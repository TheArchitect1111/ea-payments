export function qualifiesForCommunityDeposit(discoveryAnswers: unknown): boolean {
  const text = JSON.stringify(discoveryAnswers ?? '').toLowerCase();
  return /nonprofit|non-profit|fraternity|sorority|community organization/.test(text);
}

export function proposalDeposit(total: number, discoveryAnswers: unknown): number {
  const required = qualifiesForCommunityDeposit(discoveryAnswers) ? 250 : 500;
  return Math.min(required, total);
}
