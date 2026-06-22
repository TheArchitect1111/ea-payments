/**
 * List Airtable bases your token can access (find the correct app... base ID).
 *
 * Usage:
 *   set AIRTABLE_API_KEY=pat...
 *   node scripts/list-airtable-bases.mjs
 */
const key = process.env.AIRTABLE_API_KEY?.trim();

if (!key) {
  console.error('Missing AIRTABLE_API_KEY.');
  console.error('  set AIRTABLE_API_KEY=pat_your_token_here');
  console.error('  node scripts/list-airtable-bases.mjs');
  process.exit(1);
}

const res = await fetch('https://api.airtable.com/v0/meta/bases', {
  headers: { Authorization: `Bearer ${key}` },
});

if (res.status === 401) {
  console.error('401 — token invalid or missing schema.bases:read scope.');
  process.exit(1);
}

if (!res.ok) {
  console.error(`Airtable error ${res.status}:`, (await res.text()).slice(0, 300));
  process.exit(1);
}

const data = await res.json();
const bases = data.bases ?? [];

if (bases.length === 0) {
  console.log('No bases found. Add a base to your token in airtable.com/create/tokens');
  process.exit(0);
}

console.log('Bases your token can access:\n');
for (const base of bases) {
  console.log(`  ${base.name}`);
  console.log(`  ID: ${base.id}\n`);
}

console.log('Copy the ID for "Efficiency Architects - Payments & Clients", then run:');
console.log('  set AIRTABLE_PAYMENTS_BASE_ID=app...');
console.log('  node scripts/setup-capture-records-table.mjs');
