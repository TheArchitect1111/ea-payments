import type { ClientConfig } from '../../chassis/runClickTest';
import { tarrisJaneConfig } from './jane';

/** No fabricated Airtable integration: fail closed until an actual catalog is connected. */
export const clientConfig: ClientConfig = {
  id: tarrisJaneConfig.id,
  prices: { ...tarrisJaneConfig.prices },
  catalogSource: async () => ({
    status: 503,
    evidence: 'Tarris catalog not connected to a verified data source',
  }),
  janeUrl: tarrisJaneConfig.janeUrl,
};
