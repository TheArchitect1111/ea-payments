/**
 * Client legal profiles — built from append-only Legal Acceptances + audit (MSA/SOW).
 * Airtable in production; local JSON only when TRUST_ENGINE_DEV_FALLBACK=1 (non-production).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getLegalAuditHistory } from './audit';
import {
  trustEngineAllowLocalFallback,
  trustEngineAirtableReady,
  trustEnginePersistenceUnavailableReason,
} from './persistence-mode';
import type {
  ClientLegalProfile,
  LegalAcceptanceRecord,
  TrustLegalDocType,
  TrustProductId,
} from './types';
import { getLegalDocument } from './legal-pack';
import {
  airtableFindAcceptanceDuplicate,
  airtableInsertAcceptance,
  airtableListAcceptances,
  newAcceptanceId,
  type StoredLegalAcceptance,
} from './airtable-legal-store';

const DATA_DIR = join(process.cwd(), '.data', 'trust-engine');
const STORE_FILE = join(DATA_DIR, 'client-profiles.json');

const profiles = new Map<string, ClientLegalProfile>();
let hydrated = false;

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function hydrateLocal() {
  if (!trustEngineAllowLocalFallback()) return;
  if (hydrated) return;
  hydrated = true;
  if (!existsSync(STORE_FILE)) return;
  try {
    const raw = JSON.parse(readFileSync(STORE_FILE, 'utf8')) as ClientLegalProfile[];
    if (Array.isArray(raw)) {
      for (const p of raw) profiles.set(p.clientId, p);
    }
  } catch {
    // ignore
  }
}

function persistLocal() {
  if (!trustEngineAllowLocalFallback()) return;
  try {
    ensureDir();
    writeFileSync(STORE_FILE, JSON.stringify([...profiles.values()], null, 2), 'utf8');
  } catch {
    // non-fatal
  }
}

function rebuildLatest(history: LegalAcceptanceRecord[]) {
  const latest: ClientLegalProfile['latestByDoc'] = {};
  for (const rec of history) {
    const prev = latest[rec.docType];
    if (!prev || prev.acceptedAt <= rec.acceptedAt) {
      latest[rec.docType] = rec;
    }
  }
  return latest;
}

function applyEsignFromAudit(
  profile: ClientLegalProfile,
  events: Awaited<ReturnType<typeof getLegalAuditHistory>>,
): ClientLegalProfile {
  let msaStatus = profile.msaStatus;
  let sowStatus = profile.sowStatus;
  let msaSignedAt = profile.msaSignedAt;
  let sowSignedAt = profile.sowSignedAt;

  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));
  for (const e of sorted) {
    if (e.type === 'msa_sent') msaStatus = 'sent';
    if (e.type === 'msa_signed') {
      msaStatus = 'signed';
      msaSignedAt = e.at;
    }
    if (e.type === 'sow_generated') sowStatus = 'generated';
    if (e.type === 'sow_signed') {
      sowStatus = 'signed';
      sowSignedAt = e.at;
    }
  }

  return { ...profile, msaStatus, sowStatus, msaSignedAt, sowSignedAt };
}

function profileFromAcceptances(
  clientId: string,
  rows: StoredLegalAcceptance[],
  meta?: Partial<ClientLegalProfile>,
): ClientLegalProfile {
  const history: LegalAcceptanceRecord[] = rows.map((r) => ({
    userId: r.userId,
    productId: r.productId,
    docType: r.docType,
    version: r.version,
    acceptedAt: r.acceptedAt,
    href: r.href,
  }));
  const first = rows[0];
  const base = emptyClientLegalProfile({
    clientId,
    userId: meta?.userId ?? first?.userId ?? clientId,
    organizationId: meta?.organizationId ?? first?.organizationId ?? clientId,
    organizationName: meta?.organizationName ?? 'Organization',
    email: meta?.email ?? '',
    displayName: meta?.displayName ?? first?.userId ?? clientId,
    productId: meta?.productId ?? first?.productId ?? 'portal_products',
  });
  return {
    ...base,
    ...meta,
    acceptanceHistory: history,
    latestByDoc: rebuildLatest(history),
    updatedAt: new Date().toISOString(),
  };
}

export function emptyClientLegalProfile(input: {
  clientId: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  email: string;
  displayName: string;
  productId: TrustProductId;
}): ClientLegalProfile {
  const now = new Date().toISOString();
  return {
    ...input,
    acceptanceHistory: [],
    latestByDoc: {},
    msaStatus: 'pending',
    sowStatus: 'pending',
    requiresReacceptance: false,
    updatedAt: now,
  };
}

export async function getClientLegalProfile(
  clientId: string,
): Promise<ClientLegalProfile | null> {
  if (trustEngineAirtableReady()) {
    const rows = await airtableListAcceptances({ clientId, maxRecords: 500 });
    if (rows.length === 0) {
      const audit = await getLegalAuditHistory({ clientId, limit: 50 });
      if (audit.length === 0) return null;
      const empty = emptyClientLegalProfile({
        clientId,
        userId: clientId,
        organizationId: clientId,
        organizationName: 'Organization',
        email: '',
        displayName: clientId,
        productId: 'portal_products',
      });
      return applyEsignFromAudit(empty, audit);
    }
    let profile = profileFromAcceptances(clientId, rows);
    const audit = await getLegalAuditHistory({ clientId, limit: 100 });
    profile = applyEsignFromAudit(profile, audit);
    const statusNeeds = Object.entries(profile.latestByDoc).some(([docType, rec]) => {
      const current = getLegalDocument(docType as TrustLegalDocType);
      return current && rec.version !== current.version;
    });
    profile.requiresReacceptance = statusNeeds;
    return profile;
  }

  if (!trustEngineAllowLocalFallback()) return null;
  hydrateLocal();
  return profiles.get(clientId) ?? null;
}

export async function listClientLegalProfiles(): Promise<ClientLegalProfile[]> {
  if (trustEngineAirtableReady()) {
    const rows = await airtableListAcceptances({ maxRecords: 500 });
    const byClient = new Map<string, StoredLegalAcceptance[]>();
    for (const row of rows) {
      const list = byClient.get(row.clientId) ?? [];
      list.push(row);
      byClient.set(row.clientId, list);
    }
    const out: ClientLegalProfile[] = [];
    for (const [clientId, list] of byClient) {
      let profile = profileFromAcceptances(clientId, list);
      const audit = await getLegalAuditHistory({ clientId, limit: 50 });
      profile = applyEsignFromAudit(profile, audit);
      out.push(profile);
    }
    return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  if (!trustEngineAllowLocalFallback()) return [];
  hydrateLocal();
  return [...profiles.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function upsertClientLegalProfile(
  profile: ClientLegalProfile,
): Promise<ClientLegalProfile> {
  if (trustEngineAirtableReady()) {
    // Profiles are derived from acceptances/audit — no mutable row store in Airtable.
    return { ...profile, updatedAt: new Date().toISOString() };
  }
  if (!trustEngineAllowLocalFallback()) {
    throw new Error(trustEnginePersistenceUnavailableReason() ?? 'Persistence unavailable');
  }
  hydrateLocal();
  const next = { ...profile, updatedAt: new Date().toISOString() };
  profiles.set(next.clientId, next);
  persistLocal();
  return next;
}

export type AppendAcceptancesResult = {
  profile: ClientLegalProfile;
  inserted: StoredLegalAcceptance[];
  duplicatesSkipped: number;
};

/** Append acceptance rows — never overwrites. Duplicates (same client+doc+version) are skipped. */
export async function appendClientAcceptances(
  clientId: string,
  records: LegalAcceptanceRecord[],
  meta?: Partial<ClientLegalProfile> & {
    ipAddress?: string;
    userAgent?: string;
    source?: string;
  },
): Promise<ClientLegalProfile> {
  const result = await appendClientAcceptancesDetailed(clientId, records, meta);
  return result.profile;
}

