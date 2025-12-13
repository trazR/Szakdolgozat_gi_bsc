import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { buildScheduleSlots, getNextDate, setTimeForDate } from "@/utils/scheduleUtils";
import { generateBergerRounds } from "@/utils/bergerGenerator";
import { requireTournamentOwner } from "@/auth/check";

//
// ============================================================
// POST – Bajnoki rendszer (League) meccsek generálása
// ============================================================
//
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tournamentId } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: "Hiányzik a Tournament ID." }, { status: 400 });
    }

    const tournament_id = Number(tournamentId);

    // 🔐 Jogosultság ellenőrzés
    await requireTournamentOwner(tournament_id);

    // 🧹 Korábbi meccsek törlése
    await prisma.matches.deleteMany({
      where: { tournament_tournament_id: tournament_id },
    });

    // 🧠 Bajnokság adatainak lekérése
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id },
      include: {
        schedule: true,
        team: { include: { stadium: true } },
        referee: true,
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "A bajnokság nem található." }, { status: 404 });
    }

    // ✅ Ellenőrzések
    if (!tournament.tournament_start) {
      return NextResponse.json(
        { error: "Add meg a kezdő dátumot, mielőtt legenerálod a mérkőzéseket." },
        { status: 400 }
      );
    }

    if (!tournament.schedule || tournament.schedule.length === 0) {
      return NextResponse.json(
        { error: "Hiányzik az ütemezés (időzítő)! Kérlek add meg az időpontokat a mérkőzésekhez." },
        { status: 400 }
      );
    }

    const teams = tournament.team;
    if (!teams || teams.length < 2) {
      return NextResponse.json(
        { error: "Legalább két csapat szükséges a mérkőzések generálásához." },
        { status: 400 }
      );
    }

    const referees = tournament.referee;
    if (!referees || referees.length === 0) {
      return NextResponse.json(
        { error: "Adj hozzá legalább egy játékvezetőt a bajnoksághoz." },
        { status: 400 }
      );
    }

    // 🕓 Időpontok előkészítése
    const scheduleSlots = buildScheduleSlots(tournament.schedule);

    // 🔁 Bajnokság = 2 kör (oda-vissza)
    const numberOfRounds = tournament.round > 0 ? tournament.round : 2;

    // 🧮 Berger-féle párosítás generálása
    const allRounds = generateBergerRounds(teams, numberOfRounds);

    const matches: any[] = [];
    const refereesForTournament = [...referees].sort(() => Math.random() - 0.5);

    let refereeIndex = 0;
    let weekOffset = 0;
    let currentRoundNumber = 0;

    // 🔹 Minden fordulóhoz hozzárendeljük a bírókat, helyszínt, időpontot
    for (const roundPairs of allRounds) {
      let matchesAssignedInRound = 0;
      let currentSlotIndex = 0;
      let currentTimeIndex = 0;

      while (matchesAssignedInRound < roundPairs.length) {
        const currentSlot = scheduleSlots[currentSlotIndex % scheduleSlots.length];
        const currentTime = currentSlot.times[currentTimeIndex % currentSlot.times.length];

        if (!currentTime) {
          throw new Error("Nincs időpont megadva az ütemezésben.");
        }

        const matchDay = getNextDate(
          new Date(tournament.tournament_start),
          currentSlot.dayOfWeek,
          weekOffset
        );
        const matchDate = setTimeForDate(matchDay, currentTime);

        const { homeTeam, awayTeam } = roundPairs[matchesAssignedInRound];
        const referee = refereesForTournament[refereeIndex % refereesForTournament.length];
        refereeIndex++;

        matches.push({
          tournament_tournament_id: tournament_id,
          home_team_id: homeTeam.team_id,
          away_team_id: awayTeam.team_id,
          match_round: currentRoundNumber + 1,
          referee_referee_id: referee.referee_id,
          stadium_stadium_id: homeTeam.stadium?.stadium_id,
          match_date: matchDate,
          bracket_type: tournament.tournament_type,
        });

        matchesAssignedInRound++;
        currentSlotIndex++;

        // ha minden slot elfogyott, új időpont ciklus
        if (currentSlotIndex % scheduleSlots.length === 0) {
          currentTimeIndex++;
        }
      }

      currentRoundNumber++;
      weekOffset++; // minden új forduló új héten kezdődik
    }

    // 💾 Tranzakció: meccsek mentése + státusz frissítése
    await prisma.$transaction([
      prisma.matches.createMany({ data: matches }),
      prisma.tournament.update({
        where: { tournament_id },
        data: { status: "generated" },
      }),
    ]);

    return NextResponse.json({
      message: "Bajnoki mérkőzések sikeresen létrehozva.",
      totalMatches: matches.length,
      status: "generated",
    });
  } catch (error: any) {
    console.error("Hiba történt bajnoki generálás közben:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      case "NOT_FOUND":
        return NextResponse.json({ error: "Verseny nem található" }, { status: 404 });
      default:
        return NextResponse.json(
          { error: error.message || "Hiba történt a mérkőzések generálásakor." },
          { status: 500 }
        );
    }
  }
}

// GET – Meccsek lekérése (Bajnoki rendszer)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = Number(searchParams.get("tournamentId"));

    if (!tournamentId) {
      return NextResponse.json({ error: "Hiányzik a tournamentId." }, { status: 400 });
    }

    const matches = await prisma.matches.findMany({
      where: { tournament_tournament_id: tournamentId },
      include: {
        tournament: true,
        homeTeam: { include: { player: true } },
        awayTeam: { include: { player: true } },
        referee: true,
        stadium: true,
        venue: true,
        plays: { include: { player: true } },
      },
      orderBy: [{ match_round: "asc" }, { match_id: "asc" }],
    });

    return NextResponse.json(matches);
  } catch (error: any) {
    console.error("GET /api/league error:", error);
    return NextResponse.json(
      { error: "Lekérdezési hiba", details: error.message },
      { status: 500 }
    );
  }
}
