import AddVenue from "@/components/AddVenue";

export default function VenuePage({ params }: { params: { id: string } }) {
  const tournamentId = Number(params.id);

  return (
    <div className="p-6">
      <AddVenue tournamentId={tournamentId} />
    </div>
  );
}
