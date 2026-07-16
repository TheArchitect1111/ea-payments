import { listAgents } from '@/lib/agents/registry';
import type { AgentHealth } from '@/lib/agents/types';
import { productionSecretIssues } from '@/lib/integration-env';
import { buildLaunchCommandCenterReport, type LaunchCommandCenterReport } from '@/lib/launch-command-center';
import { monitoringConfigured } from '@/lib/monitoring';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export type OpsSubsystemStatus = 'healthy' | 'degraded' | 'critical' | 'unknown' | 'not_configured';

export type PlatformOpsSubsystem = {
  id: string;
  name: string;
  status: OpsSubsystemStatus;
  message: string;
};

export type PlatformOpsReport = {
  generatedAt: string;
  ok: boolean;
  platformUrl: string;
  launchStatus: string;
  readinessScore: number;
  launchBlockers: number;
  recommendedNextAction: string;
  subsystems: PlatformOpsSubsystem[];
  agents: AgentHealth[];
  monitoring: {
    sentryConfigured: boolean;
    glitchtipConfigured?: boolean;
    uptimeDashboardConfigured: boolean;
    backupDestinationConfigured: boolean;
    backupDestinationReachable: boolean | null;
    productionSecretIssues: string[];
  };
  links: {
    ops: string;
    commandCenter: string;
    healthLaunch: string;
    missionControl: string;
  };
};

const CRITICAL_ROUTE_PATHS = [
  '/api/health/launch',
  '/api/health/command-center',
  '/start',
  '/checkout',
] as const;

async function probeRoute(path: string): Promise<{ ok: boolean; status: number }> {
  const base = EA_PLATFORM_URL.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function verifyBackupDestination(): Promise<{
  configured: boolean;
  reachable: boolean | null;
  message: string;
}> {
  const uri = process.env.BACKUP_DESTINATION_URI?.trim();
  if (!uri) {
    return {
      configured: false,
      reachable: null,
      message: 'BACKUP_DESTINATION_URI is not set.',
    };
  }

  if (!/^https?:\/\//i.test(uri)) {
    return {
      configured: true,
      reachable: null,
      message: 'BACKUP_DESTINATION_URI is set (non-HTTP scheme — manual verification required).',
    };
  }

  try {
    const res = await fetch(uri, { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
    if (res.ok || res.status === 405 || res.status === 403) {
      return {
        configured: true,
        reachable: true,
        message: `Backup destination responded HTTP ${res.status}.`,
      };
    }
    return {
      configured: true,
      reachable: false,
      message: `Backup destination returned HTTP ${res.status}.`,
    };
  } catch (err) {
    return {
      configured: true,
      reachable: false,
      message: `Backup destination unreachable: ${err instanceof Error ? err.message : 'network error'}.`,
    };
  }
}

function subsystemFromLaunch(report: LaunchCommandCenterReport): PlatformOpsSubsystem[] {
  const items: PlatformOpsSubsystem[] = [
    {
      id: 'revenue',
      name: 'Revenue',
      status: report.readiness.revenueReady ? 'healthy' : 'critical',
      message: report.readiness.revenueReady
        ? 'Stripe, Airtable, and Resend revenue path ready.'
        : `Missing: ${report.readiness.missing.revenue.missing.join(', ') || 'revenue checks'}`,
    },
    {
      id: 'delivery',
      name: 'Delivery',
      status: report.readiness.deliveryReady ? 'healthy' : 'critical',
      message: report.readiness.deliveryReady
        ? 'Onboarding webhooks and Airtable schemas ready.'
        : `Missing: ${report.readiness.missing.delivery.missing.join(', ') || 'delivery checks'}`,
    },
    {
      id: 'monitoring',
      name: 'Monitoring',
      status: report.readiness.monitoringReady ? 'healthy' : 'degraded',
      message: report.readiness.monitoringReady
        ? 'Sentry and uptime dashboard configured.'
        : `Missing: ${report.readiness.missing.monitoring.missing.join(', ') || 'monitoring checks'}`,
    },
    {
      id: 'resilience',
      name: 'Resilience',
      status: report.readiness.resilienceReady ? 'healthy' : 'degraded',
      message: report.readiness.resilienceReady
        ? 'Backup destination configured.'
        : `Missing: ${report.readiness.missing.resilience.missing.join(', ') || 'BACKUP_DESTINATION_URI'}`,
    },
  ];

  return items;
}

export async function buildPlatformOpsReport(options?: {
  probeRoutes?: boolean;
  verifyBackup?: boolean;
}): Promise<PlatformOpsReport> {
  const probeRoutes = options?.probeRoutes ?? process.env.PLATFORM_OPS_PROBE_ROUTES === 'true';
  const verifyBackup = options?.verifyBackup ?? true;

  const [launchReport, backup, agentHealth] = await Promise.all([
    buildLaunchCommandCenterReport(),
    verifyBackup ? verifyBackupDestination() : Promise.resolve(null),
    Promise.all(listAgents().map((agent) => agent.health())),
  ]);

  const secretIssues = productionSecretIssues();
  const subsystems = subsystemFromLaunch(launchReport);

  if (probeRoutes) {
    const routeResults = await Promise.all(
      CRITICAL_ROUTE_PATHS.map(async (path) => {
        const result = await probeRoute(path);
        return { path, ...result };
      }),
    );
    const failed = routeResults.filter((r) => !r.ok);
    subsystems.push({
      id: 'routes',
      name: 'Critical routes',
      status: failed.length === 0 ? 'healthy' : failed.some((f) => f.status === 0) ? 'critical' : 'degraded',
      message:
        failed.length === 0
          ? `All ${routeResults.length} critical routes responded OK.`
          : `Failed: ${failed.map((f) => `${f.path} (${f.status || 'timeout'})`).join(', ')}`,
    });
  }

  const platformUrl = EA_PLATFORM_URL.replace(/\/$/, '');
  const monitoringDegraded =
    !launchReport.readiness.monitoringReady || !launchReport.readiness.resilienceReady || secretIssues.length > 0;

  const ok =
    launchReport.launchBlockers === 0 &&
    !monitoringDegraded &&
    (backup?.reachable !== false);

  return {
    generatedAt: new Date().toISOString(),
    ok,
    platformUrl,
    launchStatus: launchReport.status,
    readinessScore: launchReport.readinessScore,
    launchBlockers: launchReport.launchBlockers,
    recommendedNextAction: launchReport.recommendedNextAction,
    subsystems,
    agents: agentHealth,
    monitoring: {
      sentryConfigured: monitoringConfigured(),
      glitchtipConfigured: monitoringConfigured(),
      uptimeDashboardConfigured: Boolean(
        process.env.UPTIME_KUMA_DASHBOARD_URL?.trim() || process.env.UPTIME_MONITORING_URL?.trim(),
      ),
      backupDestinationConfigured: backup?.configured ?? Boolean(process.env.BACKUP_DESTINATION_URI?.trim()),
      backupDestinationReachable: backup?.reachable ?? null,
      productionSecretIssues: secretIssues,
    },
    links: {
      ops: `${platformUrl}/api/health/ops`,
      commandCenter: `${platformUrl}/api/health/command-center`,
      healthLaunch: `${platformUrl}/api/health/launch`,
      missionControl: `${platformUrl}/api/mission-control`,
    },
  };
}
