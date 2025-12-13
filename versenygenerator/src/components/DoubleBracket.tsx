'use client';

import { useEffect, useState } from 'react';
import { Bracket, RoundProps, Seed, SeedItem, SeedTeam, RenderSeedProps } from 'react-brackets';
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
  previous_match_2_id?: number | null; // alsó ági döntő kereséséhez használod
};

type Referee = { referee_id: number; referee_name: string };

type CustomSeedProps = RenderSeedProps & {
  referees: Referee[];
  refreshMatches: () => void;
};

function CustomSeed({ seed, breakpoint, referees, refreshMatches }: CustomSeedProps) {
  const winnerId = seed.match?.winner_team_id;
  const homeId = seed.match?.home_team_id;
  const awayId = seed.match?.away_team_id;

  return (
    <Seed mobileBreakpoint={breakpoint} style={{ fontSize: 16, minWidth: 240 }}>
      <SeedItem>
        <div className="flex flex-col gap-1 text-base">
          <SeedTeam className={`font-semibold ${homeId && winnerId === homeId ? "text-yellow-200 font-bold" : ""}`}>
            {seed.teams[0]?.name || 'TBD'}
            {typeof seed.score?.scoreA !== 'undefined' && seed.score?.scoreA !== '-' && (
              <span className="ml-2 font-semibold">{seed.score?.scoreA}</span>
            )}
          </SeedTeam>
          <SeedTeam className={`font-semibold ${awayId && winnerId === awayId ? "text-yellow-200 font-bold" : ""}`}>
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
            <EditMatchResults
              match={seed.match}
              endpoint="double"
              onSaved={refreshMatches}
            />
            {seed.match?.match_status === 'over' && (
              <>
                <EditMatchStatsModal match={seed.match} onSaved={refreshMatches} />
                <ExportMatchResults match={seed.match} />
              </>
            )}
          </div>
        </div>
      </SeedItem>
    </Seed>
  );
}

export default function DoubleBracket({ tournamentId }: { tournamentId: number }) {
  const [winnersRounds, setWinnersRounds] = useState<RoundProps[]>([]);
  const [losersRounds, setLosersRounds] = useState<RoundProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [referees, setReferees] = useState<Referee[]>([]);

  const groupMatches = (matches: Match[]): RoundProps[] => {
    const grouped: Record<number, any[]> = {};

    matches.forEach((m) => {
      const round = m.match_round ?? 1;
      if (!grouped[round]) grouped[round] = [];
      grouped[round].push({
        id: m.match_id,
        teams: [
          { name: m.homeTeam?.team_name || 'TBD' },
          { name: m.awayTeam?.team_name || 'TBD' },
        ],
        score: {
          scoreA: m.home_team_score ?? '-',
          scoreB: m.away_team_score ?? '-',
        },
        match: m,
        round,
      });
    });

    return Object.entries(grouped)
      .map(([roundNum, seeds]) => ({
        title: `${roundNum}. Forduló`,
        seeds,
      }))
      .sort((a, b) => Number(a.title.match(/\d+/)) - Number(b.title.match(/\d+/)));
  };

  const handleFetchedData = (data: Match[]) => {
    const winnerMatches = data.filter((m) => m.bracket_type === 'winner');
    const loserMatches = data.filter((m) => m.bracket_type === 'loser');
    const finalMatch = data.find((m) => m.bracket_type === 'final');

    const winnerFinal = winnerMatches.find((m) => m.match_round === 3);

    let loserFinal: Match | null = null;
    let otherLosers: Match[] = [];

    if (winnerFinal) {
      loserFinal = loserMatches.find((m) => m.previous_match_2_id === winnerFinal.match_id) || null;
      otherLosers = loserMatches.filter((m) => m.match_id !== (loserFinal?.match_id ?? -1));
    } else {
      otherLosers = loserMatches;
    }

    const losersGrouped = groupMatches(otherLosers);

    if (loserFinal) {
      losersGrouped.push({
        title: 'Alsó ági döntő',
        seeds: [
          {
            id: loserFinal.match_id,
            teams: [
              { name: loserFinal.homeTeam?.team_name || 'TBD' },
              { name: loserFinal.awayTeam?.team_name || 'TBD' },
            ],
            score: {
              scoreA: loserFinal.home_team_score ?? '-',
              scoreB: loserFinal.away_team_score ?? '-',
            },
            match: loserFinal,
            round: 'Alsó ági döntő',
          },
        ],
      });
    }

    const winnersRoundsGrouped = groupMatches(winnerMatches);

    if (finalMatch) {
      winnersRoundsGrouped.push({
        title: 'Döntő',
        seeds: [
          {
            id: finalMatch.match_id,
            teams: [
              { name: finalMatch.homeTeam?.team_name || 'TBD' },
              { name: finalMatch.awayTeam?.team_name || 'TBD' },
            ],
            score: {
              scoreA: finalMatch.home_team_score ?? '-',
              scoreB: finalMatch.away_team_score ?? '-',
            },
            match: finalMatch,
            round: 'Döntő',
          },
        ],
      });
    }

    setWinnersRounds(winnersRoundsGrouped);
    setLosersRounds(losersGrouped);
    setLoading(false);
  };

  const refreshMatches = () => {
    setLoading(true);
    fetch(`/api/double?tournamentId=${tournamentId}`)
      .then((res) => res.json())
      .then(handleFetchedData)
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    refreshMatches();
  }, [tournamentId]);

  useEffect(() => {
    fetch(`/api/referees?tournamentId=${tournamentId}`)
      .then((res) => res.json())
      .then((data) => setReferees(data.refereeStats ?? []))
      .catch(() => setReferees([]));
  }, [tournamentId]);

  if (loading) return <div className="p-4">Ágrajz betöltése...</div>;

  return (
    <>
      <h2 className="font-bold text-xl">Felső ág</h2>
      <Bracket
        rounds={winnersRounds}
        renderSeedComponent={(props) => (
          <CustomSeed {...props} referees={referees} refreshMatches={refreshMatches} />
        )}
      />

      <h2 className="font-bold text-xl mt-8">Alsó ág</h2>
      <Bracket
        rounds={losersRounds}
        renderSeedComponent={(props) => (
          <CustomSeed {...props} referees={referees} refreshMatches={refreshMatches} />
        )}
      />
    </>
  );
}
