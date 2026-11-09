import { createHash, timingSafeEqual } from 'node:crypto';
import { PrintfulError } from './printful-transport';

const PREVIEW_BRANCH = 'work/tb3-commerce-hq-20261109';
const STORE_ID = 18945233;
const PROBE_SYNC_PRODUCT_ID = 485112609;
const DIAGNOSTIC_TOKEN_HEADER = 'x-tb3-printful-diagnostic-token';

export function verifyTb3PrintfulDiagnosticToken(token: string | null, expectedSha256: string | undefined): boolean {
  if (!token || token.length < 43 || token.length > 128 || !/^[A-Za-z0-9_-]+$/.test(token)) return false;
  if (!expectedSha256 || !/^[a-f0-9]{64}$/i.test(expectedSha256)) return false;
  const suppliedDigest = createHash('sha256').update(token, 'utf8').digest();
  const expectedDigest = Buffer.from(expectedSha256, 'hex');
  return timingSafeEqual(suppliedDigest, expectedDigest);
}

type PrintfulProbeResult = { sync_product?: { id?: number } };

export function createTb3PrintfulDiagnosticHandler(deps: {
  environment: () => { vercel: string | undefined; branch: string | undefined };
  authorize: (request: Request) => Promise<unknown>;
  diagnosticTokenSha256: () => string | undefined;
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

    const suppliedDiagnosticToken = request.headers.get(DIAGNOSTIC_TOKEN_HEADER);
    if (suppliedDiagnosticToken !== null) {
      if (!verifyTb3PrintfulDiagnosticToken(suppliedDiagnosticToken, deps.diagnosticTokenSha256())) {
        return json({ ok: false, error: 'Private TB3 HQ access required.' }, 401);
      }
    } else {
      try {
        await deps.authorize(request);
      } catch (error) {
        const status = error && typeof error === 'object' && 'status' in error
          && typeof error.status === 'number' ? error.status : 403;
        return json({ ok: false, error: 'Private TB3 HQ access required.' }, status);
      }
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
