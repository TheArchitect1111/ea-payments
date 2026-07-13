/**
 * Quick domain-map sanity (no tsx required).
 * Run: node scripts/test-domain-map.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../lib/platform/domain-map.ts'), 'utf8');

const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

assert(src.includes('CLIENT_DOMAIN_BINDINGS'), 'missing CLIENT_DOMAIN_BINDINGS');
assert(src.includes('resolveClientDomainEntry'), 'missing resolveClientDomainEntry');
assert(src.includes('EA_CLIENT_DOMAIN_MAP'), 'missing env override key');
assert(src.includes("cpr.efficiencyarchitects.online"), 'missing CPR seed host');
assert(src.includes("surface: 'site'"), 'missing site surface');
assert(src.includes('QUARANTINED'), 'CPR portal host should be quarantined');
assert(src.includes("surface: 'portal'") || src.includes("surfacePart === 'portal'"), 'portal surface parsing missing');

const mw = readFileSync(join(here, '../middleware.ts'), 'utf8');
assert(mw.includes('resolveClientDomainEntry'), 'middleware not wired to domain map');
assert(mw.includes('NextResponse.rewrite'), 'middleware should rewrite (not only redirect)');

const api = join(here, '../app/api/platform/domains/route.ts');
assert(readFileSync(api, 'utf8').includes('listClientDomainBindings'), 'domains API missing');

if (failures.length) {
  console.error('Domain map verify FAILED');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('Domain map verify OK');
console.log(' - seed bindings + env override present');
console.log(' - middleware rewrite wired');
console.log(' - /api/platform/domains present');
console.log('Ready for Vercel domain attach when DNS is ready.');
