import { prisma } from '@/db/prisma';
import EditPlayer from '@/components/EditPlayer';

export default async function PlayerOverviewPage({ params }: { params: { teamId: string } }) {
  const teamId = Number(params.teamId);

  const players = await prisma.player.findMany({
    where: { team_team_id: teamId },
    orderBy: { player_name: 'asc' },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold">Játékosok</h1>
      </div>
      {players.length === 0 ? (
        <div className="text-gray-500">Nincs játékos a csapatban.</div>
      ) : (
        <table className="w-full border text-left mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Név</th>
              <th className="p-2">Életkor</th>
              <th className="p-2">Nem</th>
              <th className="p-2">Nemzetiség</th>
              <th className="p-2">Poszt</th>
              <th className="p-2">Szerkesztés</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.player_id} className="border-t">
                <td className="p-2">{player.player_name}</td>
                <td className="p-2">{player.age ?? '-'}</td>
                <td className="p-2">{player.gender ?? '-'}</td>
                <td className="p-2">{player.nationality ?? '-'}</td>
                <td className="p-2">{player.position ?? '-'}</td>
                <td className="p-2">
                  <EditPlayer player={player} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
