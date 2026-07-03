/**
 * Create / verify Creative Studio Airtable table using credentials from .env.local
 * Usage: node scripts/ops-airtable-creative-studio.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvLocal() {
  const file = path.join(root, '.env.local');
  if (!fs.existsSync(file)) return {};
  let text = fs.readFileSync(file, 'utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnvLocal();
const key = env.AIRTABLE_API_KEY || env.AIRTABLE_PAT || process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_PAT;
const baseId = env.AIRTABLE_PAYMENTS_BASE_ID || process.env.AIRTABLE_PAYMENTS_BASE_ID || 'appv0YoLIMY45fmDA';
const tableName = env.AIRTABLE_CREATIVE_STUDIO_TABLE || process.env.AIRTABLE_CREATIVE_STUDIO_TABLE || 'Creative Studio';

const REQUIRED = [
  'Record Key',
  'Record Type',
  'Organization ID',
  'Title',
  'Payload JSON',
  'Updated At',
];

const FIELD_DEFS = [
  { name: 'Record Key', type: 'singleLineText' },
  {
    name: 'Record Type',
    type: 'singleSelect',
    options: { choices: [{ name: 'Campaign' }, { name: 'Brand' }, { name: 'Media' }] },
  },
  { name: 'Organization ID', type: 'singleLineText' },
  { name: 'Title', type: 'singleLineText' },
  { name: 'Payload JSON', type: 'multilineText' },
  {
    name: 'Updated At',
    type: 'dateTime',
    options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' },
  },
];

const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

async function main() {
  if (!key) {
    console.error('Missing AIRTABLE_API_KEY or AIRTABLE_PAT in .env.local');
    process.exit(1);
  }

  const tablesRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, { headers });
  if (!tablesRes.ok) {
    console.error('List tables failed:', tablesRes.status, await tablesRes.text());
    process.exit(1);
  }
  const { tables = [] } = await tablesRes.json();
  let table = tables.find((t) => t.name === tableName);

  if (!table) {
    const createRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: tableName,
        description: 'Creative Studio campaigns, brand profiles, and media library',
        fields: FIELD_DEFS,
      }),
    });
    if (!createRes.ok) {
      console.error('Create table failed:', createRes.status, await createRes.text());
      process.exit(1);
    }
    table = await createRes.json();
    console.log(`Created table "${tableName}" (${table.id})`);
  } else {
    console.log(`Table "${tableName}" exists (${table.id})`);
    const existing = new Set((table.fields ?? []).map((f) => f.name));
    for (const field of FIELD_DEFS) {
      if (existing.has(field.name)) continue;
      const res = await fetch(
        `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${table.id}/fields`,
        { method: 'POST', headers, body: JSON.stringify(field) },
      );
      if (res.ok) console.log(`  + field ${field.name}`);
      else console.warn(`  ! field ${field.name}:`, res.status, (await res.text()).slice(0, 120));
    }
  }

  const verifyRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, { headers });
  const verifyData = await verifyRes.json();
  const verified = verifyData.tables?.find((t) => t.name === tableName);
  const names = new Set((verified?.fields ?? []).map((f) => f.name));
  const missing = REQUIRED.filter((f) => !names.has(f));

  if (missing.length) {
    console.error('Missing fields:', missing.join(', '));
    process.exit(1);
  }

  console.log('Creative Studio schema OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
