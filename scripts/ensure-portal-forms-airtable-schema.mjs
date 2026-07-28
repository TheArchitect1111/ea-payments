#!/usr/bin/env node
/**
 * Launch ops: ensure Portal Form Submissions Airtable table.
 * Usage: node scripts/ensure-portal-forms-airtable-schema.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env) || !process.env[k]) process.env[k] = v;
  }
}

const key = process.env.AIRTABLE_API_KEY;
const BASE =
  process.env.AIRTABLE_PLATFORM_BASE_ID?.trim() ||
  process.env.AIRTABLE_PAYMENTS_BASE_ID?.trim();
if (!key) {
  console.error('NO_KEY');
  process.exit(1);
}
if (!BASE) {
  console.error('NO_AIRTABLE_BASE_ID');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

const TABLE =
  process.env.AIRTABLE_PORTAL_FORM_SUBMISSIONS_TABLE?.trim() || 'Portal Form Submissions';

const FIELDS = [
  { name: 'Submission ID', type: 'singleLineText' },
  { name: 'Portal Slug', type: 'singleLineText' },
  {
    name: 'Kind',
    type: 'singleSelect',
    options: { choices: [{ name: 'intake' }, { name: 'application' }] },
  },
  {
    name: 'Status',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'submitted' },
        { name: 'reviewed' },
        { name: 'accepted' },
        { name: 'rejected' },
      ],
    },
  },
  { name: 'Email', type: 'email' },
  { name: 'Name', type: 'singleLineText' },
  { name: 'Phone', type: 'phoneNumber' },
  { name: 'Notes', type: 'multilineText' },
  { name: 'Payload JSON', type: 'multilineText' },
  { name: 'Created At', type: 'singleLineText' },
  { name: 'Updated At', type: 'singleLineText' },
];

async function listTables() {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}/tables`, { headers });
  if (!res.ok) throw new Error(`meta tables ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { tables?: Array<{ id: string; name: string }> };
  return json.tables || [];
}

async function createTable() {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}/tables`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: TABLE, fields: FIELDS }),
  });
  if (!res.ok) throw new Error(`create table ${res.status}: ${await res.text()}`);
  return res.json();
}

async function ensureFields(tableId, existingNames) {
  const missing = FIELDS.filter((f) => !existingNames.has(f.name));
  for (const field of missing) {
    const res = await fetch(
      `https://api.airtable.com/v0/meta/bases/${BASE}/tables/${tableId}/fields`,
      { method: 'POST', headers, body: JSON.stringify(field) },
    );
    if (!res.ok) {
      console.warn(`field ${field.name}: ${res.status} ${await res.text()}`);
    } else {
      console.log('created field', field.name);
    }
  }
}

async function main() {
  const tables = await listTables();
  let table = tables.find((t) => t.name === TABLE);
  if (!table) {
    console.log('creating table', TABLE);
    const created = (await createTable()) as { id: string; name: string };
    table = created;
    console.log('OK created', TABLE);
    return;
  }

  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}/tables`, { headers });
  const json = (await res.json()) as {
    tables?: Array<{ id: string; name: string; fields?: Array<{ name: string }> }>;
  };
  const full = (json.tables || []).find((t) => t.id === table.id);
  const names = new Set((full?.fields || []).map((f) => f.name));
  await ensureFields(table.id, names);
  console.log('OK', TABLE, 'fields ensured');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
