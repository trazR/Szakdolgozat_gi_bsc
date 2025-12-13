import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { statFieldsBySport } from "@/utils/statFields";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = Number(params.id);
    if (!matchId) {
      return NextResponse.json({ error: "Hiányzó matchId" }, { status: 400 });
    }

    const match = await prisma.matches.findUnique({
      where: { match_id: matchId },
      include: {
        plays: {
          include: {
            player: { select: { team_team_id: true, player_name: true } },
          },
        },
        homeTeam: true,
        awayTeam: true,
        tournament: { select: { game: true } },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "A mérkőzés nem található" },
        { status: 404 }
      );
    }

    const sportKey = match.tournament?.game?.toLowerCase() ?? "football";

    const fields =
      statFieldsBySport[sportKey as keyof typeof statFieldsBySport] ?? [];

    const homeId = match.homeTeam?.team_id;
    const awayId = match.awayTeam?.team_id;

    const autoStats: Record<number, any> = {};
    if (homeId) autoStats[homeId] = {};
    if (awayId) autoStats[awayId] = {};

    const add = (obj: any, key: string, val: number | null | undefined) => {
      if (val === null || val === undefined || isNaN(Number(val))) return;
      obj[key] = (obj[key] ?? 0) + Number(val);
    };

    for (const play of match.plays) {
      const teamId = play.player?.team_team_id;
      if (!teamId) continue;

      if (!autoStats[teamId]) autoStats[teamId] = {};
      const target = autoStats[teamId];


      for (const field of fields) {
        const key = field.key;           
        const totalKey = `${key}_total`; 
        const value = (play as any)[key];
        add(target, totalKey, value);
      }

        if (sportKey === "basketball") {
          const made2 = play.points_2pt ?? 0;          
          const made3 = play.points_3pt ?? 0;           
          const madeFT = play.penalties_scored ?? 0;    

          const totalPoints =
            made2 * 2 +
            made3 * 3 +
            madeFT * 1;

          add(target, "total_points_total", totalPoints);
        }
    }

    return NextResponse.json(autoStats);
  } catch (error) {
    console.error("Hiba az automatikus statisztikák számításakor:", error);
    return NextResponse.json(
      { error: "Hiba a számítás során" },
      { status: 500 }
    );
  }
}
