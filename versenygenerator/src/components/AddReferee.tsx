"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Referee {
  referee_id: number;
  referee_name: string;
  yellow_cards?: number;
  red_cards?: number;
  fouls_committed?: number;
  penalties_taken?: number;
  two_min_suspensions?: number;
  personal_fouls?: number;
  technical_fouls?: number;
  unsportsmanlike_fouls?: number;
}

export default function AddReferees({ tournamentId }: { tournamentId: number }) {
  const [referees, setReferees] = useState<Referee[]>([]);
  const [sport, setSport] = useState<string | null>(null);
  const [newRefereeName, setNewRefereeName] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchReferees = async () => {
    try {
      const res = await fetch(`/api/referees?tournamentId=${tournamentId}`);
      if (!res.ok) throw new Error("Nem sikerült lekérni a játékvezetőket.");
      const data = await res.json();
      setSport(data.sport);
      setReferees(data.refereeStats);
    } catch {
      toast.error("Hiba a játékvezetők betöltése közben.");
    }
  };

  useEffect(() => {
    fetchReferees();
  }, []);

  const handleAddReferee = async () => {
  const name = newRefereeName.trim();

  if (!name) {
    toast.error("Adj meg egy nevet!");
    return;
  }

  if (/\d/.test(name)) {
    toast.error("A játékvezető neve nem tartalmazhat számot!");
    return;
  }

  if (!/^[\p{L}\s.'-]+$/u.test(name)) {
    toast.error("A név csak betűket és szóközöket tartalmazhat.");
    return;
  }

  if (name.length < 3) {
    toast.error("A játékvezető neve legalább 3 karakter hosszú legyen.");
    return;
  }

  setLoading(true);
  try {
    const res = await fetch("/api/referees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referee_name: name,
        tournament_tournament_id: tournamentId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Nem sikerült hozzáadni.");
    }

    toast.success("Játékvezető hozzáadva!");
    setNewRefereeName("");
    fetchReferees();
  } catch (err) {
    toast.error("Hiba a játékvezető hozzáadásánál.");
  } finally {
    setLoading(false);
  }
};

 const handleDeleteReferee = async (refereeId: number) => {
  try {
    const res = await fetch("/api/referees", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referee_id: refereeId }),
    });
    if (!res.ok) throw new Error();

    toast.success("Játékvezető törölve!");
    fetchReferees();
  } catch {
    toast.error("Nem sikerült törölni a játékvezetőt.");
  }
};

  if (!sport) {
    return <div className="p-4 text-gray-500">Betöltés...</div>;
  }
  const columns =
    sport === "basketball" || sport === "kosárlabda"
      ? [
          { key: "referee_name", label: "Név" },
          { key: "personal_fouls", label: "Személyi hibák" },
          { key: "technical_fouls", label: "Technikai hibák" },
          { key: "unsportsmanlike_fouls", label: "Sportszerűtlen hibák" },
        ]
      : sport === "handball" || sport === "kézilabda"
      ? [
          { key: "referee_name", label: "Név" },
          { key: "two_min_suspensions", label: "2 perces kiállítások" },
          { key: "penalties_taken", label: "Megítélt büntetők" },
          { key: "yellow_cards", label: "Sárga lap" },
          { key: "red_cards", label: "Piros lap" },
          { key: "fouls_committed", label: "Lefújt szabálytalanságok" },
        ]
      : [
          { key: "referee_name", label: "Név" },
          { key: "yellow_cards", label: "Sárga lap" },
          { key: "red_cards", label: "Piros lap" },
          { key: "penalties_taken", label: "Megítélt büntetők" },
          { key: "fouls_committed", label: "Lefújt szabálytalanságok" },
        ];

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold mb-2">Játékvezetők</h2>

      <table className="w-full border text-left">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="p-2">
                {col.label}
              </th>
            ))}
            <th className="p-2">Törlés</th>
          </tr>
        </thead>
        <tbody>
          {referees.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="p-4 text-center text-gray-500"
              >
                Nincs játékvezető adat.
              </td>
            </tr>
          ) : (
            referees.map((referee) => (
              <tr key={referee.referee_id} className="border-t">
                {columns.map((col) => (
                  <td key={col.key} className="p-2">
                    {col.key === "referee_name" ? (
                      <Link
                        href={`/tournaments/${tournamentId}/referee/info`}
                        className="text-blue-600 hover:underline"
                      >
                        {referee.referee_name}
                      </Link>
                    ) : (
                      (referee as any)[col.key] ?? 0
                    )}
                  </td>
                ))}
                <td className="p-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleDeleteReferee(referee.referee_id)}
                    className="text-red-500"
                  >
                    <X size={18} />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex gap-2">
        <Input
          placeholder="Játékvezető neve"
          value={newRefereeName}
          onChange={(e) => setNewRefereeName(e.target.value)}
          disabled={loading}
        />
        <Button onClick={handleAddReferee} disabled={loading}>
          {loading ? "Hozzáadás..." : "Játékvezető hozzáadása"}
        </Button>
      </div>
    </div>
  );
}
