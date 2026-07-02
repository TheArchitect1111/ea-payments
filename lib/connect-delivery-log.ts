import { emitPulseEvent } from '@/lib/pulse-bus';

export type ConnectDeliveryChannel = 'email' | 'sms' | 'webhook' | 'staff';
export type ConnectDeliveryTrigger = 'capture' | 'nurture' | 'kit' | 'staff';
export type ConnectDeliveryProvider = 'resend' | 'twilio' | 'n8n' | 'resend-internal';
export type ConnectDeliveryOutcome = 'sent' | 'failed' | 'skipped';

export type ConnectDeliveryLogEntry = {
  at: string;
  channel: ConnectDeliveryChannel;
  outcome: ConnectDeliveryOutcome;
  provider: ConnectDeliveryProvider;
  trigger: ConnectDeliveryTrigger;
  orgSlug: string;
  relationshipId?: string;
  stepId?: string;
  recipient?: string;
  subject?: string;
  error?: string;
  providerRef?: string;
};

export type ConnectDeliveryStats = {
  email: { sent: number; failed: number; skipped: number };
  sms: { sent: number; failed: number; skipped: number };
  webhook: { sent: number; failed: number; skipped: number };
  staff: { sent: number; failed: number; skipped: number };
};

const HISTORY_CAP = 120;
const history: ConnectDeliveryLogEntry[] = [];

function emptyStats(): ConnectDeliveryStats {
  return {
    email: { sent: 0, failed: 0, skipped: 0 },
    sms: { sent: 0, failed: 0, skipped: 0 },
    webhook: { sent: 0, failed: 0, skipped: 0 },
    staff: { sent: 0, failed: 0, skipped: 0 },
  };
}

function bumpStats(stats: ConnectDeliveryStats, entry: ConnectDeliveryLogEntry) {
  const bucket = stats[entry.channel];
  if (entry.outcome === 'sent') bucket.sent += 1;
  else if (entry.outcome === 'failed') bucket.failed += 1;
  else bucket.skipped += 1;
}

function matchesOrg(entry: ConnectDeliveryLogEntry, orgSlug?: string): boolean {
  return !orgSlug || entry.orgSlug === orgSlug;
}

export function recordConnectDelivery(
  entry: Omit<ConnectDeliveryLogEntry, 'at'> & { at?: string },
): ConnectDeliveryLogEntry {
  const full: ConnectDeliveryLogEntry = {
    ...entry,
    at: entry.at ?? new Date().toISOString(),
  };
  history.unshift(full);
  if (history.length > HISTORY_CAP) history.length = HISTORY_CAP;
  void mirrorDeliveryToPulse(full);
  return full;
}

async function mirrorDeliveryToPulse(entry: ConnectDeliveryLogEntry): Promise<void> {
  await emitPulseEvent({
    product: 'simplifi',
    type: 'capture.completed',
    title: `Connect delivery: ${entry.channel} ${entry.outcome}`,
    detail: JSON.stringify({
      channel: entry.channel,
      outcome: entry.outcome,
      provider: entry.provider,
      trigger: entry.trigger,
      orgSlug: entry.orgSlug,
      relationshipId: entry.relationshipId,
      stepId: entry.stepId,
      recipient: entry.recipient,
      subject: entry.subject,
      error: entry.error,
      providerRef: entry.providerRef,
    }),
    priority: entry.outcome === 'failed' ? 'high' : 'low',
    tenantId: entry.orgSlug,
    objectId: entry.relationshipId,
    metadata: {
      channel: entry.channel,
      outcome: entry.outcome,
      provider: entry.provider,
    },
  });
}

