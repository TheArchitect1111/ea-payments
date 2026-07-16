/**
 * EA platform error monitoring — GlitchTip (Sentry-compatible protocol).
 * Reuses @sentry/nextjs; never hardcodes credentials.
 */

/** Preferred public DSN for browser + server. */
export function resolveMonitoringDsn(): string | undefined {
  const candidates = [
    process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
    process.env.GLITCHTIP_DSN,
    // Legacy Sentry-hosted DSN still accepted during migration.
    process.env.NEXT_PUBLIC_SENTRY_DSN,
    process.env.SENTRY_DSN,
  ];
  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

export function monitoringConfigured(): boolean {
  return Boolean(resolveMonitoringDsn());
}

/** @deprecated Prefer monitoringConfigured — kept for Pass 1 / launch API aliases. */
export function sentryConfigured(): boolean {
  return monitoringConfigured();
}

export function resolveAppEnvironment(): string {
  return (
    process.env.APP_ENV?.trim() ||
    process.env.VERCEL_ENV?.trim() ||
    process.env.NODE_ENV ||
    'development'
  );
}

export function resolveAppRelease(): string | undefined {
  const release =
    process.env.APP_RELEASE?.trim() ||
    process.env.APP_VERSION?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.NEXT_PUBLIC_APP_VERSION?.trim();
  return release || undefined;
}

export function resolveApplicationName(): string {
  return (
    process.env.NEXT_PUBLIC_APP_NAME?.trim() ||
    process.env.APP_NAME?.trim() ||
    'ea-payments'
  );
}

/** Env var name to surface in operator checklists when unset. */
export function monitoringDsnEnvHint(): string {
  if (process.env.NEXT_PUBLIC_GLITCHTIP_DSN?.trim() || process.env.GLITCHTIP_DSN?.trim()) {
    return 'NEXT_PUBLIC_GLITCHTIP_DSN';
  }
  if (process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || process.env.SENTRY_DSN?.trim()) {
    return 'NEXT_PUBLIC_SENTRY_DSN';
  }
  return 'NEXT_PUBLIC_GLITCHTIP_DSN';
}
