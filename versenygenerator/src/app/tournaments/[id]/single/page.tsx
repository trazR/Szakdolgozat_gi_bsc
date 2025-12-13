import MatchControlPanel from '@/components/MatchControlPanel';
import SingleBracket from '@/components/SingleBracket';

export default function SingleMatches({ params }: { params: { id: string } }) {
  const tournamentId = Number(params.id);

  return (
    <div className="p-8 flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-center">
        Egyeneságú kieséses mérkőzések
      </h1>
      <MatchControlPanel
        tournamentId={tournamentId}
        generateEndpoint="/api/single"
        generateLabel="Kieséses mérkőzések generálása"
      />
      <SingleBracket tournamentId={tournamentId} />
    </div>
  );
}
