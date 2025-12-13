import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireTournamentOwner } from "@/auth/check";

// POST – Új helyszín létrehozása

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { venue_name, tournament_tournament_id } = body;

    if (!venue_name || !tournament_tournament_id) {
      return NextResponse.json({ error: "Hiányzó adat" }, { status: 400 });
    }

    const name = String(venue_name).trim();

    if (!name || name.length < 3) {
      return NextResponse.json(
        { error: "A helyszín neve kötelező, és legalább 3 karakter hosszú legyen." },
        { status: 400 }
      );
    }

    if (!/^[\p{L}\d\s.'-]+$/u.test(name)) {
      return NextResponse.json(
        { error: "A helyszín neve csak betűket, számokat és szóközöket tartalmazhat." },
        { status: 400 }
      );
    }

    await requireTournamentOwner(Number(tournament_tournament_id));

    const newVenue = await prisma.venue.create({
      data: {
        venue_name: name,
        tournament_tournament_id: Number(tournament_tournament_id),
      },
    });

    return NextResponse.json(newVenue, { status: 201 });
  } catch (error: any) {
    console.error("Hiba a helyszín létrehozásánál:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      default:
        return NextResponse.json({ error: "Hiba történt" }, { status: 500 });
    }
  }
}

// GET – Helyszínek lekérdezése

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tournamentId = Number(searchParams.get("tournamentId"));

  if (!tournamentId) {
    return NextResponse.json({ error: "Hiányzó tournamentId" }, { status: 400 });
  }

  try {
    const venues = await prisma.venue.findMany({
      where: { tournament_tournament_id: tournamentId },
      orderBy: { venue_id: "asc" },
    });

    return NextResponse.json(venues);
  } catch (error) {
    console.error("Hiba a helyszínek lekérdezésénél:", error);
    return NextResponse.json({ error: "Hiba történt" }, { status: 500 });
  }
}

// DELETE – Helyszín törlése

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { venue_id } = body;

    if (!venue_id) {
      return NextResponse.json({ error: "Hiányzó venue_id" }, { status: 400 });
    }

    const venue = await prisma.venue.findUnique({
      where: { venue_id: Number(venue_id) },
      select: { tournament_tournament_id: true },
    });

    if (!venue) {
      return NextResponse.json({ error: "Helyszín nem található" }, { status: 404 });
    }

    await requireTournamentOwner(Number(venue.tournament_tournament_id));

    await prisma.venue.delete({
      where: { venue_id: Number(venue_id) },
    });

    return NextResponse.json({ message: "Helyszín törölve" }, { status: 200 });
  } catch (error: any) {
    console.error("Hiba a helyszín törlésénél:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      default:
        return NextResponse.json({ error: "Hiba történt a törlésnél" }, { status: 500 });
    }
  }
}

// PUT – Helyszín módosítása

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { venue_id, venue_name, address, capacity } = body;

    if (!venue_id) {
      return NextResponse.json({ error: "Hiányzó venue_id" }, { status: 400 });
    }

    const venue = await prisma.venue.findUnique({
      where: { venue_id: Number(venue_id) },
      select: { tournament_tournament_id: true },
    });

    if (!venue) {
      return NextResponse.json({ error: "Helyszín nem található" }, { status: 404 });
    }

    await requireTournamentOwner(Number(venue.tournament_tournament_id));

    if (!venue_name || typeof venue_name !== "string" || venue_name.trim().length < 3) {
      return NextResponse.json(
        { error: "A helyszín neve kötelező, és legalább 3 karakter hosszú legyen." },
        { status: 400 }
      );
    }

    const safeName = venue_name.trim();
    if (!/^[\p{L}\d\s.'-]+$/u.test(safeName)) {
      return NextResponse.json(
        { error: "A helyszín neve csak betűket, számokat és szóközöket tartalmazhat." },
        { status: 400 }
      );
    }

    let safeAddress: string | null = null;
    if (typeof address === "string" && address.trim() !== "") {
      const addr = address.trim();
      if (addr.length < 5 || addr.length > 100) {
        return NextResponse.json(
          { error: "A cím hossza 5 és 100 karakter között legyen." },
          { status: 400 }
        );
      }
      if (!/^[\p{L}\d\s,.\-\/]+$/u.test(addr)) {
        return NextResponse.json(
          { error: "A cím csak betűket, számokat, szóközt és alap írásjeleket tartalmazhat." },
          { status: 400 }
        );
      }
      safeAddress = addr;
    }

    let safeCapacity: number | null = null;
    if (capacity !== "" && capacity !== undefined && capacity !== null) {
      const parsedCapacity = Number(capacity);
      if (Number.isNaN(parsedCapacity) || parsedCapacity < 0 || parsedCapacity > 200000) {
        return NextResponse.json(
          { error: "A férőhely 0 és 200.000 közötti érték legyen." },
          { status: 400 }
        );
      }
      safeCapacity = parsedCapacity;
    }

    const updatedVenue = await prisma.venue.update({
      where: { venue_id: Number(venue_id) },
      data: {
        venue_name: safeName,
        address: safeAddress,
        capacity: safeCapacity,
      },
    });

    return NextResponse.json(updatedVenue, { status: 200 });
  } catch (error: any) {
    console.error("Hiba a helyszín módosításánál:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      default:
        return NextResponse.json({ error: "Hiba történt a módosításnál" }, { status: 500 });
    }
  }
}
