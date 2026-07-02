import { getConnectDeliveryStatus } from '@/lib/connect-delivery-log';
import { buildConnectMatrixFailureReport } from '@/lib/connect-matrix-run';
import { getConnectNurtureRunStatus } from '@/lib/connect-nurture-log';
import { previewDueConnectSequences } from '@/lib/connect-sequence-runner';
import { buildConnectTestMatrix } from '@/lib/connect-test-matrix';
import { listConnectFollowUpTasks } from '@/lib/connect-tasks';
import { getConnectSystemStatus } from '@/lib/connect-store';

export type ConnectLaunchChecklistItem = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
  action?: string;
  priority: 'critical' | 'high' | 'medium';
};

export type ConnectLaunchReadiness = {
  productScore: number;
  launchScore: number;
  matrixScore: number;
  ready: boolean;
  summary: string;
  checklist: ConnectLaunchChecklistItem[];
  env: {
    resend: boolean;
    twilio: boolean;
    openai: boolean;
    cronSecret: boolean;
    n8n: boolean;
    tenantStorage: boolean;
  };
  matrixReport: ReturnType<typeof buildConnectMatrixFailureReport>;
  actions: string[];
};

const SHIPPED_PHASES = [
  'Auto-provision on Implementation Package checkout',
  'Event QR persistence + portal kit',
  'Nurture cron + admin run + delivery logging',
  'Owner copy edit + QR export packs',
  'Admin tenant CRUD + ops panel',
  'OpenAI relationship memory',
  'Staff follow-up task board',
  'Production matrix run + failure report',
];

