import { prisma } from "@/db/prisma";
import AddPlayers from "@/components/AddPlayers";
import AddStadion from "@/components/AddStadion";

export default async function PlayersPage({ params }: { params: { id: string; teamId: string } }) {
  const teamId = Number(params.teamId);
  const tournamentId = Number(params.id);
  const tournament = await prisma.tournament.findUnique({
    where: { tournament_id: tournamentId },
    select: { game: true },
  });

  const game = tournament?.game;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Hazai Pálya</h1>
      <AddStadion teamId={teamId} tournamentId={tournamentId} />
      <h1 className="text-2xl font-bold mb-4">Játékosok</h1>
      <AddPlayers
        teamId={teamId}
        tournamentId={tournamentId}
        game={game} 
      />
    </div>
  );
}
