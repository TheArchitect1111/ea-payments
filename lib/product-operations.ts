/**
 * Product operations summaries for executive command surfaces.
 */

export type Product360Summary = {
  slug: string;
  name: string;
  trademark: string;
  executiveSummary: string;
  ownerDisplay: string;
  status: string;
  health: string;
  purpose: string;
  href: string;
  provenance: { identity: { source: string; confidence: 'High' | 'Medium' | 'Low' } };
};

export const PRODUCT_OPERATIONS_CATALOG: Array<{ slug: string; trademark: string }> = [
  { slug: 'amplifi', trademark: 'Amplifi™' },
  { slug: 'simplifi', trademark: 'Simplifi™' },
  { slug: 'magnifi', trademark: 'Magnifi™' },
  { slug: 'pulse', trademark: 'Pulse™' },
  { slug: 'ctp', trademark: 'Consider the Possibilities™' },
];

export async function getProductOperationsSummaries(): Promise<Product360Summary[]> {
  return PRODUCT_OPERATIONS_CATALOG.map((item) => ({
    slug: item.slug,
    name: item.trademark.replace(/™/g, ''),
    trademark: item.trademark,
    executiveSummary: `${item.trademark} product operations overview.`,
    ownerDisplay: 'Efficiency Architects',
    status: 'Active',
    health: 'Healthy',
    purpose: 'Platform product',
    href: '/admin/products',
    provenance: {
      identity: { source: 'Product operations catalog', confidence: 'Medium' },
    },
  }));
}
