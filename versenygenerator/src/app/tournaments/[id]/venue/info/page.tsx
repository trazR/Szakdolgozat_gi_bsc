import { prisma } from '@/db/prisma';
import EditVenue from '@/components/EditVenue';

export default async function VenueInfoPage({ params }: { params: { id: string } }) {
  const tournamentId = Number(params.id);

  const venues = await prisma.venue.findMany({
    where: { tournament_tournament_id: tournamentId },
    orderBy: { venue_name: 'asc' },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold">Helyszínek</h1>
      </div>
      {venues.length === 0 ? (
        <div className="text-gray-500">Nincs helyszín ehhez a tornához.</div>
      ) : (
        <table className="w-full border text-left mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Név</th>
              <th className="p-2">Cím</th>
              <th className="p-2">Férőhely</th>
              <th className="p-2">Szerkesztés</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((venue) => (
              <tr key={venue.venue_id} className="border-t">
                <td className="p-2">{venue.venue_name}</td>
                <td className="p-2">{venue.address || '-'}</td>
                <td className="p-2">{venue.capacity ?? '-'}</td>
                <td className="p-2">
                  <EditVenue venue={venue} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
