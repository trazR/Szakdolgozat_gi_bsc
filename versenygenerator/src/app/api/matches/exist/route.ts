import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = Number(searchParams.get('tournamentId'));

    if (!tournamentId || Number.isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Hiányzó vagy érvénytelen tournamentId' }, { status: 400 });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
      select: { status: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'A bajnokság nem található.' }, { status: 404 });
    }

    // generáltak e már a meccsek
    const isGenerated = tournament.status === 'generated';

    return NextResponse.json({
      exists: isGenerated,
      status: tournament.status,
    });
  } catch (error) {
    console.error('[MATCH_CHECK_ERROR]', error);
    return NextResponse.json(
      { error: 'Hiba történt az ellenőrzés során' },
      { status: 500 }
    );
  }
}
