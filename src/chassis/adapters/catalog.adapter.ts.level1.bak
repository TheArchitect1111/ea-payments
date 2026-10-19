import { sourceAdapter } from './sourceAdapter';
import type { BrickHealth } from '../BrickInterface';

/** Client supplies an actual catalog health query, not a client-name string. */
export type CatalogSource = () => Promise<BrickHealth>;
export function createCatalogAdapter(source: CatalogSource) {
  return sourceAdapter({
    id: 'catalog',
    files: [],
    verify: async () => {
      if (typeof source !== 'function') return { status: 503, evidence: 'Catalog source not configured' };
      try {
        const result = await source();
        return { status: result.status, evidence: 'Client catalog query: ' + result.evidence };
      } catch (error) {
        return { status: 503, evidence: 'Catalog source request failed: ' + String(error) };
      }
    },
  });
}
export const catalogAdapter = createCatalogAdapter(async () => ({
  status: 503,
  evidence: 'No client catalog attached',
}));
