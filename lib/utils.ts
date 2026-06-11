export function displayToken(token: string): string {
  const replaced = token
    .replace(/ /g, '·')
    .replace(/\n/g, '↵')
    .replace(/\t/g, '→');
  return replaced.length > 15 ? replaced.slice(0, 14) + '…' : replaced;
}

export function calculatePathProbability(tokens: Array<{ prob: number }>): number {
  return tokens.reduce((acc, t) => acc * t.prob, 1);
}

export function buildPhrase(phrase: string, tokens: Array<{ token: string }>): string {
  return tokens.reduce((acc, t) => acc + t.token, phrase);
}

export function formatPercentage(prob: number): string {
  return (prob * 100).toFixed(2) + '%';
}
