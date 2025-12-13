import { prisma } from "@/db/prisma";
import { buildScheduleSlots, getNextDate, setTimeForDate } from "@/utils/scheduleUtils";

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

export async function generateDoubleEliminationMatches(tournamentId: number) {
  const tournament = await prisma.tournament.findUnique({
    where: { tournament_id: tournamentId },
    include: { schedule: true, venue: true, referee: true, team: true },
  });
  if (!tournament) return { error: "Nem található a bajnokság." };
  let teams = shuffle(tournament.team);
  if (teams.length !== 4 && teams.length !== 8)
    return { error: "Ez a rendszer csak 4 vagy 8 csapatos tornához használható!" };
  if (!tournament.schedule.length)
    return { error: "Nincs időbeosztás a bajnoksághoz!" };
  if (!tournament.venue.length)
    return { error: "Nincs helyszín megadva a bajnoksághoz!" };
  if (!tournament.referee.length)
    return { error: "Nincs játékvezető megadva a bajnoksághoz!" };

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
  await prisma.matches.deleteMany({ where: { tournament_tournament_id: tournamentId } });

  let round = 1;
  let totalCreated = 0;
//4 fő
  if (teams.length === 4) {
    const mW1 = [];
    for (let i = 0; i < 2; i++) {
      mW1.push(await prisma.matches.create({
        data: {
          tournament_tournament_id: tournamentId,
          home_team_id: teams[i * 2].team_id,
          away_team_id: teams[i * 2 + 1].team_id,
          match_round: round,
          bracket_type: "winner",
          manual_stadium_id: venues[i % venues.length].venue_id,
          referee_referee_id: referees[i % referees.length].referee_id,
          match_date: getNextMatchDate(),
        },
      }));
      totalCreated++;
    }

    round++;
    const mWF = await prisma.matches.create({
      data: {
        tournament_tournament_id: tournamentId,
        match_round: round,
        bracket_type: "winner",
        manual_stadium_id: venues[0].venue_id,
        referee_referee_id: referees[0].referee_id,
        match_date: getNextMatchDate(),
      },
    });
    totalCreated++;

    const mL1 = await prisma.matches.create({
      data: {
        tournament_tournament_id: tournamentId,
        match_round: round,
        bracket_type: "loser",
        manual_stadium_id: venues[1 % venues.length].venue_id,
        referee_referee_id: referees[1 % referees.length].referee_id,
        match_date: getNextMatchDate(),
      },
    });
    totalCreated++;

    round++;
    const mLF = await prisma.matches.create({
      data: {
        tournament_tournament_id: tournamentId,
        match_round: round,
        bracket_type: "loser",
        manual_stadium_id: venues[2 % venues.length].venue_id,
        referee_referee_id: referees[2 % referees.length].referee_id,
        match_date: getNextMatchDate(),
      },
    });
    totalCreated++;

    round++;
    const mFinal = await prisma.matches.create({
      data: {
        tournament_tournament_id: tournamentId,
        match_round: round,
        bracket_type: "final",
        manual_stadium_id: venues[0].venue_id,
        referee_referee_id: referees[0].referee_id,
        match_date: getNextMatchDate(),
      },
    });
    totalCreated++;

//gráf 4 fő
    await prisma.matches.update({
      where: { match_id: mWF.match_id },
      data: { previous_match_1_id: mW1[0].match_id, previous_match_2_id: mW1[1].match_id },
    });
    await prisma.matches.update({
      where: { match_id: mL1.match_id },
      data: { previous_match_1_id: mW1[0].match_id, previous_match_2_id: mW1[1].match_id },
    });
    await prisma.matches.update({
      where: { match_id: mLF.match_id },
      data: { previous_match_1_id: mL1.match_id, previous_match_2_id: mWF.match_id },
    });
    await prisma.matches.update({
      where: { match_id: mFinal.match_id },
      data: { previous_match_1_id: mWF.match_id, previous_match_2_id: mLF.match_id },
    });

    await prisma.tournament.update({
      where: { tournament_id: tournamentId },
      data: { status: "generated" },
    });

    return { matchesCreated: totalCreated };
  }

//8 fő
  if (teams.length === 8) {
    const mW1 = [];
    for (let i = 0; i < 4; i++) {
      mW1.push(await prisma.matches.create({
        data: {
          tournament_tournament_id: tournamentId,
          home_team_id: teams[i * 2].team_id,
          away_team_id: teams[i * 2 + 1].team_id,
          match_round: round,
          bracket_type: "winner",
          manual_stadium_id: venues[i % venues.length].venue_id,
          referee_referee_id: referees[i % referees.length].referee_id,
          match_date: getNextMatchDate(),
        },
      }));
      totalCreated++;
    }

    const mL1 = [];
    for (let i = 0; i < 2; i++) {
      mL1.push(await prisma.matches.create({
        data: {
          tournament_tournament_id: tournamentId,
          match_round: round,
          bracket_type: "loser",
          manual_stadium_id: venues[i % venues.length].venue_id,
          referee_referee_id: referees[i % referees.length].referee_id,
          match_date: getNextMatchDate(),
        },
      }));
      totalCreated++;
    }

    round++;
    const mW2 = [];
    for (let i = 0; i < 2; i++) {
      mW2.push(await prisma.matches.create({
        data: {
          tournament_tournament_id: tournamentId,
          match_round: round,
          bracket_type: "winner",
          manual_stadium_id: venues[i % venues.length].venue_id,
          referee_referee_id: referees[i % referees.length].referee_id,
          match_date: getNextMatchDate(),
        },
      }));
      totalCreated++;
    }

    const mL2 = [];
    for (let i = 0; i < 2; i++) {
      mL2.push(await prisma.matches.create({
        data: {
          tournament_tournament_id: tournamentId,
          match_round: round,
          bracket_type: "loser",
          manual_stadium_id: venues[i % venues.length].venue_id,
          referee_referee_id: referees[i % referees.length].referee_id,
          match_date: getNextMatchDate(),
        },
      }));
      totalCreated++;
    }

    round++;
    const mWF = await prisma.matches.create({
      data: {
        tournament_tournament_id: tournamentId,
        match_round: round,
        bracket_type: "winner",
        manual_stadium_id: venues[0].venue_id,
        referee_referee_id: referees[0].referee_id,
        match_date: getNextMatchDate(),
      },
    });
    totalCreated++;

    const mL3 = await prisma.matches.create({
      data: {
        tournament_tournament_id: tournamentId,
        match_round: round,
        bracket_type: "loser",
        manual_stadium_id: venues[1 % venues.length].venue_id,
        referee_referee_id: referees[1 % referees.length].referee_id,
        match_date: getNextMatchDate(),
      },
    });
    totalCreated++;

    round++;
    const mLF = await prisma.matches.create({
      data: {
        tournament_tournament_id: tournamentId,
        match_round: round,
        bracket_type: "loser",
        manual_stadium_id: venues[1 % venues.length].venue_id,
        referee_referee_id: referees[1 % referees.length].referee_id,
        match_date: getNextMatchDate(),
      },
    });
    totalCreated++;

    round++;
    const mFinal = await prisma.matches.create({
      data: {
        tournament_tournament_id: tournamentId,
        match_round: round,
        bracket_type: "final",
        manual_stadium_id: venues[2 % venues.length].venue_id,
        referee_referee_id: referees[2 % referees.length].referee_id,
        match_date: getNextMatchDate(),
      },
    });
    totalCreated++;

    await prisma.matches.update({ where: { match_id: mW2[0].match_id }, data: { previous_match_1_id: mW1[0].match_id, previous_match_2_id: mW1[1].match_id } });
    await prisma.matches.update({ where: { match_id: mW2[1].match_id }, data: { previous_match_1_id: mW1[2].match_id, previous_match_2_id: mW1[3].match_id } });
    await prisma.matches.update({ where: { match_id: mWF.match_id }, data: { previous_match_1_id: mW2[0].match_id, previous_match_2_id: mW2[1].match_id } });
    await prisma.matches.update({ where: { match_id: mL1[0].match_id }, data: { previous_match_1_id: mW1[0].match_id, previous_match_2_id: mW1[1].match_id } });
    await prisma.matches.update({ where: { match_id: mL1[1].match_id }, data: { previous_match_1_id: mW1[2].match_id, previous_match_2_id: mW1[3].match_id } });
    await prisma.matches.update({ where: { match_id: mL2[0].match_id }, data: { previous_match_1_id: mL1[0].match_id, previous_match_2_id: mW2[0].match_id } });
    await prisma.matches.update({ where: { match_id: mL2[1].match_id }, data: { previous_match_1_id: mL1[1].match_id, previous_match_2_id: mW2[1].match_id } });
    await prisma.matches.update({ where: { match_id: mL3.match_id }, data: { previous_match_1_id: mL2[0].match_id, previous_match_2_id: mL2[1].match_id } });
    await prisma.matches.update({ where: { match_id: mLF.match_id }, data: { previous_match_1_id: mL3.match_id, previous_match_2_id: mWF.match_id } });
    await prisma.matches.update({ where: { match_id: mFinal.match_id }, data: { previous_match_1_id: mWF.match_id, previous_match_2_id: mLF.match_id } });

    await prisma.tournament.update({
      where: { tournament_id: tournamentId },
      data: { status: "generated" },
    });

    return { matchesCreated: totalCreated };
  }

  return { error: "Ismeretlen hiba történt a generálás során." };
}
//todo 16 fő