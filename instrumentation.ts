import * as Sentry from '@sentry/nextjs';
import { monitoringConfigured } from '@/lib/monitoring';

export async function register() {
  if (!monitoringConfigured()) {
    return;
  }

  try {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('./sentry.server.config');
    }
    if (process.env.NEXT_RUNTIME === 'edge') {
      await import('./sentry.edge.config');
    }
  } catch {
    // Monitoring must never block boot.
  }
}

export const onRequestError = Sentry.captureRequestError;
