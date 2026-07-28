#!/usr/bin/env node
/**
 * Launch ops: ensure Client Records.Commerce Offer Id + report Capture schema gaps.
 * Usage: node scripts/ensure-commerce-offer-and-capture-schema.mjs
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
const BASE = process.env.AIRTABLE_PAYMENTS_BASE_ID?.trim();
if (!key) {
  console.error('NO_KEY');
  process.exit(1);
}
if (!BASE) {
  console.error('NO_AIRTABLE_PAYMENTS_BASE_ID');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

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

async function listTables() {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE}/tables`, {
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`meta ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  return data.tables || [];
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

const tables = await listTables();
const capture = tables.find((t) => t.name === 'Capture Records');
const client = tables.find((t) => t.name === 'Client Records');

const captureNames = new Set((capture?.fields || []).map((f) => f.name));
const captureMissing = CAPTURE_REQUIRED.filter((f) => !captureNames.has(f));

console.log(
  JSON.stringify(
    {
      base: BASE,
      capture: {
        exists: Boolean(capture),
        id: capture?.id || null,
        missingRequired: captureMissing,
        fieldCount: capture?.fields?.length || 0,
      },
      client: {
        exists: Boolean(client),
        id: client?.id || null,
        hasCommerceOfferId: (client?.fields || []).some((f) => f.name === 'Commerce Offer Id'),
      },
    },
    null,
    2,
  ),
);

if (!client?.id) {
  console.error('Client Records table not found');
  process.exit(1);
}

if (!(client.fields || []).some((f) => f.name === 'Commerce Offer Id')) {
  const created = await createField(client.id, {
    name: 'Commerce Offer Id',
    type: 'singleLineText',
    description: 'Canonical commerce offer id (e.g. website_portal_starter)',
  });
  console.log('create_Commerce_Offer_Id', created.status, created.text);
} else {
  console.log('Commerce Offer Id already present');
}

// Backfill Website + Portal demo offer id now that the column exists.
{
  const formula = encodeURIComponent("{Portal Slug}='demo-website'");
  const lookup = await fetch(
    `https://api.airtable.com/v0/${BASE}/${encodeURIComponent('Client Records')}?filterByFormula=${formula}&maxRecords=1`,
    { headers },
  );
  const data = await lookup.json();
  const id = data.records?.[0]?.id;
  if (id) {
    const patch = await fetch(
      `https://api.airtable.com/v0/${BASE}/${encodeURIComponent('Client Records')}/${id}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          fields: { 'Commerce Offer Id': 'website_portal_starter' },
          typecast: true,
        }),
      },
    );
    console.log('backfill_demo_website', patch.status, (await patch.text()).slice(0, 200));
  } else {
    console.log('backfill_demo_website skipped — record not found');
  }
}

if (captureMissing.length && capture?.id) {
  console.log('NOTE: capture required fields still missing — run ensureAirtableLaunchTables / setup-schema');
  console.log('missing:', captureMissing.join(', '));
} else {
  console.log('Capture required schema OK');
}
