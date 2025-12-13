import DoubleBracket from "@/components/DoubleBracket";
import MatchControlPanel from "@/components/MatchControlPanel";
export default function DoubleMatches({ params }: { params: { id: string } }) {
  const tournamentId = Number(params.id);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Vigaszágas kieséses rendszer mérkőzései</h1>
        <MatchControlPanel
        tournamentId={tournamentId}
        generateEndpoint="/api/double"
        generateLabel="Vigaszágas mérkőzések generálása"
      />
      <DoubleBracket tournamentId={tournamentId} />
    </div>
  );
}