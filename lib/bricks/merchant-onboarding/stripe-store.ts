import 'server-only';
import { Client } from 'pg';
import type { ConnectedAccountStore } from './stripe-connect';

type AccountRow = { 
  stripe_account_id: string;
  mode?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
};

function getMerchantConfig() {
  const raw = process.env.EA_MERCHANT_DATABASE_URL;
  if (!raw) throw new Error('Restricted merchant database not configured');
  const url = new URL(raw);
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') throw new Error('Invalid merchant database protocol');
  if (url.username !== 'ea_merchant_api' && !url.username.startsWith('ea_merchant_api.')) throw new Error('Merchant DB must use restricted account');
  if (!url.hostname.endsWith('.supabase.com')) throw new Error('Unexpected merchant database hostname');
  if (url.searchParams.get('sslmode') === 'disable') throw new Error('Merchant DB TLS is required');
  url.searchParams.delete('sslmode');
  url.searchParams.delete('sslrootcert');
  url.searchParams.delete('sslcert');
  url.searchParams.delete('sslkey');
  return url.toString();
}

async function withMerchantDb<T>(fn:(client:Client)=>Promise<T>):Promise<T> {
  const client=new Client({connectionString:getMerchantConfig(),ssl:{rejectUnauthorized:true,...(process.env.EA_MERCHANT_DB_CA_PEM ? {ca:process.env.EA_MERCHANT_DB_CA_PEM} : {})},connectionTimeoutMillis:5000,query_timeout:8000,statement_timeout:8000});
  await client.connect();
  try { return await fn(client); } finally { await client.end(); }
}

// Direct mode helpers - new table columns: mode, charges_enabled, payouts_enabled, details_submitted
export async function getDirectConnection(tenantId: string) {
  return withMerchantDb(async client => {
    const found = await client.query<AccountRow>(
      'SELECT stripe_account_id FROM public.ea_merchant_connections WHERE tenant_id=$1 LIMIT 1',
      [tenantId]
    );
    return found.rows[0] ?? null;
  });
}

export async function saveDirectConnection(
  tenantId: string,
  accountId: string,
  status: { charges_enabled: boolean; payouts_enabled: boolean; details_submitted: boolean }
) {
  return withMerchantDb(async client => {
    // upsert - supports both old schema (just stripe_account_id) and new schema with mode columns
    // If new columns don't exist yet, fallback to simple upsert
    try {
      const result = await client.query(
        `INSERT INTO public.ea_merchant_connections 
         (tenant_id, stripe_account_id, mode, charges_enabled, payouts_enabled, details_submitted, updated_at)
         VALUES ($1,$2,'direct',$3,$4,$5,NOW())
         ON CONFLICT (tenant_id) DO UPDATE SET
           stripe_account_id = EXCLUDED.stripe_account_id,
           mode = 'direct',
           charges_enabled = EXCLUDED.charges_enabled,
           payouts_enabled = EXCLUDED.payouts_enabled,
           details_submitted = EXCLUDED.details_submitted,
           updated_at = NOW()
         RETURNING stripe_account_id`,
        [tenantId, accountId, status.charges_enabled, status.payouts_enabled, status.details_submitted]
      );
      return result.rows[0]?.stripe_account_id;
    } catch (e: any) {
      // Fallback for old schema without new columns
      const fallback = await client.query(
        `INSERT INTO public.ea_merchant_connections (tenant_id, stripe_account_id)
         VALUES ($1,$2)
         ON CONFLICT (tenant_id) DO UPDATE SET stripe_account_id = EXCLUDED.stripe_account_id
         RETURNING stripe_account_id`,
        [tenantId, accountId]
      );
      return fallback.rows[0]?.stripe_account_id;
    }
  });
}

/** Legacy Connect store - preserved for rollback, but no longer used for tarris */
export const stripeMerchantStore: ConnectedAccountStore = {
  async get(tenantId) {
    return withMerchantDb(async client => {
      const found=await client.query<AccountRow>(
        'SELECT stripe_account_id FROM public.ea_merchant_connections WHERE tenant_id=$1 LIMIT 1',
        [tenantId]);
      return found.rows[0]?.stripe_account_id ?? null;
    });
  },
  async putIfAbsent(tenantId,stripeAccountId) {
    return withMerchantDb(async client => {
      const found=await client.query<AccountRow>(
        'INSERT INTO public.ea_merchant_connections (tenant_id,stripe_account_id) VALUES ($1,$2) ON CONFLICT (tenant_id) DO NOTHING RETURNING stripe_account_id',
        [tenantId,stripeAccountId]);
      if (found.rows[0]) return found.rows[0].stripe_account_id;
      const existing=await client.query<AccountRow>(
        'SELECT stripe_account_id FROM public.ea_merchant_connections WHERE tenant_id=$1 LIMIT 1',
        [tenantId]);
      if (!existing.rows[0]) throw new Error('Merchant registry write unconfirmed');
      return existing.rows[0].stripe_account_id;
    });
  },
};
