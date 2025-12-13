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

type Player = {
  player_id: number;
  player_name: string;
  age: number | null;
  gender: string | null;
  nationality: string | null;
  position: string | null;
};


export default function EditPlayer({ player }: { player: Player }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    player_name: player.player_name ?? "",
    age:
      player.age !== null && player.age !== undefined ? String(player.age) : "",
    gender: player.gender ?? "",
    nationality: player.nationality ?? "",
    position: player.position ?? "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const name = form.player_name.trim();
    if (!name || name.length < 3) {
      toast.error("A játékos neve legalább 3 karakter hosszú legyen.");
      return;
    }
    if (!/^[\p{L}\s.'-]+$/u.test(name)) {
      toast.error("A játékos neve csak betűket és szóközöket tartalmazhat.");
      return;
    }

    let parsedAge: number | null = null;
    if (form.age !== "") {
      parsedAge = Number(form.age);
      if (Number.isNaN(parsedAge) || parsedAge < 5 || parsedAge > 70) {
        toast.error("A kor 5 és 70 év közé essen, ha megadjuk.");
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

    const pos = form.position.trim();
    if (pos && pos.length > 50) {
      toast.error("A poszt megnevezése legfeljebb 50 karakter lehet.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/players", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: player.player_id,
          player_name: name,
          age: parsedAge,
          gender: form.gender || null,
          nationality: nat || null,
          position: pos || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Hiba történt a módosítás során.");
      }

      toast.success("A játékos adatai sikeresen frissítve!");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Nem sikerült módosítani a játékost.");
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
            <h2 className="text-3xl font-bold text-center">Játékos szerkesztése</h2>
            <div className="space-y-4">
              <div>
                <Label className="block text-xl font-medium">Név</Label>
                <Input
                  name="player_name"
                  value={form.player_name}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 text-lg"
                />
              </div>
              <div>
                <Label className="block text-xl font-medium">Kor</Label>
                <Input
                  name="age"
                  type="number"
                  value={form.age}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 text-lg"
                  min={0}
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
                  placeholder="pl: Magyar"
                />
              </div>
              <div>
                <Label className="block text-xl font-medium">Poszt</Label>
                <Input
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 text-lg"
                  placeholder="pl: Csatár"
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
