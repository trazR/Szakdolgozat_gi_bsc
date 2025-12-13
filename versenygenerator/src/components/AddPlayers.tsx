'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { statFieldsBySport } from '@/utils/statFields';

interface Player {
  player_id: number;
  player_name: string;
  [key: string]: any;
}

export default function AddPlayers({
  teamId,
  tournamentId,
  game = 'football',
}: {
  teamId: number;
  tournamentId: number;
  game?: string;
}) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(false);

  const statFields = statFieldsBySport[game] || statFieldsBySport['football'];

  const fetchPlayers = async () => {
    try {
      const res = await fetch(`/api/players?teamId=${teamId}`);
      if (!res.ok) throw new Error('Nem sikerült betölteni a játékosokat.');
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      console.error(err);
      toast.error('Nem sikerült betölteni a játékosokat.');
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [teamId]);

  const handleAddPlayer = async () => {
  const name = newPlayerName.trim();

  if (!name) {
    toast.error("Add meg a játékos nevét!");
    return;
  }

  if (/\d/.test(name)) {
    toast.error("A játékos neve nem tartalmazhat számot!");
    return;
  }

  if (!/^[\p{L}\s.'-]+$/u.test(name)) {
    toast.error("A név csak betűket és szóközöket tartalmazhat.");
    return;
  }

  if (name.length < 3) {
    toast.error("A játékos neve legalább 3 karakter hosszú legyen.");
    return;
  }

  try {
    setLoading(true);
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_name: name, team_team_id: teamId }),
    });

    if (!res.ok) throw new Error("Hiba a játékos hozzáadásakor.");

    toast.success("Játékos sikeresen hozzáadva!");
    setNewPlayerName("");
    fetchPlayers();
  } catch (err) {
    console.error(err);
    toast.error("Nem sikerült hozzáadni a játékost.");
  } finally {
    setLoading(false);
  }
};


  const handleDeletePlayer = async (playerId: number) => {
    try {
      const res = await fetch(`/api/players`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId }),
      });

      if (!res.ok) throw new Error('Hiba a játékos törlésekor.');

      toast.success('Játékos sikeresen törölve!');
      fetchPlayers();
    } catch (err) {
      console.error(err);
      toast.error('Nem sikerült törölni a játékost.');
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <table className="w-full border text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Név</th>
            {statFields.map((field) => (
              <th key={field.key} className="p-2">
                {field.label}
              </th>
            ))}
            <th className="p-2">Törlés</th>
          </tr>
        </thead>
        <tbody>
          {players.length === 0 ? (
            <tr>
              <td
                colSpan={statFields.length + 2}
                className="text-center text-gray-500 py-4"
              >
                Nincs játékos a csapatban.
              </td>
            </tr>
          ) : (
            players.map((player) => (
              <tr key={player.player_id} className="border-t">
                <td className="p-2">
                  <Link
                    href={`/tournaments/${tournamentId}/teams/${teamId}/player`}
                    className="text-blue-600 hover:underline"
                  >
                    {player.player_name}
                  </Link>
                </td>
                {statFields.map((field) => (
                  <td key={field.key} className="p-2 text-center">
                    {player[field.key] ?? 0}
                  </td>
                ))}

                <td className="p-2 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => handleDeletePlayer(player.player_id)}
                    className="text-red-500"
                  >
                    <X size={18} />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex gap-2">
        <Input
          placeholder="Játékos neve"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
        />
        <Button onClick={handleAddPlayer} disabled={loading}>
          {loading ? 'Hozzáadás...' : 'Játékos hozzáadása'}
        </Button>
      </div>
    </div>
  );
}
