import type { NextRequest } from 'next/server';
import { authorize, handled, json } from '@/lib/tb3/server';
import { tb3Printful } from '@/lib/tb3/printful-client';
import catalog from '@/public/tb3/merch/manifest.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PrintfulProduct = { id: number; name: string };
type PrintfulListing = { sync_variants?: { id: number; variant_id: number }[] };

export async function GET(req: NextRequest) {
  return handled(async () => {
    await authorize(req, true);
    const synced: PrintfulProduct[] = [];
    // Store product API is paginated. Fail closed rather than return a partial PASS.
    for (let offset = 0; offset < 1000; offset += 100) {
      const batch = await tb3Printful<PrintfulProduct[]>(
        '/store/products?limit=100&offset=' + offset,
      );
      synced.push(...batch);
      if (batch.length < 100) break;
      if (offset === 900) return json({ verified: false, reason: 'catalog-pagination-limit' }, 503);
    }

    const available = new Set(synced.map(x => x.id));
    const results: { id: string; productId: number; status: string; missingVariants: number[] }[] = [];
    for (const product of catalog) {
      if (!available.has(product.printfulProductId)) {
        results.push({ id: product.id, productId: product.printfulProductId,
          status: 'missing', missingVariants: product.variants.map(x => x.id) });
        continue;
      }
      const listing = await tb3Printful<PrintfulListing>(
        '/store/products/' + product.printfulProductId,
      );
      const ids = new Set((listing.sync_variants ?? []).map(x => x.id));
      const missingVariants = product.variants.filter(x => !ids.has(x.id)).map(x => x.id);
      results.push({ id: product.id, productId: product.printfulProductId,
        status: missingVariants.length ? 'variant-mismatch' : 'matched', missingVariants });
    }
    return json({
      source: 'live-printful-api',
      store: 'tb3',
      configuredProductCount: catalog.length,
      matchedProductCount: results.filter(x => x.status === 'matched').length,
      verified: results.length === catalog.length &&
        results.every(x => x.status === 'matched'),
      products: results,
      note: 'Presence and variant IDs only. Artwork print quality, printing costs, shipping, and billing remain separately unverified.',
    });
  });
}
