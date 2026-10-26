import {test} from 'node:test';
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
