#!/usr/bin/env node
/**
 * Launch ops: ensure Portal Pretix Events + Portal Event Registrations Airtable tables.
 * Usage: node scripts/ensure-event-hub-airtable-schema.mjs
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

const PRETIX_EVENTS_TABLE =
  process.env.AIRTABLE_PORTAL_PRETIX_EVENTS_TABLE?.trim() || 'Portal Pretix Events';
const REGISTRATIONS_TABLE =
  process.env.AIRTABLE_PORTAL_EVENT_REGISTRATIONS_TABLE?.trim() || 'Portal Event Registrations';

const PRETIX_EVENT_FIELDS = [
  { name: 'Event ID', type: 'singleLineText' },
  { name: 'Portal Slug', type: 'singleLineText' },
  { name: 'Title', type: 'singleLineText' },
  { name: 'Summary', type: 'multilineText' },
  { name: 'Shop URL', type: 'url' },
  { name: 'Pretix Event Slug', type: 'singleLineText' },
  { name: 'Pretix Organizer Slug', type: 'singleLineText' },
  { name: 'Starts At', type: 'singleLineText' },
  { name: 'Ends At', type: 'singleLineText' },
  { name: 'Location', type: 'singleLineText' },
  {
    name: 'Status',
    type: 'singleSelect',
    options: { choices: [{ name: 'draft' }, { name: 'published' }, { name: 'closed' }] },
  },
  { name: 'Created At', type: 'singleLineText' },
  { name: 'Updated At', type: 'singleLineText' },
  { name: 'Created By', type: 'singleLineText' },
  { name: 'Deleted At', type: 'singleLineText' },
];

const REGISTRATION_FIELDS = [
  { name: 'Registration Key', type: 'singleLineText' },
  { name: 'Registration ID', type: 'singleLineText' },
  { name: 'Portal Slug', type: 'singleLineText' },
  { name: 'Organization ID', type: 'singleLineText' },
  { name: 'Order Code', type: 'singleLineText' },
  { name: 'Email', type: 'email' },
  { name: 'Event Title', type: 'singleLineText' },
  { name: 'Pretix Event Slug', type: 'singleLineText' },
  { name: 'Pretix Organizer Slug', type: 'singleLineText' },
  { name: 'Shop URL', type: 'url' },
  { name: 'Event Starts At', type: 'singleLineText' },
  {
    name: 'Status',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'placed' },
        { name: 'paid' },
        { name: 'canceled' },
        { name: 'unknown' },
      ],
    },
  },
  { name: 'Placed At', type: 'singleLineText' },
  { name: 'Paid At', type: 'singleLineText' },
  { name: 'Updated At', type: 'singleLineText' },
  { name: 'Reminders Sent JSON', type: 'multilineText' },
];

async function listTables() {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}/tables`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(`meta ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  return data.tables || [];
}

async function createTable(name, fields) {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}/tables`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name,
      description: 'Event Hub durable store — managed by ensure-event-hub-airtable-schema.mjs',
      fields: fields.slice(0, 1),
    }),
  });
  const text = await res.text();
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    // ignore
  }
  return { ok: res.ok, status: res.status, table: parsed, text: text.slice(0, 400) };
}

async function createField(tableId, field) {
  const res = await fetch(
    `https://api.airtable.com/v0/meta/bases/${BASE}/tables/${tableId}/fields`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(field),
    },
  );
  const text = await res.text();
  return { ok: res.ok || res.status === 422, status: res.status, text: text.slice(0, 400) };
}

async function ensureTable(tableName, fieldDefs) {
  let tables = await listTables();
  let table = tables.find((t) => t.name === tableName);
  const report = { table: tableName, existed: Boolean(table), created: false, fieldsAdded: [] };

  if (!table) {
    const created = await createTable(tableName, fieldDefs);
    console.log(`create_table_${tableName.replace(/\s+/g, '_')}`, created.status, created.text);
    if (!created.ok) return report;
    report.created = true;
    tables = await listTables();
    table = tables.find((t) => t.name === tableName);
  }

  if (!table?.id) return report;

  const existing = new Set((table.fields || []).map((f) => f.name));
  for (const field of fieldDefs) {
    if (existing.has(field.name)) continue;
    const result = await createField(table.id, field);
    report.fieldsAdded.push({ name: field.name, status: result.status });
    console.log(`create_field_${field.name.replace(/\s+/g, '_')}`, result.status, result.text);
  }

  return report;
}

const pretixReport = await ensureTable(PRETIX_EVENTS_TABLE, PRETIX_EVENT_FIELDS);
const registrationReport = await ensureTable(REGISTRATIONS_TABLE, REGISTRATION_FIELDS);

console.log(
  JSON.stringify(
    {
      base: BASE,
      pretixEvents: pretixReport,
      registrations: registrationReport,
      env: {
        AIRTABLE_PORTAL_PRETIX_EVENTS_TABLE: PRETIX_EVENTS_TABLE,
        AIRTABLE_PORTAL_EVENT_REGISTRATIONS_TABLE: REGISTRATIONS_TABLE,
      },
    },
    null,
    2,
  ),
);

console.log('Event Hub Airtable schema ensure complete');
