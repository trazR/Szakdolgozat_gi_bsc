'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const weekdays = [
  { name: 'Hétfő', value: 'monday' },
  { name: 'Kedd', value: 'tuesday' },
  { name: 'Szerda', value: 'wednesday' },
  { name: 'Csütörtök', value: 'thursday' },
  { name: 'Péntek', value: 'friday' },
  { name: 'Szombat', value: 'saturday' },
  { name: 'Vasárnap', value: 'sunday' },
];

export default function SchedulerForm({
  tournamentId,
  tournamentType,
}: {
  tournamentId: number;
  tournamentType: string;
}) {
  const router = useRouter();

  const [startDate, setStartDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<{ day: string; start: string; end: string }[]>([]);
  const [matchDuration, setMatchDuration] = useState('');

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev =>
      prev.find(d => d.day === day)
        ? prev.filter(d => d.day !== day)
        : [...prev, { day, start: '', end: '' }]
    );
  };

  const handleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
    setSelectedDays(prev =>
      prev.map(d => (d.day === day ? { ...d, [type]: value } : d))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !matchDuration || selectedDays.length === 0) {
      toast.error('Kérlek töltsd ki a kezdési dátumot, a meccshosszt és válassz napokat!');
      return;
    }

    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        body: JSON.stringify({
          tournamentId,
          startDate,
          selectedDays,
          matchDuration: parseInt(matchDuration),
        }),
      });

      if (!res.ok) throw new Error();

      toast.success('Ütemezés sikeresen mentve!');

      setTimeout(() => {
        switch (tournamentType) {
          case 'league':
            router.push(`/tournaments/${tournamentId}/league`);
            break;
          case 'knockout':
            router.push(`/tournaments/${tournamentId}/single`);
            break;
          case 'double':
            router.push(`/tournaments/${tournamentId}/double`);
            break;
          case 'round-robin':
            router.push(`/tournaments/${tournamentId}/robin`);
            break;
          default:
            router.push(`/tournaments/${tournamentId}/overview`);
            break;
        }
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error('Hiba történt a mentés során.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="flex flex-col gap-2">
        <Label className="text-2xl">Kezdési dátum</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-4">
        <Label className="text-2xl">Mely napokon és idősávban legyen mérkőzés</Label>
        {weekdays.map((day) => {
          const isSelected = selectedDays.some(d => d.day === day.value);
          const currentDay = selectedDays.find(d => d.day === day.value);

          return (
            <div key={day.value} className="border rounded p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleDayToggle(day.value)}
                  className="w-5 h-5"
                />
                <span className="text-lg">{day.name}</span>
              </div>

              {isSelected && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex flex-col">
                    <Label className="text-sm">Kezdés:</Label>
                    <Input
                      type="time"
                      value={currentDay?.start || ''}
                      onChange={(e) => handleTimeChange(day.value, 'start', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label className="text-sm">Befejezés:</Label>
                    <Input
                      type="time"
                      value={currentDay?.end || ''}
                      onChange={(e) => handleTimeChange(day.value, 'end', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col">
        <Label className="text-xl">Mérkőzés hossza (perc)</Label>
        <Input
          type="number"
          value={matchDuration}
          onChange={(e) => setMatchDuration(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full">
        Mentés
      </Button>
    </form>
  );
}
