import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { buildScheduleSlots, getNextDate, setTimeForDate } from "@/utils/scheduleUtils";
import { updateNextTeams } from "@/utils/updateNextTeams";
import { requireTournamentOwner } from "@/auth/check";

export async function POST(req: NextRequest) {
  try {
    const { tournamentId } = await req.json();

    if (!tournamentId)
      return NextResponse.json({ error: "Hiányzó tournamentId" }, { status: 400 });

    const tournament_id = Number(tournamentId);

    await requireTournamentOwner(tournament_id);

    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id },
      include: { schedule: true, venue: true, referee: true, team: true },
    });

    if (!tournament)
      return NextResponse.json({ error: "Nem található a bajnokság." }, { status: 404 });

    // Kötelező adatok ellenőrzése
    if (!tournament.team.length || tournament.team.length < 2)
      return NextResponse.json({ error: "Legalább 2 csapat szükséges!" }, { status: 400 });
    if (!tournament.schedule.length)
      return NextResponse.json({ error: "Hiányzik az ütemezés!" }, { status: 400 });
    if (!tournament.venue.length)
      return NextResponse.json({ error: "Nincs megadva helyszín!" }, { status: 400 });
    if (!tournament.referee.length)
      return NextResponse.json({ error: "Nincs megadva játékvezető!" }, { status: 400 });

    await prisma.matches.deleteMany({
      where: { tournament_tournament_id: tournament_id },
    });

    const teams = shuffle(tournament.team);
    const venues = shuffle(tournament.venue);
    const referees = shuffle(tournament.referee);
    const baseDate = new Date(tournament.tournament_start || Date.now());
    const scheduleSlots = buildScheduleSlots(tournament.schedule);

    let weekOffset = 0,
      slotIdx = 0;
    function getNextMatchDate() {
      const slot = scheduleSlots[slotIdx % scheduleSlots.length];
      const matchDate = setTimeForDate(
        getNextDate(baseDate, slot.dayOfWeek, weekOffset),
        slot.times[0]
      );
      slotIdx++;
      if (slotIdx % scheduleSlots.length === 0) weekOffset++;
      return matchDate;
    }

    function shuffle<T>(array: T[]): T[] {
      let m = array.length,
        t,
        i;
      while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
      }
      return array;
    }

    let round = 1;
    let totalCreated = 0;
    let currentMatches: any[] = [];

    for (let i = 0; i < teams.length; i += 2) {
      const match = await prisma.matches.create({
        data: {
          tournament_tournament_id: tournament_id,
          home_team_id: teams[i]?.team_id,
          away_team_id: teams[i + 1]?.team_id,
          match_round: round,
          bracket_type: "winner",
          manual_stadium_id: venues[i % venues.length].venue_id,
          referee_referee_id: referees[i % referees.length].referee_id,
          match_date: getNextMatchDate(),
        },
      });
      currentMatches.push(match);
      totalCreated++;
    }

    let semiFinals: any[] = [];
    while (currentMatches.length > 1) {
      round++;
      const nextRound: any[] = [];

      for (let i = 0; i < currentMatches.length; i += 2) {
        const isFinal = currentMatches.length / 2 === 1;
        const match = await prisma.matches.create({
          data: {
            tournament_tournament_id: tournament_id,
            match_round: round,
            bracket_type: isFinal ? "final" : "winner",
            manual_stadium_id: venues[i % venues.length].venue_id,
            referee_referee_id: referees[i % referees.length].referee_id,
            match_date: getNextMatchDate(),
            previous_match_1_id: currentMatches[i]?.match_id,
            previous_match_2_id: currentMatches[i + 1]?.match_id,
          },
        });
        nextRound.push(match);
        totalCreated++;

        if (isFinal) semiFinals = currentMatches;
      }

      currentMatches = nextRound;
    }

    if (tournament.hold_third_place_match && semiFinals.length === 2) {
      await prisma.matches.create({
        data: {
          tournament_tournament_id: tournament_id,
          match_round: round,
          bracket_type: "third_place",
          manual_stadium_id: venues[1 % venues.length].venue_id,
          referee_referee_id: referees[1 % referees.length].referee_id,
          match_date: getNextMatchDate(),
          previous_match_1_id: semiFinals[0].match_id,
          previous_match_2_id: semiFinals[1].match_id,
        },
      });
      totalCreated++;
    }

    await prisma.tournament.update({
      where: { tournament_id },
      data: { status: "generated" },
    });

    return NextResponse.json({
      message: "Mérkőzések sikeresen generálva.",
      matchesCreated: totalCreated,
      status: "generated",
    });
  } catch (error: any) {
    console.error("Mérkőzés generálási hiba:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      default:
        return NextResponse.json(
          { error: "Hiba történt a generálás során.", details: error.message },
          { status: 500 }
        );
    }
  }
}

//EREDMÉNYMENTÉS (PATCH)

export async function PATCH(req: NextRequest) {
  try {
    const { match_id, home_team_score, away_team_score } = await req.json();

    if (!match_id)
      return NextResponse.json({ error: "Hiányzó match_id" }, { status: 400 });

    const match = await prisma.matches.findUnique({
      where: { match_id: Number(match_id) },
      select: { tournament_tournament_id: true },
    });

    if (!match)
      return NextResponse.json({ error: "Mérkőzés nem található" }, { status: 404 });

    await requireTournamentOwner(Number(match.tournament_tournament_id));

    const result = await updateNextTeams(
      Number(match_id),
      Number(home_team_score),
      Number(away_team_score)
    );

    if (result.error)
      return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({
      message: "Eredmény sikeresen mentve.",
      ...result,
    });
  } catch (error: any) {
    console.error("Eredmény mentése sikertelen.", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      default:
        return NextResponse.json(
          { error: "Eredménymentés sikertelen", details: error.message },
          { status: 500 }
        );
    }
  }
}

//MECCSEK LEKÉRDEZÉSE (GET)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = Number(searchParams.get("tournamentId"));

    if (!tournamentId)
      return NextResponse.json({ error: "Hiányzó tournamentId" }, { status: 400 });

    const matches = await prisma.matches.findMany({
      where: { tournament_tournament_id: tournamentId },
      include: {
        homeTeam: { include: { player: true } },
        awayTeam: { include: { player: true } },
        referee: true,
        venue: true,
        plays: { include: { player: true } },
        tournament: true,
      },
      orderBy: [{ match_round: "asc" }, { match_id: "asc" }],
    });

    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
      select: { hold_third_place_match: true },
    });

    return NextResponse.json({
      matches,
      hold_third_place_match: tournament?.hold_third_place_match || false,
    });
  } catch (error: any) {
    console.error("Hiba történt a meccsek lekérése közben:", error);
    return NextResponse.json(
      { error: "Hiba történt a meccsek lekérése közben.", details: error.message },
      { status: 500 }
    );
  }
}
