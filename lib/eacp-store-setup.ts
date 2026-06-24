import { getAirtableApiKey } from './integration-env';

const AIRTABLE_BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const AIRTABLE_TABLE = process.env.EACP_AIRTABLE_TABLE?.trim() || 'EACP Store';
const AIRTABLE_KEY_FIELD = process.env.EACP_AIRTABLE_KEY_FIELD?.trim() || 'Key';
const AIRTABLE_PAYLOAD_FIELD = process.env.EACP_AIRTABLE_PAYLOAD_FIELD?.trim() || 'Payload';

type AirtableMetaField = {
  id?: string;
  name: string;
  type: string;
};

type AirtableMetaTable = {
  id: string;
  name: string;
  fields?: AirtableMetaField[];
};

async function fetchTables(key: string): Promise<AirtableMetaTable[]> {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Airtable metadata read failed (${res.status}).`);
  }
  const data = await res.json() as { tables?: AirtableMetaTable[] };
  return data.tables ?? [];
}

async function createField(key: string, tableId: string, fieldName: string, type: string) {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables/${tableId}/fields`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: fieldName, type }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Airtable field setup failed for ${fieldName} (${res.status}). ${detail}`.trim());
  }
}

export async function ensureEACPStoreTable() {
  const key = getAirtableApiKey();
  if (!key) {
    return { ok: false, error: 'AIRTABLE_API_KEY or AIRTABLE_PAT is not configured.' };
  }

  const tables = await fetchTables(key);
  let table = tables.find((item) => item.name === AIRTABLE_TABLE);
  let tableCreated = false;

  if (!table) {
    const res = await fetch(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: AIRTABLE_TABLE,
        fields: [
          { name: AIRTABLE_KEY_FIELD, type: 'singleLineText' },
          { name: AIRTABLE_PAYLOAD_FIELD, type: 'multilineText' },
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Airtable table setup failed (${res.status}). ${detail}`.trim());
    }
    table = await res.json() as AirtableMetaTable;
    tableCreated = true;
  }

  const fieldNames = new Set((table.fields ?? []).map((field) => field.name));
  const fieldsCreated: string[] = [];

  if (!fieldNames.has(AIRTABLE_KEY_FIELD)) {
    await createField(key, table.id, AIRTABLE_KEY_FIELD, 'singleLineText');
    fieldsCreated.push(AIRTABLE_KEY_FIELD);
  }
  if (!fieldNames.has(AIRTABLE_PAYLOAD_FIELD)) {
    await createField(key, table.id, AIRTABLE_PAYLOAD_FIELD, 'multilineText');
    fieldsCreated.push(AIRTABLE_PAYLOAD_FIELD);
  }

  return {
    ok: true,
    baseId: AIRTABLE_BASE_ID,
    tableName: AIRTABLE_TABLE,
    tableId: table.id,
    tableCreated,
    fieldsCreated,
  };
}
