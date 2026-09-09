export function displayToken(token: string): string {
  const replaced = token
    .replace(/ /g, '·')
    .replace(/\n/g, '↵')
    .replace(/\t/g, '→');
  return replaced.length > 15 ? replaced.slice(0, 14) + '…' : replaced;
}

export function formatPercentage(prob: number): string {
  return (prob * 100).toFixed(2) + '%';
}
