import { randomUUID, timingSafeEqual } from 'node:crypto';
import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { previewDollarTestGuard, readPreviewDollarTest, runPreviewDollarTest } from '@/lib/amanda-catherine/preview-dollar-test';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const COOKIE = '__Host-amanda-preview-qa';
const HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'none'; form-action 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
};
function esc(value: unknown) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function page(title: string, body: string) {
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + esc(title) + '</title>' +
    '<style>body{background:#f7f5ef;color:#18221d;font:16px Arial,sans-serif;max-width:700px;margin:5vh auto;padding:24px}main{background:white;padding:32px;border:1px solid #ddd7cb;border-radius:16px}h1{font:32px Georgia,serif}dl{display:grid;grid-template-columns:1fr 1fr;gap:12px}dt{font-weight:bold}dd{margin:0;overflow-wrap:anywhere}button{background:#17211c;color:white;padding:16px;border:0;border-radius:9px;font-size:17px;cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f7f5ef;padding:16px;border-radius:8px}</style>' +
    '<main><h1>' + esc(title) + '</h1>' + body + '</main></html>';
}
function html(body: string, status = 200, headers: HeadersInit = {}) {
  return new Response(body, { status, headers: { ...HEADERS, ...headers } });
}
function constantTimeMatch(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export async function GET(req: NextRequest) {
  const gate = previewDollarTestGuard(req.nextUrl.hostname);
  if (!gate.enabled) return html(page('Preview $1 test unavailable', '<p>' + esc(gate.reason) + '</p>'), gate.code);
  const id = req.nextUrl.searchParams.get('registration_id');
  if (id) {
    if (!constantTimeMatch(String(req.cookies.get(COOKIE)?.value || ''), id))
      return html(page('Private test receipt', '<p>The matching test session cookie is required.</p>'), 403);
    const result = await readPreviewDollarTest(id);
    if (!result) return html(page('Private test receipt', '<p>No durable tracking record found.</p>'), 404);
    return html(page('Amanda preview tracking receipt',
      '<p>Read directly from the tracking Airtable record, not from a local simulation.</p>' +
      '<dl><dt>Registration ID</dt><dd>' + esc(result.registration_id) + '</dd>' +
      '<dt>Payment status</dt><dd>' + esc(result.payment_status) + '</dd>' +
      '<dt>Payment reference</dt><dd>' + esc(result.payment_reference) + '</dd>' +
      '<dt>Test record</dt><dd>' + esc(result.is_test) + '</dd>' +
      '<dt>Isolated from live</dt><dd>' + esc(result.isolated_from_live) + '</dd>' +
      '<dt>Confirmation letter</dt><dd>' + esc(result.confirmation_status) + '</dd></dl>' +
      '<h2>' + esc(result.confirmation_subject) + '</h2><pre>' + esc(result.confirmation_body_html) + '</pre>'));
  }
  const token = randomUUID();
  return html(page('Amanda Catherine, preview $1 verification',
    '<p>Login-free, preview-branch-only test using a Stripe TEST key and a fixed fake signup identity. This cannot charge a real card or create a real student enrollment.</p>' +
    '<p>Amount: CAD $1.00. Stripe test card: pm_card_visa. Test records are stored outside real registration counts.</p>' +
    '<form method="post"><input type="hidden" name="registration_id" value="' + token + '">' +
    '<button type="submit">Run complete CAD $1 preview test</button></form>'), 200,
    { 'Set-Cookie': COOKIE + '=' + token + '; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=900' });
}
export async function POST(req: NextRequest) {
  const gate = previewDollarTestGuard(req.nextUrl.hostname);
  if (!gate.enabled) return html(page('Preview $1 test unavailable', '<p>' + esc(gate.reason) + '</p>'), gate.code);
  const origin = req.headers.get('origin');
  if (origin !== req.nextUrl.origin) return html(page('Request denied', '<p>Only the preview test form may submit.</p>'), 403);
  if (!req.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))
    return html(page('Request denied', '<p>Invalid form content type.</p>'), 415);
  const form = await req.formData().catch(() => null);
  const registrationId = String(form?.get('registration_id') || '');
  const sessionCookie = req.cookies.get(COOKIE)?.value || '';
  if (!/^[0-9a-f-]{36}$/.test(registrationId) || !constantTimeMatch(registrationId, sessionCookie))
    return html(page('Request denied', '<p>Session token was not confirmed.</p>'), 403);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit('amanda-preview-dollar:' + ip, 2, 30 * 60 * 1000).ok)
    return html(page('Test limit reached', '<p>Preview tests are rate-limited to prevent repeated charges, even in Stripe test mode.</p>'), 429);
  try {
    const result = await runPreviewDollarTest(registrationId);
    const receipt = '/api/amanda-catherine/preview-dollar-test?registration_id=' + encodeURIComponent(registrationId);
    return html(page('Amanda $1 end-to-end test: verified',
      '<p>Actual Stripe TEST payment and durable Airtable tracking verified. This is not real money.</p>' +
      '<ol><li>Isolated signup saved: ' + esc(result.signup_confirmed) + '</li>' +
      '<li>Stripe TEST CAD $1 payment confirmed: ' + esc(result.stripe_payment_confirmed) + '</li>' +
      '<li>Same tracking registration updated to paid: ' + esc(result.payment_status) + '</li>' +
      '<li>Confirmation letter: ' + esc(result.confirmation_delivery) + '</li></ol>' +
      '<dl><dt>Registration ID</dt><dd>' + esc(result.registration_id) + '</dd>' +
      '<dt>Payment reference</dt><dd>' + esc(result.payment_reference) + '</dd>' +
      '<dt>Stripe mode</dt><dd>' + esc(result.stripe_mode) + '</dd>' +
      '<dt>Isolated from live records</dt><dd>' + esc(result.isolated_from_live) + '</dd></dl>' +
      '<p><a href="' + receipt + '">Independently reload the saved tracking proof</a></p>' +
      '<h2>Confirmation letter: ' + esc(result.confirmation_subject) + '</h2>' +
      '<pre>' + esc(result.confirmation_body_html) + '</pre>'));
  } catch (error) {
    console.error('[amanda-preview-dollar-test] full-chain test failed', error);
    const receipt = '/api/amanda-catherine/preview-dollar-test?registration_id=' + encodeURIComponent(registrationId);
    return html(page('Preview test incomplete',
      '<p>The test could not confirm every step. No successful end-to-end result is claimed.</p>' +
      '<p>Check the existing signup and payment state: <a href="' + receipt + '">inspect durable test record</a>.</p>' +
      '<p>' + esc(error instanceof Error ? error.message : 'Unknown test error') + '</p>'), 503);
  }
}
