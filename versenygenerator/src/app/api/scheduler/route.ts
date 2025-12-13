import { prisma } from "@/db/prisma";
import { NextResponse } from "next/server";
import { requireTournamentOwner } from "@/auth/check";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tournamentId, startDate, matchDuration, selectedDays } = body;

    if (!tournamentId || !selectedDays || !Array.isArray(selectedDays)) {
      return NextResponse.json(
        { error: "Hiányzó vagy hibás adatok" },
        { status: 400 }
      );
    }

    const tournament_id = Number(tournamentId);
    await requireTournamentOwner(tournament_id);

    await prisma.schedule.deleteMany({
      where: { tournament_tournament_id: tournament_id },
    });

    const scheduleData = selectedDays.map((day: { day: string; start: string; end: string }) => ({
      tournament_tournament_id: tournament_id,
      day_of_week: day.day,
      start_time: day.start,
      end_time: day.end,     
      match_duration: matchDuration ? parseInt(matchDuration) : null,
    }));

    await prisma.schedule.createMany({ data: scheduleData });

    await prisma.tournament.update({
      where: { tournament_id },
      data: { tournament_start: new Date(startDate) },
    });

    return NextResponse.json(
      { message: "Ütemezés sikeresen létrehozva!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Hiba történt", error);
    return NextResponse.json(
      { error: "Hiba történt az ütemezés mentése során." },
      { status: 500 }
    );
  }
}
