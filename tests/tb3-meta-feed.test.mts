import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import catalog from '../public/tb3/merch/manifest.json';
import {buildTb3MetaFeed} from '../lib/tb3/meta-feed';

test('Meta Instagram feed includes each of the real configured TB3 variants', () => {
  const text=buildTb3MetaFeed();
  const rows=text.trimEnd().split('\n');
  const variants=catalog.flatMap(product=>product.variants);
  assert.equal(catalog.length,14);
  assert.equal(rows.length,variants.length+1);
  assert.equal(variants.length,82);
  assert.ok(rows[0].includes('item_group_id'));
  const ids=rows.slice(1).map(row=>row.split(',')[0]);
  assert.equal(new Set(ids).size,ids.length);
  for(const product of catalog) {
    assert.ok(text.includes('https://tb3.online' + product.image));
    assert.ok(text.includes('#merch-' + product.id));
  }
  assert.match(text,/utm_source=instagram/);
  assert.match(text,/utm_medium=shop/);
});
test('Meta feed has no university-affiliation merchandise claim', () => {
  const text=buildTb3MetaFeed();
  assert.match(text,/Not affiliated with University of Alabama/);
});

test('Meta feed defaults every variant to out of stock pending live verification', () => {
  const rows=buildTb3MetaFeed().trim().split('\n').slice(1);
  assert.equal(rows.length,82);
  assert.ok(rows.every(row=>row.includes('"out of stock"')));
});
test('Meta feed only advertises verified variants when checkout is live', () => {
  const one=catalog[0].variants[0].id;
  const feed=buildTb3MetaFeed({checkoutLive:true,verifiedAvailableVariantIds:new Set([one])});
  const rows=feed.trim().split('\n').slice(1);
  assert.equal(rows.filter(row=>row.includes('"in stock"')).length,1);
  assert.equal(rows.filter(row=>row.includes('"out of stock"')).length,81);
  const disabled=buildTb3MetaFeed({checkoutLive:false,verifiedAvailableVariantIds:new Set([one])});
  assert.equal(disabled.split('"in stock"').length,1);
});

test('public Meta feed only becomes purchasable after all hard launch gates', () => {
  const route=readFileSync(new URL('../app/api/tb3/merch/meta-catalog/route.ts',import.meta.url),'utf8');
  assert.match(route,/TB3_PRINTFUL_FUNDING_VERIFIED/);
  assert.match(route,/TB3_PRINTFUL_CATALOG_VERIFIED/);
  assert.match(route,/getStripeMerchantStatus/);
  assert.match(route,/auditTb3PrintfulCatalog/);
  assert.match(route,/buildTb3MetaFeed\(\{/);
  assert.match(route,/verifiedAvailableVariantIds/);
  assert.match(route,/status:503/);
});
