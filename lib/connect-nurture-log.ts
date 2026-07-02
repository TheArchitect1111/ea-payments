import { emitPulseEvent } from '@/lib/pulse-bus';

export type ConnectNurtureTrigger = 'cron' | 'admin-verify' | 'admin-run';

export type ConnectNurtureRunLog = {
  at: string;
  processed: number;
  sent: number;
  skipped: number;
  errors: string[];
  trigger: ConnectNurtureTrigger;
};

const HISTORY_CAP = 20;
const history: ConnectNurtureRunLog[] = [];

const NURTURE_PULSE_TITLES: Record<ConnectNurtureTrigger, string> = {
  cron: 'Connect nurture cron',
  'admin-verify': 'Connect nurture verify',
  'admin-run': 'Connect nurture run',
};

export function recordConnectNurtureRun(
  result: Omit<ConnectNurtureRunLog, 'at'> & { at?: string },
): ConnectNurtureRunLog {
  const entry: ConnectNurtureRunLog = {
    ...result,
    at: result.at ?? new Date().toISOString(),
  };
  history.unshift(entry);
  if (history.length > HISTORY_CAP) history.length = HISTORY_CAP;
  return entry;
}

function parseNurtureRunDetail(detail: string, title: string, at: string): ConnectNurtureRunLog | null {
  try {
    const parsed = JSON.parse(detail) as Partial<ConnectNurtureRunLog>;
    if (typeof parsed.processed !== 'number' || typeof parsed.sent !== 'number') return null;
    const trigger =
      parsed.trigger ??
      (title.includes('verify') ? 'admin-verify' : title.includes('run') ? 'admin-run' : 'cron');
    return {
      at,
      processed: parsed.processed,
      sent: parsed.sent,
      skipped: parsed.skipped ?? 0,
      errors: Array.isArray(parsed.errors) ? parsed.errors.map(String) : [],
      trigger: trigger as ConnectNurtureTrigger,
    };
  } catch {
    return null;
  }
}

async function fetchNurtureRunsFromPulse(limit = 5): Promise<ConnectNurtureRunLog[]> {
  const baseId = process.env.AIRTABLE_PAYMENTS_BASE_ID;
  const table = process.env.PULSE_EVENTS_TABLE;
  const key = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT;
  if (!baseId || !table || !key) return [];

  const formula = encodeURIComponent(`FIND('Connect nurture', {Title})`);
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?filterByFormula=${formula}&maxRecords=${limit}&sort%5B0%5D%5Bfield%5D=${encodeURIComponent('Recorded At')}&sort%5B0%5D%5Bdirection%5D=desc`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!response.ok) return [];

    const data = (await response.json()) as {
      records?: Array<{ fields?: Record<string, unknown> }>;
    };

    return (data.records ?? [])
      .map((record) => {
        const title = String(record.fields?.Title ?? '');
        const detail = String(record.fields?.Detail ?? '');
        const at = String(record.fields?.['Recorded At'] ?? '');
        return parseNurtureRunDetail(detail, title, at);
      })
      .filter((run): run is ConnectNurtureRunLog => Boolean(run));
  } catch {
    return [];
  }
}

function mergeRuns(memory: ConnectNurtureRunLog[], persisted: ConnectNurtureRunLog[]): ConnectNurtureRunLog[] {
  const byKey = new Map<string, ConnectNurtureRunLog>();
  for (const run of [...memory, ...persisted]) {
    const key = `${run.at}:${run.trigger}:${run.sent}`;
    if (!byKey.has(key)) byKey.set(key, run);
  }
  return [...byKey.values()].sort((a, b) => b.at.localeCompare(a.at));
}

export async function getConnectNurtureRunStatus(): Promise<{
  lastRun: ConnectNurtureRunLog | null;
  recentRuns: ConnectNurtureRunLog[];
  source: 'memory' | 'pulse' | 'merged';
}> {
  const persisted = await fetchNurtureRunsFromPulse(10);
  const merged = mergeRuns(history, persisted);
  const source = persisted.length && history.length ? 'merged' : persisted.length ? 'pulse' : 'memory';

  return {
    lastRun: merged[0] ?? null,
    recentRuns: merged.slice(0, 5),
    source,
  };
}

export async function logConnectNurtureRun(
  result: { processed: number; sent: number; skipped: number; errors: string[] },
  trigger: ConnectNurtureTrigger,
  context?: { tenantId?: string; objectId?: string; note?: string },
): Promise<ConnectNurtureRunLog> {
  const run = recordConnectNurtureRun({ ...result, trigger });

  await emitPulseEvent({
    product: 'simplifi',
    type: 'capture.completed',
    title: NURTURE_PULSE_TITLES[trigger],
    detail: JSON.stringify({
      trigger,
      processed: result.processed,
      sent: result.sent,
      skipped: result.skipped,
      errors: result.errors,
      note: context?.note,
    }),
    priority: result.errors.length ? 'high' : result.sent ? 'low' : 'medium',
    tenantId: context?.tenantId ?? 'connect',
    objectId: context?.objectId,
    metadata: {
      processed: result.processed,
      sent: result.sent,
      skipped: result.skipped,
      errors: result.errors.length,
    },
  });

  return run;
}
