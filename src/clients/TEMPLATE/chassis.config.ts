import type { ClientConfig } from '../../chassis/runClickTest';
// TEMPLATE — copy to src/clients/[your-client]/
export const clientConfig: ClientConfig = {
  id: 'template-client',
  prices: { 'strategy-call': 249 },
  catalogSource: { live: Array(12).fill(0).map((_,i)=>({id:`live-${i}`})), ready: Array(5).fill(0).map((_,i)=>({id:`ready-${i}`})), name: 'template-catalog' },
  janeUrl: 'https://template.janeapp.com/',
  billingInterval: 'monthly',
};
