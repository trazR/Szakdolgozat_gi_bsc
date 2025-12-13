import { prisma } from '@/db/prisma';
import EditTeams from '@/components/EditTeams';
import Link from 'next/link';
import UploadCsv from '@/components/UploadCsv';

export default async function TeamsPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const teams = await prisma.team.findMany({
    where: { tournament_tournament_id: id },
    orderBy: { team_name: 'asc' },
  });

  const tournament = await prisma.tournament.findUnique({
    where: { tournament_id: id },
    select: { status: true },
  });

  const hasMatches = tournament?.status === 'generated';

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold underline">Csapatok</h1>
        {!hasMatches ? (
          <EditTeams teams={teams} tournamentId={id} />
        ) : (
          <div className="flex-1 text-center mt-6">
            <p className="text-2xl font-semibold text-gray-600">
             Új csapatot nem adhatsz hozzá, amíg a generált mérkőzéseket nem törlöd.
            </p>
          </div>
        )}
      </div>

      {!hasMatches && (
        <div className="mt-4 flex flex-col items-end">
          <h2 className="text-xl font-semibold mb-2">CSV import</h2>
          <UploadCsv tournamentId={id} />
        </div>
      )}

      {teams.length === 0 ? (
        <p className="text-gray-600 italic mt-4">
          Még nem adtál csapatot a versenyhez.
        </p>
      ) : (
        <ul className="list-disc pl-6 space-y-2 text-xl">
          {teams.map((team) => (
            <li key={team.team_id}>
              <Link
                href={`/tournaments/${team.tournament_tournament_id}/teams/${team.team_id}`}
                className="hover:underline text-blue-700"
              >
                <strong>{team.team_name}</strong>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