export async function appendClientAcceptancesDetailed(
  clientId: string,
  records: LegalAcceptanceRecord[],
  meta?: Partial<ClientLegalProfile> & {
    ipAddress?: string;
    userAgent?: string;
    source?: string;
  },
): Promise<AppendAcceptancesResult> {
  const inserted: StoredLegalAcceptance[] = [];
  let duplicatesSkipped = 0;
  const organizationId = meta?.organizationId ?? clientId;
  const source = meta?.source ?? 'api';

  if (trustEngineAirtableReady()) {
    for (const rec of records) {
      const existing = await airtableFindAcceptanceDuplicate({
        clientId,
        docType: rec.docType,
        version: rec.version,
      });
      if (existing) {
        duplicatesSkipped += 1;
        continue;
      }
      const row: StoredLegalAcceptance = {
        acceptanceId: newAcceptanceId(),
        userId: rec.userId,
        clientId,
        organizationId,
        productId: rec.productId,
        docType: rec.docType,
        version: rec.version,
        acceptedAt: rec.acceptedAt,
        href: rec.href,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        source,
      };
      const write = await airtableInsertAcceptance(row);
      if (!write.ok) {
        throw new Error(write.error);
      }
      inserted.push(write.record);
    }
    const profile = (await getClientLegalProfile(clientId)) ?? profileFromAcceptances(clientId, inserted, meta);
    return { profile: { ...profile, requiresReacceptance: false }, inserted, duplicatesSkipped };
  }

  const unavailable = trustEnginePersistenceUnavailableReason();
  if (unavailable) {
    throw new Error(unavailable);
  }

  hydrateLocal();
  let profile = profiles.get(clientId);
  if (!profile) {
    const first = records[0];
    profile = emptyClientLegalProfile({
      clientId,
      userId: first?.userId ?? clientId,
      organizationId,
      organizationName: meta?.organizationName ?? 'Unknown',
      email: meta?.email ?? '',
      displayName: meta?.displayName ?? first?.userId ?? clientId,
      productId: first?.productId ?? meta?.productId ?? 'portal_products',
    });
  }

  const history = [...profile.acceptanceHistory];
  for (const rec of records) {
    const dup = history.some((h) => h.docType === rec.docType && h.version === rec.version);
    if (dup) {
      duplicatesSkipped += 1;
      continue;
    }
    history.push(rec);
    inserted.push({
      acceptanceId: newAcceptanceId(),
      ...rec,
      clientId,
      organizationId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      source,
    });
  }

  const next: ClientLegalProfile = {
    ...profile,
    ...meta,
    acceptanceHistory: history,
    latestByDoc: rebuildLatest(history),
    requiresReacceptance: false,
    updatedAt: new Date().toISOString(),
  };
  profiles.set(clientId, next);
  persistLocal();
  return { profile: next, inserted, duplicatesSkipped };
}

