import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireTournamentOwner } from "@/auth/check";

// PATCH – Csapatok létrehozása / módosítása / törlése

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { editedTeams, deletedTeamIds, tournamentId } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: "Hiányzó tournamentId" }, { status: 400 });
    }

    const tournament_id = Number(tournamentId);

    await requireTournamentOwner(tournament_id);

    if (Array.isArray(deletedTeamIds) && deletedTeamIds.length > 0) {
      await prisma.team.deleteMany({
        where: {
          team_id: { in: deletedTeamIds },
          tournament_tournament_id: tournament_id,
        },
      });
    }

    const upserts = (editedTeams || [])
      .filter((team: any) => team.team_name && team.team_name.trim() !== "")
      .map((team: any) =>
        team.team_id
          ? prisma.team.update({
              where: { team_id: team.team_id },
              data: { team_name: team.team_name.trim() },
            })
          : prisma.team.create({
              data: {
                team_name: team.team_name.trim(),
                tournament_tournament_id: tournament_id,
              },
            })
      );

    if (upserts.length > 0) {
      await prisma.$transaction(upserts);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Hiba történt:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      case "NOT_FOUND":
        return NextResponse.json({ error: "A bajnokság nem található" }, { status: 404 });
      default:
        return NextResponse.json(
          { error: "Hiba történt a csapatok mentése közben.", details: error.message },
          { status: 500 }
        );
    }
  }
}
