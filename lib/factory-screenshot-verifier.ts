import { createHmac } from 'node:crypto';
import { z } from 'zod';
import { ScreenshotEvidenceSchema, RecoverableScreenshotError, screenshotRetry, ACCEPTANCE_CHECKS, type ScreenshotBuildResult } from './factory-screenshot-build';

/** Internal browser-runner boundary. The runner owns test identities and must exercise the actual private routes.
 * No customer credentials, public publish permissions, or client-submitted evidence enter this boundary.
 */
export async function verifyPrivateScreenshotDraft(draft: ScreenshotBuildResult) {
  const endpoint = process.env.EA_SCREENSHOT_VERIFIER_URL;
  const secret = process.env.EA_SCREENSHOT_VERIFIER_SECRET;
  if (!endpoint || !secret) return [];
  const url = new URL(endpoint);
  const local = process.env.EA_SCREENSHOT_ALLOW_LOCAL_VERIFIER === '1' && process.env.NODE_ENV !== 'production' &&
    !['production', 'preview'].includes(process.env.VERCEL_ENV || '') && url.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((!local && url.protocol !== 'https:') || url.username || url.password) throw new Error('Private verifier requires an HTTPS service URL');
  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({ version: 1, projectId: draft.projectId, revision: draft.revision, timestamp,
    tenant: draft.tenant, pages: draft.pages, requiredChecks: ACCEPTANCE_CHECKS,
    constraints: { privateOnly: true, testIdentitiesOnly: true, noEmails: true, noPayments: true, noPublicPublish: true } });
  return screenshotRetry(async () => {
    let response: Response;
    try {
      response = await fetch(url, { method: 'POST', redirect: 'error',
        headers: { 'content-type': 'application/json', 'x-ea-signature': createHmac('sha256', secret).update(payload).digest('hex') },
        body: payload, signal: AbortSignal.timeout(25000) });
    } catch { throw new RecoverableScreenshotError('Private browser verifier temporarily unavailable'); }
    if ([429, 502, 503, 504].includes(response.status)) throw new RecoverableScreenshotError(`Private verifier retryable response: ${response.status}`);
    if (!response.ok) throw new Error(`Private browser verifier failed: ${response.status}`);
    return z.object({ evidence: z.array(ScreenshotEvidenceSchema).max(100) }).strict().parse(await response.json()).evidence;
  }, 2);
}
