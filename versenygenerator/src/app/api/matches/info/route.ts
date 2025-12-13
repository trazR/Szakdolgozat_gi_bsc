import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getUser } from "@/auth/server";
import { requireTournamentOwner } from "@/auth/check";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Nincs bejelentkezve" },
        { status: 401 }
      );
    }

    const { id, date, stadium, referee } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Hiányzó mérkőzés ID" },
        { status: 400 }
      );
    }

    //Meccs lekérése, hogy tudjuk melyik versenyhez tartozik
    const match = await prisma.matches.findUnique({
      where: { match_id: Number(id) },
      select: {
        match_id: true,
        tournament_tournament_id: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Mérkőzés nem található" },
        { status: 404 }
      );
    }


    await requireTournamentOwner(Number(match.tournament_tournament_id));

  //venue or stadion
    let venueRecord: { venue_id: number } | null = null;
    const trimmedStadium =
      typeof stadium === "string" ? stadium.trim() : "";

    if (trimmedStadium) {
      venueRecord = await prisma.venue.findFirst({
        where: {
          venue_name: trimmedStadium,
          tournament_tournament_id: match.tournament_tournament_id,
        },
      });

      if (!venueRecord) {
        venueRecord = await prisma.venue.create({
          data: {
            venue_name: trimmedStadium,
            tournament_tournament_id: match.tournament_tournament_id,
          },
        });
      }
    }

    //mérkőzés frissítése
    const updatedMatch = await prisma.matches.update({
      where: { match_id: Number(id) },
      data: {
        match_date: date ? new Date(date) : null,
        manual_stadium_id: venueRecord?.venue_id ?? null,
        referee_referee_id: referee ? Number(referee) : null,
      },
      include: {
        stadium: true,
        venue: true,
      },
    });

    return NextResponse.json({ success: true, match: updatedMatch });
  } catch (error: any) {
    console.error("Hiba a mérkőzés frissítésénél:", error);

    switch (error?.message) {
      case "UNAUTHORIZED":
        return NextResponse.json(
          { error: "Nincs bejelentkezve" },
          { status: 401 }
        );
      case "FORBIDDEN":
        return NextResponse.json(
          { error: "Nincs jogosultság ehhez a versenyhez" },
          { status: 403 }
        );
      case "NOT_FOUND":
        return NextResponse.json(
          { error: "Verseny nem található" },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          {
            error: "Sikertelen módosítás",
            details: error?.message ?? "Ismeretlen hiba",
          },
          { status: 500 }
        );
    }
  }
}
