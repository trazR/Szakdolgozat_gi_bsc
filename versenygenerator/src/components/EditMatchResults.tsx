"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

type EditMatchResultsProps = {
  match: any;
  endpoint?: "matches/results" | "single" | "double";
  onSaved?: () => void;
};

export default function EditMatchResults({
  match,
  endpoint = "matches/results",
  onSaved,
}: EditMatchResultsProps) {
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    homeScore: match.home_team_score ?? "",
    awayScore: match.away_team_score ?? "",
  });

  const homeTeamName = match.homeTeam?.team_name || "Hazai csapat";
  const awayTeamName = match.awayTeam?.team_name || "Vendég csapat";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  function getWinnerId() {
    const h = Number(form.homeScore);
    const a = Number(form.awayScore);
    if (isNaN(h) || isNaN(a)) return null;
    if (h === a) return null;
    return h > a ? match.homeTeam.team_id : match.awayTeam.team_id;
  }

  const handleSubmit = async () => {
    const isKnockout = endpoint === "single" || endpoint === "double";
    const h = Number(form.homeScore);
    const a = Number(form.awayScore);

    if (h < 0 || a < 0) {
      toast.error("Az eredmény nem lehet negatív szám!");
      return;
    }

    if (isNaN(h) || isNaN(a)) {
      toast.error("Mindkét csapat eredményét meg kell adni!");
      return;
    }

    if (isKnockout && h === a) {
      toast.error("Kieséses mérkőzésen nem adható meg döntetlen eredmény!");
      return;
    }

    try {
      const winnerId = getWinnerId();
      let url = "";
      let method: "POST" | "PATCH" = "POST";
      let body: any = {};

      if (endpoint === "single") {
        url = "/api/single";
        method = "PATCH";
        body = {
          match_id: match.match_id,
          home_team_score:
            form.homeScore === "" ? null : Number(form.homeScore),
          away_team_score:
            form.awayScore === "" ? null : Number(form.awayScore),
          winner_team_id: winnerId,
        };
      } else if (endpoint === "double") {
        url = "/api/double";
        method = "PATCH";
        body = {
          match_id: match.match_id,
          home_team_score:
            form.homeScore === "" ? null : Number(form.homeScore),
          away_team_score:
            form.awayScore === "" ? null : Number(form.awayScore),
        };
      } else {
        url = "/api/matches/results";
        body = {
          id: match.match_id,
          homeScore: form.homeScore === "" ? null : Number(form.homeScore),
          awayScore: form.awayScore === "" ? null : Number(form.awayScore),
          winnerTeamId: winnerId,
        };
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();

      if (!res.ok)
        throw new Error(result.error || "Hiba történt a mentés során.");

      setOpen(false);
      toast.success("Eredmény sikeresen mentve!");

      if (onSaved) onSaved();
      else window.location.reload();
    } catch (error) {
      console.error("Hiba:", error);
      toast.error("Nem sikerült menteni az eredményt.");
    }
  };

  return (
    <>
      <Pencil
        className="w-6 h-6 inline cursor-pointer ml-2 text-gray-700 hover:text-gray-900"
        onClick={() => setOpen(true)}
        aria-label="Eredmény szerkesztése"
        role="button"
      />

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl border w-full max-w-md space-y-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-center mb-4">
              Eredmény szerkesztése
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-lg font-medium">{homeTeamName}</Label>
                <Input
                  name="homeScore"
                  type="number"
                  value={form.homeScore}
                  onChange={handleChange}
                  min={0}
                  className="w-16 text-center rounded"
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label className="text-lg font-medium">{awayTeamName}</Label>
                <Input
                  name="awayScore"
                  type="number"
                  value={form.awayScore}
                  onChange={handleChange}
                  min={0}
                  className="w-16 text-center rounded"
                />
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
