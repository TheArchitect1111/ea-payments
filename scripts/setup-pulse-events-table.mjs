/**
 * Ensure Pulse Events table exists in the Payments Airtable base.
 *
 * Usage:
 *   set AIRTABLE_API_KEY=pat...
 *   set AIRTABLE_PAYMENTS_BASE_ID=app...
 *   node scripts/setup-pulse-events-table.mjs
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
const tableName = env.PULSE_EVENTS_TABLE || 'Pulse Events';

if (!key?.trim()) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_PAT.');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

async function listTables() {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, { headers });
  if (!res.ok) throw new Error(`Meta API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.tables ?? [];
}

const FIELD_DEFS = [
  { name: 'Product', type: 'singleLineText' },
  { name: 'Event Type', type: 'singleLineText' },
  { name: 'Title', type: 'singleLineText' },
  { name: 'Detail', type: 'multilineText' },
  {
    name: 'Priority',
    type: 'singleSelect',
    options: { choices: [{ name: 'critical' }, { name: 'high' }, { name: 'medium' }, { name: 'low' }] },
  },
  { name: 'URL', type: 'url' },
  { name: 'Tenant ID', type: 'singleLineText' },
  { name: 'Object ID', type: 'singleLineText' },
  { name: 'Recorded At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' } },
];

let tables = await listTables();
let table = tables.find((t) => t.name === tableName);

if (!table) {
  console.log('Creating table', tableName);
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: tableName,
      description: 'Pulse™ activity bus — cross-product events',
      fields: FIELD_DEFS.slice(0, 3),
    }),
  });
  if (!res.ok) throw new Error(`Create table failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const created = await res.json();
  table = created;
  tables = await listTables();
  table = tables.find((t) => t.id === created.id) ?? created;
}

console.log('TABLE', table.name, table.id);
const existing = new Set((table.fields || []).map((f) => f.name));

for (const field of FIELD_DEFS) {
  if (existing.has(field.name)) {
    console.log('OK', field.name);
    continue;
  }
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${table.id}/fields`, {
    method: 'POST',
    headers,
    body: JSON.stringify(field),
  });
  if (res.status === 422) {
    console.log('SKIP (exists)', field.name);
    continue;
  }
  if (!res.ok) throw new Error(`Field ${field.name}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  console.log('CREATED', field.name);
}

console.log('');
console.log('Done. Add to Vercel:');
console.log(`  PULSE_EVENTS_TABLE=${tableName}`);
