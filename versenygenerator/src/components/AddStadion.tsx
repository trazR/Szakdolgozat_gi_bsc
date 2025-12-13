'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import Link from "next/link";
import { toast } from 'sonner';

interface Stadion {
  stadium_id: number;
  stadium_name: string;
}

export default function AddStadion({
  teamId,
  tournamentId,
}: {
  teamId: number;
  tournamentId: number;
}) {
  const [stadiumName, setStadiumName] = useState('');
  const [stadion, setStadion] = useState<Stadion | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchStadion = async () => {
    try {
      const res = await fetch(`/api/stadion?teamId=${teamId}`);
      if (!res.ok) throw new Error('Nem sikerült lekérni a stadion adatokat.');
      const data = await res.json();
      setStadion(data);
    } catch (err) {
      console.error(err);
      toast.error('Nem sikerült betölteni a stadiont.');
    }
  };

  useEffect(() => {
    fetchStadion();
  }, []);

  const handleAdd = async () => {
    if (!stadiumName.trim()) {
      toast.error('Add meg a stadion nevét!');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/stadion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stadium_name: stadiumName, team_id: teamId }),
      });

      if (!res.ok) throw new Error('Hiba a stadion hozzáadásakor.');

      toast.success('Stadion sikeresen hozzáadva!');
      setStadiumName('');
      fetchStadion();
    } catch (err) {
      console.error(err);
      toast.error('Nem sikerült hozzáadni a stadiont.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!stadion) return;

    try {
      const res = await fetch('/api/stadion', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId }),
      });

      if (!res.ok) throw new Error('Hiba a stadion törlésekor.');

      toast.success('Stadion sikeresen törölve!');
      setStadion(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Nem sikerült törölni a stadiont.');
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {stadion ? (
        <div className="flex items-center gap-2 text-xl">
          <Link
            href={`/tournaments/${tournamentId}/teams/${teamId}/stadion`}
            className="text-blue-600 hover:underline"
          >
            {stadion.stadium_name}
          </Link>
          <Button variant="ghost" onClick={handleDelete} className="text-red-500 p-1" title="Stadion törlése">
            <X size={18} />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Stadion neve"
            value={stadiumName}
            onChange={(e) => setStadiumName(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? 'Hozzáadás...' : 'Stadion hozzáadása'}
          </Button>
        </div>
      )}
    </div>
  );
}
