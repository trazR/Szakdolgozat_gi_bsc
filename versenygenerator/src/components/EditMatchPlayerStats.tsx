'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { statFieldsBySport } from '@/utils/statFields';
import { toast } from 'sonner';

export default function EditMatchPlayerStats({ match, onCancel }: any) {
  const router = useRouter();
  const sport = match.tournament?.game || 'football';
  const statFields = statFieldsBySport[sport] || statFieldsBySport.football;

  const initialStats: Record<string, any> = {};
  [
    ...(match.homeTeam?.player || []),
    ...(match.awayTeam?.player || []),
  ].forEach((p: any) => {
    initialStats[p.player_id] = {};
    statFields.forEach((f) => (initialStats[p.player_id][f.key] = ''));
  });

  if (match.plays?.length) {
    match.plays.forEach((play: any) => {
      if (!initialStats[play.player_player_id]) return;
      statFields.forEach((f) => {
        initialStats[play.player_player_id][f.key] = play[f.key] ?? '';
      });
    });
  }

  const [stats, setStats] = useState(initialStats);

  const handleChange = (playerId: number, field: string, value: string) => {
    setStats((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    for (const playerId in stats) {
      const playerStats = stats[playerId];
      for (const key in playerStats) {
        const value = Number(playerStats[key]);
        if (!isNaN(value) && value < 0) {
          toast.error('A statisztikai értékek nem lehetnek negatívak!');
          return;
        }
      }
    }

    try {
      const res = await fetch('/api/matches/stats/playerStats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.match_id,
          stats,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Mentés sikertelen');

      router.refresh();
      toast.success('Játékos statisztikák sikeresen mentve!');
      onCancel();
    } catch (error) {
      toast.error('Nem sikerült menteni a játékos statisztikákat.');
      console.error(error);
    }
  };

  const homePlayers = match.homeTeam?.player || [];
  const awayPlayers = match.awayTeam?.player || [];

  const renderTeamTable = (players: any[], teamName: string) => (
    <div className="min-w-[900px] overflow-x-auto">
      <div className="font-bold text-center mb-4 text-lg">{teamName}</div>
      <table className="w-full text-sm md:text-base border-separate border-spacing-y-2 whitespace-nowrap">
        <thead>
          <tr>
            <th className="p-2 text-left sticky left-0 bg-white">Név</th>
            {statFields.map((field) => (
              <th key={field.key} className="p-2 text-center">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((player: any) => (
            <tr key={player.player_id} className="border-b last:border-b-0">
              <td className="p-2 whitespace-nowrap font-medium">
                {player.player_name}
              </td>
              {statFields.map((field) => (
                <td key={field.key} className="p-2 text-center">
                  <Input
                    type="number"
                    min={0}
                    value={stats[player.player_id]?.[field.key] ?? ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < 0) {
                        toast.error('A statisztikai érték nem lehet negatív!');
                        return;
                      }
                      handleChange(player.player_id, field.key, e.target.value);
                    }}
                    className="w-20 text-center py-1"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="w-full max-w-[95vw] max-h-[85vh] overflow-auto p-4 bg-white rounded-lg shadow-lg">
      <div className="flex flex-col md:flex-row gap-12 overflow-x-auto pb-6">
        {renderTeamTable(
          homePlayers,
          match.homeTeam.team_name
        )}
        {renderTeamTable(
          awayPlayers,
          match.awayTeam.team_name
        )}
      </div>

      <div className="flex justify-center gap-6 mt-8">
        <Button onClick={onCancel} className="bg-gray-300 text-black">
          Mégse
        </Button>
        <Button onClick={handleSubmit} className="bg-blue-600 text-white">
          Mentés
        </Button>
      </div>
    </div>
  );
}
