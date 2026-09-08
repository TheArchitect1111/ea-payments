import { decryptAccounts, encryptAccounts, type NativeAccount } from '@/lib/amplifi-native-social';

const AIRTABLE_BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID?.trim() || 'appv0YoLIMY45fmDA';
const AIRTABLE_TABLE = process.env.AIRTABLE_AMPLIFI_CONNECTIONS_TABLE_ID?.trim() || 'tbl5Hvzjheden2dfw';
const PROVIDER = 'gateway';

function headers(): Record<string, string> {
  const key = process.env.AIRTABLE_API_KEY?.trim() || process.env.AIRTABLE_PAT?.trim();
  if (!key) throw new Error('Amplifi gateway profile storage is not configured');
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

function escapeFormula(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function findRecord(portalSlug: string): Promise<{ id: string; encrypted: string } | null> {
  const formula = `AND({Portal Slug}='${escapeFormula(portalSlug)}',{Provider}='${PROVIDER}')`;
  const params = new URLSearchParams({ filterByFormula: formula, pageSize: '1' });
  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}?${params}`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Unable to load Amplifi gateway profile: ${await response.text()}`);
  const payload = (await response.json()) as { records?: Array<{ id: string; fields?: { 'Encrypted Accounts'?: string } }> };
  const record = payload.records?.[0];
  return record ? { id: record.id, encrypted: String(record.fields?.['Encrypted Accounts'] || '') } : null;
}

export async function loadGatewayProfileKey(portalSlug: string): Promise<string> {
  const record = await findRecord(portalSlug);
  if (!record?.encrypted) return '';
  const accounts = decryptAccounts(record.encrypted);
  return accounts[0]?.accessToken?.trim() || '';
}

export async function saveGatewayProfileKey(portalSlug: string, profileKey: string): Promise<void> {
  const existing = await findRecord(portalSlug);
  const record = {
    id: `ayrshare:${portalSlug}`,
    provider: 'x',
    platform: 'x',
    name: 'Amplifi Publishing Gateway',
    accessToken: profileKey,
  } as NativeAccount;
  const fields = {
    'Connection Key': `${portalSlug}:${PROVIDER}`,
    'Portal Slug': portalSlug,
    Provider: PROVIDER,
    'Encrypted Accounts': encryptAccounts([record]),
    'Updated At': new Date().toISOString(),
  };
  const url = existing
    ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${existing.id}`
    : `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;
  const response = await fetch(url, {
    method: existing ? 'PATCH' : 'POST',
    headers: headers(),
    body: JSON.stringify(existing ? { fields, typecast: true } : { records: [{ fields }], typecast: true }),
  });
  if (!response.ok) throw new Error(`Unable to save Amplifi gateway profile: ${await response.text()}`);
}
