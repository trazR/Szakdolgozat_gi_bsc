import { prisma } from "@/db/prisma";
import { getUser } from "@/auth/server";

export async function requireTournamentOwner(tournamentId: number) {
  const user = await getUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const tournament = await prisma.tournament.findUnique({
    where: { tournament_id: tournamentId },
    select: { tournament_id: true, user_id: true },
  });

  if (!tournament) throw new Error("NOT_FOUND");
  if (tournament.user_id !== user.id) throw new Error("FORBIDDEN");

  return { user, tournament };
}

export async function checkTournamentPermission(tournamentId: number, userId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { tournament_id: tournamentId },
    select: { user_id: true },
  });
  return tournament?.user_id === userId;
}
