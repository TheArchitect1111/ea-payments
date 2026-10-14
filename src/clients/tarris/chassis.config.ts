import type { ClientConfig } from '../../chassis/runClickTest';
import { tarrisJaneConfig } from './jane';
import { tarrisCommerce } from './commerce';
import { airtableQuery } from '@/lib/data/airtable-client';
import { TB3_ENTITLEMENTS_TABLE } from '@/lib/tb3/paid-access';

/** No fabricated Airtable integration: fail closed until an actual catalog is connected. */
export const clientConfig: ClientConfig = {
  id: tarrisJaneConfig.id,
  prices: { ...tarrisJaneConfig.prices },
  catalogSource: async () => {
    try {
      const records = await airtableQuery(TB3_ENTITLEMENTS_TABLE, { maxRecords: 1, strict: true });
      return { status: 200, evidence: `Real TB3 entitlement ledger readable; ${records.length} sampled rows. Not a course inventory count.` };
    } catch { return { status: 503, evidence: 'Real TB3 Airtable entitlement ledger unavailable' }; }
  },
  commerce: tarrisCommerce,
  janeUrl: tarrisJaneConfig.janeUrl,
};

export const tarrisConfig = clientConfig;
