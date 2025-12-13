'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import Link from "next/link";
import { toast } from 'sonner';

interface Venue {
  venue_id: number;
  venue_name: string;
}

export default function AddVenue({ tournamentId }: { tournamentId: number }) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [newVenueName, setNewVenueName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchVenues = async () => {
    try {
      const res = await fetch(`/api/venues?tournamentId=${tournamentId}`);
      if (!res.ok) throw new Error('Nem sikerült betölteni a helyszíneket.');
      const data = await res.json();
      setVenues(data);
    } catch (err) {
      console.error(err);
      toast.error('Nem sikerült betölteni a helyszíneket.');
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [tournamentId]);

  const handleAddVenue = async () => {
    if (!newVenueName.trim()) {
      toast.error('Add meg a helyszín nevét!');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_name: newVenueName,
          tournament_tournament_id: tournamentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Hiba történt a helyszín hozzáadásakor.');
        return;
      }

      toast.success('Helyszín sikeresen hozzáadva!');
      setNewVenueName('');
      fetchVenues();
    } catch (err) {
      console.error(err);
      toast.error('Nem sikerült hozzáadni a helyszínt.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVenue = async (venueId: number) => {
    try {
      const res = await fetch('/api/venues', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venue_id: venueId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Hiba történt a helyszín törlésekor.');
        return;
      }

      toast.success('Helyszín sikeresen törölve!');
      fetchVenues();
    } catch (err) {
      console.error(err);
      toast.error('Nem sikerült törölni a helyszínt.');
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <table className="w-full border text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Név</th>
            <th className="p-2 text-center">Törlés</th>
          </tr>
        </thead>
        <tbody>
          {venues.length === 0 ? (
            <tr>
              <td colSpan={2} className="text-center text-gray-500 py-4">
                Nincs helyszín ehhez a tornához.
              </td>
            </tr>
          ) : (
            venues.map((venue) => (
              <tr key={venue.venue_id} className="border-t">
                <td className="p-2">
                  <Link
                    href={`/tournaments/${tournamentId}/venue/info`}
                    className="text-blue-600 hover:underline"
                  >
                    {venue.venue_name}
                  </Link>
                </td>
                <td className="p-2 text-center">
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteVenue(venue.venue_id)}
                    title="Törlés"
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
          placeholder="Helyszín neve"
          value={newVenueName}
          onChange={e => setNewVenueName(e.target.value)}
        />
        <Button onClick={handleAddVenue} disabled={loading}>
          {loading ? 'Hozzáadás...' : 'Helyszín hozzáadása'}
        </Button>
      </div>
    </div>
  );
}
