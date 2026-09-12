import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const token = process.env.AIRTABLE_ACCESS_TOKEN || process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_PAT;
const baseId = process.env.EA_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_PAYMENTS_BASE_ID || 'appv0YoLIMY45fmDA';
const outDir = process.env.EA_RECOVERY_EXPORT_DIR || path.resolve('.recovery/airtable');

if (!token) {
  console.error('FAIL: Airtable credential missing. Set AIRTABLE_ACCESS_TOKEN, AIRTABLE_TOKEN, AIRTABLE_API_KEY, or AIRTABLE_PAT.');
  process.exit(1);
}

async function airtableJson(url) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getAllRecords(tableId) {
  const records = [];
  let offset;
  do {
    const u = new URL(`https://api.airtable.com/v0/${baseId}/${tableId}`);
    u.searchParams.set('pageSize', '100');
    u.searchParams.set('returnFieldsByFieldId', 'true');
    if (offset) u.searchParams.set('offset', offset);
    const page = await airtableJson(u.toString());
    records.push(...(page.records || []));
    offset = page.offset;
  } while (offset);
  return records;
}

await fs.mkdir(outDir, { recursive: true });
const meta = await airtableJson(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`);
const generatedAt = new Date().toISOString();
const tables = [];

for (const table of meta.tables || []) {
  const records = await getAllRecords(table.id);
  const payload = {
    table: {
      id: table.id,
      name: table.name,
      primaryFieldId: table.primaryFieldId,
      description: table.description || '',
      fields: table.fields || [],
      views: table.views || []
    },
    records
  };
  const filename = `${table.id}.json`;
  const body = JSON.stringify(payload, null, 2);
  await fs.writeFile(path.join(outDir, filename), body, { mode: 0o600 });
  tables.push({
    id: table.id,
    name: table.name,
    recordCount: records.length,
    file: filename,
    sha256: crypto.createHash('sha256').update(body).digest('hex')
  });
}

const manifest = {
  format: 'ea-airtable-recovery-v1',
  baseId,
  generatedAt,
  tableCount: tables.length,
  recordCount: tables.reduce((n, t) => n + t.recordCount, 0),
  tables
};
const manifestBody = JSON.stringify(manifest, null, 2);
await fs.writeFile(path.join(outDir, 'manifest.json'), manifestBody, { mode: 0o600 });
await fs.writeFile(path.join(outDir, 'schema.json'), JSON.stringify({ baseId, generatedAt, tables: meta.tables || [] }, null, 2), { mode: 0o600 });

console.log(`PASS: exported ${manifest.tableCount} tables / ${manifest.recordCount} records to ${outDir}`);
console.log(`Manifest SHA256: ${crypto.createHash('sha256').update(manifestBody).digest('hex')}`);
console.log('Security: export contains production data. Do not commit .recovery/ or upload it to a public location.');
