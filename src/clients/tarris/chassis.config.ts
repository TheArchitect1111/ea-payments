import type { ClientConfig } from '../../chassis/runClickTest';
export const clientConfig: ClientConfig = {
  id: 'tarris',
  prices: { 'strategy-call': 249 },
  catalogSource: { live: Array(12).fill(0), ready: Array(5).fill(0), name: 'tarris-catalog' },
  janeUrl: 'https://example.com',
};
export const tarrisConfig = clientConfig;
