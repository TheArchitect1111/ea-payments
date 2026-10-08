import { get, put } from '@vercel/blob';
import { randomBytes } from 'node:crypto';

export const BLUEPRINT_ORIGIN = 'https://app.efficiencyarchitects.online';

export type BlueprintVaultFile = {
  name: string;
  type: string;
  size: number;
  blobPath: string;
  uploadedAt: string;
};

export type BlueprintRecord = {
  schemaVersion: 1;
  clientId: string;
  /** Trusted server-assigned tenant binding; absent means inaccessible until claimed. */
  ownerOrgId?: string;
  ownerPortalSlug?: string;
  alias?: string;
  policy: Record<string, any>;
  summary: Record<string, any>;
  contact: {
    choice: string;
    value: string;
  };
  vaultFiles: BlueprintVaultFile[];
  delivery?: {
    channel: 'email' | 'sms' | 'conversation' | 'none';
    status: 'sent' | 'skipped' | 'failed';
    detail?: string;
  };
  createdAt: string;
  updatedAt: string;
};

const RECORD_PREFIX = 'ea-blueprints/records';
const ALIAS_PREFIX = 'ea-blueprints/aliases';

export function safeBlueprintKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96);
}

function recordPath(clientId: string) {
  return `${RECORD_PREFIX}/${safeBlueprintKey(clientId)}.json`;
}

function aliasPath(alias: string) {
  return `${ALIAS_PREFIX}/${safeBlueprintKey(alias)}.json`;
}

async function readJson<T>(path: string): Promise<T | null> {
  const result = await get(path, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200) return null;
  try {
    return JSON.parse(await new Response(result.stream).text()) as T;
  } catch {
    return null;
  }
}

