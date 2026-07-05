/**
 * Create / verify CTP Submissions Airtable table
 * Usage: node scripts/ops-airtable-ctp-submissions.mjs
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
const tableName = env.AIRTABLE_CTP_SUBMISSIONS_TABLE || process.env.AIRTABLE_CTP_SUBMISSIONS_TABLE || 'CTP Submissions';

const REQUIRED = [
  'Submission ID',
  'Business Name',
  'Contact Name',
  'Email',
  'Status',
  'Workspace Status',
  'Studio Status',
  'Assessment ID',
  'Proposal ID',
  'Intake Analysis JSON',
  'Payload JSON',
  'Submitted At',
  'Updated At',
];

const FIELD_DEFS = [
  { name: 'Submission ID', type: 'singleLineText' },
  { name: 'Business Name', type: 'singleLineText' },
  { name: 'Contact Name', type: 'singleLineText' },
  { name: 'Email', type: 'email' },
  {
    name: 'Status',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'Submitted' },
        { name: 'Workspace Pending' },
        { name: 'Workspace Active' },
        { name: 'Studio In Progress' },
        { name: 'Ready For Review' },
        { name: 'Review Scheduled' },
        { name: 'Completed' },
      ],
    },
  },
  {
    name: 'Workspace Status',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'Pending' },
        { name: 'Provisioning' },
        { name: 'Active' },
        { name: 'Failed' },
      ],
    },
  },
  {
    name: 'Studio Status',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'Not Started' },
        { name: 'In Progress' },
        { name: 'Ready For Review' },
        { name: 'Completed' },
      ],
    },
  },
  {
    name: 'Review Scheduled At',
    type: 'dateTime',
    options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' },
  },
  { name: 'Consider Slug', type: 'singleLineText' },
  { name: 'Partner Slug', type: 'singleLineText' },
  { name: 'Assessment ID', type: 'singleLineText' },
  { name: 'Proposal ID', type: 'singleLineText' },
  { name: 'Discovery Version', type: 'singleLineText' },
  { name: 'Intake Analysis JSON', type: 'multilineText' },
  { name: 'Payload JSON', type: 'multilineText' },
  {
    name: 'Submitted At',
    type: 'dateTime',
    options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' },
  },
  {
    name: 'Updated At',
    type: 'dateTime',
    options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' },
  },
];

const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

async function main() {
  if (!key) {
    console.error('Missing AIRTABLE_API_KEY or AIRTABLE_PAT');
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
        description: 'Consider The Possibilities discovery submissions and lifecycle',
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

  console.log('CTP Submissions schema OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
