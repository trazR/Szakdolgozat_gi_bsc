import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireTournamentOwner } from "@/auth/check";

export async function POST(req: NextRequest) {
  try {
    const { matchId, stats } = await req.json();

    if (!matchId || !stats) {
      return NextResponse.json(
        { error: "Hiányzó adatok (matchId vagy stats)" },
        { status: 400 }
      );
    }

    const match = await prisma.matches.findUnique({
      where: { match_id: Number(matchId) },
      select: { tournament_tournament_id: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Mérkőzés nem található" }, { status: 404 });
    }

    await requireTournamentOwner(Number(match.tournament_tournament_id));

    for (const playerId in stats) {
      const playerStats = stats[playerId];
      for (const key in playerStats) {
        const value = Number(playerStats[key]);
        if (!isNaN(value) && value < 0) {
          return NextResponse.json(
            { error: "A statisztikai értékek nem lehetnek negatívak!" },
            { status: 400 }
          );
        }
      }
    }

    for (const playerId in stats) {
      const playerStats = stats[playerId];
      if (!playerStats) continue;

      const cleanData: Record<string, number | null> = {};
      for (const key in playerStats) {
        const value = playerStats[key];
        if (value === "" || value === null || value === undefined) continue;
        const parsed = Number(value);
        if (!isNaN(parsed)) cleanData[key] = parsed;
      }

      if (Object.keys(cleanData).length === 0) continue;

      await prisma.plays.upsert({
        where: {
          matches_match_id_player_player_id: {
            matches_match_id: Number(matchId),
            player_player_id: Number(playerId),
          },
        },
        update: cleanData,
        create: {
          matches_match_id: Number(matchId),
          player_player_id: Number(playerId),
          ...cleanData,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Hiba a játékos statisztikák mentésekor:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      case "NOT_FOUND":
        return NextResponse.json({ error: "Verseny nem található" }, { status: 404 });
      default:
        return NextResponse.json(
          { error: "Mentés sikertelen", details: error.message },
          { status: 500 }
        );
    }
  }
}
