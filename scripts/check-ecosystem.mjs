import fs from 'node:fs';
import path from 'node:path';

const envPath =
  process.argv[2] && !process.argv[2].startsWith('--')
    ? process.argv[2]
    : path.join(process.cwd(), '.env.local');

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

async function checkAirtable() {
  const key = env.AIRTABLE_API_KEY;
  const baseId = env.AIRTABLE_PAYMENTS_BASE_ID || 'appv0YoLIMY45fmDA';
  const tableId = env.AIRTABLE_CLIENT_RECORDS_TABLE_ID || 'tblEtkE88ADyIitnm';
  const required = [
    'Onboarding Status',
    'Payment Received At',
    'Docs Sent At',
    'Docs Signed At',
  ];
  const optional = ['Engagement Score'];

  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!res.ok) {
    console.log('AIRTABLE_META_ERROR', res.status, (await res.text()).slice(0, 200));
    return;
  }

  const data = await res.json();
  const table = data.tables?.find((t) => t.id === tableId || t.name === 'Client Records');
  if (!table) {
    console.log('TABLE_NOT_FOUND', tableId);
    return;
  }

  const names = new Set((table.fields || []).map((f) => f.name));
  console.log('TABLE', table.name, table.id);
  for (const field of required) {
    console.log(names.has(field) ? 'OK' : 'MISSING', field);
  }
  for (const field of optional) {
    console.log(names.has(field) ? 'OK' : 'OPTIONAL_MISSING', field);
  }

  const onboarding = table.fields?.find((f) => f.name === 'Onboarding Status');
  if (onboarding?.options?.choices) {
    console.log('ONBOARDING_OPTIONS', onboarding.options.choices.map((c) => c.name).join('|'));
  }

  const capturesTable = data.tables?.find((t) => t.name === (env.AIRTABLE_CAPTURES_TABLE || 'Capture Records'));
  if (!capturesTable) {
    console.log('MISSING TABLE Capture Records');
    return;
  }
  const captureFields = [
    'Capture ID',
    'Title',
    'Blueprint Summary',
    'EA Fit Score',
    'Opportunity Score',
    'Status',
  ];
  const captureNames = new Set((capturesTable.fields || []).map((f) => f.name));
  console.log('CAPTURE_TABLE', capturesTable.name, capturesTable.id);
  for (const field of captureFields) {
    console.log(captureNames.has(field) ? 'OK' : 'MISSING', field);
  }
}

async function checkResend() {
  console.log('RESEND_FROM_EMAIL', env.RESEND_FROM_EMAIL || '(not set)');
  const key = env.RESEND_API_KEY;
  if (!key) {
    console.log('RESEND_KEY missing');
    return;
  }

  const res = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!res.ok) {
    console.log('RESEND_ERROR', res.status);
    return;
  }

  const data = await res.json();
  for (const domain of data.data || []) {
    console.log('DOMAIN', domain.name, `status=${domain.status}`);
  }
}

function checkWebhooks() {
  for (const name of ['ONBOARDING_WEBHOOK_URL', 'ESIGN_WEBHOOK_URL', 'CONTENT_REQUEST_WEBHOOK_URL']) {
    console.log(env[name] ? 'SET' : 'MISSING', name);
  }
}

await checkAirtable();
await checkResend();
checkWebhooks();
