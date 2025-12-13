import { prisma } from "@/db/prisma";
import { buildScheduleSlots, getNextDate, setTimeForDate } from "@/utils/scheduleUtils";

export async function generateSingleEliminationMatches(tournamentId: number) {
  const tournament = await prisma.tournament.findUnique({
    where: { tournament_id: tournamentId },
    include: { schedule: true, venue: true, referee: true, team: true },
  });

  if (!tournament) return { error: "Nem található a bajnokság." };
  if (!tournament.team.length || tournament.team.length < 2)
    return { error: "Legalább 2 csapat szükséges a generáláshoz!" };
  if (!tournament.schedule.length)
    return { error: "Hiányzik az ütemezés (schedule)!" };
  if (!tournament.venue.length)
    return { error: "Nincs megadva helyszín!" };
  if (!tournament.referee.length)
    return { error: "Nincs megadva játékvezető!" };

  await prisma.matches.deleteMany({ where: { tournament_tournament_id: tournamentId } });

  const teams = shuffle(tournament.team);
  const venues = shuffle(tournament.venue);
  const referees = shuffle(tournament.referee);
  const baseDate = new Date(tournament.tournament_start || Date.now());
  const scheduleSlots = buildScheduleSlots(tournament.schedule);

  let weekOffset = 0, slotIdx = 0;
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
    let m = array.length, t, i;
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
        tournament_tournament_id: tournamentId,
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
          tournament_tournament_id: tournamentId,
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
      if (isFinal) {
        semiFinals = currentMatches;
      }
    }

    currentMatches = nextRound;
  }
  if (semiFinals.length === 2) {
    const bronzeMatch = await prisma.matches.create({
      data: {
        tournament_tournament_id: tournamentId,
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
    where: { tournament_id: tournamentId },
    data: { status: "generated" },
  });

  return { matchesCreated: totalCreated };
}
