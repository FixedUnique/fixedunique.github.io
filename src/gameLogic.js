export const calculateScore = (dice1, dice2) => {
    const [a, b] = [dice1, dice2].sort((x, y) => y - x);
  
    // Special combinations
    if (a === 1 && b === 2) return { score: Infinity, special: 'MAX' };
    if (a === 3 && b === 4) return { score: -Infinity, special: 'INSTANT_LOSE' };
  
    // Doubles
    if (dice1 === dice2) {
      return { score: dice1 * 100, special: 'DOUBLE' };
    }
  
    // Normal score
    return { score: a * 10 + b, special: null };
  };
  
  export const determineLoser = (players) => {
    const scores = players.map(p => p.score);
    const minScore = Math.min(...scores);
    return players.filter(p => p.score === minScore);
  };