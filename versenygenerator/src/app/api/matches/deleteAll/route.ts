import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireTournamentOwner } from "@/auth/check";

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tournamentIdRaw = (body as any)?.tournamentId;
    const tournamentId = Number(tournamentIdRaw);

    if (!tournamentId || Number.isNaN(tournamentId)) {
      return NextResponse.json(
        { error: "Hiányzó vagy érvénytelen tournamentId." },
        { status: 400 }
      );
    }

    // jogosultság
    await requireTournamentOwner(tournamentId);

    // tournament exist
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
      select: { tournament_id: true },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "A bajnokság nem található." },
        { status: 404 }
      );
    }

    // meccsek törlése + státusz visszaállítás
    const [deletedMatches] = await prisma.$transaction([
      prisma.matches.deleteMany({
        where: { tournament_tournament_id: tournamentId },
      }),
      prisma.tournament.update({
        where: { tournament_id: tournamentId },
        data: { status: "onhold" },
      }),
    ]);

    return NextResponse.json({
      message: `Összesen ${deletedMatches.count} mérkőzés törölve.`,
      deletedCount: deletedMatches.count,
      status: "onhold",
    });
  } catch (error: any) {
    console.error("[MATCH_DELETE_ERROR]", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      case "NOT_FOUND":
        return NextResponse.json({ error: "Verseny nem található" }, { status: 404 });
      default:
        return NextResponse.json(
          {
            error: "Hiba történt a mérkőzések törlése során.",
            details: error?.message ?? "Ismeretlen hiba",
          },
          { status: 500 }
        );
    }
  }
}
