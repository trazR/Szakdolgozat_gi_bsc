import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireTournamentOwner } from "@/auth/check";

// POST – Új játékvezető hozzáadása

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { referee_name, tournament_tournament_id } = body;

    if (!referee_name || !tournament_tournament_id) {
      return NextResponse.json({ error: "Hiányzó adat" }, { status: 400 });
    }

    await requireTournamentOwner(Number(tournament_tournament_id));

    const newReferee = await prisma.referee.create({
      data: {
        referee_name,
        tournament_tournament_id,
      },
    });

    return NextResponse.json(newReferee, { status: 201 });
  } catch (err: any) {
    console.error("Hiba a játékvezető hozzáadásánál:", err);

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

// DELETE – Játékvezető törlése

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { referee_id } = body;

    if (!referee_id) {
      return NextResponse.json({ error: "Hiányzó játékvezető ID" }, { status: 400 });
    }

    const referee = await prisma.referee.findUnique({
      where: { referee_id: Number(referee_id) },
      select: { tournament_tournament_id: true },
    });

    if (!referee) {
      return NextResponse.json({ error: "A játékvezető nem található" }, { status: 404 });
    }

    await requireTournamentOwner(Number(referee.tournament_tournament_id));

    await prisma.referee.delete({
      where: { referee_id: Number(referee_id) },
    });

    return NextResponse.json({ message: "Játékvezető törölve" }, { status: 200 });
  } catch (err: any) {
    console.error("Hiba a játékvezető törlésénél:", err);

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

// PUT – Játékvezető módosítása

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { referee_id, referee_name, age, gender, nationality } = body;

    if (!referee_id) {
      return NextResponse.json({ error: "Hiányzó referee_id" }, { status: 400 });
    }

    const referee = await prisma.referee.findUnique({
      where: { referee_id: Number(referee_id) },
      select: { tournament_tournament_id: true },
    });

    if (!referee) {
      return NextResponse.json({ error: "A játékvezető nem található" }, { status: 404 });
    }

    await requireTournamentOwner(Number(referee.tournament_tournament_id));

    if (
      !referee_name ||
      typeof referee_name !== "string" ||
      referee_name.trim().length < 3
    ) {
      return NextResponse.json(
        { error: "A játékvezető neve kötelező, és legalább 3 karakter hosszú legyen." },
        { status: 400 }
      );
    }

    if (!/^[\p{L}\s.'-]+$/u.test(referee_name.trim())) {
      return NextResponse.json(
        { error: "A játékvezető neve csak betűket és szóközöket tartalmazhat." },
        { status: 400 }
      );
    }

    let safeAge: number | null = null;
    if (age !== null && age !== undefined && age !== "") {
      const parsedAge = Number(age);
      if (Number.isNaN(parsedAge) || parsedAge < 18 || parsedAge > 75) {
        return NextResponse.json(
          { error: "A játékvezető életkora 18 és 75 év közé essen, ha megadásra kerül." },
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

    const updated = await prisma.referee.update({
      where: { referee_id: Number(referee_id) },
      data: {
        referee_name: referee_name.trim(),
        age: safeAge,
        gender: safeGender,
        nationality: safeNationality,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("Hiba a referee módosításánál:", err);

    switch (err.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      default:
        return NextResponse.json(
          { error: "Hiba történt a játékvezető módosítása során." },
          { status: 500 }
        );
    }
  }
}

// GET – Játékvezetők lekérdezése (sportágfüggő statisztikákkal)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tournamentId = Number(searchParams.get("tournamentId"));

  if (!tournamentId) {
    return NextResponse.json({ error: "Hiányzó tournamentId" }, { status: 400 });
  }

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
      select: { game: true },
    });

    const sport = tournament?.game?.toLowerCase() ?? "football";

    const referees = await prisma.referee.findMany({
      where: { tournament_tournament_id: tournamentId },
      orderBy: { referee_id: "asc" },
      select: {
        referee_id: true,
        referee_name: true,
        matches: {
          select: {
            plays: {
              select: {
                yellow_cards: true,
                red_cards: true,
                fouls_committed: true,
                personal_fouls: true,
                technical_fouls: true,
                unsportsmanlike_fouls: true,
                penalties_taken: true,
                two_min_suspensions: true,
              },
            },
          },
        },
      },
    });

    const refereeStats = referees.map((ref) => {
      let yellow = 0;
      let red = 0;
      let fouls = 0;
      let personal = 0;
      let technical = 0;
      let unsportsmanlike = 0;
      let penaltiesTaken = 0;
      let suspensions = 0;

      ref.matches.forEach((match) => {
        match.plays.forEach((play) => {
          yellow          += play.yellow_cards ?? 0;
          red             += play.red_cards ?? 0;
          fouls           += play.fouls_committed ?? 0;
          personal        += play.personal_fouls ?? 0;
          technical       += play.technical_fouls ?? 0;
          unsportsmanlike += play.unsportsmanlike_fouls ?? 0;
          penaltiesTaken  += play.penalties_taken ?? 0;
          suspensions     += play.two_min_suspensions ?? 0;
        });
      });

      if (sport === "football") {
        return {
          referee_id: ref.referee_id,
          referee_name: ref.referee_name,
          yellow_cards: yellow,
          red_cards: red,
          fouls_committed: fouls,
          penalties_taken: penaltiesTaken,
        };
      }

      if (sport === "handball") {
        return {
          referee_id: ref.referee_id,
          referee_name: ref.referee_name,
          yellow_cards: yellow,
          red_cards: red,
          two_min_suspensions: suspensions,
          penalties_taken: penaltiesTaken,
          fouls_committed: fouls,
        };
      }

      if (sport === "basketball") {
        return {
          referee_id: ref.referee_id,
          referee_name: ref.referee_name,
          personal_fouls: personal,
          technical_fouls: technical,
          unsportsmanlike_fouls: unsportsmanlike,
        };
      }

      return {
        referee_id: ref.referee_id,
        referee_name: ref.referee_name,
        yellow_cards: yellow,
        red_cards: red,
        fouls_committed: fouls,
      };
    });

    return NextResponse.json({ sport, refereeStats });
  } catch (err) {
    console.error("Hiba a játékvezetők lekérdezésénél:", err);
    return NextResponse.json({ error: "Hiba történt" }, { status: 500 });
  }
}

