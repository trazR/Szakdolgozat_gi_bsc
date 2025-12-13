import { prisma } from '@/db/prisma';
import EditStadion from '@/components/EditStadion';

export default async function StadionPage({ params }: { params: { teamId: string } }) {
  const teamId = Number(params.teamId);

  const team = await prisma.team.findUnique({
    where: { team_id: teamId },
    include: { stadium: true },
  });

  if (!team?.stadium) {
    return <div className="p-6 text-red-600">Ehhez a csapathoz nincs stadion hozzárendelve.</div>;
  }

  const stadion = team.stadium;

  return (
    <div >
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold">Stadion adatai</h1>
        <EditStadion stadion={stadion} />
      </div>
      <ul className="list-disc pl-6 space-y-1 text-lg">
        <li><strong>Név:</strong> {stadion.stadium_name}</li>
        <li><strong>Cím:</strong> {stadion.address || "Nincs megadva"}</li>
        <li><strong>Férőhely:</strong> {stadion.capacity ?? "Nincs megadva"}</li>
      </ul>
    </div>
  );
}
