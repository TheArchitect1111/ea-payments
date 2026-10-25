import 'server-only';

import type { ConnectedAccountStore } from './stripe-connect';

type AccountRow = { tenant_id: string; stripe_account_id: string };
async function merchantRest(path: string, init: RequestInit & {prefer?: string} = {}): Promise<AccountRow[]> {
  const url = process.env.EA_MERCHANT_DB_URL?.trim().replace(/\/$/, '');
  const key = process.env.EA_MERCHANT_DB_SERVICE_KEY?.trim();
  if (!url || !key || !/^https:\/\//.test(url)) throw new Error('Dedicated merchant database not configured');
  const headers = new Headers(init.headers);
  headers.set('apikey',key);
  headers.set('Authorization','Bearer '+key);
  headers.set('Content-Type','application/json');
  headers.set('Cache-Control','no-store');
  if(init.prefer) headers.set('Prefer',init.prefer);
  const result = await fetch(url+'/rest/v1/'+path,{...init,headers,cache:'no-store'});
  if(!result.ok) throw new Error('Merchant registry unavailable');
  return await result.json() as AccountRow[];
}
/** Server-only atomic tenant merchant mapping; requires private table and service key. */
export const stripeMerchantStore: ConnectedAccountStore = {
  async get(tenantId) {
    const q = new URLSearchParams({tenant_id:'eq.'+tenantId,select:'stripe_account_id',limit:'1'});
    const rows = await merchantRest('ea_merchant_connections?'+q.toString());
    return rows[0]?.stripe_account_id ?? null;
  },
  async putIfAbsent(tenantId,stripeAccountId) {
    const rows = await merchantRest('ea_merchant_connections', {
      method:'POST', prefer:'resolution=ignore-duplicates,return=representation',
      body:JSON.stringify({tenant_id:tenantId,stripe_account_id:stripeAccountId}),
    });
    const saved = rows[0]?.stripe_account_id ?? await this.get(tenantId);
    if (!saved) throw new Error('Merchant registry write unconfirmed');
    return saved;
  },
};
