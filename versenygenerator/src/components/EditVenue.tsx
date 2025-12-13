"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface Venue {
  venue_id: number;
  venue_name: string;
  address?: string | null;
  capacity?: number | null;
}

export default function EditVenue({ venue }: { venue: Venue }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    venue_name: venue.venue_name ?? "",
    address: venue.address || "",
    capacity:
      venue.capacity !== null && venue.capacity !== undefined
        ? String(venue.capacity)
        : "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const name = form.venue_name.trim();
    if (!name || name.length < 3) {
      toast.error(
        "A helyszín neve kötelező, és legalább 3 karakter hosszú legyen."
      );
      return;
    }

    if (!/^[\p{L}\d\s.'-]+$/u.test(name)) {
      toast.error(
        "A helyszín neve csak betűket, számokat és szóközöket tartalmazhat."
      );
      return;
    }

    const addr = form.address.trim();
    if (addr) {
      if (addr.length < 5 || addr.length > 100) {
        toast.error("A cím hossza 5 és 100 karakter között legyen.");
        return;
      }
      if (!/^[\p{L}\d\s,.\-\/]+$/u.test(addr)) {
        toast.error(
          "A cím csak betűket, számokat, szóközt és alap írásjeleket tartalmazhat."
        );
        return;
      }
    }

    let parsedCapacity: number | null = null;
    if (form.capacity !== "") {
      parsedCapacity = Number(form.capacity);
      if (
        Number.isNaN(parsedCapacity) ||
        parsedCapacity < 0 ||
        parsedCapacity > 200000
      ) {
        toast.error(
          "A férőhely 0 és 200 000 közötti szám legyen, ha megadjuk."
        );
        return;
      }
    }

    try {
      setLoading(true);
      const res = await fetch("/api/venues", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue_id: venue.venue_id,
          venue_name: name,
          address: addr || null,
          capacity: parsedCapacity,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Hiba történt a módosítás során.");
        return;
      }

      toast.success("A helyszín adatai sikeresen frissítve!");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült módosítani a helyszínt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Pencil
        className="w-6 h-6 inline cursor-pointer ml-2 text-gray-700 hover:text-gray-900"
        onClick={() => setOpen(true)}
        aria-label="Helyszín szerkesztése"
        role="button"
      />

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl border w-full max-w-lg space-y-6 shadow-2xl">
            <h2 className="text-3xl font-bold text-center">
              Helyszín szerkesztése
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="block text-xl font-medium">Név</Label>
                <Input
                  name="venue_name"
                  value={form.venue_name}
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
                disabled={loading}
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
