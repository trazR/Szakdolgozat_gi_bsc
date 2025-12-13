'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { statFieldsBySport } from '@/utils/statFields';

type EditMatchGeneralStatsProps = {
  sport: string;
  match: any;
  onCancel: () => void;
};

export default function EditMatchGeneralStats({
  sport,
  match,
  onCancel,
}: EditMatchGeneralStatsProps) {

  const sportKey = sport?.toLowerCase() || 'football';

  let baseFields =
    statFieldsBySport[sportKey as keyof typeof statFieldsBySport] ?? [];
  if (sportKey === 'basketball') {
    const filtered = baseFields.filter(
      (f) =>
        f.key !== 'points_2pt' &&
        f.key !== 'points_3pt' &&
        f.key !== 'penalties_scored'
    );

    baseFields = [
      { key: 'total_points', label: 'Összes dobott pont' },
      ...filtered,
    ];
  }
  const fields = baseFields.map((f) => ({
    ...f,
    totalKey: `${f.key}_total`,
  }));

  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;

  const [stats, setStats] = useState<{
    home: Record<string, number>;
    away: Record<string, number>;
  }>({
    home: {},
    away: {},
  });

  useEffect(() => {
    async function fetchAutoStats() {
      try {
        const res = await fetch(
          `/api/matches/stats/${match.match_id}/autoStats`
        );
        if (!res.ok) return;
        const auto = await res.json();

        setStats({
          home: auto[homeTeam?.team_id] ?? {},
          away: auto[awayTeam?.team_id] ?? {},
        });
      } catch (err) {
        console.error('Nem sikerült automatikus statokat betölteni', err);
      }
    }

    if (match?.match_id && homeTeam?.team_id && awayTeam?.team_id) {
      fetchAutoStats();
    }
  }, [match?.match_id, homeTeam?.team_id, awayTeam?.team_id]);

  return (
    <div className="w-full max-w-[80vw] max-h-[80vh] mx-auto overflow-auto bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-6 text-center">
        Mérkőzés összesített statisztikái
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-[700px] w-full text-center border-separate border-spacing-y-3 whitespace-nowrap">
          <thead>
            <tr>
              <th className="w-1/3 text-right text-lg font-semibold pr-4">
                {homeTeam?.team_name}
              </th>
              <th className="w-1/3"></th>
              <th className="w-1/3 text-left text-lg font-semibold pl-4">
                {awayTeam?.team_name}
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr
                key={field.key}
                className="hover:bg-gray-50 transition border-b last:border-b-0"
              >
                <td className="p-2 text-right">
                  <span className="inline-block min-w-[3rem] text-right font-medium">
                    {stats.home[field.totalKey] ?? 0}
                  </span>
                </td>
                <td className="font-medium py-2 text-sm sm:text-base">
                  {field.label}
                </td>
                <td className="p-2 text-left">
                  <span className="inline-block min-w-[3rem] text-left font-medium">
                    {stats.away[field.totalKey] ?? 0}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-6 mt-8">
        <Button
          onClick={onCancel}
          className="bg-gray-300 text-black hover:bg-gray-400"
        >
          Bezárás
        </Button>
      </div>
    </div>
  );
}
