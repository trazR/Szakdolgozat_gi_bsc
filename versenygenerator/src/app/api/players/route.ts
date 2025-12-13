import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireTournamentOwner } from "@/auth/check";
import { statFieldsBySport } from "@/utils/statFields";


// POST – Új játékos hozzáadása

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { player_name, team_team_id } = body;

    if (!player_name || !team_team_id) {
      return NextResponse.json({ error: "Hiányzó adat" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { team_id: Number(team_team_id) },
      select: { tournament_tournament_id: true },
    });

    if (!team) {
      return NextResponse.json({ error: "A csapat nem található" }, { status: 404 });
    }

    await requireTournamentOwner(Number(team.tournament_tournament_id));

    const newPlayer = await prisma.player.create({
      data: {
        player_name,
        team_team_id,
      },
    });

    return NextResponse.json(newPlayer, { status: 201 });
  } catch (err: any) {
    console.error("Hiba a játékos hozzáadásánál:", err);

    switch (err.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      default:
        return NextResponse.json({ error: "Hiba történt" }, { status: 500 });
    }
  }
}

// DELETE – Játékos törlése

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { player_id } = body;

    if (!player_id) {
      return NextResponse.json({ error: "Hiányzó játékos ID" }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { player_id: Number(player_id) },
      select: {
        team: { select: { tournament_tournament_id: true } },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "A játékos nem található" }, { status: 404 });
    }

    await requireTournamentOwner(Number(player.team.tournament_tournament_id));

    await prisma.player.delete({
      where: { player_id: Number(player_id) },
    });

    return NextResponse.json({ message: "Játékos törölve" }, { status: 200 });
  } catch (err: any) {
    console.error("Hiba a játékos törlésénél:", err);

    switch (err.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      default:
        return NextResponse.json({ error: "Hiba történt" }, { status: 500 });
    }
  }
}


// PUT – Játékos módosítása

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { player_id, player_name, age, gender, nationality, position } = body;

    if (!player_id) {
      return NextResponse.json({ error: "Hiányzó játékos ID" }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { player_id: Number(player_id) },
      select: {
        team: { select: { tournament_tournament_id: true } },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "A játékos nem található" }, { status: 404 });
    }

    await requireTournamentOwner(Number(player.team.tournament_tournament_id));


    if (!player_name || typeof player_name !== "string" || player_name.trim().length < 3) {
      return NextResponse.json(
        { error: "A játékos neve kötelező, és legalább 3 karakter hosszú legyen." },
        { status: 400 }
      );
    }

    if (!/^[\p{L}\s.'-]+$/u.test(player_name.trim())) {
      return NextResponse.json(
        { error: "A játékos neve csak betűket és szóközöket tartalmazhat." },
        { status: 400 }
      );
    }

    let safeAge: number | null = null;
    if (age !== null && age !== undefined && age !== "") {
      const parsedAge = Number(age);
      if (Number.isNaN(parsedAge) || parsedAge < 5 || parsedAge > 70) {
        return NextResponse.json(
          { error: "A kor 5 és 70 év közé essen, ha megadásra kerül." },
          { status: 400 }
        );
      }
      safeAge = parsedAge;
    }

    let safeGender: string | null = null;
    if (gender !== null && gender !== undefined && gender !== "") {
      if (!["ferfi", "no", "egyeb"].includes(gender)) {
        return NextResponse.json(
          { error: "Érvénytelen nem érték." },
          { status: 400 }
        );
      }
      safeGender = gender;
    }

    let safeNationality: string | null = null;
    if (typeof nationality === "string" && nationality.trim() !== "") {
      const nat = nationality.trim();
      if (nat.length < 2 || nat.length > 50) {
        return NextResponse.json(
          { error: "A nemzetiség hossza 2 és 50 karakter között legyen." },
          { status: 400 }
        );
      }
      if (!/^[\p{L}\s-]+$/u.test(nat)) {
        return NextResponse.json(
          { error: "A nemzetiség csak betűket, szóközt és kötőjelet tartalmazhat." },
          { status: 400 }
        );
      }
      safeNationality = nat;
    }

    let safePosition: string | null = null;
    if (typeof position === "string" && position.trim() !== "") {
      const pos = position.trim();
      if (pos.length > 50) {
        return NextResponse.json(
          { error: "A poszt megnevezése legfeljebb 50 karakter lehet." },
          { status: 400 }
        );
      }
      safePosition = pos;
    }

    const updated = await prisma.player.update({
      where: { player_id: Number(player_id) },
      data: {
        player_name: player_name.trim(),
        age: safeAge,
        gender: safeGender,
        nationality: safeNationality,
        position: safePosition,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("Hiba a játékos módosításánál:", err);

    switch (err.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json(
          { error: "Nincs jogosultság ehhez a versenyhez" },
          { status: 403 }
        );
      default:
        return NextResponse.json(
          { error: "Hiba történt a játékos módosítása során." },
          { status: 500 }
        );
    }
  }
}

// GET – Csapat játékosai

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teamId = Number(searchParams.get("teamId"));

  if (!teamId) {
    return NextResponse.json({ error: "Hiányzó teamId" }, { status: 400 });
  }

  try {

    const team = await prisma.team.findUnique({
      where: { team_id: teamId },
      include: {
        tournament: { select: { game: true } },
        player: {
          include: {
            plays: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Csapat nem található" }, { status: 404 });
    }

    const sportKey = team.tournament?.game?.toLowerCase() ?? "football";

    const fields =
      statFieldsBySport[sportKey as keyof typeof statFieldsBySport] ?? [];

    const playerStats = team.player
      .sort((a, b) => a.player_id - b.player_id)
      .map((player) => {
        const stats: Record<string, number> = {};

        for (const field of fields) {
          const key = field.key; 
          let sum = 0;

          for (const p of player.plays) {
            const value = (p as any)[key];
            if (typeof value === "number") sum += value;
          }

          stats[key] = sum;
        }

        return {
          player_id: player.player_id,
          player_name: player.player_name,
          ...stats,
        };
      });

    return NextResponse.json(playerStats);
  } catch (err) {
    console.error("Hiba a játékosok lekérdezésénél:", err);
    return NextResponse.json({ error: "Hiba történt" }, { status: 500 });
  }
}
