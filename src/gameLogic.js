export const calculateScore = (die1, die2) => {
  const d1 = Number(die1);
  const d2 = Number(die2);

  // Check for INSTANT_LOSE first (3 & 4 in any order)
  if ((d1 === 3 && d2 === 4) || (d1 === 4 && d2 === 3)) {
    return { score: -Infinity, special: 'INSTANT_LOSE', instantLoss: true };
  }

  // Check for MAX (1 & 2 in any order)
  if ((d1 === 1 && d2 === 2) || (d1 === 2 && d2 === 1)) {
    return { score: Infinity, special: 'MAX' };
  }

  // Check doubles
  if (d1 === d2) {
    const special = d1 === 1 ? 'KNIGHT' : 'DOUBLE';
    return { score: d1 * 100, special };
  }

  // Normal score calculation (highest die * 10 + lowest die)
  const [a, b] = [d1, d2].sort((x, y) => y - x);
  return { score: a * 10 + b, special: null };
};

export const determineLoser = (players) => {
  // Add index to each player and filter
  const playersWithIndex = players.map((player, index) => ({ ...player, index }));
  
  // Check for instant loss first
  const instantLosers = playersWithIndex.filter(p => p.finalScore === -Infinity);
  if (instantLosers.length > 0) return instantLosers;

  // Otherwise check lowest score
  const validPlayers = playersWithIndex.filter(p => 
    p.finalScore !== null && p.finalScore !== -Infinity
  );
  
  if (validPlayers.length === 0) return playersWithIndex;
  
  const scores = validPlayers.map(p => p.finalScore);
  const minScore = Math.min(...scores);
  return validPlayers.filter(p => p.finalScore === minScore);
};