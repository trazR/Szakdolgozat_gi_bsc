"use client";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { statFieldsBySport } from "@/utils/statFields";

export default function StatsClient({ tournament, matches }: any) {
  const sport = tournament?.game ? String(tournament.game).toLowerCase() : "";

  const safeMatches = Array.isArray(matches) ? matches : [];
  const allPlays = safeMatches.flatMap((m: any) => m.plays ?? []);
  const isFootball = sport === "football" || sport === "foci";
  const isBasketball = sport === "basketball" || sport === "kosárlabda";
  const isHandball = sport === "handball" || sport === "kézilabda";

  const totalHomeScore = safeMatches.reduce(
    (sum: number, m: any) => sum + (m.home_team_score ?? 0),
    0
  );
  const totalAwayScore = safeMatches.reduce(
    (sum: number, m: any) => sum + (m.away_team_score ?? 0),
    0
  );
  const totalScores = totalHomeScore + totalAwayScore;

  const totalGames = safeMatches.length;
  const avgScore = (totalScores / (totalGames || 1)).toFixed(2);

  const totals = useMemo<Record<string, number>>(() => {
    const sum = (key: string): number =>
      allPlays.reduce((s: number, p: any) => s + (p[key] ?? 0), 0);

    if (isFootball) {
      return {
        goals: sum("goals"),
        assists: sum("assists"),
        shots_total: sum("shots_total"),
        shots_on_target: sum("shots_on_target"),
        fouls_committed: sum("fouls_committed"),
        yellow_cards: sum("yellow_cards"),
        red_cards: sum("red_cards"),
        penalties_taken: sum("penalties_taken"),
        penalties_scored: sum("penalties_scored"),
        offsides: sum("offsides"),
        corners: sum("corners"),
        free_kick: sum("free_kick"),
        throw_ins: sum("throw_ins"),
        total_passes: sum("total_passes"),
        successful_passes: sum("successful_passes"),
        interception: sum("interception"),
        tackles: sum("tackles"),
        goalkeeper_saves: sum("goalkeeper_saves"),
      };
    }

    if (isBasketball) {
      return {
        points_2pt: sum("points_2pt"),
        points_3pt: sum("points_3pt"),
        shots_total: sum("shots_total"), 
        shots_on_target: sum("shots_on_target"), 
        penalties_taken: sum("penalties_taken"), 
        penalties_scored: sum("penalties_scored"), 
        rebounds: sum("rebounds"),
        assists: sum("assists"),
        interception: sum("interception"),
        blocks: sum("blocks"),
        turnovers: sum("turnovers"),
        personal_fouls: sum("personal_fouls"),
        technical_fouls: sum("technical_fouls"),
        unsportsmanlike_fouls: sum("unsportsmanlike_fouls"),
      };
    }

    return {
      goals: sum("goals"),
      assists: sum("assists"),
      shots_total: sum("shots_total"),
      shots_on_target: sum("shots_on_target"),
      penalties_taken: sum("penalties_taken"),
      penalties_scored: sum("penalties_scored"),
      fouls_committed: sum("fouls_committed"),
      free_kick: sum("free_kick"),
      interception: sum("interception"),
      turnovers: sum("turnovers"),
      two_min_suspensions: sum("two_min_suspensions"),
      yellow_cards: sum("yellow_cards"),
      red_cards: sum("red_cards"),
      goalkeeper_saves: sum("goalkeeper_saves"),
    };
  }, [sport, allPlays, isFootball, isBasketball]);


  const topFootballScorers = useMemo(() => {
    if (!isFootball) return [];
    const players: Record<number, { name: string; value: number }> = {};

    allPlays.forEach((p: any) => {
      const id = p.player_player_id;
      if (!id) return;

      const goals = p.goals ?? 0;
      if (goals === 0) return;

      const name =
        p.player?.player_name || p.player_name || `Játékos ${id}`;

      if (!players[id]) {
        players[id] = { name, value: 0 };
      }
      players[id].value += goals;
    });

    return Object.values(players)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [allPlays, isFootball]);

  const topFootballAssists = useMemo(() => {
    if (!isFootball) return [];
    const players: Record<number, { name: string; value: number }> = {};

    allPlays.forEach((p: any) => {
      const id = p.player_player_id;
      if (!id) return;

      const assists = p.assists ?? 0;
      if (assists === 0) return;

      const name =
        p.player?.player_name || p.player_name || `Játékos ${id}`;

      if (!players[id]) {
        players[id] = { name, value: 0 };
      }
      players[id].value += assists;
    });

    return Object.values(players)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [allPlays, isFootball]);

  const topPlayers = useMemo(() => {
    if (isFootball) return [];

    const players: Record<number, { name: string; value: number }> = {};

    allPlays.forEach((p: any) => {
      const id = p.player_player_id;
      if (!id) return;

      let val: number;

      if (isBasketball) {
        const made2 = p.points_2pt ?? 0;
        const made3 = p.points_3pt ?? 0;
        const madeFT = p.penalties_scored ?? 0;
        val = made2 * 2 + made3 * 3 + madeFT;
      } else {
        val = p.goals ?? 0;
      }

      const name =
        p.player?.player_name || p.player_name || `Játékos ${id}`;

      if (!players[id]) {
        players[id] = { name, value: 0 };
      }
      players[id].value += val;
    });

    return Object.values(players)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [allPlays, isFootball, isBasketball]);

  const topBasketballRebounds = useMemo(() => {
    if (!isBasketball) return [];
    const players: Record<number, { name: string; value: number }> = {};

    allPlays.forEach((p: any) => {
      const id = p.player_player_id;
      if (!id) return;

      const rebounds = p.rebounds ?? 0;
      if (rebounds === 0) return;

      const name =
        p.player?.player_name || p.player_name || `Játékos ${id}`;

      if (!players[id]) {
        players[id] = { name, value: 0 };
      }
      players[id].value += rebounds;
    });

    return Object.values(players)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [allPlays, isBasketball]);

  const topHandballGoalkeepers = useMemo(() => {
    if (!isHandball) return [];
    const players: Record<number, { name: string; value: number }> = {};

    allPlays.forEach((p: any) => {
      const id = p.player_player_id;
      if (!id) return;

      const saves = p.goalkeeper_saves ?? 0;
      if (saves === 0) return;

      const name =
        p.player?.player_name || p.player_name || `Játékos ${id}`;

      if (!players[id]) {
        players[id] = { name, value: 0 };
      }
      players[id].value += saves;
    });

    return Object.values(players)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [allPlays, isHandball]);

  const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const sportKey = sport;

  const labelMap: Record<string, string> = useMemo(() => {
    const fields = statFieldsBySport[sportKey as keyof typeof statFieldsBySport];
    if (!fields) return {};
    return Object.fromEntries(fields.map((f) => [f.key, f.label]));
  }, [sportKey]);

  // valami biztos kimaradt
  const yellowCards = totals["yellow_cards"] ?? 0;
  const redCards = totals["red_cards"] ?? 0;
  const fouls = totals["fouls_committed"] ?? 0;
  const totalPasses = totals["total_passes"] ?? 0;
  const successfulPasses = totals["successful_passes"] ?? 0;
  const totalShots = totals["shots_total"] ?? 0;
  const shotsOnTarget = totals["shots_on_target"] ?? 0;
  const goals = totals["goals"] ?? 0;
  const onTargetNonGoal = Math.max(shotsOnTarget - goals, 0);
  const offTargetShots = Math.max(totalShots - shotsOnTarget, 0);
  const made2Total = totals["points_2pt"] ?? 0; // db
  const made3Total = totals["points_3pt"] ?? 0; // db
  const madeFTTotal = totals["penalties_scored"] ?? 0; // db
  const points2Points = made2Total * 2;
  const points3Points = made3Total * 3;
  const freeThrowsPoints = madeFTTotal * 1;
  const totalBasketPoints = points2Points + points3Points + freeThrowsPoints;
  const personalFouls = totals["personal_fouls"] ?? 0;
  const technicalFouls = totals["technical_fouls"] ?? 0;
  const unsportsmanlikeFouls = totals["unsportsmanlike_fouls"] ?? 0;
  const rebounds = totals["rebounds"] ?? 0;
  const steals = totals["interception"] ?? 0;
  const blocksDef = totals["blocks"] ?? 0;
  const handFouls = totals["fouls_committed"] ?? 0;
  const handTwoMin = totals["two_min_suspensions"] ?? 0;
  const handYellow = totals["yellow_cards"] ?? 0;
  const handRed = totals["red_cards"] ?? 0;
  const handInterceptions = totals["interception"] ?? 0;
  const handTurnovers = totals["turnovers"] ?? 0;
  const handSaves = totals["goalkeeper_saves"] ?? 0;
  const handPositiveDef = handInterceptions + handSaves;

  if (!tournament) {
    return <div>Hiba: nincs tournament adat.</div>;
  }

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-3xl font-bold">
        {tournament.tournament_name} statisztikái
      </h1>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Általános verseny adatok</h2>
        <ul className="text-lg space-y-1">
          <li>
            Lejátszott meccsek: <strong>{totalGames}</strong>
          </li>
          <li>
            Hazai csapatok összes találata:{" "}
            <strong>{totalHomeScore}</strong>
          </li>
          <li>
            Vendég csapatok összes találata:{" "}
            <strong>{totalAwayScore}</strong>
          </li>
          <li>
            Összes találat: <strong>{totalScores}</strong>
          </li>
          <li>
            Átlag találat / meccs: <strong>{avgScore}</strong>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Összesített statisztikák</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 text-lg">
          {Object.entries(totals).map(([key, val]) => (
            <div key={key} className="bg-gray-50 rounded-xl p-4 shadow-sm">
              <div className="font-semibold">
                {labelMap[key] ?? key.replace(/_/g, " ")}:
              </div>
              <div className="text-xl font-bold">{val}</div>
            </div>
          ))}
        </div>
      </section>

      {isFootball &&
        (topFootballScorers.length > 0 ||
          topFootballAssists.length > 0) && (
          <section>
            <h2 className="text-2xl font-semibold mb-2">
              Top 5 játékos
            </h2>
            <div className="flex flex-col lg:flex-row gap-8">
              {topFootballScorers.length > 0 && (
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-center mb-2">
                    Top 5 gólszerző
                  </h3>
                  <div className="w-full h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topFootballScorers}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#2563eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {topFootballAssists.length > 0 && (
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-center mb-2">
                    Top 5 gólpasszadó
                  </h3>
                  <div className="w-full h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topFootballAssists}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

      {!isFootball && (
        <>
          {isBasketball &&
            (topPlayers.length > 0 || topBasketballRebounds.length > 0) && (
              <section>
                <h2 className="text-2xl font-semibold mb-2">
                  Top 5 játékos
                </h2>
                <div className="flex flex-col lg:flex-row gap-8">
                  {topPlayers.length > 0 && (
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-center mb-2">
                        Top 5 pontszerző
                      </h3>
                      <div className="w-full h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topPlayers}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#2563eb" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {topBasketballRebounds.length > 0 && (
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-center mb-2">
                        Top 5 lepattanózó
                      </h3>
                        <div className="w-full h-[260px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topBasketballRebounds}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="value" fill="#10b981" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                    </div>
                  )}
                </div>
              </section>
            )}
{/*kézilabda diagramok*/}
          {isHandball && (
            <section>
              <h2 className="text-2xl font-semibold mb-2">
                Top 5 játékos
              </h2>
              <div className="flex flex-col lg:flex-row gap-8">
                {topPlayers.length > 0 && (
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-center mb-2">
                      Top 5 gólszerző
                    </h3>
                    <div className="w-full h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topPlayers}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#2563eb" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {topHandballGoalkeepers.length > 0 && (
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-center mb-2">
                      Top 5 kapus
                    </h3>
                    <div className="w-full h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topHandballGoalkeepers}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* focis torták */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Megoszlások</h2>
        <div className="flex flex-wrap justify-center gap-12">
          {isFootball && (
            <>
              {fouls + yellowCards + redCards > 0 && (
                <div className="flex flex-col items-center">
                  <div className="mb-2 text-sm text-gray-700">
                    Szabálytalanságok és súlyosságuk megoszlása
                  </div>
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Szabálytalanságok", value: fouls },
                          { name: "Sárga lapok", value: yellowCards },
                          { name: "Piros lapok", value: redCards },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                      >
                        {PIE_COLORS.slice(0, 3).map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {totalPasses > 0 && (
                <div className="flex flex-col items-center">
                  <div className="mb-2 text-sm text-gray-700">
                    Passzok sikerességének megoszlása
                  </div>
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Sikeres passz", value: successfulPasses },
                          {
                            name: "Sikertelen passz",
                            value: totalPasses - successfulPasses,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                      >
                        {PIE_COLORS.slice(0, 2).map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {totalShots > 0 && (
                <div className="flex flex-col items-center">
                  <div className="mb-2 text-sm text-gray-700">
                    Lövések és gólok megoszlása
                  </div>
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Gól", value: goals },
                          {
                            name: "Kaput eltaláló, de nem gól",
                            value: onTargetNonGoal,
                          },
                          {
                            name: "Kaput nem találó lövés",
                            value: offTargetShots,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                      >
                        {PIE_COLORS.slice(0, 3).map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/*kosarlabda torták*/}
          {isBasketball && (
            <>
              {totalBasketPoints > 0 && (
                <div className="flex flex-col items-center">
                  <div className="mb-2 text-sm text-gray-700">
                    Pontszerzés megoszlása
                  </div>
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "2 pontos dobásokból",
                            value: points2Points,
                          },
                          {
                            name: "3 pontos dobásokból",
                            value: points3Points,
                          },
                          {
                            name: "Büntetőkből",
                            value: freeThrowsPoints,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                      >
                        {PIE_COLORS.map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {personalFouls + technicalFouls + unsportsmanlikeFouls > 0 && (
                <div className="flex flex-col items-center">
                  <div className="mb-2 text-sm text-gray-700">
                    Faultok megoszlása
                  </div>
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Személyi fault",
                            value: personalFouls,
                          },
                          {
                            name: "Technikai fault",
                            value: technicalFouls,
                          },
                          {
                            name: "Sportszerűtlen fault",
                            value: unsportsmanlikeFouls,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                      >
                        {PIE_COLORS.map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {(rebounds + steals + blocksDef) > 0 && (
                <div className="flex flex-col items-center">
                  <div className="mb-2 text-sm text-gray-700">
                    Védekező megmozdulások megoszlása
                  </div>
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Lepattanók", value: rebounds },
                          { name: "Labdaszerzések", value: steals },
                          { name: "Blokkok", value: blocksDef },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                      >
                        {PIE_COLORS.map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* kézilabda torták*/}
          {isHandball && (
            <>
              {handFouls + handTwoMin + handYellow + handRed > 0 && (
                <div className="flex flex-col items-center">
                  <div className="mb-2 text-sm text-gray-700">
                    Fegyelmi mutatók megoszlása
                  </div>
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Szabálytalanságok", value: handFouls },
                          {
                            name: "2 perces kiállítások",
                            value: handTwoMin,
                          },
                          { name: "Sárga lapok", value: handYellow },
                          { name: "Piros lapok", value: handRed },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                      >
                        {PIE_COLORS.map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {totalShots > 0 && (
                <div className="flex flex-col items-center">
                  <div className="mb-2 text-sm text-gray-700">
                    Dobások és gólok megoszlása
                  </div>
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Gól", value: goals },
                          {
                            name: "Kaput eltaláló, de nem gól",
                            value: onTargetNonGoal,
                          },
                          {
                            name: "Kaput nem találó dobás",
                            value: offTargetShots,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                      >
                        {PIE_COLORS.slice(0, 3).map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {(handPositiveDef + handTurnovers) > 0 && (
                <div className="flex flex-col items-center">
                  <div className="mb-2 text-sm text-gray-700">
                    Labdaszerzések és védések az eladott labdákhoz viszonyítva
                  </div>
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Labdaszerzések + kapusvédések",
                            value: handPositiveDef,
                          },
                          {
                            name: "Eladott labdák",
                            value: handTurnovers,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                      >
                        {PIE_COLORS.slice(0, 2).map((c, i) => (
                          <Cell key={i} fill={c} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
