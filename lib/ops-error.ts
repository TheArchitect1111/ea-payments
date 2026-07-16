/**
 * Ops error reporting — logs always; GlitchTip (Sentry SDK) when a DSN is set.
 */
import { monitoringConfigured } from '@/lib/monitoring';

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

  if (!monitoringConfigured()) return;

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
