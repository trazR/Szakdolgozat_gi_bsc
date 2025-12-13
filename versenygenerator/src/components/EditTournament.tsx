"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

export default function EditTournamentModal({ tournament }: { tournament: any }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    name: tournament.tournament_name,
    game: tournament.game,
    type: tournament.tournament_type,
    winPoints: tournament.point_for_win ?? 0,
    drawPoints: tournament.point_for_draw ?? 0,
    description: tournament.description ?? "",
    holdThirdPlaceMatch:
      tournament.hold_third_place_match === 1 ||
      tournament.hold_third_place_match === true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || form.name.trim().length < 6) {
      toast.error("A verseny neve legalább 6 karakter hosszú legyen.");
      return;
    }

    if (!form.game) {
      toast.error("Válaszd ki a sportágat.");
      return;
    }

    if (!form.type) {
      toast.error("Válaszd ki a versenytípust.");
      return;
    }

    if (form.type === "league" || form.type === "round-robin") {
      const win = Number(form.winPoints);
      const draw = Number(form.drawPoints);

      if (Number.isNaN(win) || Number.isNaN(draw)) {
        toast.error("A pontszámokat számként kell megadni.");
        return;
      }

      if (win < 0 || draw < 0) {
        toast.error("A pontszámok nem lehetnek negatívak.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload: any = {
        id: tournament.tournament_id,
        name: form.name,
        game: form.game,
        type: form.type,
        description: form.description,
      };

      if (form.type === "league" || form.type === "round-robin") {
        payload.winPoints = Number(form.winPoints);
        payload.drawPoints = Number(form.drawPoints);
      }

      if (form.type === "knockout") {
        payload.holdThirdPlaceMatch = form.holdThirdPlaceMatch;
      }

      const res = await fetch("/api/tournaments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Hiba történt a módosítás során.");
        return;
      }

      toast.success("Verseny sikeresen módosítva!");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Nem sikerült módosítani a versenyt.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Pencil
        className="w-6 h-6 inline cursor-pointer ml-2 text-gray-700 hover:text-gray-900"
        onClick={() => setOpen(true)}
        aria-label="Verseny szerkesztése"
        role="button"
      />

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl border w-full max-w-2xl space-y-6 shadow-2xl">
            <h2 className="text-4xl font-bold text-center">Verseny szerkesztése</h2>

            <div className="space-y-6">
              <div>
                <Label className="block text-2xl font-medium">Verseny neve</Label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border rounded px-4 py-2 text-xl"
                />
              </div>

              <div>
                <Label className="block text-2xl font-medium">Sport</Label>
                <Select
                  value={form.game}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, game: value }))
                  }
                >
                  <SelectTrigger className="w-full p-3 text-lg mt-1">
                    <SelectValue placeholder="Válassz sportot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="football">Labdarúgás</SelectItem>
                      <SelectItem value="basketball">Kosárlabda</SelectItem>
                      <SelectItem value="handball">Kézilabda</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block text-2xl font-medium">Versenytípus</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="w-full p-3 text-lg mt-1">
                    <SelectValue placeholder="Válassz típust" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="league">Bajnoki rendszer</SelectItem>
                      <SelectItem value="knockout">Kieséses rendszer</SelectItem>
                      <SelectItem value="double">Vigaszágas rendszer</SelectItem>
                      <SelectItem value="round-robin">Körmérkőzés</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {(form.type === "league" || form.type === "round-robin") && (
                <>
                  <div>
                    <Label className="block text-2xl font-medium">Győzelemért járó pont</Label>
                    <Input
                      type="number"
                      name="winPoints"
                      value={form.winPoints}
                      onChange={handleChange}
                      className="w-full border rounded px-4 py-2 text-xl"
                    />
                  </div>
                  <div>
                    <Label className="block text-2xl font-medium">Döntetlenért járó pont</Label>
                    <Input
                      type="number"
                      name="drawPoints"
                      value={form.drawPoints}
                      onChange={handleChange}
                      className="w-full border rounded px-4 py-2 text-xl"
                    />
                  </div>
                </>
              )}

              {form.type === "knockout" && (
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    type="checkbox"
                    name="holdThirdPlaceMatch"
                    checked={form.holdThirdPlaceMatch}
                    onChange={handleChange}
                    className="w-6 h-6"
                  />
                  <Label className="text-lg">Harmadik helyért mérkőzés</Label>
                </div>
              )}

              <div>
                <Label className="block text-2xl font-medium">Leírás</Label>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1"
                  placeholder="A verseny rövid leírása..."
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
                disabled={isLoading}
                type="button"
              >
                {isLoading ? "Mentés folyamatban..." : "Mentés"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
