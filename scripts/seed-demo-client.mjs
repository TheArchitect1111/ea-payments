/**
 * Create or refresh the Pulse demo client in Airtable Client Records + demo proposal.
 *
 * Usage:
 *   vercel env pull .env.local --environment=production
 *   node scripts/seed-demo-client.mjs .env.local
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const envPath = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.env.local';
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
const proposalsTable = env.AIRTABLE_PROPOSALS_TABLE_ID || 'Proposals';
const clientTable = 'Client Records';

const DEMO = {
  slug: 'demo-client',
  email: 'demo@efficiencyarchitects.online',
  password: env.DEMO_CLIENT_PASSWORD || 'DemoPulse2026!',
  clientName: 'Demo Client',
  organization: 'Efficiency Architects Demo',
  proposalId: 'PROP-DEMO-PULSE',
};

if (!key?.trim()) {
  console.error('Missing AIRTABLE_API_KEY.');
  console.error('');
  console.error('Easiest (CMD — paste your pat token):');
  console.error('  set AIRTABLE_API_KEY=pat_your_token_here');
  console.error('  node scripts/seed-demo-client.mjs');
  console.error('');
  console.error('Or put AIRTABLE_API_KEY=pat... in .env.local and run:');
  console.error('  node scripts/seed-demo-client.mjs .env.local');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

async function findByFormula(table, formula) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
  const res = await fetch(url, { headers });
  if (res.status === 401) {
    throw new Error(
      'Airtable returned 401 Unauthorized. Your AIRTABLE_API_KEY is wrong, expired, or still the placeholder. ' +
        'Create a new token at https://airtable.com/create/tokens with access to the Payments base, then run: set AIRTABLE_API_KEY=pat...',
    );
  }
  if (!res.ok) throw new Error(`${table} lookup ${res.status}`);
  const data = await res.json();
  return data.records?.[0] ?? null;
}

async function upsertClient() {
  const existing = await findByFormula(clientTable, `{Portal Slug}='${DEMO.slug}'`);
  const fields = {
    'Client Name': DEMO.clientName,
    Email: DEMO.email,
    Organization: DEMO.organization,
    'Package Purchased': 'Simplifi',
    'Amount Paid': 149,
    'Payment Date': new Date().toISOString().slice(0, 10),
    'Stripe Transaction ID': 'demo_seed',
    'Portal Access Status': 'Active',
    'Onboarding Status': 'In Progress',
    'Portal Username': DEMO.email,
    'Portal Slug': DEMO.slug,
    'Temp Password': DEMO.password,
    'Payment Received At': new Date().toISOString(),
  };

  if (existing) {
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(clientTable)}/${existing.id}`,
      { method: 'PATCH', headers, body: JSON.stringify({ fields, typecast: true }) },
    );
    if (!res.ok) throw new Error(`Client PATCH ${await res.text()}`);
    console.log('UPDATED client', existing.id);
    return existing.id;
  }

  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(clientTable)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!res.ok) throw new Error(`Client POST ${await res.text()}`);
  const data = await res.json();
  const id = data.records?.[0]?.id;
  console.log('CREATED client', id);
  return id;
}

async function upsertProposal() {
  const existing = await findByFormula(proposalsTable, `{Proposal ID}='${DEMO.proposalId}'`);
  const fields = {
    'Proposal ID': DEMO.proposalId,
    'Business Name': DEMO.organization,
    'Contact Name': DEMO.clientName,
    Email: DEMO.email,
    Status: 'Approved',
    'Recommended Project Type': 'capacity_blueprint',
    'Project Type Label': 'Capacity Blueprint',
    'Capacity Score': 72,
    'Score Band': 'Growth Ready',
    'Primary Constraint': 'Operational visibility',
    'Weekly Time Recovery': 8,
    'Opportunity Low': 48000,
    'Opportunity High': 96000,
    'Raw Fee': 12000,
    'Recommended Fee': 12000,
    'Date Approved': new Date().toISOString().slice(0, 10),
  };

  if (existing) {
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(proposalsTable)}/${existing.id}`,
      { method: 'PATCH', headers, body: JSON.stringify({ fields, typecast: true }) },
    );
    if (!res.ok) throw new Error(`Proposal PATCH ${await res.text()}`);
    console.log('UPDATED proposal', existing.id);
    return;
  }

  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(proposalsTable)}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!res.ok) throw new Error(`Proposal POST ${await res.text()}`);
  console.log('CREATED proposal');
}

await upsertClient();
await upsertProposal();

const baseUrl = env.NEXT_PUBLIC_BASE_URL || 'https://ea-payments.vercel.app';
console.log('\n--- Pulse demo credentials ---');
console.log('Login:', `${baseUrl}/portal/login`);
console.log('Email:', DEMO.email);
console.log('Password:', DEMO.password);
console.log('Pulse:', `${baseUrl}/portal/${DEMO.slug}/pulse`);
console.log('Proposal:', `${baseUrl}/proposal/${DEMO.proposalId}`);
