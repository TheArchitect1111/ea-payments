import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(path, 'utf8');
const catalog = JSON.parse(read('public/tb3/merch/manifest.json'));
const publicSite = read('app/tarris/page.tsx');
const booking = read('app/tarris/book/booking-form.tsx');
const hq = read('app/tarris/future/page.tsx');
const auth = read('app/tarris/future/layout.tsx');
const seo = read('app/tarris/layout.tsx');
const reportRoute = read('app/api/tb3/paypal/report/route.ts');

assert.equal(catalog.length, 14, 'Approved 14-product catalog must remain intact');
assert.equal(new Set(catalog.map(item => item.id)).size, 14, 'Catalog item IDs must be unique');
const approvedPrices = {
  'tb3-signature-tee-black': 50, 'tb3-signature-tee-white': 50,
  'tb3-official-tee-black': 35, 'tb3-official-tee-white': 35,
  'tb3-official-hoodie-black': 75, 'tb3-official-hoodie-white': 75,
  'tb3-official-crewneck-black': 65, 'tb3-signature-collage-hoodie-black': 65,
  'tb3-signature-collage-hoodie-white': 65, 'tb3-official-long-sleeve-black': 45,
  'tb3-official-long-sleeve-white': 45, 'tb3-official-crewneck-white': 65,
  'tb3-official-joggers-black': 60, 'tb3-official-duffel-black': 110,
};
const variants = catalog.flatMap(item => item.variants);
for (const item of catalog) {
  assert.equal(item.price, approvedPrices[item.id], 'Unapproved price change for ' + item.id);
  assert.match(item.image, /^\//, 'Catalog image must be local for ' + item.id);
  assert.equal(item.provider, 'printful', 'Printful is the exclusive TB3 fulfillment provider');
  assert.equal(item.status, 'coming_soon', 'Unverified merchandise remains closed');
  assert.equal(item.fulfillmentMappingVerified, false, 'Unverified Printful mappings cannot be purchased');
  assert.ok(item.variants.length > 0, 'Product has no variant mappings: ' + item.id);
  for (const variant of item.variants) {
    assert.ok(Number.isSafeInteger(variant.id) && variant.id > 0, 'Missing Printful sync variant ID');
    assert.ok(Number.isSafeInteger(variant.catalogVariantId) && variant.catalogVariantId > 0, 'Missing Printful catalog variant ID');
    assert.equal(variant.price, item.price, 'Variant price drift for ' + item.id);
  }
}
assert.equal(Object.keys(approvedPrices).length, 14);
assert.equal(variants.length, 82, 'All 82 variants must remain present');
assert.equal(new Set(variants.map(variant => variant.id)).size, 82, 'Printful sync variant IDs must be unique');
assert.match(publicSite, /merchCatalog\.map|merchProducts\.map/);
assert.match(publicSite, /merchProducts = merchCatalog/);
assert.match(publicSite, /data-product-id=\{product\.id\}/);
assert.match(publicSite, /COMING SOON/i);
assert.match(publicSite, /REQUEST FIRST ACCESS/);
assert.match(publicSite, /type=merch&product=/, 'Existing inquiry path must remain available');
assert.doesNotMatch(publicSite, /Add to Cart|Secure checkout|PayPal checkout/i, 'Coming Soon storefront must not expose purchase controls');
assert.match(booking, /merchCatalog\.find\(/);
assert.match(booking, /requestedProduct/);
assert.match(booking, /api\/opportunities\/create/, 'Merch inquiry remains a request, not an order');
assert.doesNotMatch(booking, /api\/tb3\/paypal\/(?:orders|capture)/, 'Inquiry form must not create or capture a PayPal order');
assert.doesNotMatch(booking, /bonfire/i, 'Bonfire must not enter TB3 purchase flow');
assert.match(hq, /merchCatalog\.map\(/);
assert.match(hq, /Tb3MerchSales/);
assert.match(hq, /Online checkout stays disabled/);
assert.match(reportRoute, /authorize: \(request, write\) => authorize\(request as NextRequest, write\)/, 'HQ report delegates to the authenticated TB3 boundary');
assert.match(reportRoute, /paypalLedger/);
assert.match(reportRoute, /tb3Printful/);
assert.match(auth, /hasApplicationAccess\(\)/);
assert.match(auth, /portal\/login\?next=%2Ftarris%2Ffuture/);
assert.match(auth, /redirect\('\/tarris\?hq=private'\)/);
assert.match(seo, /14-piece lineup/);
assert.doesNotMatch(seo, /Bonfire/i);
console.log('PASS: TB3 14-product/82-variant catalog, Printful-only mappings, Coming Soon inquiry, PayPal-disabled purchase, and private HQ contracts');
