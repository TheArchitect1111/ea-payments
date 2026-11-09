import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(path, 'utf8');
const catalog = JSON.parse(read('public/tb3/merch/manifest.json'));
const publicSite = read('app/tarris/page.tsx');
const booking = read('app/tarris/book/booking-form.tsx');
const hq = read('app/tarris/future/page.tsx');
const auth = read('app/tarris/future/layout.tsx');
const seo = read('app/tarris/layout.tsx');

assert.equal(catalog.length, 14, 'Approved 14-product catalog must remain intact');
assert.equal(new Set(catalog.map(item => item.id)).size, 14, 'Catalog item IDs must be unique');
const approvedPrices = {
  'merch-short-red': 35, 'merch-short-white': 35, 'merch-long-red': 45,
  'merch-long-white': 45, 'merch-cap-white': 30, 'merch-cap-red': 30,
  'merch-hoodie-red': 75, 'merch-hoodie-white': 75, 'merch-hoodie-premium': 85,
  'merch-crewneck-red': 65, 'tb3-sig-collage-tee-black': 65,
  'tb3-sig-collage-hoodie-black': 75, 'tb3-sig-collage-tee-white': 65,
  'tb3-sig-collage-hoodie-white': 75,
};
for (const item of catalog) {
  assert.equal(item.price, approvedPrices[item.id], 'Unapproved price change for ' + item.id);
  assert.match(item.image, /^\//, 'Catalog image must be local for ' + item.id);
}
assert.match(publicSite, /merchCatalog\.map|merchProducts\.map/);
assert.match(publicSite, /merchProducts = merchCatalog/);
assert.match(publicSite, /data-product-id=\{product\.id\}/);
assert.doesNotMatch(publicSite, /Ask about this item|type=merch&product=/, 'Coming Soon storefront must not expose order inquiry CTAs');
assert.match(publicSite, /COMING SOON\. Explore the TB3 collection/);
assert.match(publicSite, /Online checkout is not open yet/);
assert.doesNotMatch(publicSite, /Add to Cart|Secure checkout|checkout\.stripe\.com/);
assert.match(booking, /merchCatalog\.find\(/);
assert.match(booking, /requestedProduct/);
assert.match(booking, /api\/opportunities\/create/);
assert.match(hq, /merchCatalog\.map\(/);
assert.match(hq, /Explore the TB3 collection/);
assert.match(hq, /Online checkout stays disabled/);
assert.match(auth, /hasApplicationAccess\(\)/);
assert.match(auth, /portal\/login\?next=%2Ftarris%2Ffuture/);
assert.match(auth, /redirect\('\/tarris\?hq=private'\)/);
assert.match(seo, /14-piece lineup/);
assert.doesNotMatch(seo, /Bonfire/);
console.log('PASS: TB3 Phase 1 catalog, prices, Coming Soon storefront, HQ login, private access and payment-disabled safety');
