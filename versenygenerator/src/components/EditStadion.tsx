"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface Stadion {
  stadium_id: number;
  stadium_name: string;
  address?: string | null;
  capacity?: number | null;
}

export default function EditStadionModal({ stadion }: { stadion: Stadion }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    stadium_name: stadion.stadium_name,
    address: stadion.address || "",
    capacity: stadion.capacity ?? "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.stadium_name.trim()) {
      toast.error("A stadion neve kötelező.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/stadion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stadium_id: stadion.stadium_id,
          stadium_name: form.stadium_name,
          address: form.address,
          capacity: form.capacity ? Number(form.capacity) : null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Hiba történt a módosítás során.");
      }

      toast.success("A stadion adatai sikeresen frissítve!");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült módosítani a stadiont.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Pencil
        className="w-6 h-6 inline cursor-pointer ml-2 text-gray-700 hover:text-gray-900"
        onClick={() => setOpen(true)}
      />

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl border w-full max-w-lg space-y-6 shadow-2xl">
            <h2 className="text-3xl font-bold text-center">Stadion szerkesztése</h2>

            <div className="space-y-4">
              <div>
                <Label className="block text-xl font-medium">Stadion neve</Label>
                <Input
                  name="stadium_name"
                  value={form.stadium_name}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 text-lg"
                />
              </div>

              <div>
                <Label className="block text-xl font-medium">Cím</Label>
                <Input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 text-lg"
                />
              </div>

              <div>
                <Label className="block text-xl font-medium">Férőhely</Label>
                <Input
                  name="capacity"
                  type="number"
                  value={form.capacity}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 text-lg"
                  min={0}
                />
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <Button
                onClick={() => setOpen(false)}
                className="px-6 py-2 text-xl bg-gray-300 rounded"
                type="button"
              >
                Mégse
              </Button>

              <Button
                onClick={handleSubmit}
                className="px-6 py-2 text-xl bg-blue-600 text-white rounded"
                type="button"
                disabled={loading}
              >
                {loading ? "Mentés..." : "Mentés"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
