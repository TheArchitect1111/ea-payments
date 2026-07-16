import type { BrowserOptions, User } from '@sentry/nextjs';
import {
  resolveAppEnvironment,
  resolveAppRelease,
  resolveApplicationName,
  resolveMonitoringDsn,
} from './dsn';
import { scrubMonitoringEvent } from './scrub';

/**
 * Shared init options for @sentry/nextjs pointed at GlitchTip (or legacy Sentry).
 * Safe when DSN is missing — `enabled: false`.
 */
export function getMonitoringOptions(): BrowserOptions {
  const dsn = resolveMonitoringDsn();
  const environment = resolveAppEnvironment();
  const release = resolveAppRelease();
  const application = resolveApplicationName();

  return {
    dsn,
    enabled: Boolean(dsn),
    environment,
    release,
    tracesSampleRate: environment === 'production' || environment === 'prod' ? 0.1 : 1.0,
    // GlitchTip groups by fingerprint; keep defaults and avoid flooding.
    sampleRate: 1.0,
    sendDefaultPii: false,
    initialScope: {
      tags: {
        application,
        'ea.platform': 'efficiency-architects',
        'ea.product': application,
      },
    },
    beforeSend(event) {
      try {
        return scrubMonitoringEvent(event);
      } catch {
        return event;
      }
    },
  };
}

/** @deprecated Use getMonitoringOptions */
export function getSentryOptions(): BrowserOptions {
  return getMonitoringOptions();
}

export type MonitoringUserContext = {
  id?: string;
  email?: string;
  username?: string;
  organizationId?: string;
  organizationSlug?: string;
  role?: string;
};

/** Attach safe user/org context — never passwords or payment data. */
export function toSentryUser(input: MonitoringUserContext): User {
  return {
    id: input.id,
    email: input.email,
    username: input.username,
    ...(input.organizationId || input.organizationSlug || input.role
      ? {
          data: {
            organizationId: input.organizationId,
            organizationSlug: input.organizationSlug,
            role: input.role,
          },
        }
      : {}),
  };
}
