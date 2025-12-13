"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";

type Referee = {
  referee_id: number;
  referee_name: string;
  age: number | null;
  gender: string | null;
  nationality: string | null;
};

export default function EditReferee({ referee }: { referee: Referee }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    referee_name: referee.referee_name ?? "",
    age:
      referee.age !== null && referee.age !== undefined
        ? String(referee.age)
        : "",
    gender: referee.gender ?? "",
    nationality: referee.nationality ?? "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const name = form.referee_name.trim();
    if (!name || name.length < 3) {
      toast.error("A játékvezető neve legalább 3 karakter hosszú legyen.");
      return;
    }

    if (!/^[\p{L}\s.'-]+$/u.test(name)) {
      toast.error("A játékvezető neve csak betűket és szóközöket tartalmazhat.");
      return;
    }

    let parsedAge: number | null = null;
    if (form.age !== "") {
      parsedAge = Number(form.age);
      if (Number.isNaN(parsedAge) || parsedAge < 18 || parsedAge > 75) {
        toast.error(
          "A játékvezető életkora 18 és 75 év közé essen, ha megadjuk."
        );
        return;
      }
    }

    if (form.gender && !["ferfi", "no", "egyeb"].includes(form.gender)) {
      toast.error("Érvénytelen nem érték.");
      return;
    }

    const nat = form.nationality.trim();
    if (nat) {
      if (nat.length < 2 || nat.length > 50) {
        toast.error("A nemzetiség hossza 2 és 50 karakter között legyen.");
        return;
      }
      if (!/^[\p{L}\s-]+$/u.test(nat)) {
        toast.error(
          "A nemzetiség csak betűket, szóközt és kötőjelet tartalmazhat."
        );
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/referees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referee_id: referee.referee_id,
          referee_name: name,
          age: parsedAge,
          gender: form.gender || null,
          nationality: nat || null,
        }),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error || "Hiba történt a módosítás során.");
      }

      toast.success("Játékvezető módosítva!");
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Nem sikerült módosítani a játékvezetőt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Pencil
        className="w-6 h-6 inline cursor-pointer ml-2 text-gray-700 hover:text-gray-900"
        onClick={() => setOpen(true)}
        aria-label="Játékvezető szerkesztése"
        role="button"
      />

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl border w-full max-w-lg space-y-6 shadow-2xl">
            <h2 className="text-3xl font-bold text-center">
              Játékvezető szerkesztése
            </h2>

            <div className="space-y-4">
              {/* Név */}
              <div>
                <Label className="block text-xl font-medium">Név</Label>
                <Input
                  name="referee_name"
                  value={form.referee_name}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 text-lg"
                />
              </div>

              {/* Kor */}
              <div>
                <Label className="block text-xl font-medium">Kor</Label>
                <Input
                  name="age"
                  type="number"
                  value={form.age}
                  onChange={handleChange}
                  min={0}
                  className="w-full border rounded px-4 py-2 text-lg"
                />
              </div>

              <div>
                <Label className="block text-xl font-medium">Nem</Label>
                <Select
                  value={form.gender || ""}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger className="w-full px-4 py-2 text-lg">
                    <SelectValue placeholder="Válassz nemet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ferfi">Férfi</SelectItem>
                    <SelectItem value="no">Nő</SelectItem>
                    <SelectItem value="egyeb">Egyéb</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block text-xl font-medium">Nemzetiség</Label>
                <Input
                  name="nationality"
                  value={form.nationality}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 text-lg"
                  placeholder="pl. Magyar, Német, Spanyol"
                />
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <Button
                onClick={() => setOpen(false)}
                variant="secondary"
                className="px-6 py-2 text-xl"
                type="button"
              >
                Mégse
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 text-xl"
                type="button"
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