export async function markClientsReacceptanceRequired(
  docType: TrustLegalDocType,
  newVersion: string,
): Promise<string[]> {
  const clients = await listClientLegalProfiles();
  const touched: string[] = [];
  for (const profile of clients) {
    const latest = profile.latestByDoc[docType];
    if (!latest || latest.version !== newVersion) {
      touched.push(profile.clientId);
      if (trustEngineAllowLocalFallback() && !trustEngineAirtableReady()) {
        hydrateLocal();
        const local = profiles.get(profile.clientId);
        if (local) {
          profiles.set(profile.clientId, {
            ...local,
            requiresReacceptance: true,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
  }
  if (trustEngineAllowLocalFallback() && !trustEngineAirtableReady()) persistLocal();
  return touched;
}

export async function updateClientEsignStatus(
  clientId: string,
  patch: Partial<Pick<ClientLegalProfile, 'msaStatus' | 'sowStatus' | 'msaSignedAt' | 'sowSignedAt'>>,
): Promise<ClientLegalProfile | null> {
  // Durable signal is the audit event written by governance; local profile is optional.
  if (trustEngineAllowLocalFallback() && !trustEngineAirtableReady()) {
    hydrateLocal();
    const profile = profiles.get(clientId);
    if (!profile) {
      const empty = emptyClientLegalProfile({
        clientId,
        userId: clientId,
        organizationId: clientId,
        organizationName: 'Organization',
        email: '',
        displayName: clientId,
        productId: 'portal_products',
      });
      const next = { ...empty, ...patch, updatedAt: new Date().toISOString() };
      profiles.set(clientId, next);
      persistLocal();
      return next;
    }
    const next = { ...profile, ...patch, updatedAt: new Date().toISOString() };
    profiles.set(clientId, next);
    persistLocal();
    return next;
  }

  const existing = await getClientLegalProfile(clientId);
  if (!existing) {
    return {
      ...emptyClientLegalProfile({
        clientId,
        userId: clientId,
        organizationId: clientId,
        organizationName: 'Organization',
        email: '',
        displayName: clientId,
        productId: 'portal_products',
      }),
      ...patch,
    };
  }
  return { ...existing, ...patch, updatedAt: new Date().toISOString() };
}

/** Demo seed — local/dev fallback only. Never seeds production Airtable. */
export async function ensureDemoLegalClients(): Promise<void> {
  if (trustEngineAirtableReady()) return;
  if (!trustEngineAllowLocalFallback()) return;
  hydrateLocal();
  if (profiles.size > 0) return;

  const now = new Date().toISOString();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const demos: ClientLegalProfile[] = [
    {
      clientId: 'client_selena',
      userId: 'user_selena',
      organizationId: 'org_selena',
      organizationName: 'Selena Studio',
      email: 'selena@example.com',
      displayName: 'Selena',
      productId: 'portal_products',
      acceptanceHistory: [
        {
          userId: 'user_selena',
          productId: 'portal_products',
          docType: 'privacy',
          version: '1.0',
          acceptedAt: dayAgo,
          href: '/legal/privacy',
        },
        {
          userId: 'user_selena',
          productId: 'portal_products',
          docType: 'tos',
          version: '1.0',
          acceptedAt: dayAgo,
          href: '/legal/terms',
        },
        {
          userId: 'user_selena',
          productId: 'portal_products',
          docType: 'support',
          version: '1.0',
          acceptedAt: dayAgo,
          href: '/legal/support',
        },
      ],
      latestByDoc: {},
      msaStatus: 'signed',
      sowStatus: 'signed',
      msaSignedAt: dayAgo,
      sowSignedAt: dayAgo,
      requiresReacceptance: false,
      updatedAt: now,
    },
  ];
  for (const d of demos) {
    d.latestByDoc = rebuildLatest(d.acceptanceHistory);
    profiles.set(d.clientId, d);
  }
  persistLocal();
}
