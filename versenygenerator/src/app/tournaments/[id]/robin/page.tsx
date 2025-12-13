'use client';

import { useEffect, useState } from 'react';
import MatchControlPanel from '@/components/MatchControlPanel';
import EditMatch from '@/components/EditMatch';
import EditMatchResults from '@/components/EditMatchResults';
import EditMatchStatsModal from '@/components/EditMatchStatsModal';
import ExportMatchResults from '@/components/ExportMatchResults';

export default function RobinMatches({ params }: { params: { id: string } }) {
  const id = params.id;
  const [matches, setMatches] = useState<any[]>([]);
  const [referees, setReferees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [matchRes, refRes] = await Promise.all([
          fetch(`/api/robin?tournamentId=${id}`),
          fetch(`/api/referees?tournamentId=${id}`),
        ]);

        const matchData = matchRes.ok ? await matchRes.json() : [];
        const refData = refRes.ok ? await refRes.json() : [];

        setMatches(matchData);
        setReferees(refData);
      } catch (err) {
        console.error('Hiba az adatok betöltésekor:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) return <p className="text-center mt-8">Betöltés...</p>;

  const groupedMatches = matches.reduce((acc: Record<string, any[]>, match) => {
    const round = match.match_round ?? 'N/A';
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-12 items-center w-full">
      <MatchControlPanel
        tournamentId={id}
        generateEndpoint="/api/robin"
        generateLabel="Körmérkőzéses menetrend generálása"
      />

      {matches.length === 0 ? (
        <p className="text-center">Még nincsenek mérkőzések.</p>
      ) : (
        <div className="flex flex-col gap-24 w-full max-w-4xl">
          {Object.keys(groupedMatches).map((round) => (
            <div key={round} className="mb-8 w-full">
              <h3 className="font-bold text-2xl text-center mb-8">{round}. forduló</h3>
              <div className="flex flex-col gap-0 w-full">
                {groupedMatches[round].map((match, idx) => {
                  const result =
                    match.home_team_score !== null && match.away_team_score !== null
                      ? `${match.home_team_score} : ${match.away_team_score}`
                      : '';

                  return (
                    <div key={match.match_id} className="mb-8 w-full">
                      <div className="relative flex items-center w-full">
                        <div className="w-full flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center w-full">
                            <span className="font-semibold text-lg min-w-[120px] px-3 text-center truncate">
                              {match.homeTeam?.team_name}
                            </span>
                            <span className="text-gray-500 font-medium text-base px-4 select-none text-center">
                              vs
                            </span>
                            <span className="font-semibold text-lg min-w-[120px] px-3 text-center truncate">
                              {match.awayTeam?.team_name}
                            </span>
                          </div>

                          {result && (
                            <span className="text-2xl font-extrabold mt-2 mb-3 text-center">
                              {result}
                            </span>
                          )}
                        </div>

                        <div className="absolute right-0 flex items-center gap-2">
                          <EditMatch
                            match={match}
                            referees={referees}
                            roundRefereeIds={groupedMatches[round]
                              .map((m) => m.referee_referee_id)
                              .filter(Boolean)}
                          />
                                <EditMatchResults match={match} endpoint="matches/results" />

                                {match.match_status === "over" && (
                                  <>
                                    <EditMatchStatsModal match={match} />
                                    <ExportMatchResults match={match} />
                                  </>
                                )}

                        </div>
                      </div>

                      {idx !== groupedMatches[round].length - 1 && (
                        <hr className="border-t border-gray-400 my-6" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
