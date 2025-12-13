import { ReactNode } from 'react';
import { prisma } from '@/db/prisma';
import TournamentNav from '@/components/TournamentNav'; 

export default async function TournamentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { id: string };
}) {
  const { id } = params;
  const tournament = await prisma.tournament.findUnique({
    where: { tournament_id: Number(id) },
    select: { tournament_type: true },
  });

  if (!tournament) {
    return (
      <div className="p-4">
        <div className="font-bold mb-4">Nem található ilyen verseny.</div>
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="p-4">
      <TournamentNav id={id} tournamentType={tournament.tournament_type} />
      <main>{children}</main>
    </div>
  );
}
