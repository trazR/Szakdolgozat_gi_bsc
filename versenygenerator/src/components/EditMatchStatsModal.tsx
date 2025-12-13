"use client";

import { useState } from "react";
import EditMatchPlayerStats from "./EditMatchPlayerStats";
import EditMatchGeneralStats from "./EditMatchGeneralStats";
import { BarChart3 } from "lucide-react";

export default function EditMatchStatsModal({ match }: { match: any }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"players" | "general">("players");

  const sport = match.tournament?.game || "football";

  return (
    <>
      <BarChart3
        className="w-5 h-5 inline cursor-pointer ml-2 text-gray-700 hover:text-gray-900"
        onClick={() => setOpen(true)}
        aria-label="Mérkőzés statisztikák szerkesztése"
        role="button"
      />

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl border w-[98vw] max-w-[1800px] shadow-2xl overflow-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold text-center mb-6">
              Mérkőzés statisztikák – {sport.toUpperCase()}
            </h2>

            {/* TABOK */}
            <div className="flex justify-center gap-8 border-b pb-2 mb-6">
              <button
                className={`text-lg font-medium pb-1 ${
                  activeTab === "players"
                    ? "border-b-4 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("players")}
              >
                Játékos statisztikák
              </button>
              <button
                className={`text-lg font-medium pb-1 ${
                  activeTab === "general"
                    ? "border-b-4 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("general")}
              >
                Mérkőzés összesített statisztika
              </button>
            </div>

            {activeTab === "players" ? (
              <EditMatchPlayerStats match={match} onCancel={() => setOpen(false)} />
            ) : (
              <EditMatchGeneralStats
                sport={sport}
                match={match}
                onCancel={() => setOpen(false)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
