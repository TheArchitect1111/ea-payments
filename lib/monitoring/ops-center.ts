/**
 * Architecture stub for a future EA Operations Center.
 * Do not build dashboards here — only define the event shape monitoring can feed later.
 */

export type OpsCenterApplication =
  | 'ea-payments'
  | 'simplifi'
  | 'portal'
  | 'amplifi'
  | 'magnifi'
  | 'pulse'
  | 'shared-api'
  | 'ai-services';

export type OpsCenterHealthSlice = {
  application: OpsCenterApplication;
  environment: string;
  release?: string;
  errorCount24h?: number;
  affectedUsers?: number;
  criticalOpen?: number;
  lastDeployAt?: string;
  /** Future: payment / email / AI subsystem health */
  subsystems?: Partial<Record<'payments' | 'email' | 'ai' | 'webhooks', 'ok' | 'degraded' | 'down'>>;
};

/**
 * GlitchTip remains the system of record for events.
 * Mission Control / Launch Command Center already surface `monitoringConfigured()`.
 * A future Ops Center should query GlitchTip APIs + `/api/health/launch` — not a second store.
 */
export const OPS_CENTER_MONITORING_NOTES = [
  'Use GlitchTip project tags: application, ea.platform, ea.product, ea.scope',
  'Release = APP_RELEASE || APP_VERSION || VERCEL_GIT_COMMIT_SHA',
  'Environment = APP_ENV || VERCEL_ENV',
  'Do not duplicate events into Airtable for primary error storage',
] as const;
