import 'server-only';
import { supabaseRest } from '@/lib/simplifi-os/supabase';
import type { ConnectedAccountStore } from './stripe-connect';

type AccountRow = { tenant_id: string; stripe_account_id: string };
/** Server-only atomic tenant merchant mapping; requires private table and service key. */
export const stripeMerchantStore: ConnectedAccountStore = {
  async get(tenantId) {
    const q = new URLSearchParams({tenant_id:'eq.'+tenantId,select:'stripe_account_id',limit:'1'});
    const result = await supabaseRest<AccountRow[]>('ea_merchant_connections?'+q.toString(),
      {headers:{'Cache-Control':'no-store'}});
    if (!result.ok) throw new Error('Merchant registry unavailable');
    return result.data[0]?.stripe_account_id ?? null;
  },
  async putIfAbsent(tenantId,stripeAccountId) {
    const result = await supabaseRest<AccountRow[]>('ea_merchant_connections', {
      method:'POST', prefer:'resolution=ignore-duplicates,return=representation',
      body:JSON.stringify({tenant_id:tenantId,stripe_account_id:stripeAccountId}),
    });
    if (!result.ok) throw new Error('Merchant registry unavailable');
    const saved = result.data[0]?.stripe_account_id ?? await this.get(tenantId);
    if (!saved) throw new Error('Merchant registry write unconfirmed');
    return saved;
  },
};
