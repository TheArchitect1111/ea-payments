import { sourceAdapter } from './sourceAdapter';
import type { BrickHealth } from '../BrickInterface';

export type CatalogSource = () => Promise<BrickHealth>;

export function createCatalogAdapter(source: CatalogSource) {
  return sourceAdapter({
    id: 'catalog',
    files: [],
    verify: async () => {
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

export default catalogAdapter;
