'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
interface TableRow {
  team_id: number;
  team_name: string;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
}

export default function TablePage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [table, setTable] = useState<TableRow[]>([]);

  useEffect(() => {
    if (!tournamentId) return;
    fetch(`/api/table?tournamentId=${tournamentId}`)
      .then(res => res.json())
      .then(setTable)
      .catch(() => setTable([]));
  }, [tournamentId]);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tabella</h1>
      <div className="overflow-x-auto rounded shadow">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Csapat</th>
              <th className="p-2 text-center">M</th>
              <th className="p-2 text-center">Gy</th>
              <th className="p-2 text-center">D</th>
              <th className="p-2 text-center">V</th>
              <th className="p-2 text-center">G</th>
              <th className="p-2 text-center">KG</th>
              <th className="p-2 text-center">GK</th>
              <th className="p-2 text-center">P</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row, i) => (
              <tr key={row.team_id} className="border-t">
                <td className="p-2">{i + 1}</td>
                <td className="p-2">{row.team_name}</td>
                <td className="p-2 text-center">{row.played}</td>
                <td className="p-2 text-center">{row.wins}</td>
                <td className="p-2 text-center">{row.draws}</td>
                <td className="p-2 text-center">{row.losses}</td>
                <td className="p-2 text-center">{row.goalsFor}</td>
                <td className="p-2 text-center">{row.goalsAgainst}</td>
                <td className="p-2 text-center">{row.goalDiff}</td>
                <td className="p-2 text-center font-bold">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
