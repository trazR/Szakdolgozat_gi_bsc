import { prisma } from "@/db/prisma";
import StatsClient from "./statsClient";

export const dynamic = "force-dynamic";

export default async function TournamentStatsPage({
  params,
}: {
  params: { id: string };
}) {
  const tournamentId = Number(params.id);

  const tournament = await prisma.tournament.findUnique({
    where: { tournament_id: tournamentId },
    select: { tournament_name: true, game: true },
  });

  if (!tournament) {
    return <div className="p-8 text-lg">A bajnokság nem található.</div>;
  }

  const matches = await prisma.matches.findMany({
    where: {
      tournament_tournament_id: tournamentId,
      home_team_score: { not: null },
      away_team_score: { not: null },
    },
    include: {
      plays: {
        include: {
          player: {
            select: {
              player_name: true,
            },
          },
        },
      },
      referee: true,
    },
  });

  return (
    <StatsClient
      tournament={tournament}
      matches={JSON.parse(JSON.stringify(matches))}
    />
  );
}
