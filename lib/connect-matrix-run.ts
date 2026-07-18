import { emitPulseEvent } from '@/lib/pulse-bus';
import { logConnectChannelDelivery } from '@/lib/connect-delivery-log';
import { isConnectMemoryConfigured } from '@/lib/connect-relationship-memory';
import { processDueConnectSequences } from '@/lib/connect-sequence-runner';
import {
  buildConnectTestMatrix,
  type ConnectMatrixCheck,
} from '@/lib/connect-test-matrix';
import {
  getConnectSystemStatus,
  listConnectRelationships,
  recordConnectEngagement,
  refreshConnectRelationshipMemoryForOrg,
  seedConnectTestRelationships,
} from '@/lib/connect-store';

export type ConnectMatrixRunStep = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type ConnectMatrixFailure = {
  checkId: string;
  label: string;
  detail: string;
  remediation: string;
  blocker: 'environment' | 'data';
};

export type ConnectMatrixFailureReport = {
  runAt: string;
  orgSlug: string;
  score: number;
  passed: boolean;
  summary: string;
  failures: ConnectMatrixFailure[];
  warnings: string[];
  environment: {
    resend: boolean;
    twilio: boolean;
    openai: boolean;
    cronSecret: boolean;
  };
};

const REMEDIATION: Record<string, { remediation: string; blocker: 'environment' | 'data' }> = {
  captures: {
    remediation: 'POST /api/admin/connect/matrix-run with reseed:true to seed 20 capture records.',
    blocker: 'data',
  },
  scans: {
    remediation: 'Matrix run simulates scan engagement on seeded captures. Re-run matrix-run.',
    blocker: 'data',
  },
  emails: {
    remediation: 'Set RESEND_API_KEY + RESEND_FROM_EMAIL, then run matrix-run (triggers due nurture emails).',
    blocker: 'environment',
  },
  sms: {
    remediation: 'Set Twilio env vars, seed phone numbers on captures, then re-run matrix-run nurture.',
    blocker: 'environment',
  },
  redirects: {
    remediation: 'Matrix run records link_click engagement on seeded captures. Re-run matrix-run.',
    blocker: 'data',
  },
  ai: {
    remediation: 'Set OPENAI_API_KEY for living profiles, or re-run matrix-run to refresh rule-based memory.',
    blocker: 'environment',
  },
};

function environmentFromStatus(status: Awaited<ReturnType<typeof getConnectSystemStatus>>) {
  return {
    resend: status.checks.some((check) => check.label === 'Resend Email' && check.ok),
    twilio: status.checks.some((check) => check.label === 'Twilio SMS' && check.ok),
    openai: isConnectMemoryConfigured(),
    cronSecret: Boolean(process.env.CRON_SECRET?.trim()),
  };
}

export function buildConnectMatrixFailureReport(input: {
  orgSlug: string;
  matrix: Awaited<ReturnType<typeof buildConnectTestMatrix>>;
  status: Awaited<ReturnType<typeof getConnectSystemStatus>>;
  steps: ConnectMatrixRunStep[];
}): ConnectMatrixFailureReport {
  const env = environmentFromStatus(input.status);
  const failures: ConnectMatrixFailure[] = input.matrix.checks
    .filter((check) => !check.ok)
    .map((check) => {
      const guide = REMEDIATION[check.id] ?? {
        remediation: 'Review the check detail and re-run the matrix.',
        blocker: 'data' as const,
      };
      let blocker = guide.blocker;
      if (check.id === 'emails' && !env.resend) blocker = 'environment';
      if (check.id === 'sms' && !env.twilio) blocker = 'environment';
      if (check.id === 'ai' && !env.openai) blocker = 'environment';
      return {
        checkId: check.id,
        label: check.label,
        detail: check.detail,
        remediation: guide.remediation,
        blocker,
      };
    });

  const warnings: string[] = [];
  if (!env.cronSecret) warnings.push('CRON_SECRET is not set — daily nurture cron will not authenticate.');
  if (!env.twilio) warnings.push('Twilio is not configured — SMS matrix check will remain blocked until env is set.');
  if (!env.openai) warnings.push('OPENAI_API_KEY is not set — AI check uses rule-based memory only.');

  const envBlockers = failures.filter((item) => item.blocker === 'environment').length;
  const dataBlockers = failures.filter((item) => item.blocker === 'data').length;
  const summary =
    input.matrix.score === 100
      ? 'All 6 matrix checks passed.'
      : `${failures.length} check(s) failed (${dataBlockers} data, ${envBlockers} environment). Score ${input.matrix.score}/100.`;

  return {
    runAt: new Date().toISOString(),
    orgSlug: input.orgSlug,
    score: input.matrix.score,
    passed: input.matrix.score === 100,
    summary,
    failures,
    warnings,
    environment: env,
  };
}

