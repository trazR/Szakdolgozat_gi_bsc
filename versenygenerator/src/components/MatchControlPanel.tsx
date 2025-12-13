'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MatchControlPanelProps {
  tournamentId: string | number;
  generateEndpoint: string;
  generateLabel?: string;
}

export default function MatchControlPanel({
  tournamentId,
  generateEndpoint,
  generateLabel = 'Mérkőzések generálása',
}: MatchControlPanelProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadyGenerated, setAlreadyGenerated] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const checkMatches = async () => {
      try {
        const res = await fetch(`/api/matches/exist?tournamentId=${tournamentId}`);
        const data = await res.json();
        setAlreadyGenerated(data.status === 'generated');
      } catch (err) {
        console.error('Nem sikerült ellenőrizni a mérkőzéseket:', err);
      } finally {
        setChecking(false);
      }
    };
    checkMatches();
  }, [tournamentId]);

  const handleGenerate = async () => {
  try {
    setLoading(true);
    const response = await fetch(generateEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId: Number(tournamentId) }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error || 'Hiányos adatok! Kérlek ellenőrizd a beállításokat.');
      return;
    }

    toast.success('Mérkőzések sikeresen legenerálva!');
    setAlreadyGenerated(true);
    window.location.reload();
  } catch (error: any) {
    toast.error(error.message || 'Hiba történt a generálás során.');
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/matches/deleteAll', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: Number(tournamentId) }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Hiba történt a törlés során');

      toast.success(`Mérkőzések törölve (${data.deletedCount})`);
      setAlreadyGenerated(false);
      setConfirmOpen(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt a törlés során');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <p className="text-center text-gray-500 mt-4">Ellenőrzés...</p>;
  }

  return (
    <div className="flex flex-col gap-2 items-center mt-4">
      {!alreadyGenerated ? (
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generálás...' : generateLabel}
        </Button>
      ) : (
        <>
          <p className="text-gray-600 text-center mb-2">
            A mérkőzések már legenerálva lettek ehhez a bajnoksághoz.
          </p>

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={loading}>
                {loading ? 'Törlés...' : 'Mérkőzések törlése'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Biztosan törlöd az összes mérkőzést?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ez a művelet nem visszavonható. Az összes generált mérkőzés végleg törlődni fog
                  ehhez a bajnoksághoz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Mégsem</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Igen, törlöm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
