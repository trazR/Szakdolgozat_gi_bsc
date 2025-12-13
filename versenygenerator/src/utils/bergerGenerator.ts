export function generateBergerRounds(teams: any[], numberOfRounds = 2) {
  const originalTeams = [...teams];
  const hasByeTeam = originalTeams.length % 2 !== 0;
  if (hasByeTeam) {
    originalTeams.push({ isBye: true });
  }
  const randomizedTeams = [...originalTeams].sort(() => Math.random() - 0.5);
  const teamCount = randomizedTeams.length;

  if (teamCount < 2) return [];

  const roundsPerFullSet = teamCount - 1;
  const generatedRounds: any[] = [];

  const generateFullRoundSet = (reverseHomeAway = false) => {
    const rotatingTeams = [...randomizedTeams];
    const roundsInThisSet: any[] = [];

    for (let roundIndex = 0; roundIndex < roundsPerFullSet; roundIndex++) {
      const matchPairs: any[] = [];

      for (let pairIndex = 0; pairIndex < teamCount / 2; pairIndex++) {
        const teamA = rotatingTeams[pairIndex];
        const teamB = rotatingTeams[teamCount - 1 - pairIndex];
        const isByeMatch = (teamA as any).isBye || (teamB as any).isBye;
        const shouldSwapHome =
          pairIndex === 0 && roundIndex % 2 !== 0; 

        const homeTeam = reverseHomeAway
          ? teamB
          : shouldSwapHome
          ? teamB
          : teamA;

        const awayTeam = reverseHomeAway
          ? teamA
          : shouldSwapHome
          ? teamA
          : teamB;

        if (!isByeMatch) {
          matchPairs.push({ homeTeam, awayTeam });
        }
      }

      roundsInThisSet.push(matchPairs);
      const lastTeam = rotatingTeams.pop();
      if (lastTeam) rotatingTeams.splice(1, 0, lastTeam);
    }

    return roundsInThisSet;
  };

  for (let fullSetIndex = 0; fullSetIndex < numberOfRounds; fullSetIndex++) {
    const reverseHomeAway = fullSetIndex % 2 === 1;
    const generatedSet = generateFullRoundSet(reverseHomeAway);
    generatedRounds.push(...generatedSet);
  }

  return generatedRounds;
}
