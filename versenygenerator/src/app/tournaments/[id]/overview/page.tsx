import { prisma } from '@/db/prisma';
import EditTournament from '@/components/EditTournament';

const GAME_LABELS: Record<string, string> = {
  football: "Labdarúgás",
  basketball: "Kosárlabda",
  handball: "Kézilabda",
};

const TOURNAMENT_TYPE_LABELS: Record<string, string> = {
  league: "Bajnoki rendszer",
  "round-robin": "Körmérkőzéses rendszer",
  knockout: "Egyenes kieséses rendszer",
  double: "Vigaszágas kieséses rendszer",
};

export default async function TournamentPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const tournament = await prisma.tournament.findUnique({
    where: {
      tournament_id: Number(id),
    },
  });

  if (!tournament) return <div>Verseny nem található.</div>;

  const teams = await prisma.team.findMany({
    where: {
      tournament_tournament_id: Number(id),
    },
  });

  const type = tournament.tournament_type;
  const canEdit = tournament.status !== "generated";

  let creationText: string | null = null;

  if (type === "knockout" || type === "double") {
    creationText =
      "Mérkőzések generálása előtt töltsd ki az „Időzítő” menüpontot, adj hozzá játékvezetőket a „Játékvezetők” menüpontban, add meg a helyszíneket a „Helyszínek” menüpontban, és szerkeszd a csapatokat a „Csapatok” menüpontban.";
  } else if (type === "league" || type === "round-robin") {
    creationText =
      "Mérkőzések generálása előtt töltsd ki az „Időzítő” menüpontot, adj hozzá játékvezetőket a „Játékvezetők” menüpontban, szerkeszd a csapatokat és adj hozzájuk stadiont a „Csapatok” menüpontban.";
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold underline">Verseny adatai</h1>
        {canEdit && <EditTournament tournament={tournament} />}
      </div>

      {creationText && (
        <p className="text-sm text-gray-600 text-center max-w-3xl mx-auto">
          {creationText}
        </p>
      )}

      <p className="text-sm text-red-600 font-semibold text-center max-w-3xl mx-auto">
        A mérkőzések létrehozása után a verseny beállításai már nem módosíthatók.
      </p>

      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Név:</strong> {tournament.tournament_name}
        </li>
        <li>
          <strong>Játék:</strong>{" "}
          {GAME_LABELS[tournament.game] ?? tournament.game}
        </li>
        <li>
          <strong>Típus:</strong>{" "}
          {TOURNAMENT_TYPE_LABELS[tournament.tournament_type] ??
            tournament.tournament_type}
        </li>
        <li>
          <strong>Leírás:</strong> {tournament.description}
        </li>
      </ul>

      <h1 className="text-xl font-semibold underline">Verseny beállításai</h1>
      <ul className="list-disc pl-6 space-y-1">
        {(type === "league" || type === "round-robin") && (
          <>
            <li>
              <strong>Győzelemért járó pont:</strong>{" "}
              {tournament.point_for_win}
            </li>
            <li>
              <strong>Döntetlenért járó pont:</strong>{" "}
              {tournament.point_for_draw}
            </li>
          </>
        )}
        {type === "knockout" && (
          <li>
            <strong>Harmadik helyért mérkőzés:</strong>{" "}
            {tournament.hold_third_place_match ? "Igen" : "Nem"}
          </li>
        )}
      </ul>

      <h1 className="text-xl font-semibold underline">Résztvevő csapatok</h1>
      {teams.length === 0 ? (
        <p>Nincs csapat ehhez a versenyhez.</p>
      ) : (
        teams.map((team) => (
          <ul key={team.team_id} className="list-disc pl-6 space-y-1">
            <li>
              <strong>{team.team_name}</strong>
            </li>
          </ul>
        ))
      )}
    </div>
  );
}
