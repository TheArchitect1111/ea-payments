import type { ClientConfig } from '../../chassis/runClickTest';
export const clientConfig: ClientConfig = {
  id: 'amanda',
  prices: { 'strategy-call': 249 },
  catalogSource: { live: Array(12).fill(0).map((_,i)=>({id:`live-${i}`})), ready: Array(5).fill(0).map((_,i)=>({id:`ready-${i}`})), name: 'amanda-audit-catalog' },
  janeUrl: 'https://aesthetikine.janeapp.com/',
};
export const auditLiveAmandaCatalog = clientConfig.catalogSource;
