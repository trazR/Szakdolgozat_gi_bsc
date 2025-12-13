import { prisma } from '@/db/prisma';
import SchedulerForm from '@/components/SchedulerForm';

export default async function SchedulersPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);

  const tournament = await prisma.tournament.findUnique({
    where: { tournament_id: id },
    select: { tournament_id: true, tournament_type: true, status: true },
  });

  if (!tournament) {
    return <div className="text-center text-red-600 mt-10 text-lg">Bajnokság nem található</div>;
  }
  if (tournament.status === 'generated') {
    return (
          <div className="flex-1 text-center mt-6">
            <p className="text-2xl font-semibold text-gray-600">
             Az ütemezés nem módosítható, amíg a generált mérkőzéseket nem törlöd.
            </p>
          </div>
    );
  }
  return (
    <div className="p-6">
      <SchedulerForm
        tournamentId={tournament.tournament_id}
        tournamentType={tournament.tournament_type}
      />
    </div>
  );
}
