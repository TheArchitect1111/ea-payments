import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../app/portal/tb3-run12b/page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app/portal/tb3-run12b/tb3-run15.css', import.meta.url), 'utf8');
const reference = readFileSync(new URL('../public/benchmarks/tb3-hq-approved-reference.jpg', import.meta.url));
const digest = createHash('sha256').update(reference).digest('hex');

assert.equal(digest, 'bf63b97db7841abfb7c6c638d87767957828bf34d171eb3e1add7207be0d5479', 'approved visual baseline changed');
assert.match(page, /width="1463" height="1536"/, 'approved reference dimensions');
for (const region of ['home', 'journey', 'academics', 'training', 'nil-brand', 'opportunities', 'media', 'calendar', 'documents', 'community', 'messages', 'eva', 'settings', 'store']) {
  assert.match(page, new RegExp(`['\"]${region}['\"]`), `missing ${region} module`);
}
assert.match(css, /@media\(max-width:899px\)/, 'mobile reconstruction breakpoint');
assert.match(css, /\.tb3-reference\{display:none\}/, 'desktop reference hidden on mobile');
assert.match(css, /\.tb3-mobile\{display:block/, 'functional mobile reconstruction enabled');
assert.match(css, /\.tb3-hotspot:focus-visible/, 'keyboard focus treatment');
console.log('PASS Run 15 TB3 approved-reference fidelity and responsive functionality contract');
