import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tournamentId = Number(searchParams.get('tournamentId'));
  if (!tournamentId) {
    return NextResponse.json({ error: 'Hiányzó tournamentId paraméter' }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { tournament_id: tournamentId },
    select: { point_for_win: true, point_for_draw: true },
  });
  if (!tournament) {
    return NextResponse.json({ error: 'Nincs ilyen torna' }, { status: 404 });
  }

  const teams = await prisma.team.findMany({
    where: { tournament_tournament_id: tournamentId },
    select: { team_id: true, team_name: true }
  });

  const matches = await prisma.matches.findMany({
    where: {
      tournament_tournament_id: tournamentId,
      match_status: 'over'
    },
    select: {
      home_team_id: true,
      away_team_id: true,
      home_team_score: true,
      away_team_score: true,
      winner_team_id: true,
    },
  });

  const table = teams.map(team => {

    const played = matches.filter(m => m.home_team_id === team.team_id || m.away_team_id === team.team_id);

    let goalsFor = 0, goalsAgainst = 0, points = 0, wins = 0, draws = 0, losses = 0;
    played.forEach(m => {
      const isHome = m.home_team_id === team.team_id;
      const scored = isHome ? m.home_team_score : m.away_team_score;
      const conceded = isHome ? m.away_team_score : m.home_team_score;

      goalsFor += scored ?? 0;
      goalsAgainst += conceded ?? 0;

      if (m.winner_team_id === team.team_id) {
        points += tournament.point_for_win;
        wins += 1;
      } else if (m.winner_team_id === null) {
        points += tournament.point_for_draw;
        draws += 1;
      } else {
        losses += 1;
      }
    });

    return {
      team_id: team.team_id,
      team_name: team.team_name,
      played: played.length,
      goalsFor,
      goalsAgainst,
      goalDiff: goalsFor - goalsAgainst,
      points,
      wins,
      draws,
      losses,
    };
  });

  table.sort((a, b) =>
    b.points - a.points ||
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor
  );

  return NextResponse.json(table);
}