export async function buildConnectLaunchReadiness(orgSlug = 'demo-client'): Promise<ConnectLaunchReadiness> {
  const status = await getConnectSystemStatus();
  const matrix = await buildConnectTestMatrix(orgSlug);
  const matrixReport = buildConnectMatrixFailureReport({ orgSlug, matrix, status, steps: [] });
  const nurture = await previewDueConnectSequences();
  const delivery = await getConnectDeliveryStatus(orgSlug);
  const tasks = await listConnectFollowUpTasks(orgSlug);
  const runs = await getConnectNurtureRunStatus();

  const env = {
    resend: status.checks.some((check) => check.label === 'Resend Email' && check.ok),
    twilio: status.checks.some((check) => check.label === 'Twilio SMS' && check.ok),
    openai: status.checks.some((check) => check.label === 'OpenAI Memory' && check.ok),
    cronSecret: Boolean(process.env.CRON_SECRET?.trim()),
    n8n: status.checks.some((check) => check.label === 'Automation Webhook' && check.ok),
    tenantStorage: status.checks.some((check) => check.label === 'Tenant Storage' && check.ok),
  };

  const checklist: ConnectLaunchChecklistItem[] = [
    {
      id: 'platform',
      label: 'Connect platform shipped (phases 1–12)',
      ok: true,
      detail: SHIPPED_PHASES.join(' · '),
      priority: 'medium',
    },
    {
      id: 'tenant-storage',
      label: 'Tenant storage reachable',
      ok: env.tenantStorage,
      detail: status.checks.find((check) => check.label === 'Tenant Storage')?.detail ?? 'Unknown',
      action: 'Verify Airtable Connect Tenants table and API key.',
      priority: 'critical',
    },
    {
      id: 'resend',
      label: 'Email delivery configured',
      ok: env.resend,
      detail: env.resend ? 'Resend is configured for welcome + nurture emails.' : 'Missing RESEND_API_KEY or RESEND_FROM_EMAIL.',
      action: 'Set Resend env vars in Vercel Production.',
      priority: 'critical',
    },
    {
      id: 'cron',
      label: 'Daily nurture cron authenticated',
      ok: env.cronSecret,
      detail: env.cronSecret ? 'CRON_SECRET is set.' : 'Daily /api/cron/connect-sequence will return 401.',
      action: 'Set CRON_SECRET in Vercel Production.',
      priority: 'critical',
    },
    {
      id: 'matrix',
      label: 'Production matrix verified',
      ok: matrix.score >= 67,
      detail: `Matrix score ${matrix.score}/100 for ${orgSlug}.`,
      action: 'POST /api/admin/connect/matrix-run from admin Ops.',
      priority: 'critical',
    },
    {
      id: 'nurture-clear',
      label: 'No due nurture backlog',
      ok: nurture.dueSteps === 0,
      detail: nurture.dueSteps ? `${nurture.dueSteps} due step(s) waiting.` : 'All nurture steps current.',
      action: 'POST /api/admin/connect/run-nurture',
      priority: 'high',
    },
    {
      id: 'delivery',
      label: 'No recent delivery failures',
      ok: delivery.recentFailures.length === 0,
      detail: delivery.recentFailures.length
        ? `${delivery.recentFailures.length} recent failure(s).`
        : `${delivery.stats.email.sent} email(s) logged; ${delivery.stats.sms.sent} SMS logged.`,
      action: 'GET /api/admin/connect/delivery-log',
      priority: 'high',
    },
    {
      id: 'tasks',
      label: 'Follow-up task queue clear',
      ok: tasks.stats.immediate === 0,
      detail: `${tasks.stats.open} open task(s); ${tasks.stats.immediate} immediate.`,
      action: 'Complete tasks in portal Connect or POST /api/admin/connect/tasks.',
      priority: 'medium',
    },
    {
      id: 'twilio',
      label: 'SMS channel (optional for 100 score)',
      ok: env.twilio,
      detail: env.twilio ? 'Twilio configured.' : 'SMS matrix check blocked until Twilio env is set.',
      action: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.',
      priority: 'medium',
    },
    {
      id: 'openai',
      label: 'Living AI memory (optional for 100 score)',
      ok: env.openai,
      detail: env.openai ? 'OPENAI_API_KEY configured.' : 'Rule-based memory only until OpenAI is set.',
      action: 'Set OPENAI_API_KEY in Vercel Production.',
      priority: 'medium',
    },
    {
      id: 'n8n',
      label: 'Automation webhook (optional)',
      ok: env.n8n,
      detail: env.n8n ? 'n8n webhook configured.' : 'Automation webhook not set.',
      action: 'Set CONNECT_N8N_WEBHOOK_URL or N8N_WEBHOOK_URL.',
      priority: 'medium',
    },
    {
      id: 'nurture-ran',
      label: 'Nurture has run at least once',
      ok: Boolean(runs.lastRun),
      detail: runs.lastRun
        ? `Last run sent ${runs.lastRun.sent} step(s) via ${runs.lastRun.trigger}.`
        : 'No nurture run logged yet.',
      action: 'POST /api/admin/connect/run-nurture',
      priority: 'high',
    },
  ];

  const criticalOpen = checklist.filter((item) => item.priority === 'critical' && !item.ok);
  const productScore = Math.round(
    (checklist.filter((item) => item.ok).length / checklist.length) * 55 +
      (matrix.score / 100) * 25 +
      (status.score / 100) * 20,
  );
  const launchScore = Math.min(
    100,
    Math.round(productScore + (criticalOpen.length === 0 ? 10 : 0) + (matrix.score === 100 ? 5 : 0)),
  );
  const ready = criticalOpen.length === 0 && matrix.score >= 67 && nurture.dueSteps === 0;

  const actions: string[] = [];
  for (const item of checklist.filter((check) => !check.ok && check.action)) {
    actions.push(`${item.label}: ${item.action}`);
  }
  if (matrix.score < 100) {
    actions.unshift(`Run full matrix — ${matrixReport.summary}`);
  }

  const summary = ready
    ? `Connect is launch-ready for ${orgSlug} (${launchScore}/100).`
    : `${criticalOpen.length} critical item(s) remain. Launch score ${launchScore}/100.`;

  return {
    productScore,
    launchScore,
    matrixScore: matrix.score,
    ready,
    summary,
    checklist,
    env,
    matrixReport,
    actions,
  };
}
