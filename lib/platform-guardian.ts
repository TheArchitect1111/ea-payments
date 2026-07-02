import type { AgentExecutionResult, AgentFinding } from '@/lib/agents/types';
import { getAdminNotificationEmail } from '@/lib/integration-env';
import { sendEmail } from '@ea/portal-chassis/email';
import { buildPlatformOpsReport, type PlatformOpsReport } from '@/lib/platform-ops';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export type PlatformGuardianReport = {
  generatedAt: string;
  ok: boolean;
  opsScore: number;
  executiveSummary: string;
  risks: AgentFinding[];
  recommendations: string[];
  ops: PlatformOpsReport;
  emailSent: boolean;
};

function finding(title: string, detail: string): AgentFinding {
  return { title, detail };
}

function scoreFromOps(ops: PlatformOpsReport): number {
  let score = ops.readinessScore;
  if (ops.launchBlockers > 0) score = Math.min(score, 40);
  if (!ops.monitoring.sentryConfigured) score -= 8;
  if (!ops.monitoring.uptimeDashboardConfigured) score -= 8;
  if (!ops.monitoring.backupDestinationConfigured) score -= 10;
  if (ops.monitoring.backupDestinationReachable === false) score -= 12;
  if (ops.monitoring.productionSecretIssues.length > 0) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function buildGuardianAnalysis(ops: PlatformOpsReport): Pick<
  PlatformGuardianReport,
  'ok' | 'opsScore' | 'executiveSummary' | 'risks' | 'recommendations'
> {
  const risks: AgentFinding[] = [];
  const recommendations: string[] = [];

  if (ops.launchBlockers > 0) {
    risks.push(
      finding(
        'Launch blockers active',
        `${ops.launchBlockers} revenue/delivery blocker(s). Status: ${ops.launchStatus}.`,
      ),
    );
    recommendations.push(ops.recommendedNextAction);
  }

  if (!ops.monitoring.sentryConfigured) {
    risks.push(finding('Sentry not configured', 'NEXT_PUBLIC_SENTRY_DSN is unset — errors are not tracked.'));
    recommendations.push('Set NEXT_PUBLIC_SENTRY_DSN on Vercel Production (docs/sentry-setup.md).');
  }

  if (!ops.monitoring.uptimeDashboardConfigured) {
    risks.push(finding('Uptime monitoring not linked', 'No UPTIME_KUMA_DASHBOARD_URL configured.'));
    recommendations.push('Deploy Uptime Kuma monitors and set UPTIME_KUMA_DASHBOARD_URL.');
  }

  if (!ops.monitoring.backupDestinationConfigured) {
    risks.push(finding('Backup destination missing', 'BACKUP_DESTINATION_URI is not set.'));
    recommendations.push('Document backup destination in BACKUP_DESTINATION_URI and run npm run backup:verify.');
  } else if (ops.monitoring.backupDestinationReachable === false) {
    risks.push(finding('Backup destination unreachable', 'BACKUP_DESTINATION_URI failed connectivity check.'));
    recommendations.push('Fix backup destination URI or storage permissions; re-run npm run backup:verify.');
  }

  for (const issue of ops.monitoring.productionSecretIssues) {
    risks.push(finding(`Production secret missing: ${issue}`, 'Required secret not set in production deploy.'));
  }

  for (const subsystem of ops.subsystems) {
    if (subsystem.status === 'critical') {
      risks.push(finding(`${subsystem.name} critical`, subsystem.message));
    }
  }

  const opsScore = scoreFromOps(ops);
  const ok = ops.ok && risks.filter((r) => r.title.includes('critical') || r.title.includes('blocker')).length === 0;

  const executiveSummary = [
    `Platform Guardian audit — ${ops.platformUrl}`,
    `Launch status: ${ops.launchStatus} (${ops.readinessScore}/100 readiness, ops score ${opsScore}/100).`,
    risks.length
      ? `${risks.length} risk(s) detected. Top action: ${recommendations[0] ?? ops.recommendedNextAction}.`
      : 'No critical risks detected. Monitoring and resilience checks passed.',
  ].join(' ');

  if (!recommendations.length && ops.recommendedNextAction) {
    recommendations.push(ops.recommendedNextAction);
  }

  return {
    ok,
    opsScore,
    executiveSummary,
    risks: risks.slice(0, 12),
    recommendations: Array.from(new Set(recommendations)).slice(0, 8),
  };
}

export async function runPlatformGuardianAudit(options?: {
  probeRoutes?: boolean;
  sendDailyBrief?: boolean;
}): Promise<PlatformGuardianReport> {
  const ops = await buildPlatformOpsReport({
    probeRoutes: options?.probeRoutes ?? process.env.PLATFORM_GUARDIAN_PROBE_ROUTES === 'true',
    verifyBackup: true,
  });

  const analysis = buildGuardianAnalysis(ops);
  let emailSent = false;

  if (options?.sendDailyBrief && process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim()) {
    const to = process.env.PLATFORM_GUARDIAN_EMAIL?.trim() || getAdminNotificationEmail();
    const subject = analysis.ok
      ? `EA Platform Guardian — all clear (${analysis.opsScore}/100)`
      : `EA Platform Guardian — ${analysis.risks.length} risk(s) (${analysis.opsScore}/100)`;

    const riskLines = analysis.risks.length
      ? analysis.risks.map((r) => `<li><strong>${r.title}</strong> — ${r.detail}</li>`).join('')
      : '<li>No critical risks detected.</li>';

    const recLines = analysis.recommendations.map((r) => `<li>${r}</li>`).join('');

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.5">
<h2>Platform Guardian™ Daily Brief</h2>
<p>${analysis.executiveSummary}</p>
<h3>Risks</h3><ul>${riskLines}</ul>
<h3>Recommendations</h3><ul>${recLines}</ul>
<p><a href="${EA_PLATFORM_URL}/api/health/ops">Ops health</a> · 
<a href="${EA_PLATFORM_URL}/launch">Launch Command Center</a></p>
</body></html>`;

    try {
      await sendEmail({ to, subject, html });
      emailSent = true;
    } catch {
      emailSent = false;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    ...analysis,
    ops,
    emailSent,
  };
}

export function guardianResultToAgentExecution(report: PlatformGuardianReport): AgentExecutionResult {
  return {
    agent: 'platform-guardian',
    summary: report.executiveSummary,
    keyFindings: report.risks.slice(0, 6),
    opportunities: report.ok
      ? [finding('Platform stable', 'Revenue and delivery paths are green for controlled launch.')]
      : [],
    risks: report.risks,
    recommendedNextSteps: report.recommendations,
    confidence: report.ok ? 0.92 : 0.75,
    sources: [report.ops.links.ops, report.ops.links.commandCenter],
    raw: report,
  };
}
