import { prisma } from "@/db/prisma";
export async function updateNextTeams(
  match_id: number,
  home_team_score: number,
  away_team_score: number
) {
  try {
    const match = await prisma.matches.findUnique({
      where: { match_id },
    });

    if (!match) {
      return { error: "A megadott meccs nem található." };
    }
    let winner_team_id: number | null = null;
    let loser_team_id: number | null = null;

    if (home_team_score > away_team_score) {
      winner_team_id = match.home_team_id;
      loser_team_id = match.away_team_id;
    } else if (away_team_score > home_team_score) {
      winner_team_id = match.away_team_id;
      loser_team_id = match.home_team_id;
    } else {
      return { error: "A mérkőzés nem végződhet döntetlennel kieséses rendszerben." };
    }
    await prisma.matches.update({
      where: { match_id },
      data: {
        home_team_score,
        away_team_score,
        winner_team_id,
        match_status: "over",
      },
    });
    const findNextMatch = async (bracket_type: string) => {
      return prisma.matches.findFirst({
        where: {
          tournament_tournament_id: match.tournament_tournament_id,
          bracket_type,
          OR: [
            { previous_match_1_id: match.match_id },
            { previous_match_2_id: match.match_id },
          ],
        },
      });
    };
    const setTeamInNextMatch = async (nextMatch: any, team_id: number | null) => {
      if (!nextMatch || !team_id) return;
      const setHome = nextMatch.previous_match_1_id === match.match_id;
      await prisma.matches.update({
        where: { match_id: nextMatch.match_id },
        data: setHome
          ? { home_team_id: team_id }
          : { away_team_id: team_id },
      });
    };
    if (match.bracket_type === "winner") {
      const nextWinner = await findNextMatch("winner");
      await setTeamInNextMatch(nextWinner, winner_team_id);

      const nextLoser = await findNextMatch("loser");
      if (nextLoser) await setTeamInNextMatch(nextLoser, loser_team_id);

      const nextThird = await findNextMatch("third_place");
      if (nextThird) await setTeamInNextMatch(nextThird, loser_team_id);

      const nextFinal = await findNextMatch("final");
      if (nextFinal) await setTeamInNextMatch(nextFinal, winner_team_id);
    }

    else if (match.bracket_type === "loser") {
      const nextLoser = await findNextMatch("loser");
      await setTeamInNextMatch(nextLoser, winner_team_id);

      const nextFinal = await findNextMatch("final");
      await setTeamInNextMatch(nextFinal, winner_team_id);
    }

    else if (match.bracket_type === "third_place") {
    }

    else if (match.bracket_type === "final") {
    }

    else {
      const nextMatch = await findNextMatch("winner");
      await setTeamInNextMatch(nextMatch, winner_team_id);
      const nextThird = await findNextMatch("third_place");
      if (nextThird) await setTeamInNextMatch(nextThird, loser_team_id);
    }

    return { success: true, winner_team_id, loser_team_id };
  } catch (error: any) {
    console.error("updateNextTeams error:", error);
    return { error: "Eredmény mentése sikertelen", details: error.message };
  }
}
