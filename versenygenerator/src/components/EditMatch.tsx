"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";

function toDateTimeLocal(dt: any) {
  if (!dt) return "";
  const date = typeof dt === "string" ? new Date(dt) : dt;
  const off = date.getTimezoneOffset();
  const local = new Date(date.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function EditMatch({
  match,
  referees,
  roundRefereeIds,
}: {
  match: any;
  referees: { referee_id: number; referee_name: string }[];
  roundRefereeIds: (number | null | undefined)[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const currentStadiumName =
  match.venue?.venue_name || match.stadium?.stadium_name || "";

  const [form, setForm] = useState({
    date: toDateTimeLocal(match.match_date),
    stadium: currentStadiumName,
    referee: match.referee_referee_id ? String(match.referee_referee_id) : "",
  });

  const availableReferees = referees.filter(
    (r) =>
      !roundRefereeIds.includes(r.referee_id) ||
      r.referee_id === match.referee_referee_id
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/matches/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: match.match_id,
          date: form.date,
          stadium: form.stadium,
          referee: form.referee,
        }),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || "Hiba történt a módosítás során.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Hiba:", error);
      alert("Nem sikerült módosítani a mérkőzést.");
    }
  };

  return (
    <>
      <Calendar
        className="w-6 h-6 inline cursor-pointer ml-2 text-gray-700 hover:text-gray-900"
        onClick={() => setOpen(true)}
        aria-label="Mérkozés szerkesztése"
        role="button"
      />

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl border w-full max-w-xl space-y-6 shadow-2xl">
            <h2 className="text-3xl font-bold text-center mb-4">
              Mérkőzés szerkesztése
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="block text-xl font-medium">
                  Mérkőzés időpontja
                </Label>
                <Input
                  name="date"
                  type="datetime-local"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 text-lg"
                />
              </div>
              <div>
                <Label className="block text-xl font-medium">Helyszín</Label>
                <Input
                  name="stadium"
                  value={form.stadium}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 text-lg"
                  placeholder="Add meg a helyszínt"
                />
              </div>
              <div>
                <Label className="block text-xl font-medium">
                  Játékvezető
                </Label>
                <select
                  name="referee"
                  value={form.referee}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 text-lg"
                >
                  <option value="">Válassz játékvezetőt</option>
                  {availableReferees.map((r) => (
                    <option key={r.referee_id} value={String(r.referee_id)}>
                      {r.referee_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <Button
                type="button"
                onClick={() => setOpen(false)}
                className="px-6 py-2 text-lg bg-gray-300 rounded"
              >
                Mégse
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2 text-lg bg-blue-600 text-white rounded"
              >
                Mentés
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
