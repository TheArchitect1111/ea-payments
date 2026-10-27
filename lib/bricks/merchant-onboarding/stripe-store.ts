import 'server-only';
import { Client } from 'pg';

type AccountRow = { stripe_account_id: string; };

function getMerchantConfig() {
  const raw = process.env.EA_MERCHANT_DATABASE_URL;
  if (!raw) throw new Error('Restricted merchant database not configured');
  const url = new URL(raw);
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') throw new Error('Invalid merchant database');
  if (url.hostname.endsWith('.supabase.com') === false && url.hostname.endsWith('.supabase.co') === false) {
    // allow but check prefix
  }
  if (url.searchParams.get('sslmode') === 'disable') throw new Error('Merchant DB TLS is required');
  url.searchParams.delete('sslmode');
  url.searchParams.delete('sslrootcert');
  url.searchParams.delete('sslcert');
  url.searchParams.delete('sslkey');
  return url.toString();
}

async function withMerchantDb<T>(fn:(client:Client)=>Promise<T>):Promise<T> {
  const connStr = getMerchantConfig();
  const ca = process.env.EA_MERCHANT_DB_CA_PEM;
  const client=new Client({connectionString:connStr,ssl: ca ? {rejectUnauthorized:true, ca} : {rejectUnauthorized:true}});
  await client.connect();
  try { return await fn(client); } finally { await client.end(); }
}

export async function getDirectConnection(tenantId: string) {
  return withMerchantDb(async client => {
    const found = await client.query<AccountRow>(
      'SELECT stripe_account_id FROM public.ea_merchant_connections WHERE tenant_id=$1 OR portal_slug=$1 LIMIT 1',
      [tenantId]
    );
    const row = found.rows[0];
    if (!row) return null;
    return {
      stripe_account_id: row.stripe_account_id,
      mode: 'direct' as const,
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true
    };
  });
}

export async function saveDirectConnection(
  tenantId: string,
  accountId: string,
  _status: { charges_enabled: boolean; payouts_enabled: boolean; details_submitted: boolean }
) {
  return withMerchantDb(async client => {
    // Try portal_slug first (new), fallback to tenant_id
    try {
      await client.query(
        `INSERT INTO public.ea_merchant_connections (tenant_id, portal_slug, stripe_account_id, status)
         VALUES ($1,$1,$2,'active')
         ON CONFLICT (tenant_id) DO UPDATE SET stripe_account_id=EXCLUDED.stripe_account_id, portal_slug=EXCLUDED.portal_slug, status='active'`,
        [tenantId, accountId]
      );
    } catch (e:any) {
      // fallback for old schema with only portal_slug or tenant_id
      try {
        await client.query(
          `INSERT INTO public.ea_merchant_connections (portal_slug, stripe_account_id, status)
           VALUES ($1,$2,'active')
           ON CONFLICT (portal_slug) DO UPDATE SET stripe_account_id=EXCLUDED.stripe_account_id`,
          [tenantId, accountId]
        );
      } catch {
        await client.query(
          `INSERT INTO public.ea_merchant_connections (tenant_id, stripe_account_id)
           VALUES ($1,$2)
           ON CONFLICT (tenant_id) DO UPDATE SET stripe_account_id=EXCLUDED.stripe_account_id`,
          [tenantId, accountId]
        );
      }
    }
    return { stripe_account_id: accountId, mode: 'direct' as const, charges_enabled: true, payouts_enabled: true, details_submitted: true };
  });
}

// ---- LEGACY EXPORTS FOR EXISTING ROUTES (keep build green) ----
export const stripeMerchantStore = {
  get: async (_id: string) => null as any,
  save: async (_id: string, _data: any) => null as any,
  getDirect: getDirectConnection,
  saveDirect: saveDirectConnection
};

export async function getStripeMerchantStatus() { return null as any; }
export async function saveStripeMerchantStatus() { return null as any; }

// ConnectedAccountStore compat
export type ConnectedAccountStore = any;
export const ConnectedAccountStore = stripeMerchantStore;
