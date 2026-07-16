/**
 * Ops error reporting — logs always; Sentry when NEXT_PUBLIC_SENTRY_DSN is set.
 */

export async function reportOpsError(
  error: unknown,
  context: {
    scope: string;
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  },
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context.scope}]`, message, context.extra ?? '');

  if (!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) return;

  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.withScope((scope) => {
      scope.setTag('ea.scope', context.scope);
      for (const [key, value] of Object.entries(context.tags ?? {})) {
        scope.setTag(key, value);
      }
      if (context.extra) scope.setExtras(context.extra);
      Sentry.captureException(error instanceof Error ? error : new Error(message));
    });
  } catch {
    // Never let monitoring break the request path.
  }
}
