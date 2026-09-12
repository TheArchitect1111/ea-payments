import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';

const token = (
  process.env.AIRTABLE_ACCESS_TOKEN ||
  process.env.AIRTABLE_TOKEN ||
  process.env.AIRTABLE_API_KEY ||
  process.env.AIRTABLE_PAT ||
  ''
).trim();
const baseId = process.env.AIRTABLE_PAYMENTS_BASE_ID || process.env.EA_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID || 'appv0YoLIMY45fmDA';

if (!token) {
  console.error('EA_RECOVERY_PROOF', JSON.stringify({ status: 'BLOCKED', reason: 'Airtable credential unavailable in Vercel preview environment' }));
  process.exit(1);
}

async function airtableJson(url) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Airtable ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response.json();
}

async function getAllRecords(tableId) {
  const records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${tableId}`);
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('returnFieldsByFieldId', 'true');
    if (offset) url.searchParams.set('offset', offset);
    const page = await airtableJson(url.toString());
    records.push(...(page.records || []));
    offset = page.offset;
  } while (offset);
  return records;
}

try {
  const meta = await airtableJson(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`);
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE ea_table_schema (table_id TEXT PRIMARY KEY, table_name TEXT NOT NULL, schema_json TEXT NOT NULL)');
  db.exec('CREATE TABLE ea_records (table_id TEXT NOT NULL, record_id TEXT NOT NULL, created_time TEXT, fields_json TEXT NOT NULL, PRIMARY KEY (table_id, record_id))');
  const insertSchema = db.prepare('INSERT INTO ea_table_schema (table_id, table_name, schema_json) VALUES (?, ?, ?)');
  const insertRecord = db.prepare('INSERT INTO ea_records (table_id, record_id, created_time, fields_json) VALUES (?, ?, ?, ?)');

  const tables = [];
  const archiveTables = [];
  let recordCount = 0;

  for (const table of meta.tables || []) {
    const records = await getAllRecords(table.id);
    const tablePayload = JSON.stringify({ table, records });
    const sha256 = createHash('sha256').update(tablePayload).digest('hex');
    tables.push({ id: table.id, name: table.name, recordCount: records.length, sha256 });
    archiveTables.push({ table, records });
    recordCount += records.length;
    insertSchema.run(table.id, table.name, JSON.stringify(table));
    for (const record of records) {
      insertRecord.run(table.id, record.id, record.createdTime || null, JSON.stringify(record.fields || {}));
    }
  }

  const integrity = String(db.prepare('PRAGMA integrity_check').get()?.integrity_check || 'unknown');
  const sqliteTableCount = Number(db.prepare('SELECT COUNT(*) AS n FROM ea_table_schema').get()?.n || 0);
  const sqliteRecordCount = Number(db.prepare('SELECT COUNT(*) AS n FROM ea_records').get()?.n || 0);
  const generatedAt = new Date().toISOString();
  const manifest = { format: 'ea-airtable-recovery-v1', baseId, generatedAt, tableCount: tables.length, recordCount, tables };
  const manifestJson = JSON.stringify(manifest);
  const manifestSha256 = createHash('sha256').update(manifestJson).digest('hex');

  let durableArchive = { stored: false, reason: 'BLOB_READ_WRITE_TOKEN unavailable' };
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob');
      const compressed = gzipSync(Buffer.from(JSON.stringify({ manifest, schema: meta.tables || [], tables: archiveTables })));
      const pathname = `ea-recovery/airtable/${generatedAt.replace(/[:.]/g, '-')}-${manifestSha256.slice(0, 16)}.json.gz`;
      const blob = await put(pathname, compressed, {
        access: 'private',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        contentType: 'application/gzip',
      });
      durableArchive = { stored: true, pathname: blob.pathname, url: blob.url };
    } catch (error) {
      durableArchive = { stored: false, reason: error instanceof Error ? error.message : String(error) };
    }
  }

  const status = integrity === 'ok' && sqliteTableCount === tables.length && sqliteRecordCount === recordCount ? 'PASS' : 'FAIL';
  const proof = {
    status,
    source: 'live-airtable-via-vercel-preview-build',
    baseId,
    generatedAt,
    tableCount: tables.length,
    recordCount,
    manifestSha256,
    sqliteRestore: { integrity, tableCount: sqliteTableCount, recordCount: sqliteRecordCount },
    durableArchive,
    secretValuesExposed: false,
  };
  console.log('EA_RECOVERY_PROOF', JSON.stringify(proof));
  if (status !== 'PASS') process.exit(1);
} catch (error) {
  console.error('EA_RECOVERY_PROOF', JSON.stringify({ status: 'FAIL', reason: error instanceof Error ? error.message : String(error), secretValuesExposed: false }));
  process.exit(1);
}
