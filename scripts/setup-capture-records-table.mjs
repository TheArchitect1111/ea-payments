/**
 * Ensure Capture Records table + fields exist in the Payments Airtable base.
 *
 * Usage:
 *   set AIRTABLE_API_KEY=pat...
 *   node scripts/setup-capture-records-table.mjs
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

const key = env.AIRTABLE_API_KEY;
const baseId = env.AIRTABLE_PAYMENTS_BASE_ID || 'appv0YoLIMY45fmDA';
const tableName = env.AIRTABLE_CAPTURES_TABLE || 'Capture Records';

if (!key?.trim()) {
  console.error('Missing AIRTABLE_API_KEY.');
  console.error('');
  console.error('Easiest (CMD):');
  console.error('  set AIRTABLE_API_KEY=pat_your_token_here');
  console.error('  node scripts/setup-capture-records-table.mjs');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

async function listTables() {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, { headers });
  if (res.status === 401) {
    throw new Error(
      'Airtable 401 — token invalid or missing schema.bases:read + data.records:read/write on Payments base.',
    );
  }
  if (!res.ok) throw new Error(`Meta API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.tables ?? [];
}

async function createField(tableId, body) {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (res.status === 422) {
    const detail = await res.text();
    if (detail.includes('already exists') || detail.includes('DUPLICATE')) {
      console.log('SKIP (exists)', body.name);
      return;
    }
    throw new Error(`Field ${body.name}: ${detail.slice(0, 300)}`);
  }
  if (!res.ok) throw new Error(`Field ${body.name}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  console.log('CREATED', body.name);
}

const FIELD_DEFS = [
  { name: 'Capture ID', type: 'singleLineText' },
  { name: 'Title', type: 'singleLineText' },
  { name: 'Description', type: 'multilineText' },
  {
    name: 'Capture Type',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'Signal' },
        { name: 'Opportunity' },
        { name: 'Resource' },
        { name: 'Organization' },
        { name: 'Person' },
        { name: 'Note' },
      ],
    },
  },
  { name: 'Source URL', type: 'url' },
  { name: 'Source', type: 'singleLineText' },
  { name: 'Category', type: 'singleLineText' },
  { name: 'Resource Category', type: 'singleLineText' },
  {
    name: 'Priority',
    type: 'singleSelect',
    options: { choices: [{ name: 'Low' }, { name: 'Normal' }, { name: 'High' }] },
  },
  {
    name: 'Status',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'Captured' },
        { name: 'Triaged' },
        { name: 'Analyzing' },
        { name: 'Routed' },
        { name: 'Archived' },
      ],
    },
  },
  { name: 'Tags', type: 'multilineText' },
  { name: 'Date Captured', type: 'date', options: { dateFormat: { name: 'iso' } } },
  { name: 'EA Fit Score', type: 'number', options: { precision: 0 } },
  { name: 'Opportunity Score', type: 'number', options: { precision: 0 } },
  { name: 'Analysis Summary', type: 'multilineText' },
  { name: 'Product Alignment', type: 'singleLineText' },
  { name: 'Blueprint Template', type: 'singleLineText' },
  { name: 'Trust Confidence', type: 'number', options: { precision: 0 } },
  { name: 'Recommendation Summary', type: 'multilineText' },
  { name: 'Blueprint Summary', type: 'multilineText' },
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
      description: 'Simplifi captures and Magnifi blueprint summaries',
      fields: FIELD_DEFS.slice(0, 3),
    }),
  });
  if (!res.ok) throw new Error(`Create table failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const created = await res.json();
  table = created;
  console.log('CREATED TABLE', table.name, table.id);
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
  await createField(table.id, field);
}

console.log('Done. Simplifi/Magnifi captures can save to', tableName);
