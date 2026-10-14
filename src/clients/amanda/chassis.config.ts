import type { ClientConfig } from '../../chassis/runClickTest';
import { amandaPrices } from './offers';
import { auditLiveAmandaCatalog } from './catalog';
import { amandaJaneConfig } from './jane';

export const clientConfig: ClientConfig = {
  id: 'amanda',
  prices: { 'strategy-call': Math.round(amandaPrices.price('strategy-call').amountCad * 100) },
  catalogSource: auditLiveAmandaCatalog,
  janeUrl: amandaJaneConfig.janeUrl,
};
