const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const course = { offerId: 'body-sculpt', courseId: 'body-sculpt-course', title: 'Body Sculpt', priceCad: 2497, compareAtPriceCad: 4997, delivery: ['in-person', 'virtual'] };
const source = fs.readFileSync('app/api/public/amanda/enrollment/checkout/route.ts', 'utf8');
function load(env, create) {
  const module = { exports: {} };
  const context = {
    exports: module.exports, module, process: { env }, Map, Date,
    console: { error() {} },
    require(name) {
      if (name === 'next/server') return { NextResponse: { json: (body, options = {}) => ({ status: options.status || 200, body }) } };
      if (name.includes('/config')) return { AMANDA_SELF_ENROLLMENT_COURSES: [course] };
      if (name.includes('/stripe')) return { getStripe: () => ({ checkout: { sessions: { create } } }) };
      if (name.includes('/platform-urls')) return { canonicalPlatformOrigin: () => 'https://efficiencyarchitects.online' };
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, context);
  return module.exports.POST;
}
const valid = { offerId: course.offerId, name: 'Preview QA', email: 'preview-qa@example.com' };
function request(body = valid) {
  return { nextUrl: new URL('https://isolated-preview.vercel.app/api/public/amanda/enrollment/checkout'), headers: new Headers({ 'x-forwarded-for': '192.0.2.8' }), json: async () => body };
}
(async () => {
  let calls = 0, captured;
  const create = async (params) => { calls++; captured = params; return { url: 'https://checkout.stripe.com/test-only' }; };
  assert.equal((await load({ VERCEL_ENV: 'preview' }, create)(request())).status, 503);
  assert.equal(calls, 0, 'Missing credentials must never fake a successful checkout');
  const preview = load({ VERCEL_ENV: 'preview', STRIPE_SECRET_KEY: 'mock-only' }, create);
  assert.equal((await preview(request({ ...valid, email: 'invalid' }))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await preview(request())).status, 200);
  assert.equal(captured.success_url, 'https://isolated-preview.vercel.app/portal/amanda-catherine/enroll/success?session_id={CHECKOUT_SESSION_ID}');
  assert.equal(captured.cancel_url, 'https://isolated-preview.vercel.app/portal/amanda-catherine/enroll?payment=cancelled');
  assert.equal(captured.line_items[0].price_data.unit_amount, 249700);
  assert.equal(captured.line_items[0].price_data.currency, 'cad');
  assert.equal(captured.allow_promotion_codes, true);
  assert.equal(captured.metadata.portalSlug, 'amanda-catherine');
  assert.equal(captured.metadata.amandaCourseId, course.courseId);
  const production = load({ VERCEL_ENV: 'production', STRIPE_SECRET_KEY: 'mock-only' }, create);
  await production(request());
  assert.ok(captured.success_url.startsWith('https://efficiencyarchitects.online/'), 'Existing production behavior remains unchanged');
  const failed = load({ VERCEL_ENV: 'preview', STRIPE_SECRET_KEY: 'mock-only' }, async () => { throw new Error('Stripe unavailable'); });
  assert.equal((await failed(request())).status, 502);
  const limited = load({ VERCEL_ENV: 'preview', STRIPE_SECRET_KEY: 'mock-only' }, create);
  for (let i = 0; i < 6; i++) assert.equal((await limited(request())).status, 200);
  assert.equal((await limited(request())).status, 429);
  console.log('Amanda enrollment route behavior: PASS (mocked Stripe, no payments or emails)');
})().catch((error) => { console.error(error); process.exitCode = 1; });
