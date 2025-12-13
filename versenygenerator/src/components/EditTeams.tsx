"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { X, Pencil } from "lucide-react";
import { toast } from "sonner";

type EditTeamsProps = {
  teams: any[];
  tournamentId: number;
};

export default function EditTeams({ teams, tournamentId }: EditTeamsProps) {
  const [editedTeams, setEditedTeams] = useState<any[]>(() => [...teams]);
  const [deletedTeamIds, setDeletedTeamIds] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setEditedTeams([...teams]);
      setDeletedTeamIds([]);
    }
  }, [teams, open]);

  const openModal = () => {
    setEditedTeams([...teams]);
    setDeletedTeamIds([]);
    setOpen(true);
  };

  const handleChange = (index: number, value: string) => {
    setEditedTeams((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], team_name: value };
      return updated;
    });
  };

  const handleAddTeam = () => {
    setEditedTeams((prev) => [...prev, { team_id: null, team_name: "" }]);
  };

  const handleDeleteTeam = (index: number) => {
    setEditedTeams((prev) => {
      const toDelete = prev[index];
      if (toDelete?.team_id) {
        setDeletedTeamIds((ids) =>
          ids.includes(toDelete.team_id) ? ids : [...ids, toDelete.team_id]
        );
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    const filteredTeams = editedTeams
      .map((t) => ({
        ...t,
        team_name: (t.team_name ?? "").trim(),
      }))
      .filter((t) => t.team_name !== "");

    if (filteredTeams.length === 0 && deletedTeamIds.length === 0) {
      toast.info("Nincs mentendő változtatás.");
      return;
    }

    const toastId = toast.loading("Mentés folyamatban...");

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editedTeams: filteredTeams,
          deletedTeamIds,
          tournamentId,
        }),
      });

      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || "Hiba történt a mentés során.");

      setOpen(false);

      router.refresh();

      toast.success("Csapatok sikeresen mentve!", { id: toastId });
    } catch (err) {
      console.error("Mentés hiba:", err);
      toast.error("Nem sikerült menteni a változtatásokat.", { id: toastId });
    }
  };

  return (
    <>
      <Pencil
        className="w-6 h-6 inline cursor-pointer ml-2 text-gray-700 hover:text-gray-900"
        onClick={openModal}
        aria-label="Csapatok szerkesztése"
        role="button"
      />

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-2xl shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-center">
              Csapatok szerkesztése
            </h2>

            {editedTeams.length === 0 ? (
              <p className="text-gray-500 text-center mb-6">
                Jelenleg nincs egyetlen csapat sem. Adj hozzá új csapatot.
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {editedTeams.map((team, index) => (
                  <div key={team.team_id ?? `new-${index}`} className="flex items-center gap-3">
                    <Input
                      type="text"
                      value={team.team_name ?? ""}
                      onChange={(e) => handleChange(index, e.target.value)}
                      className="flex-grow"
                      placeholder="Csapat neve"
                    />
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteTeam(index)}
                      className="text-red-500 hover:bg-red-100 p-2"
                      title="Csapat törlése"
                      type="button"
                    >
                      <X size={20} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-between items-center">
              <Button variant="outline" onClick={handleAddTeam} type="button">
                + Új csapat
              </Button>
              <div className="flex gap-4">
                <Button
                  onClick={() => setOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400"
                  type="button"
                >
                  Mégse
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  type="button"
                >
                  Mentés
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
