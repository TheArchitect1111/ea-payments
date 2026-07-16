/**
 * Ensure Simplifi Watch List table + fields exist in the Payments Airtable base.
 *
 * Usage:
 *   node scripts/setup-simplifi-watch-list-table.mjs
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
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
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
const tableName = env.AIRTABLE_SIMPLIFI_WATCH_LIST_TABLE || 'Simplifi Watch List';

if (!key?.trim()) {
  console.error('Missing AIRTABLE_API_KEY.');
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
      'Airtable 401 — token needs schema.bases:read + schema.bases:write + data.records:read/write.',
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
  { name: 'Portal Slug', type: 'singleLineText' },
  { name: 'Organization ID', type: 'singleLineText' },
  {
    name: 'Kind',
    type: 'singleSelect',
    options: { choices: [{ name: 'item' }, { name: 'interest' }] },
  },
  { name: 'Title', type: 'singleLineText' },
  { name: 'URL', type: 'url' },
  { name: 'Category', type: 'singleLineText' },
  { name: 'Source', type: 'singleLineText' },
  { name: 'Notes', type: 'multilineText' },
  {
    name: 'Status',
    type: 'singleSelect',
    options: {
      choices: [{ name: 'watching' }, { name: 'paused' }, { name: 'archived' }],
    },
  },
  { name: 'Created At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' } },
  { name: 'Last Checked At', type: 'dateTime', options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' } },
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
      description: 'Simplifi companion extension + workspace user watch lists',
      fields: [{ name: 'Title', type: 'singleLineText' }],
    }),
  });
  if (!res.ok) throw new Error(`Create table failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const created = await res.json();
  table = created;
  console.log('CREATED table', tableName, table.id);
  tables = await listTables();
  table = tables.find((t) => t.name === tableName) ?? table;
} else {
  console.log('Table exists', tableName, table.id);
}

const existing = new Set((table.fields || []).map((f) => f.name));
for (const field of FIELD_DEFS) {
  if (existing.has(field.name)) {
    console.log('SKIP (exists)', field.name);
    continue;
  }
  await createField(table.id, field);
}

console.log('Simplifi Watch List setup complete.');
