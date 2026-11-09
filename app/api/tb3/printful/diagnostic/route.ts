import type { NextRequest } from 'next/server';
import { authorize, json } from '@/lib/tb3/server';
import { PrintfulError, TB3_PRINTFUL_STORE_ID, tb3Printful } from '@/lib/tb3/printful-client';
import { createTb3PrintfulDiagnosticHandler } from '@/lib/tb3/printful-diagnostic-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = createTb3PrintfulDiagnosticHandler({
  environment: () => ({ vercel: process.env.VERCEL_ENV, branch: process.env.VERCEL_GIT_COMMIT_REF }),
  authorize: (request) => authorize(request as NextRequest, false),
  keyAvailable: () => Boolean(process.env.PRINTFUL_API_KEY?.trim()),
  readCatalogProduct: async (storeId, productId) => {
    if (storeId !== TB3_PRINTFUL_STORE_ID) throw new PrintfulError(0, 'Printful store context mismatch.');
    try {
      return await tb3Printful<{ sync_product?: { id?: number } }>(`/store/products/${productId}`, { method: 'GET' });
    } catch (error) {
      if (error instanceof PrintfulError) throw error;
      throw new PrintfulError(0, 'Printful request failed.');
    }
  },
  json,
});