function parseDeliveryDetail(detail: string, title: string, at: string): ConnectDeliveryLogEntry | null {
  try {
    const parsed = JSON.parse(detail) as Partial<ConnectDeliveryLogEntry>;
    if (!parsed.channel || !parsed.orgSlug) return null;
    const outcome =
      parsed.outcome ??
      (title.includes('failed') ? 'failed' : title.includes('skipped') ? 'skipped' : 'sent');
    return {
      at,
      channel: parsed.channel,
      outcome: outcome as ConnectDeliveryOutcome,
      provider: (parsed.provider ?? 'resend') as ConnectDeliveryProvider,
      trigger: (parsed.trigger ?? 'capture') as ConnectDeliveryTrigger,
      orgSlug: parsed.orgSlug,
      relationshipId: parsed.relationshipId,
      stepId: parsed.stepId,
      recipient: parsed.recipient,
      subject: parsed.subject,
      error: parsed.error,
      providerRef: parsed.providerRef,
    };
  } catch {
    return null;
  }
}

async function fetchDeliveriesFromPulse(limit = 40): Promise<ConnectDeliveryLogEntry[]> {
  const baseId = process.env.AIRTABLE_PAYMENTS_BASE_ID;
  const table = process.env.PULSE_EVENTS_TABLE;
  const key = process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT;
  if (!baseId || !table || !key) return [];

  const formula = encodeURIComponent(`FIND('Connect delivery:', {Title})`);
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
        return parseDeliveryDetail(detail, title, at);
      })
      .filter((entry): entry is ConnectDeliveryLogEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function mergeDeliveries(
  memory: ConnectDeliveryLogEntry[],
  persisted: ConnectDeliveryLogEntry[],
): ConnectDeliveryLogEntry[] {
  const byKey = new Map<string, ConnectDeliveryLogEntry>();
  for (const entry of [...memory, ...persisted]) {
    const key = `${entry.at}:${entry.channel}:${entry.orgSlug}:${entry.relationshipId ?? ''}:${entry.stepId ?? ''}:${entry.outcome}`;
    if (!byKey.has(key)) byKey.set(key, entry);
  }
  return [...byKey.values()].sort((a, b) => b.at.localeCompare(a.at));
}

export async function listConnectDeliveries(orgSlug?: string, limit = 25): Promise<ConnectDeliveryLogEntry[]> {
  const persisted = await fetchDeliveriesFromPulse(60);
  const merged = mergeDeliveries(history, persisted);
  return merged.filter((entry) => matchesOrg(entry, orgSlug)).slice(0, limit);
}

export async function getConnectDeliveryStatus(orgSlug?: string): Promise<{
  stats: ConnectDeliveryStats;
  recent: ConnectDeliveryLogEntry[];
  recentFailures: ConnectDeliveryLogEntry[];
  source: 'memory' | 'pulse' | 'merged';
}> {
  const persisted = await fetchDeliveriesFromPulse(80);
  const merged = mergeDeliveries(history, persisted);
  const scoped = merged.filter((entry) => matchesOrg(entry, orgSlug));
  const stats = emptyStats();

  for (const entry of scoped) {
    bumpStats(stats, entry);
  }

  const recentFailures = scoped.filter((entry) => entry.outcome === 'failed').slice(0, 10);
  const source = persisted.length && history.length ? 'merged' : persisted.length ? 'pulse' : 'memory';

  return {
    stats,
    recent: scoped.slice(0, 15),
    recentFailures,
    source,
  };
}

export async function logConnectChannelDelivery(input: {
  channel: ConnectDeliveryChannel;
  provider: ConnectDeliveryProvider;
  trigger: ConnectDeliveryTrigger;
  orgSlug: string;
  result: { ok: boolean; error?: string; providerRef?: string };
  relationshipId?: string;
  stepId?: string;
  recipient?: string;
  subject?: string;
  skipped?: boolean;
}): Promise<ConnectDeliveryLogEntry> {
  const outcome: ConnectDeliveryOutcome = input.skipped
    ? 'skipped'
    : input.result.ok
      ? 'sent'
      : 'failed';

  return recordConnectDelivery({
    channel: input.channel,
    outcome,
    provider: input.provider,
    trigger: input.trigger,
    orgSlug: input.orgSlug,
    relationshipId: input.relationshipId,
    stepId: input.stepId,
    recipient: input.recipient,
    subject: input.subject,
    error: input.result.ok ? undefined : input.result.error,
    providerRef: input.result.providerRef,
  });
}
