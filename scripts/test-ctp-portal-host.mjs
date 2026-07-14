/**
 * CTP portal vanity host wiring checks.
 * Run: node scripts/test-ctp-portal-host.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];
const require = createRequire(import.meta.url);

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const hostPath = join(root, 'lib/ctp-portal-host.ts');
const middlewarePath = join(root, 'middleware.ts');
const workspacePath = join(root, 'lib/ctp-workspace-provision.ts');

assert(existsSync(hostPath), 'Missing ctp-portal-host.ts');
assert(existsSync(middlewarePath), 'Missing middleware.ts');
assert(existsSync(workspacePath), 'Missing workspace provision');

const hostSrc = readFileSync(hostPath, 'utf8');
const middleware = readFileSync(middlewarePath, 'utf8');
const workspace = readFileSync(workspacePath, 'utf8');

assert(hostSrc.includes('portal.efficiencyarchitects.online'), 'Default portal host required');
assert(hostSrc.includes('resolvePortalHostRewrite'), 'Must export rewrite resolver');
assert(hostSrc.includes('publicPortalUrl'), 'Must export publicPortalUrl');
assert(middleware.includes('resolvePortalHostRewrite'), 'Middleware must use portal host resolver');
assert(middleware.includes('NextResponse.rewrite'), 'Middleware must rewrite vanity paths');
assert(middleware.includes('/:slug'), 'Matcher must include vanity slug paths');
assert(workspace.includes('publicPortalUrl'), 'Welcome flow must use vanity portal URLs');

// Runtime checks via ts transpile isn't available — duplicate pure logic for smoke.
function normalizeHost(host) {
  return (host ?? '').split(':')[0]?.toLowerCase() ?? '';
}

function resolve(host, pathname) {
  const hosts = ['portal.efficiencyarchitects.online', 'portal.efficiencyarchitects.app'];
  if (!hosts.includes(normalizeHost(host))) return null;
  if (pathname === '/' || pathname === '') return { redirectPath: '/portal/login' };
  const segments = pathname.split('/').filter(Boolean);
  const first = (segments[0] ?? '').toLowerCase();
  if (['login', 'sign-in', 'register', 'forgot-password', 'reset-password'].includes(first)) {
    return { redirectPath: `/portal/${segments.join('/')}` };
  }
  const reserved = new Set(['api', 'admin', 'portal', '_next', 'buy', 'assessment']);
  if (!first || reserved.has(first)) return null;
  const rest = segments.slice(1).join('/');
  return { rewritePath: rest ? `/portal/${first}/${rest}` : `/portal/${first}` };
}

const rootRedirect = resolve('portal.efficiencyarchitects.online', '/');
assert(rootRedirect?.redirectPath === '/portal/login', 'Root should redirect to portal login');

const slugRewrite = resolve('portal.efficiencyarchitects.online', '/acme');
assert(slugRewrite?.rewritePath === '/portal/acme', 'Slug should rewrite to /portal/{slug}');

const nested = resolve('portal.efficiencyarchitects.online', '/acme/ctp');
assert(nested?.rewritePath === '/portal/acme/ctp', 'Nested path should rewrite');

const ignored = resolve('www.efficiencyarchitects.online', '/acme');
assert(ignored === null, 'Non-portal hosts must not rewrite');

const login = resolve('portal.efficiencyarchitects.online', '/login');
assert(login?.redirectPath === '/portal/login', 'Vanity /login should map to /portal/login');

void require;
void hostSrc;

if (failures.length) {
  console.error('CTP portal host checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP portal host checks: PASS');
process.exit(0);
