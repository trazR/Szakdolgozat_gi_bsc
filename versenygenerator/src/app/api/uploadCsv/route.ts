import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { requireTournamentOwner } from "@/auth/check";

const prisma = new PrismaClient();

// POST – CSV import

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const tournamentIdRaw = formData.get("tournamentId");

    const tournamentId = Number(tournamentIdRaw);

    if (!file) {
      return NextResponse.json({ error: "Nincs fájl a kérésben." }, { status: 400 });
    }
    if (!tournamentId || Number.isNaN(tournamentId)) {
      return NextResponse.json({ error: "Hiányzó vagy érvénytelen tournamentId." }, { status: 400 });
    }

    await requireTournamentOwner(tournamentId);

    const bytes = await file.arrayBuffer();
    const text = Buffer.from(bytes).toString("utf-8");

    if (!text.trim()) {
      return NextResponse.json({ error: "A feltöltött fájl üres." }, { status: 400 });
    }

    const delimiter = text.includes(";") ? ";" : ",";

    let records: any[];
    try {
      records = parse(text, {
        columns: true,
        delimiter,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (e) {
      console.error("CSV parszolási hiba:", e);
      return NextResponse.json(
        { error: "Nem sikerült feldolgozni a CSV fájlt. Ellenőrizd a formátumot." },
        { status: 400 }
      );
    }

    if (!records || records.length === 0) {
      return NextResponse.json({ error: "Üres CSV, nincs egyetlen sor sem." }, { status: 400 });
    }

    if (records.length > 1000) {
      return NextResponse.json(
        { error: "Túl hosszú a fájl < 1000" },
        { status: 400 }
      );
    }

    const requiredCols = ["team_name", "player_name"];
    const firstRecord = records[0] as any;
    for (const col of requiredCols) {
      if (!(col in firstRecord)) {
        return NextResponse.json(
          { error: `Hiányzó oszlop a CSV-ben: ${col}` },
          { status: 400 }
        );
      }
    }

    for (const record of records as any[]) {
      if (record.team_name) {
        const teamName = String(record.team_name).trim();
        if (!teamName) {
          return NextResponse.json(
            { error: "Van olyan sor, ahol a team_name üres." },
            { status: 400 }
          );
        }
        if (teamName.length > 100) {
          return NextResponse.json(
            { error: "Túl hosszú csapatnév < 100." },
            { status: 400 }
          );
        }
      }

      if (
        record.stadium_capacity !== undefined &&
        record.stadium_capacity !== null &&
        record.stadium_capacity !== ""
      ) {
        const cap = Number(record.stadium_capacity);
        if (Number.isNaN(cap) || cap < 0 || cap > 200000) {
          return NextResponse.json(
            { error: "Érvénytelen férőhely < 0." },
            { status: 400 }
          );
        }
      }

      if (record.age !== undefined && record.age !== null && record.age !== "") {
        const age = Number(record.age);
        if (Number.isNaN(age) || age < 0 || age > 100) {
          return NextResponse.json(
            { error: "Érvénytelen életkor szerepel a fájlban (0 < Életkor < 100)." },
            { status: 400 }
          );
        }
      }
    }

    await prisma.team.deleteMany({
      where: { tournament_tournament_id: tournamentId },
    });

    const teamsMap = new Map<
      string,
      {
        stadium: { stadium_name: string; address?: string; capacity?: number };
        players: {
          player_name: string;
          age?: number;
          gender?: string;
          nationality?: string;
          position?: string;
        }[];
      }
    >();

    for (const raw of records as any[]) {
      const teamNameRaw = raw.team_name?.trim();
      if (!teamNameRaw) continue;

      const teamName = teamNameRaw;

      if (!teamsMap.has(teamName)) {
        const stadiumName =
          raw.stadium_name?.trim() || `${teamName} stadion`;

        const stadiumAddress = raw.stadium_address?.trim() || "";

        const stadiumCapacity =
          raw.stadium_capacity !== undefined &&
          raw.stadium_capacity !== null &&
          raw.stadium_capacity !== ""
            ? Number(raw.stadium_capacity)
            : undefined;

        teamsMap.set(teamName, {
          stadium: {
            stadium_name: stadiumName,
            address: stadiumAddress,
            capacity: stadiumCapacity,
          },
          players: [],
        });
      }

      const playerName =
        raw.player_name?.trim() || "Ismeretlen";

      const age =
        raw.age !== undefined &&
        raw.age !== null &&
        raw.age !== ""
          ? Number(raw.age)
          : undefined;

      const gender = raw.gender?.trim() || undefined;
      const nationality = raw.nationality?.trim() || undefined;
      const position = raw.position?.trim() || undefined;

      teamsMap.get(teamName)!.players.push({
        player_name: playerName,
        age,
        gender,
        nationality,
        position,
      });
    }

    if (teamsMap.size === 0) {
      return NextResponse.json(
        { error: "Nem sikerült érvényes csapatadatokat kinyerni a CSV-ből." },
        { status: 400 }
      );
    }

    for (const [teamName, { stadium, players }] of teamsMap.entries()) {
      const newTeam = await prisma.team.create({
        data: {
          team_name: teamName,
          tournament_tournament_id: tournamentId,
        },
      });

      await prisma.stadium.create({
        data: {
          stadium_name: stadium.stadium_name,
          address: stadium.address || "",
          capacity: stadium.capacity,
          team_team_id: newTeam.team_id,
        },
      });

      if (players.length > 0) {
        await prisma.player.createMany({
          data: players.map((p) => ({
            player_name: p.player_name,
            age: p.age,
            gender: p.gender,
            nationality: p.nationality,
            position: p.position,
            team_team_id: newTeam.team_id,
          })),
        });
      }
    }

    return NextResponse.json({ message: "Sikeres feltöltés!" });
  } catch (error: any) {
    console.error("Hiba a CSV import során:", error);

    switch (error.message) {
      case "UNAUTHORIZED":
        return NextResponse.json({ error: "Nincs bejelentkezve" }, { status: 401 });
      case "FORBIDDEN":
        return NextResponse.json({ error: "Nincs jogosultság ehhez a versenyhez" }, { status: 403 });
      case "NOT_FOUND":
        return NextResponse.json({ error: "A verseny nem található" }, { status: 404 });
      default:
        return NextResponse.json(
          { error: "Hiba történt a feltöltés során.", details: error.message },
          { status: 500 }
        );
    }
  }
}
