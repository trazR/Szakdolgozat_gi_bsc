'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function UploadCsv({ tournamentId }: { tournamentId: number }) {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;

    if (!selected) {
      setFile(null);
      return;
    }

    if (!selected.name.toLowerCase().endsWith('.csv')) {
      toast.error('Csak .csv kiterjesztésű fájl tölthető fel.');
      e.target.value = '';
      setFile(null);
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (selected.size > maxSize) {
      toast.error('A fájl mérete nem haladhatja meg a 2 MB-ot.');
      e.target.value = '';
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Válassz ki egy CSV fájlt!');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('tournamentId', tournamentId.toString());

      const res = await fetch('/api/uploadCsv', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success(data.message || 'Sikeres feltöltés!');
        router.refresh();
      } else {
        toast.error(data.error || 'Hiba a feltöltés során!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Váratlan hiba a feltöltés során.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-end mb-4 gap-2">
      <Input 
        type="file" 
        accept=".csv" 
        onChange={handleFileChange} 
        className="w-auto"
      />
      <Button onClick={handleUpload} disabled={loading}>
        {loading ? 'Feltöltés...' : 'Adatok feltöltése'}
      </Button>
    </div>
  );
}