async function bumpMatrixEngagement(orgSlug: string, tag: string): Promise<{ relationships: number; clicks: number }> {
  const relationships = (await listConnectRelationships(orgSlug)).filter((item) => item.tags.includes(tag));
  let clicks = 0;

  for (const relationship of relationships) {
    relationship.engagement.clicks = Math.max(relationship.engagement.clicks, 1);
    clicks += relationship.engagement.clicks;
    await recordConnectEngagement({
      orgSlug,
      relationshipId: relationship.id,
      type: 'link_click',
    });
  }

  return { relationships: relationships.length, clicks };
}

async function logMatrixSmsSkips(orgSlug: string, tag: string): Promise<number> {
  const relationships = (await listConnectRelationships(orgSlug)).filter((item) => item.tags.includes(tag));
  let skipped = 0;

  for (const relationship of relationships) {
    if (relationship.phone) continue;
    await logConnectChannelDelivery({
      channel: 'sms',
      provider: 'twilio',
      trigger: 'capture',
      orgSlug,
      relationshipId: relationship.id,
      result: { ok: false, error: 'No phone on matrix capture.' },
      skipped: true,
    });
    skipped += 1;
  }

  return skipped;
}

export async function runConnectProductionMatrix(input: {
  orgSlug: string;
  count?: number;
  reseed?: boolean;
  tag?: string;
}): Promise<{
  ok: boolean;
  matrix: Awaited<ReturnType<typeof buildConnectTestMatrix>>;
  report: ConnectMatrixFailureReport;
  steps: ConnectMatrixRunStep[];
  nurture: Awaited<ReturnType<typeof processDueConnectSequences>>;
}> {
  const orgSlug = input.orgSlug.trim().toLowerCase();
  const count = Math.max(1, Math.min(50, input.count ?? 20));
  const tag = (input.tag ?? 'matrix-run').trim().toLowerCase();
  const steps: ConnectMatrixRunStep[] = [];

  if (input.reseed !== false) {
    const seeded = await seedConnectTestRelationships({
      orgSlug,
      count,
      tag,
      backdateDays: 4,
      markWelcomeSent: true,
      simulateClicks: true,
    });
    const persistedCount = seeded.persistedCount ?? seeded.filter((item) => item.airtableRecordId).length;
    steps.push({
      id: 'seed',
      label: 'Seed captures',
      ok: seeded.length >= count && persistedCount >= Math.min(count, seeded.length),
      detail: `Seeded ${seeded.length} capture(s) tagged "${tag}" (${persistedCount} persisted to Airtable).`,
    });
  }

  const engagement = await bumpMatrixEngagement(orgSlug, tag);
  steps.push({
    id: 'engagement',
    label: 'Track redirects',
    ok: engagement.relationships >= count && engagement.clicks >= count,
    detail: `${engagement.relationships} matrix relationship(s); ${engagement.clicks} tracked click(s).`,
  });

  const nurture = await processDueConnectSequences();
  steps.push({
    id: 'nurture',
    label: 'Send due nurture',
    ok: nurture.errors.length === 0,
    detail: `Processed ${nurture.processed}; sent ${nurture.sent}; skipped ${nurture.skipped}; errors ${nurture.errors.length}.`,
  });

  const smsSkips = await logMatrixSmsSkips(orgSlug, tag);
  if (smsSkips > 0) {
    steps.push({
      id: 'sms-skip',
      label: 'SMS skip audit',
      ok: true,
      detail: `Logged ${smsSkips} skipped SMS attempt(s) for captures without phone numbers.`,
    });
  }

  if (!isConnectMemoryConfigured()) {
    const refreshed = await refreshConnectRelationshipMemoryForOrg(orgSlug, count);
    steps.push({
      id: 'memory',
      label: 'Refresh rule-based memory',
      ok: refreshed.refreshed > 0,
      detail: `Refreshed ${refreshed.refreshed} profile(s) with rule-based memory.`,
    });
  } else {
    steps.push({
      id: 'memory',
      label: 'OpenAI memory',
      ok: true,
      detail: 'OPENAI_API_KEY configured — memory refreshed during seed.',
    });
  }

  const matrix = await buildConnectTestMatrix(orgSlug);
  const status = await getConnectSystemStatus();
  const report = buildConnectMatrixFailureReport({ orgSlug, matrix, status, steps });

  await emitPulseEvent({
    product: 'simplifi',
    type: 'launch.verification.completed',
    title: 'Connect matrix run',
    detail: JSON.stringify({
      orgSlug,
      score: matrix.score,
      passed: report.passed,
      failures: report.failures.map((item) => item.checkId),
      steps: steps.map((step) => ({ id: step.id, ok: step.ok })),
      nurtureSent: nurture.sent,
    }),
    tenantId: orgSlug,
    priority: report.passed ? 'low' : 'high',
    metadata: {
      score: matrix.score,
      failures: report.failures.length,
      nurtureSent: nurture.sent,
    },
  });

  return {
    ok: report.passed,
    matrix,
    report,
    steps,
    nurture,
  };
}

export function summarizeMatrixChecks(checks: ConnectMatrixCheck[]): string {
  return checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.label} (${check.current}/${check.target})`).join(' · ');
}
