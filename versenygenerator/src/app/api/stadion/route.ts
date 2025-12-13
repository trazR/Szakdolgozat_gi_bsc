import { prisma } from "@/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireTournamentOwner } from "@/auth/check";

// POST – Stadion hozzáadása a csapathoz

export async function POST(req: NextRequest) {
  try {
    const { stadium_name, team_id, capacity, address } = await req.json();

    if (!stadium_name || !team_id) {
      return NextResponse.json({ error: "Hiányzó adat" }, { status: 400 });
    }

    const numericTeamId = Number(team_id);

    const team = await prisma.team.findUnique({
      where: { team_id: numericTeamId },
      select: { tournament_tournament_id: true, stadium: { select: { stadium_id: true } } },
    });

    if (!team) {
      return NextResponse.json({ error: "A csapat nem található" }, { status: 404 });
    }

    if (team.stadium) {
      return NextResponse.json({ error: "Ennek a csapatnak már van stadionja" }, { status: 400 });
    }

    await requireTournamentOwner(Number(team.tournament_tournament_id));

    const newStadium = await prisma.stadium.create({
      data: {
        stadium_name,
        capacity: capacity ? Number(capacity) : null,
        address: address || null,
        team: {
          connect: { team_id: numericTeamId },
        },
      },
    });

    return NextResponse.json(newStadium, { status: 201 });
  } catch (error: any) {
    console.error("Stadion hozzáadási hiba:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      default:
        return NextResponse.json({ error: "Hiba történt a stadion hozzáadásánál" }, { status: 500 });
    }
  }
}

// GET – Csapathoz vagy stadionhoz tartozó adat lekérése

export async function GET(req: NextRequest) {
  try {
    const teamId = req.nextUrl.searchParams.get("teamId");
    const stadiumId = req.nextUrl.searchParams.get("stadiumId");

    if (teamId) {
      const stadium = await prisma.stadium.findUnique({
        where: { team_team_id: Number(teamId) },
      });
      return NextResponse.json(stadium ?? null, { status: 200 });
    }

    if (stadiumId) {
      const stadium = await prisma.stadium.findUnique({
        where: { stadium_id: Number(stadiumId) },
      });
      return NextResponse.json(stadium ?? null, { status: 200 });
    }

    return NextResponse.json({ error: "Kötelező paraméter hiányzik!" }, { status: 400 });
  } catch (error) {
    console.error("Stadion lekérdezési hiba:", error);
    return NextResponse.json({ error: "Hiba történt a stadion lekérdezésénél" }, { status: 500 });
  }
}

// PUT – Stadion adatainak módosítása

export async function PUT(req: NextRequest) {
  try {
    const { stadium_id, stadium_name, capacity, address } = await req.json();

    if (!stadium_id) {
      return NextResponse.json({ error: "stadium_id megadása kötelező" }, { status: 400 });
    }

    const numericStadiumId = Number(stadium_id);

    const stadium = await prisma.stadium.findUnique({
      where: { stadium_id: numericStadiumId },
      include: {
        team: {
          select: { tournament_tournament_id: true },
        },
      },
    });

    if (!stadium || !stadium.team) {
      return NextResponse.json({ error: "A stadionhoz nem tartozik csapat" }, { status: 404 });
    }

    await requireTournamentOwner(Number(stadium.team.tournament_tournament_id));

    const updatedStadium = await prisma.stadium.update({
      where: { stadium_id: numericStadiumId },
      data: {
        stadium_name,
        capacity: capacity !== undefined && capacity !== null ? Number(capacity) : undefined,
        address,
      },
    });

    return NextResponse.json(updatedStadium, { status: 200 });
  } catch (error: any) {
    console.error("Stadion módosítási hiba:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      default:
        return NextResponse.json({ error: "Hiba történt a stadion módosításánál" }, { status: 500 });
    }
  }
}

// DELETE – Stadion törlése a csapattól

export async function DELETE(req: NextRequest) {
  try {
    const { team_id } = await req.json();

    if (!team_id) {
      return NextResponse.json({ error: "team_id megadása kötelező" }, { status: 400 });
    }

    const numericTeamId = Number(team_id);

    const stadium = await prisma.stadium.findUnique({
      where: { team_team_id: numericTeamId },
      include: {
        team: { select: { tournament_tournament_id: true } },
      },
    });

    if (!stadium || !stadium.team) {
      return NextResponse.json({ message: "Nincs stadion ehhez a csapathoz" }, { status: 404 });
    }

    await requireTournamentOwner(Number(stadium.team.tournament_tournament_id));

    await prisma.stadium.delete({
      where: { stadium_id: stadium.stadium_id },
    });

    return NextResponse.json({ message: "Stadion törölve" }, { status: 200 });
  } catch (error: any) {
    console.error("Stadion törlési hiba:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      default:
        return NextResponse.json({ error: "Hiba történt a stadion törlésénél" }, { status: 500 });
    }
  }
}
