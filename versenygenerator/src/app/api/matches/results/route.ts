import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getUser } from "@/auth/server";
import { requireTournamentOwner } from "@/auth/check";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
    }

    const { id, homeScore, awayScore, winnerTeamId } = await req.json();

  
    if (homeScore < 0 || awayScore < 0) {
      return NextResponse.json({ error: "Az eredmény nem lehet negatív!" }, { status: 400 });
    }

    if (homeScore == null || awayScore == null) {
      return NextResponse.json({ error: "Hiányzó eredmények!" }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: "Hiányzó mérkőzés ID!" }, { status: 400 });
    }

    const match = await prisma.matches.findUnique({
      where: { match_id: Number(id) },
      select: { tournament_tournament_id: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Mérkőzés nem található" }, { status: 404 });
    }

 
    await requireTournamentOwner(Number(match.tournament_tournament_id));

    const updated = await prisma.matches.update({
      where: { match_id: Number(id) },
      data: {
        home_team_score: homeScore,
        away_team_score: awayScore,
        winner_team_id: winnerTeamId ?? null,
        match_status: "over",
      },
    });

    return NextResponse.json({ success: true, match: updated });
  } catch (error: any) {
    console.error("Eredmény mentése hiba:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      case "NOT_FOUND":
        return NextResponse.json({ error: "Verseny nem található" }, { status: 404 });
      default:
        return NextResponse.json(
          { error: "Sikertelen mentés", details: error.message },
          { status: 500 }
        );
    }
  }
}