async function writeJson(path: string, value: unknown) {
  await put(path, Buffer.from(JSON.stringify(value), 'utf8'), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

function makeClientId(policy: Record<string, any>) {
  const type = safeBlueprintKey(String(policy.clientType || 'client')) || 'client';
  return `${type}-${randomBytes(8).toString('base64url').toLowerCase()}`;
}

export function blueprintUrl(clientId: string) {
  return `${BLUEPRINT_ORIGIN}/blueprint/${encodeURIComponent(clientId)}`;
}

export function recalculateCapacity(policy: Record<string, any>, patch: Record<string, unknown>) {
  const current = policy.capacity || {};
  const assumptions = { ...(current.assumptions || {}) };
  const keys = ['averageVolume', 'frequencyPerMonth', 'timeHours', 'peopleCount', 'loadedCost', 'recoveryPercent'] as const;
  for (const key of keys) {
    if (!(key in patch)) continue;
    const raw = patch[key];
    if (raw === null || raw === '') assumptions[key] = null;
    else {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid ${key}`);
      assumptions[key] = n;
    }
  }
  const eventMode = current.unit === 'event';
  const time = Number(assumptions.timeHours);
  const people = Number(assumptions.peopleCount);
  const frequency = eventMode ? 1 : Number(assumptions.frequencyPerMonth);
  const cost = Number(assumptions.loadedCost);
  const recovery = Number(assumptions.recoveryPercent);

  const complete = [time, people, frequency, cost, recovery].every(Number.isFinite);
  const hours = complete ? Math.round(time * people * frequency * 10) / 10 : null;
  const value = hours === null ? null : Math.round(hours * cost * recovery) / 100;

  return {
    ...policy,
    capacity: {
      ...current,
      hours,
      value,
      assumptions,
    },
  };
}

export async function createBlueprintRecord(input: {
  policy: Record<string, any>;
  summary?: Record<string, any>;
  contactChoice?: string;
  contactValue?: string;
  alias?: string;
  owner?: { orgId: string; portalSlug: string };
}) {
  const clientId = makeClientId(input.policy);
  const url = blueprintUrl(clientId);
  const incomingSummary = input.summary || {};
  const text = String(incomingSummary.text || '')
    .replace(/https:\/\/cc\.efficiencyarchitects\.online\/blueprint\/preview/g, url)
    .replace(/https:\/\/cc\.efficiencyarchitects\.online\/blueprint\/[A-Za-z0-9._-]+/g, url);
  const now = new Date().toISOString();
  if (input.owner && (!input.owner.orgId || input.owner.orgId.startsWith('org_') || !input.owner.portalSlug)) throw new Error('Invalid blueprint owner.');
  const alias = input.owner && input.alias === input.owner.portalSlug ? safeBlueprintKey(input.alias) : undefined;
  const record: BlueprintRecord = {
    schemaVersion: 1,
    clientId,
    ...(input.owner ? { ownerOrgId: input.owner.orgId, ownerPortalSlug: input.owner.portalSlug } : {}),
    ...(alias ? { alias } : {}),
    policy: input.policy,
    summary: { ...incomingSummary, link: url, text },
    contact: {
      choice: String(input.contactChoice || ''),
      value: String(input.contactValue || ''),
    },
    vaultFiles: [],
    createdAt: now,
    updatedAt: now,
  };
  await writeJson(recordPath(clientId), record);
  if (alias && input.owner) await bindBlueprintAlias(alias, clientId, input.owner);
  return record;
}

export async function getBlueprintRecord(clientId: string) {
  const key = safeBlueprintKey(clientId);
  if (!key) return null;
  return readJson<BlueprintRecord>(recordPath(key));
}

export async function saveBlueprintRecord(record: BlueprintRecord) {
  record.updatedAt = new Date().toISOString();
  await writeJson(recordPath(record.clientId), record);
  return record;
}

/** Server-owned immutable tenant pointer. Rebinding requires a separately reviewed migration. */
export async function bindBlueprintAlias(
  alias: string,
  clientId: string,
  owner: { orgId: string; portalSlug: string },
) {
  const safeAlias = safeBlueprintKey(alias);
  const safeId = safeBlueprintKey(clientId);
  if (!safeAlias || !safeId || safeAlias !== owner.portalSlug || !owner.orgId || owner.orgId.startsWith('org_')) {
    throw new Error('Invalid or untrusted blueprint alias.');
  }
  const record = await getBlueprintRecord(safeId);
  if (!record || record.ownerOrgId !== owner.orgId || record.ownerPortalSlug !== owner.portalSlug) {
    throw new Error('Blueprint alias owner mismatch.');
  }
  const existing = await readJson<{ clientId?: string; ownerOrgId?: string }>(aliasPath(safeAlias));
  if (existing) {
    if (existing.clientId === safeId && existing.ownerOrgId === owner.orgId) return;
    throw new Error('Blueprint alias is immutable; reassignment denied.');
  }
  // Provider rejects a competing create, even if another request races this read.
  await put(aliasPath(safeAlias), Buffer.from(JSON.stringify({
    alias: safeAlias, clientId: safeId, ownerOrgId: owner.orgId, updatedAt: new Date().toISOString(),
  }), 'utf8'), {
    access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: false,
  });
}

export async function getBlueprintByAlias(alias: string) {
  const safeAlias = safeBlueprintKey(alias);
  if (!safeAlias) return null;
  const pointer = await readJson<{ clientId?: string }>(aliasPath(safeAlias));
  return pointer?.clientId ? getBlueprintRecord(pointer.clientId) : null;
}

export async function appendBlueprintVaultFile(clientId: string, file: BlueprintVaultFile) {
  const record = await getBlueprintRecord(clientId);
  if (!record) throw new Error('Blueprint not found.');
  record.vaultFiles = [...(record.vaultFiles || []).filter((item) => item.blobPath !== file.blobPath), file];
  if (record.policy?.vault) {
    record.policy.vault.uploads = record.vaultFiles.map((item) => ({
      name: item.name,
      type: item.type,
      size: item.size,
      stored: true,
    }));
  }
  return saveBlueprintRecord(record);
}

export function publicBlueprint(record: BlueprintRecord) {
  const { contact: _contact, ...safe } = record;
  const policy = { ...(safe.policy || {}) };
  delete policy.answers;
  const summary = {
    subject: safe.summary?.subject,
    link: safe.summary?.link,
    greeting: safe.summary?.greeting,
  };
  return { ...safe, policy, summary };
}
