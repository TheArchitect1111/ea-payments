/**
 * Launch URL normalization contracts.
 * Run: node scripts/test-factory-url-normalize.mjs
 */
import assert from 'node:assert/strict';
import {
  extractFirstUrlFromText,
  extractUrlFromLaunchNotes,
  normalizeLaunchUrl,
} from '../lib/factory-url-normalize.mjs';

const equivalents = [
  'brickeybotanicals.com',
  'www.brickeybotanicals.com',
  'https://brickeybotanicals.com',
  'https://www.brickeybotanicals.com/',
  'https://www.brickeybotanicals.com',
];

const normalized = equivalents.map((v) => normalizeLaunchUrl(v));
for (const value of normalized) {
  assert.ok(value);
  assert.match(value, /^https:\/\//i);
  assert.match(value, /brickeybotanicals\.com/i);
  assert.doesNotMatch(value, /\/$/);
}

assert.equal(
  normalizeLaunchUrl('brickeybotanicals.com'),
  normalizeLaunchUrl('https://www.brickeybotanicals.com/'),
);

assert.equal(
  extractFirstUrlFromText('Brickey Botanicals at brickeybotanicals.com'),
  'https://brickeybotanicals.com',
);

assert.equal(
  extractUrlFromLaunchNotes(
    [
      'Distinguishing detail: Brickey Botanicals at brickeybotanicals.com',
      'Known website/social: brickeybotanicals.com',
      'Source: Universal Quick Launch',
    ].join('\n'),
  ),
  'https://brickeybotanicals.com',
);

assert.equal(normalizeLaunchUrl('not a domain'), undefined);
assert.equal(normalizeLaunchUrl(''), undefined);

console.log('test-factory-url-normalize.mjs: ok');
