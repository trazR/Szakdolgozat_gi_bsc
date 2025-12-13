import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { generateDoubleEliminationMatches } from "@/utils/doubleEliminationUtils";
import { updateNextTeams } from "@/utils/updateNextTeams";
import { requireTournamentOwner } from "@/auth/check";


// POST – Mérkőzések generálása (Double Elimination)

export async function POST(req: NextRequest) {
  try {
    const { tournamentId } = await req.json();

    if (!tournamentId) {
      return NextResponse.json({ error: "Hiányzó tournamentId" }, { status: 400 });
    }

    // 🔐 Jogosultság ellenőrzés
    await requireTournamentOwner(Number(tournamentId));

    const result = await generateDoubleEliminationMatches(Number(tournamentId));

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      matchesCreated: result.matchesCreated,
    });
  } catch (error: any) {
    console.error("POST /api/double error:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      case "NOT_FOUND":
        return NextResponse.json({ error: "Verseny nem található" }, { status: 404 });
      default:
        return NextResponse.json({ error: "Mentési hiba", details: error.message }, { status: 500 });
    }
  }
}

// PATCH – Eredmény mentése és továbbjutók beállítása

export async function PATCH(req: NextRequest) {
  try {
    const { match_id, home_team_score, away_team_score } = await req.json();

    if (!match_id || home_team_score == null || away_team_score == null) {
      return NextResponse.json({ error: "Hiányzó vagy érvénytelen adatok" }, { status: 400 });
    }

    // 🔐 Ellenőrizzük, hogy a match a bejelentkezett user versenyéhez tartozik-e
    const match = await prisma.matches.findUnique({
      where: { match_id },
      select: { tournament_tournament_id: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Mérkőzés nem található" }, { status: 404 });
    }

    await requireTournamentOwner(Number(match.tournament_tournament_id));

    const result = await updateNextTeams(match_id, home_team_score, away_team_score);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("PATCH /api/double error:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      case "NOT_FOUND":
        return NextResponse.json({ error: "Verseny nem található" }, { status: 404 });
      default:
        return NextResponse.json({ error: "Eredménymentés sikertelen", details: error.message }, { status: 500 });
    }
  }
}


// GET – Összes meccs lekérdezése

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = Number(searchParams.get("tournamentId"));

    if (!tournamentId) {
      return NextResponse.json({ error: "Hiányzó tournamentId" }, { status: 400 });
    }

    const matches = await prisma.matches.findMany({
      where: { tournament_tournament_id: tournamentId },
      include: {
        homeTeam: { include: { player: true } },
        awayTeam: { include: { player: true } },
        referee: true,
        venue: true,
        plays: { include: { player: true } },
        tournament: true,
      },
      orderBy: [
        { match_round: "asc" },
        { match_id: "asc" },
      ],
    });

    return NextResponse.json(matches);
  } catch (error: any) {
    console.error("GET /api/double error:", error);
    return NextResponse.json({ error: "Lekérdezési hiba", details: error.message }, { status: 500 });
  }
}
