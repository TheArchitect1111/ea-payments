/**
 * Report Capture Records + Pulse Events schema status in the Payments base.
 *
 * Usage:
 *   set AIRTABLE_API_KEY=pat...
 *   set AIRTABLE_PAYMENTS_BASE_ID=app...
 *   node scripts/verify-airtable-schema.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const envPath =
  process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(process.cwd(), '.env.local');
const envFromFile = (() => {
  try {
    return Object.fromEntries(
      fs
        .readFileSync(envPath, 'utf8')
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const i = line.indexOf('=');
          let value = line.slice(i + 1);
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          return [line.slice(0, i), value];
        }),
    );
  } catch {
    return {};
  }
})();

const env = { ...envFromFile, ...process.env };
const key = env.AIRTABLE_API_KEY ?? env.AIRTABLE_PAT;
const baseId = env.AIRTABLE_PAYMENTS_BASE_ID || 'appv0YoLIMY45fmDA';
const capturesTable = env.AIRTABLE_CAPTURES_TABLE || 'Capture Records';
const pulseTable = env.PULSE_EVENTS_TABLE || 'Pulse Events';

const CAPTURE_REQUIRED = [
  'Capture ID',
  'Title',
  'Description',
  'Capture Type',
  'Source',
  'Priority',
  'Status',
  'Date Captured',
  'Portal Slug',
  'Prospect Status',
];

const PULSE_REQUIRED = [
  'Product',
  'Event Type',
  'Title',
  'Detail',
  'Priority',
  'URL',
  'Tenant ID',
  'Object ID',
  'Recorded At',
];

if (!key?.trim()) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_PAT.');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${key}` };

const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, { headers });
if (res.status === 401) {
  console.error('Airtable 401 — check token scopes (schema.bases:read + data.records:read/write) and base access.');
  process.exit(1);
}
if (!res.ok) {
  console.error(`Meta API ${res.status}:`, (await res.text()).slice(0, 300));
  process.exit(1);
}

const data = await res.json();
const tables = data.tables ?? [];

function report(tableName, required) {
  const table = tables.find((t) => t.name === tableName);
  if (!table) {
    console.log(`MISSING TABLE  ${tableName}`);
    console.log(`  Fix: node scripts/setup-${tableName === capturesTable ? 'capture-records' : 'pulse-events'}-table.mjs`);
    return false;
  }
  const names = new Set((table.fields || []).map((f) => f.name));
  console.log(`TABLE  ${table.name} (${table.id})`);
  let ok = true;
  for (const field of required) {
    const status = names.has(field) ? 'OK' : 'MISSING';
    if (status === 'MISSING') ok = false;
    console.log(`  ${status.padEnd(7)} ${field}`);
  }
  return ok;
}

console.log('BASE', baseId);
console.log('');
const captureOk = report(capturesTable, CAPTURE_REQUIRED);
console.log('');
const pulseOk = report(pulseTable, PULSE_REQUIRED);
console.log('');

if (captureOk && pulseOk) {
  console.log('READY — capture saves and Pulse events should work.');
  console.log('Vercel: set PULSE_EVENTS_TABLE=Pulse Events if not already set, then redeploy.');
  process.exit(0);
}

console.log('ACTION — run from ea-payments folder:');
if (!captureOk) console.log('  node scripts/setup-capture-records-table.mjs');
if (!pulseOk) console.log('  node scripts/setup-pulse-events-table.mjs');
process.exit(1);
