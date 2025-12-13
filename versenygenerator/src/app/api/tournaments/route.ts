import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { getUser } from "@/auth/server";
import { requireTournamentOwner } from "@/auth/check";

//
// ============================================================
// POST – Új verseny létrehozása
// ============================================================
//
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      type,
      game,
      participants,
      description,
      hasThirdPlaceMatch,
      pointsForWin,
      pointsForDraw,
      rounds,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length < 6) {
      return NextResponse.json(
        { error: "A verseny neve kötelező, és legalább 6 karakter hosszú legyen." },
        { status: 400 }
      );
    }

    if (!game || typeof game !== "string") {
      return NextResponse.json(
        { error: "A sportág megadása kötelező." },
        { status: 400 }
      );
    }

    if (!type || typeof type !== "string") {
      return NextResponse.json(
        { error: "A versenytípus megadása kötelező." },
        { status: 400 }
      );
    }

    const parsedParticipants = Number(participants);
    if (!Number.isInteger(parsedParticipants) || parsedParticipants < 2) {
      return NextResponse.json(
        { error: "Legalább 2 résztvevő szükséges." },
        { status: 400 }
      );
    }

    let safePointsForWin = pointsForWin;
    let safePointsForDraw = pointsForDraw;

    if (type === "league" || type === "round-robin") {
      safePointsForWin = Number(pointsForWin ?? 0);
      safePointsForDraw = Number(pointsForDraw ?? 0);

      if (isNaN(safePointsForWin) || isNaN(safePointsForDraw)) {
        return NextResponse.json(
          { error: "A pontszámokat számként kell megadni." },
          { status: 400 }
        );
      }

      if (safePointsForWin < 0 || safePointsForDraw < 0) {
        return NextResponse.json(
          { error: "A pontszámok nem lehetnek negatívak." },
          { status: 400 }
        );
      }
    } else {
      safePointsForWin = Number(pointsForWin ?? 0);
      safePointsForDraw = Number(pointsForDraw ?? 0);
    }

    let safeRounds = rounds;
    if (type === "round-robin") {
      safeRounds = Number(rounds);
      if (!Number.isInteger(safeRounds) || safeRounds < 1) {
        return NextResponse.json(
          { error: "Körmérkőzéses rendszer esetén a fordulók száma legalább 1 legyen." },
          { status: 400 }
        );
      }
    } else {
      safeRounds = Number(rounds ?? 1);
      if (isNaN(safeRounds) || safeRounds < 0) {
        safeRounds = 1;
      }
    }

    // create

    const tournament = await prisma.tournament.create({
      data: {
        tournament_name: name.trim(),
        tournament_type: type,
        participants: parsedParticipants,
        description,
        hold_third_place_match: hasThirdPlaceMatch ? 1 : 0,
        point_for_win: safePointsForWin,
        point_for_draw: safePointsForDraw,
        round: safeRounds,
        game,
        user_id: user.id,
      },
    });

    const teamData = Array.from({ length: parsedParticipants }, (_, i) => ({
      team_name: `Csapat #${i + 1}`,
      tournament_tournament_id: tournament.tournament_id,
    }));

    await prisma.team.createMany({ data: teamData });

    return NextResponse.json({ success: true, tournament }, { status: 201 });
  } catch (error: any) {
    console.error("Hiba a verseny létrehozásakor:", error);
    return NextResponse.json(
      { error: "Hiba történt a verseny létrehozásakor.", details: error.message },
      { status: 500 }
    );
  }
}

// PUT – Verseny módosítása

export async function PUT(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
    }

    const {
      id,
      name,
      game,
      type,
      winPoints,
      drawPoints,
      holdThirdPlaceMatch,
      description,
    } = await req.json();

    const tournamentId = Number(id);

    if (!tournamentId) {
      return NextResponse.json(
        { error: "Hiányzó vagy érvénytelen verseny ID" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length < 6) {
      return NextResponse.json(
        { error: "A verseny neve kötelező, és legalább 3 karakter hosszú legyen." },
        { status: 400 }
      );
    }

    if (!game || typeof game !== "string") {
      return NextResponse.json(
        { error: "A sportág megadása kötelező." },
        { status: 400 }
      );
    }

    if (!type || typeof type !== "string") {
      return NextResponse.json(
        { error: "A versenytípus megadása kötelező." },
        { status: 400 }
      );
    }

    await requireTournamentOwner(tournamentId);

    const existing = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
      select: { status: true },
    });

    if (existing?.status === "generated") {
      return NextResponse.json(
        { error: "A mérkőzések már generálva lettek, a verseny adatai nem módosíthatók." },
        { status: 400 }
      );
    }

    let safeWinPoints: number = 0;
    let safeDrawPoints: number = 0;

    if (type === "league" || type === "round-robin") {
      if (winPoints === undefined || drawPoints === undefined) {
        return NextResponse.json(
          { error: "Bajnoki és körmérkőzéses rendszer esetén a pontszámok kötelezőek." },
          { status: 400 }
        );
      }

      safeWinPoints = Number(winPoints);
      safeDrawPoints = Number(drawPoints);

      if (
        isNaN(safeWinPoints) ||
        isNaN(safeDrawPoints) ||
        safeWinPoints < 0 ||
        safeDrawPoints < 0
      ) {
        return NextResponse.json(
          { error: "A pontszámok nem lehetnek negatívak, és számnak kell lenniük." },
          { status: 400 }
        );
      }
    } else {
      safeWinPoints = 0;
      safeDrawPoints = 0;
    }

    const safeDescription =
      typeof description === "string" ? description : null;

    const updatedTournament = await prisma.tournament.update({
      where: { tournament_id: tournamentId },
      data: {
        tournament_name: name.trim(),
        game,
        tournament_type: type,
        point_for_win: safeWinPoints,
        point_for_draw: safeDrawPoints,
        hold_third_place_match:
          type === "knockout" && holdThirdPlaceMatch ? 1 : 0,
        description: safeDescription,
      },
    });

    console.log("Verseny frissítve:", updatedTournament.tournament_name);
    return NextResponse.json({ success: true, tournament: updatedTournament }, { status: 200 });
  } catch (error: any) {
    console.error("Hiba a verseny módosításánál:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json(
          { error: "Nincs jogosultság ehhez a versenyhez" },
          { status: 403 }
        );
      case "NOT_FOUND":
        return NextResponse.json({ error: "A verseny nem található" }, { status: 404 });
      default:
        return NextResponse.json(
          { error: "Sikertelen módosítás.", details: error.message },
          { status: 500 }
        );
    }
  }
}

