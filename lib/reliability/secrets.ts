const FORBIDDEN_PUBLIC_SECRET_PATTERNS = [
  /^NEXT_PUBLIC_.*(?:SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY)$/i,
  /^NEXT_PUBLIC_.*KEY$/i,
];

export function assertNoPublicSecrets(env: NodeJS.ProcessEnv = process.env): void {
  const violations = Object.entries(env)
    .filter(([key, value]) => value && FORBIDDEN_PUBLIC_SECRET_PATTERNS.some((pattern) => pattern.test(key)))
    .map(([key]) => key);
  if (violations.length) {
    throw new Error(`Public secret boundary violation: ${violations.join(', ')}`);
  }
}

export function secretConfigured(name: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env[name];
  return typeof value === 'string' && value.trim().length > 0;
}
