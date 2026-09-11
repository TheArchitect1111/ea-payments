import { runRecoveryOrchestrator } from './orchestrator';
import type { RecoveryOutcome, RecoverySignal } from './types';

export type RecoveryMonitorTarget = {
  target: string;
  url: string;
  route?: string;
  expectText?: string;
};

const DEFAULT_TARGETS: RecoveryMonitorTarget[] = [
  { target: 'EA Shared Platform', url: 'https://efficiencyarchitects.online/' },
  { target: 'Amplifi', url: 'https://efficiencyarchitects.online/amplifi', expectText: 'Focus on your craft' },
  { target: 'Amanda Catherine', url: 'https://amandacatherine.ca/' },
  { target: 'Amanda Catherine', url: 'https://efficiencyarchitects.online/portal/amanda-catherine', route: '/portal/amanda-catherine' },
  { target: 'Canadian Prospect Recruitment', url: 'https://canadianprospectrecruitment.vercel.app/' },
];

function configuredTargets(): RecoveryMonitorTarget[] {
  const raw = process.env.EA_RECOVERY_MONITOR_TARGETS_JSON?.trim();
  if (!raw) return DEFAULT_TARGETS;
  try {
    const parsed = JSON.parse(raw) as RecoveryMonitorTarget[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TARGETS;
  } catch {
    return DEFAULT_TARGETS;
  }
}

export async function probeRecoveryTarget(target: RecoveryMonitorTarget): Promise<RecoverySignal | null> {
  try {
    const res = await fetch(target.url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
      headers: { 'user-agent': 'EA-Recovery-Monitor/2' },
    });
    const body = target.expectText ? await res.text() : '';
    if (!res.ok) {
      return {
        target: target.target,
        failureClass: 'route_unhealthy',
        source: 'monitoring',
        summary: `Synthetic monitor received HTTP ${res.status} for ${target.url}.`,
        route: target.route ?? new URL(target.url).pathname,
        observedValue: String(res.status),
        expectedValue: '2xx',
        metadata: { monitor: 'vercel-cron', url: target.url },
      };
    }
    if (target.expectText && !body.includes(target.expectText)) {
      return {
        target: target.target,
        failureClass: 'configuration_drift',
        source: 'synthetic',
        summary: `Expected approved marker was not present at ${target.url}.`,
        route: target.route ?? new URL(target.url).pathname,
        observedValue: 'marker-missing',
        expectedValue: target.expectText,
        metadata: { monitor: 'vercel-cron', url: target.url },
      };
    }
    return null;
  } catch (error) {
    return {
      target: target.target,
      failureClass: 'route_unhealthy',
      source: 'monitoring',
      summary: `Synthetic monitor could not reach ${target.url}: ${error instanceof Error ? error.message : 'network error'}.`,
      route: target.route ?? new URL(target.url).pathname,
      observedValue: 'unreachable',
      expectedValue: 'reachable-2xx',
      metadata: { monitor: 'vercel-cron', url: target.url },
    };
  }
}

export async function runRecoveryMonitoringCycle(): Promise<{
  ok: boolean;
  checked: number;
  failures: number;
  outcomes: RecoveryOutcome[];
}> {
  const targets = configuredTargets();
  const signals = (await Promise.all(targets.map(probeRecoveryTarget))).filter((signal): signal is RecoverySignal => Boolean(signal));
  const outcomes: RecoveryOutcome[] = [];
  for (const signal of signals) {
    outcomes.push(await runRecoveryOrchestrator({ signal, mode: 'dry_run' }));
  }
  return { ok: signals.length === 0, checked: targets.length, failures: signals.length, outcomes };
}

export function recoveryMonitoringStatus() {
  return {
    installed: true,
    cadence: '5 minutes',
    configuredTargets: configuredTargets().length,
    errorMonitoringConfigured: Boolean(
      process.env.NEXT_PUBLIC_GLITCHTIP_DSN?.trim() || process.env.GLITCHTIP_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || process.env.SENTRY_DSN?.trim(),
    ),
    uptimeDashboardConfigured: Boolean(process.env.UPTIME_KUMA_DASHBOARD_URL?.trim() || process.env.UPTIME_MONITORING_URL?.trim()),
    mode: 'detect-and-dry-run-recovery',
  };
}
