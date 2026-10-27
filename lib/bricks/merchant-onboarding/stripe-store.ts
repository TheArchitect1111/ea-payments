import 'server-only';
import { Client } from 'pg';
import type { ConnectedAccountStore } from './stripe-connect';

type AccountRow = { stripe_account_id: string };
function getMerchantConfig() {
  const raw = process.env.EA_MERCHANT_DATABASE_URL;
  if (!raw) throw new Error('Restricted merchant database not configured');
  const url = new URL(raw);
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') throw new Error('Invalid merchant database protocol');
  if (url.username !== 'ea_merchant_api' && !url.username.startsWith('ea_merchant_api.')) throw new Error('Merchant DB must use restricted account');
  if (!url.hostname.endsWith('.supabase.com')) throw new Error('Unexpected merchant database hostname');
  if (url.searchParams.get('sslmode') === 'disable') throw new Error('Merchant DB TLS is required');
  // pg connection-string sslmode settings can silently replace explicit TLS verification.
  // Force our server-side rejectUnauthorized configuration to take precedence.
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
/** Restricted database account; no REST service_role key or shared database fallback. */
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
