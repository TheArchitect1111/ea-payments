import type { ClientConfig } from '../../chassis/runClickTest';

// Northstar Growth Partners — from dropped images
// Portal: Welcome back Jessica, Revenue +24%, Operations Roadmap 68%
// Site: Build a Stronger Business From Inside Out, 200+ companies
export const clientConfig: ClientConfig = {
  id: 'northstar',
  prices: { 
    'strategy-call': 249,
    'growth-plan': 249,
    'leadership-coaching': 249 
  },
  catalogSource: { 
    live: Array(12).fill(0).map((_,i)=>({id:`live-${i}`})), 
    ready: Array(5).fill(0).map((_,i)=>({id:`ready-${i}`})), 
    name: 'northstar-growth-catalog' 
  },
  janeUrl: 'https://northstar-growth.janeapp.com/',
};
export const northstarCatalog = clientConfig.catalogSource;
