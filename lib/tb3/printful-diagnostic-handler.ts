import { PrintfulError } from './printful-transport';

const PREVIEW_BRANCH = 'work/tb3-commerce-hq-20261109';
const STORE_ID = 18945233;
const PROBE_SYNC_PRODUCT_ID = 485112609;

type PrintfulProbeResult = { sync_product?: { id?: number } };

export function createTb3PrintfulDiagnosticHandler(deps: {
  environment: () => { vercel: string | undefined; branch: string | undefined };
  authorize: (request: Request) => Promise<unknown>;
  keyAvailable: () => boolean;
  readCatalogProduct: (storeId: number, productId: number) => Promise<PrintfulProbeResult>;
  json?: (body: unknown, status?: number) => Response;
}) {
  const json = deps.json ?? ((body, status = 200) => Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  }));

  return async function GET(request: Request): Promise<Response> {
    const environment = deps.environment();
    if (environment.vercel !== 'preview' || environment.branch !== PREVIEW_BRANCH) {
      return json({ ok: false, error: 'Not found.' }, 404);
    }

    try {
      await deps.authorize(request);
    } catch (error) {
      const status = error && typeof error === 'object' && 'status' in error
        && typeof error.status === 'number' ? error.status : 403;
      return json({ ok: false, error: 'Private TB3 HQ access required.' }, status);
    }

    const available = deps.keyAvailable();
    if (!available) {
      return json({
        keyAvailable: false,
        authentication: 'NOT TESTED',
        storeIdentity: 'UNVERIFIED',
      });
    }

    try {
      const result = await deps.readCatalogProduct(STORE_ID, PROBE_SYNC_PRODUCT_ID);
      return json({
        keyAvailable: true,
        authentication: 'PASS',
        storeIdentity: result.sync_product?.id === PROBE_SYNC_PRODUCT_ID ? 'VERIFIED' : 'UNVERIFIED',
      });
    } catch (error) {
      const status = error instanceof PrintfulError ? error.status : 0;
      return json({
        keyAvailable: true,
        authentication: status === 401 || status === 403 ? 'FAIL' : 'NOT TESTED',
        storeIdentity: 'UNVERIFIED',
      });
    }
  };
}
