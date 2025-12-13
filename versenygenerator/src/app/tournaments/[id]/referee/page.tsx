import AddReferees from '@/components/AddReferee';

export default function RefereeInfoPage({ params }: { params: { id: string } }) {
  const tournamentId = Number(params.id);

  return (
    <div className="p-6">
      <AddReferees tournamentId={tournamentId} />
    </div>
  );
}
