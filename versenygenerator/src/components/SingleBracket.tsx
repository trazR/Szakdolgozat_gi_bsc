'use client';
import { useEffect, useState } from 'react';
import { Bracket, RoundProps, Seed, SeedItem, SeedTeam, RenderSeedProps } from 'react-brackets'; //mi a francért írja h nem létezik?
import EditMatch from '@/components/EditMatch';
import EditMatchResults from '@/components/EditMatchResults';
import EditMatchStatsModal from '@/components/EditMatchStatsModal';
import ExportMatchResults from '@/components/ExportMatchResults';

type Match = {
  match_id: number;
  home_team_id: number | null;
  away_team_id: number | null;
  home_team_score: number | null;
  away_team_score: number | null;
  winner_team_id: number | null;
  match_round: number | null;
  bracket_type?: string | null;
  homeTeam?: { team_name: string } | null;
  awayTeam?: { team_name: string } | null;
  plays?: any[];
  match_status?: string | null;
};

function CustomSeed({
  seed,
  breakpoint,
  referees,
  refreshMatches,
}: RenderSeedProps & { referees: { referee_id: number; referee_name: string }[]; refreshMatches: () => void }) {
  const winnerId = seed.match?.winner_team_id;
  const homeId = seed.match?.home_team_id;
  const awayId = seed.match?.away_team_id;

  return (
    <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 16, minWidth: 240 }}>
      <SeedItem>
        <div className="flex flex-col gap-1 text-base">
          <SeedTeam className={`font-semibold ${homeId && winnerId === homeId ? 'text-yellow-200 font-bold' : ''}`}>
            {seed.teams[0]?.name || 'TBD'}
            {typeof seed.score?.scoreA !== 'undefined' && seed.score?.scoreA !== '-' && (
              <span className="ml-2 font-semibold">{seed.score?.scoreA}</span>
            )}
          </SeedTeam>
          <SeedTeam className={`font-semibold ${awayId && winnerId === awayId ? 'text-yellow-200 font-bold' : ''}`}>
            {seed.teams[1]?.name || 'TBD'}
            {typeof seed.score?.scoreB !== 'undefined' && seed.score?.scoreB !== '-' && (
              <span className="ml-2 font-semibold">{seed.score?.scoreB}</span>
            )}
          </SeedTeam>
          <div className="flex bg-white/90 shadow-lg items-center justify-center text-black">
            <EditMatch
              match={seed.match}
              referees={referees}
              roundRefereeIds={seed.round ? [seed.round] : []}
            />
            <EditMatchResults match={seed.match} endpoint="single" onSaved={refreshMatches} />
            {seed.match?.match_status === 'over' && (
              <>
                <EditMatchStatsModal match={seed.match} />
                <ExportMatchResults match={seed.match} />
              </>
            )}
          </div>
        </div>
      </SeedItem>
    </Seed>
  );
}

export default function SingleBracket({ tournamentId }: { tournamentId: number }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [rounds, setRounds] = useState<RoundProps[]>([]);
  const [bronzeMatch, setBronzeMatch] = useState<Match | null>(null);
  const [showBronze, setShowBronze] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referees, setReferees] = useState<{ referee_id: number; referee_name: string }[]>([]);

  const refreshMatches = () => {
    setLoading(true);
    fetch(`/api/single?tournamentId=${tournamentId}`)
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.matches || []);
        setBronzeMatch((data.matches || []).find((m: Match) => m.bracket_type === 'third_place') || null);
        setShowBronze((data.matches || []).some((m: Match) => m.bracket_type === 'third_place'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    refreshMatches();
  }, [tournamentId]);

  useEffect(() => {
    fetch(`/api/referees?tournamentId=${tournamentId}`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.refereeStats)
          ? data.refereeStats
          : [];

        setReferees(list);
      })
      .catch(() => setReferees([]));
  }, [tournamentId]);

  useEffect(() => {
    if (matches.length === 0) {
      setRounds([]);
      return;
    }
    const filteredMatches = matches.filter((m) => m.bracket_type !== 'third_place');
    const grouped: Record<number, Match[]> = {};
    for (const m of filteredMatches) {
      const round = m.match_round || 1;
      if (!grouped[round]) grouped[round] = [];
      grouped[round].push(m);
    }

    const roundNums = Object.keys(grouped).map(Number);
    const maxRound = Math.max(...roundNums);

    const newRounds: RoundProps[] = roundNums
      .sort((a, b) => a - b)
      .map((roundNum) => ({
        title: roundNum === maxRound ? 'Döntő' : `${roundNum}. Forduló`,
        seeds: grouped[roundNum].map((m) => ({
          id: m.match_id,
          teams: [
            { name: m.homeTeam?.team_name ?? 'TBD' },
            { name: m.awayTeam?.team_name ?? 'TBD' },
          ],
          score: {
            scoreA: m.home_team_score ?? '-',
            scoreB: m.away_team_score ?? '-',
          },
          match: m,
          round: roundNum,
        })),
      }));

    setRounds(newRounds);
  }, [matches]);

  if (loading) return <div className="p-4">Ágrajz betöltése...</div>;
  if (rounds.length === 0) return <div className="p-4">Nincs egyenes kieséses párosítás.</div>;

  return (
    <div className="overflow-auto py-8">
      <Bracket
        rounds={rounds}
        renderSeedComponent={(props) => (
          <CustomSeed {...props} referees={referees} refreshMatches={refreshMatches} />
        )}
        mobileBreakpoint={0}
        roundTitleComponent={(title) => (
          <div className="text-center font-bold text-lg mb-2">{title}</div>
        )}
      />
      {showBronze && bronzeMatch && (
        <div className="mt-8">
          <Bracket
            rounds={[
              {
                title: 'Bronz mérkőzés',
                seeds: [
                  {
                    id: bronzeMatch.match_id,
                    teams: [
                      { name: bronzeMatch.homeTeam?.team_name ?? 'TBD' },
                      { name: bronzeMatch.awayTeam?.team_name ?? 'TBD' },
                    ],
                    score: {
                      scoreA: bronzeMatch.home_team_score ?? '-',
                      scoreB: bronzeMatch.away_team_score ?? '-',
                    },
                    match: bronzeMatch,
                    round: bronzeMatch.match_round,
                  },
                ],
              },
            ]}
            renderSeedComponent={(props) => (
              <CustomSeed {...props} referees={referees} refreshMatches={refreshMatches} />
            )}
            mobileBreakpoint={0}
            roundTitleComponent={(title) => (
              <div className="text-center font-bold text-lg mb-2">{title}</div>
            )}
          />
        </div>
      )}
    </div>
  );
}
