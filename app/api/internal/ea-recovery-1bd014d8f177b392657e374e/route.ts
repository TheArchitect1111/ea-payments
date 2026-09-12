import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function airtableToken() {
  return (
    process.env.AIRTABLE_ACCESS_TOKEN ||
    process.env.AIRTABLE_TOKEN ||
    process.env.AIRTABLE_API_KEY ||
    process.env.AIRTABLE_PAT ||
    ''
  ).trim();
}

async function airtableJson(url: string, token: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Airtable ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  return response.json();
}

async function getAllRecords(baseId: string, tableId: string, token: string) {
  const records: any[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${tableId}`);
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('returnFieldsByFieldId', 'true');
    if (offset) url.searchParams.set('offset', offset);
    const page = await airtableJson(url.toString(), token);
    records.push(...(page.records || []));
    offset = page.offset;
  } while (offset);
  return records;
}

export async function GET() {
  const token = airtableToken();
  if (!token) {
    return Response.json({ status: 'BLOCKED', reason: 'Airtable runtime credential unavailable' }, { status: 503 });
  }

  const baseId = process.env.AIRTABLE_PAYMENTS_BASE_ID || process.env.EA_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID || 'appv0YoLIMY45fmDA';
  const generatedAt = new Date().toISOString();

  try {
    const meta = await airtableJson(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, token);
    const tables: any[] = [];
    let recordCount = 0;

    const db = new DatabaseSync(':memory:');
    db.exec('CREATE TABLE ea_table_schema (table_id TEXT PRIMARY KEY, table_name TEXT NOT NULL, schema_json TEXT NOT NULL)');
    db.exec('CREATE TABLE ea_records (table_id TEXT NOT NULL, record_id TEXT NOT NULL, created_time TEXT, fields_json TEXT NOT NULL, PRIMARY KEY (table_id, record_id))');
    const insertSchema = db.prepare('INSERT INTO ea_table_schema (table_id, table_name, schema_json) VALUES (?, ?, ?)');
    const insertRecord = db.prepare('INSERT INTO ea_records (table_id, record_id, created_time, fields_json) VALUES (?, ?, ?, ?)');

    for (const table of meta.tables || []) {
      const records = await getAllRecords(baseId, table.id, token);
      const body = JSON.stringify({ table, records });
      const sha256 = createHash('sha256').update(body).digest('hex');
      tables.push({ id: table.id, name: table.name, recordCount: records.length, sha256 });
      recordCount += records.length;
      insertSchema.run(table.id, table.name, JSON.stringify(table));
      for (const record of records) {
        insertRecord.run(table.id, record.id, record.createdTime || null, JSON.stringify(record.fields || {}));
      }
    }

    const integrity = String(db.prepare('PRAGMA integrity_check').get()?.integrity_check || 'unknown');
    const sqliteTableCount = Number((db.prepare('SELECT COUNT(*) AS n FROM ea_table_schema').get() as any)?.n || 0);
    const sqliteRecordCount = Number((db.prepare('SELECT COUNT(*) AS n FROM ea_records').get() as any)?.n || 0);

    const manifest = {
      format: 'ea-airtable-recovery-v1',
      baseId,
      generatedAt,
      tableCount: tables.length,
      recordCount,
      tables,
    };
    const manifestJson = JSON.stringify(manifest);
    const manifestSha256 = createHash('sha256').update(manifestJson).digest('hex');

    let durableArchive: { stored: boolean; url?: string; pathname?: string; reason?: string } = { stored: false };
    try {
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      if (!blobToken) {
        durableArchive = { stored: false, reason: 'BLOB_READ_WRITE_TOKEN unavailable' };
      } else {
        const { put } = await import('@vercel/blob');
        const archive = {
          manifest,
          schema: meta.tables || [],
          tables: await Promise.all((meta.tables || []).map(async (table: any) => ({
            table,
            records: await getAllRecords(baseId, table.id, token),
          }))),
        };
        const compressed = gzipSync(Buffer.from(JSON.stringify(archive)));
        const pathname = `ea-recovery/airtable/${generatedAt.replace(/[:.]/g, '-')}-${manifestSha256.slice(0, 16)}.json.gz`;
        const blob = await put(pathname, compressed, {
          access: 'private',
          token: blobToken,
          addRandomSuffix: false,
          contentType: 'application/gzip',
        });
        durableArchive = { stored: true, url: blob.url, pathname: blob.pathname };
      }
    } catch (error) {
      durableArchive = { stored: false, reason: error instanceof Error ? error.message : String(error) };
    }

    const pass = integrity === 'ok' && sqliteTableCount === tables.length && sqliteRecordCount === recordCount;
    return Response.json({
      status: pass ? 'PASS' : 'FAIL',
      baseId,
      generatedAt,
      source: 'live-airtable-runtime',
      tableCount: tables.length,
      recordCount,
      manifestSha256,
      sqliteRestore: {
        integrity,
        tableCount: sqliteTableCount,
        recordCount: sqliteRecordCount,
      },
      durableArchive,
      secretValuesExposed: false,
    }, { status: pass ? 200 : 500 });
  } catch (error) {
    return Response.json({
      status: 'FAIL',
      reason: error instanceof Error ? error.message : String(error),
      secretValuesExposed: false,
    }, { status: 500 });
  }
}
