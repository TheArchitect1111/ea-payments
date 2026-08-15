import { decryptAccounts, encryptAccounts, type NativeAccount, type NativeProvider } from '@/lib/amplifi-native-social';
import { isSupabaseReady, supabaseRest } from '@/lib/simplifi-os/supabase';

type StoredConnection = {
  encrypted_accounts: string;
};

type AirtableRecord = {
  id: string;
  fields: {
    'Encrypted Accounts'?: string;
  };
};

const AIRTABLE_BASE_ID =
  process.env.AIRTABLE_PAYMENTS_BASE_ID?.trim() || 'appv0YoLIMY45fmDA';
const AIRTABLE_TABLE =
  process.env.AIRTABLE_AMPLIFI_CONNECTIONS_TABLE_ID?.trim() || 'tbl5Hvzjheden2dfw';

function airtableHeaders(): Record<string, string> {
  const key =
    process.env.AIRTABLE_API_KEY?.trim() ||
    process.env.AIRTABLE_PAT?.trim();
  if (!key) throw new Error('Amplifi connection storage is not configured');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

function escapeFormula(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function connectionKey(portalSlug: string, provider: NativeProvider): string {
  return `${portalSlug}:${provider}`;
}

async function airtableFind(
  portalSlug: string,
  provider?: NativeProvider,
): Promise<AirtableRecord[]> {
  const conditions = [`{Portal Slug}='${escapeFormula(portalSlug)}'`];
  if (provider) conditions.push(`{Provider}='${escapeFormula(provider)}'`);
  const formula = conditions.length === 1 ? conditions[0] : `AND(${conditions.join(',')})`;
  const params = new URLSearchParams({
    filterByFormula: formula,
    pageSize: '100',
  });
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}?${params}`,
    { headers: airtableHeaders(), cache: 'no-store' },
  );
  if (!response.ok) {
    throw new Error(`Unable to load Amplifi connections: ${await response.text()}`);
  }
  const payload = (await response.json()) as { records?: AirtableRecord[] };
  return payload.records ?? [];
}

async function loadFromAirtable(
  portalSlug: string,
  provider?: NativeProvider,
): Promise<NativeAccount[]> {
  const records = await airtableFind(portalSlug, provider);
  return records.flatMap((record) =>
    decryptAccounts(String(record.fields['Encrypted Accounts'] || '')),
  );
}

async function saveToAirtable(
  portalSlug: string,
  provider: NativeProvider,
  accounts: NativeAccount[],
): Promise<void> {
  const existing = await airtableFind(portalSlug, provider);
  const fields = {
    'Connection Key': connectionKey(portalSlug, provider),
    'Portal Slug': portalSlug,
    Provider: provider,
    'Encrypted Accounts': encryptAccounts(accounts),
    'Updated At': new Date().toISOString(),
  };
  const target = existing[0];
  const url = target
    ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${target.id}`
    : `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;
  const response = await fetch(url, {
    method: target ? 'PATCH' : 'POST',
    headers: airtableHeaders(),
    body: JSON.stringify(target ? { fields, typecast: true } : { records: [{ fields }], typecast: true }),
  });
  if (!response.ok) {
    throw new Error(`Unable to save Amplifi connections: ${await response.text()}`);
  }
}

async function deleteFromAirtable(
  portalSlug: string,
  provider: NativeProvider,
): Promise<void> {
  const existing = await airtableFind(portalSlug, provider);
  await Promise.all(
    existing.map(async (record) => {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${record.id}`,
        { method: 'DELETE', headers: airtableHeaders() },
      );
      if (!response.ok) {
        throw new Error(`Unable to delete Amplifi connections: ${await response.text()}`);
      }
    }),
  );
}

export async function loadAmplifiConnections(
  portalSlug: string,
  provider?: NativeProvider,
): Promise<NativeAccount[]> {
  if (!isSupabaseReady()) return loadFromAirtable(portalSlug, provider);
  const providerFilter = provider ? `&provider=eq.${encodeURIComponent(provider)}` : '';
  const result = await supabaseRest<StoredConnection[]>(
    `amplifi_social_connections?select=encrypted_accounts&portal_slug=eq.${encodeURIComponent(portalSlug)}${providerFilter}`,
    { cache: 'no-store' },
  );
  if (!result.ok) throw new Error(`Unable to load Amplifi connections: ${result.error}`);
  return result.data.flatMap((row) => decryptAccounts(row.encrypted_accounts));
}

export async function saveAmplifiConnections(
  portalSlug: string,
  provider: NativeProvider,
  accounts: NativeAccount[],
): Promise<void> {
  if (!isSupabaseReady()) return saveToAirtable(portalSlug, provider, accounts);
  const result = await supabaseRest(
    'amplifi_social_connections?on_conflict=portal_slug,provider',
    {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: JSON.stringify({
        portal_slug: portalSlug,
        provider,
        encrypted_accounts: encryptAccounts(accounts),
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!result.ok) throw new Error(`Unable to save Amplifi connections: ${result.error}`);
}

export async function deleteAmplifiConnections(
  portalSlug: string,
  provider: NativeProvider,
): Promise<void> {
  if (!isSupabaseReady()) return deleteFromAirtable(portalSlug, provider);
  const result = await supabaseRest(
    `amplifi_social_connections?portal_slug=eq.${encodeURIComponent(portalSlug)}&provider=eq.${encodeURIComponent(provider)}`,
    { method: 'DELETE' },
  );
  if (!result.ok) throw new Error(`Unable to delete Amplifi connections: ${result.error}`);
}
