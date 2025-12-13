import { prisma } from '@/db/prisma';
import EditReferee from '@/components/EditReferee';

export default async function RefereeInfoPage({ params }: { params: { id: string } }) {
  const tournamentId = Number(params.id);

  const referees = await prisma.referee.findMany({
    where: { tournament_tournament_id: tournamentId },
    orderBy: { referee_name: 'asc' },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold">Játékvezetők</h1>
      </div>
      {referees.length === 0 ? (
        <div className="text-gray-500">Nincs játékvezető ehhez a tornához.</div>
      ) : (
        <table className="w-full border text-left mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Név</th>
              <th className="p-2">Életkor</th>
              <th className="p-2">Nem</th>
              <th className="p-2">Nemzetiség</th>
              <th className="p-2">Szerkesztés</th>
            </tr>
          </thead>
          <tbody>
            {referees.map((referee) => (
              <tr key={referee.referee_id} className="border-t">
                <td className="p-2">{referee.referee_name}</td>
                <td className="p-2">{referee.age ?? '-'}</td>
                <td className="p-2">{referee.gender ?? '-'}</td>
                <td className="p-2">{referee.nationality ?? '-'}</td>
                <td className="p-2">
                  <EditReferee referee={referee} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
