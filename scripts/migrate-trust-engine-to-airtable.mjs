#!/usr/bin/env node
/**
 * Migrate .data/trust-engine local files → Airtable Legal Acceptances / Legal Audit Events.
 *
 * Usage:
 *   node scripts/migrate-trust-engine-to-airtable.mjs --dry-run
 *   node scripts/migrate-trust-engine-to-airtable.mjs
 *
 * Never deletes source files. Requires AIRTABLE_API_KEY + AIRTABLE_PAYMENTS_BASE_ID.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');

function loadEnvFile(name) {
  const p = join(root, name);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnvFile('.env.local');
loadEnvFile('.env');

const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID?.trim() || 'appv0YoLIMY45fmDA';
const KEY = (process.env.AIRTABLE_API_KEY ?? process.env.AIRTABLE_PAT)?.trim();
const ACCEPT_TABLE = process.env.AIRTABLE_LEGAL_ACCEPTANCES_TABLE?.trim() || 'Legal Acceptances';
const AUDIT_TABLE = process.env.AIRTABLE_LEGAL_AUDIT_EVENTS_TABLE?.trim() || 'Legal Audit Events';

const DATA_DIR = join(root, '.data', 'trust-engine');
const PROFILES = join(DATA_DIR, 'client-profiles.json');
const AUDIT = join(DATA_DIR, 'legal-audit.jsonl');

const stats = { migrated: 0, skipped: 0, failed: 0 };

async function airtableQuery(table, formula, max = 1) {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`);
  if (formula) url.searchParams.set('filterByFormula', formula);
  url.searchParams.set('maxRecords', String(max));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`query ${table}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.records ?? [];
}

async function airtableCreate(table, fields) {
  if (dryRun) return { id: 'dry-run' };
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!res.ok) throw new Error(`create ${table}: ${res.status} ${await res.text()}`);
  return (await res.json()).records?.[0];
}

function esc(s) {
  return String(s).replace(/'/g, "\\'");
}

async function migrateAcceptances() {
  if (!existsSync(PROFILES)) {
    console.log('No client-profiles.json — skip acceptances');
    return;
  }
  const profiles = JSON.parse(readFileSync(PROFILES, 'utf8'));
  if (!Array.isArray(profiles)) return;

  for (const profile of profiles) {
    const history = profile.acceptanceHistory ?? [];
    for (const rec of history) {
      const clientId = profile.clientId;
      const formula = `AND({Client ID}='${esc(clientId)}',{Document Type}='${esc(rec.docType)}',{Accepted Version}='${esc(rec.version)}')`;
      try {
        const existing = await airtableQuery(ACCEPT_TABLE, formula, 1);
        if (existing.length) {
          stats.skipped += 1;
          console.log(`SKIP acceptance ${clientId} ${rec.docType} v${rec.version}`);
          continue;
        }
        await airtableCreate(ACCEPT_TABLE, {
          'Acceptance ID': `acc_mig_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
          'User ID': rec.userId || profile.userId,
          'Client ID': clientId,
          'Organization ID': profile.organizationId || clientId,
          Product: rec.productId || profile.productId || 'portal_products',
          'Document Type': rec.docType,
          'Accepted Version': rec.version,
          'Accepted At': rec.acceptedAt,
          Source: 'migration.local',
          Href: rec.href || '',
        });
        stats.migrated += 1;
        console.log(`${dryRun ? 'DRY ' : ''}MIGRATE acceptance ${clientId} ${rec.docType} v${rec.version}`);
      } catch (err) {
        stats.failed += 1;
        console.error('FAIL acceptance', clientId, rec.docType, err.message || err);
      }
    }
  }
}

async function migrateAudit() {
  if (!existsSync(AUDIT)) {
    console.log('No legal-audit.jsonl — skip audit');
    return;
  }
  const lines = readFileSync(AUDIT, 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      stats.failed += 1;
      continue;
    }
    const eventId = event.id || `la_mig_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const formula = `{Event ID}='${esc(eventId)}'`;
    try {
      const existing = await airtableQuery(AUDIT_TABLE, formula, 1);
      if (existing.length) {
        stats.skipped += 1;
        console.log(`SKIP audit ${eventId}`);
        continue;
      }
      const clientId = event.metadata?.clientId || '';
      await airtableCreate(AUDIT_TABLE, {
        'Event ID': eventId,
        'Event Type': event.type,
        'User ID': event.userId || '',
        'Client ID': clientId,
        'Organization ID': event.organizationId || '',
        ...(event.productId ? { Product: event.productId } : {}),
        ...(event.docType ? { 'Document Type': event.docType } : {}),
        ...(event.version ? { 'Document Version': event.version } : {}),
        Timestamp: event.at,
        ...(event.ipAddress ? { 'IP Address': event.ipAddress } : {}),
        'Metadata JSON': JSON.stringify(event.metadata ?? {}),
        Summary: event.summary || event.type,
      });
      stats.migrated += 1;
      console.log(`${dryRun ? 'DRY ' : ''}MIGRATE audit ${eventId}`);
    } catch (err) {
      stats.failed += 1;
      console.error('FAIL audit', eventId, err.message || err);
    }
  }
}

async function main() {
  if (!KEY) {
    console.error('Missing AIRTABLE_API_KEY / AIRTABLE_PAT');
    process.exit(1);
  }
  console.log(dryRun ? '=== DRY RUN ===' : '=== MIGRATE ===');
  console.log('Source:', DATA_DIR);
  console.log('Tables:', ACCEPT_TABLE, AUDIT_TABLE);
  await migrateAcceptances();
  await migrateAudit();
  console.log('\nSummary:', stats);
  console.log('Source files were NOT deleted.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
