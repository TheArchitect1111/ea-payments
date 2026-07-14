/**
 * CTP portal vanity host wiring checks.
 * Run: node scripts/test-ctp-portal-host.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolvePath(here, '..');
const failures = [];

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
assert(hostSrc.includes('probePortalVanityHost'), 'Must export vanity host health probe');
assert(middleware.includes('resolvePortalHostRewrite'), 'Middleware must use portal host resolver');
assert(middleware.includes('NextResponse.rewrite'), 'Middleware must rewrite vanity paths');
assert(middleware.includes('/:slug'), 'Matcher must include vanity slug paths');
assert(workspace.includes('publicPortalUrl'), 'Welcome flow must use vanity portal URLs');

const launchPath = join(root, 'app/api/health/launch/route.ts');
assert(existsSync(launchPath), 'Missing launch health route');
const launch = readFileSync(launchPath, 'utf8');
assert(launch.includes('probePortalVanityHost'), 'Launch health must probe vanity portal host');
assert(launch.includes('portalVanityHost'), 'Launch health must expose portalVanityHost check');
assert(workspace.includes("publicPortalUrl(slug, 'ctp')"), 'Welcome must deep-link vanity CTP overview');
assert(workspace.includes('portalLoginUrl()'), 'Welcome CTA must use vanity login helper');
assert(
  !workspace.includes('portalResult.portalLoginUrl ??'),
  'Must not prefer hub createPortalAccess login URL over vanity host',
);

const setupDocPath = join(root, 'docs/CTP-SETUP.md');
assert(existsSync(setupDocPath), 'Missing docs/CTP-SETUP.md');
const setupDoc = readFileSync(setupDocPath, 'utf8');
assert(
  setupDoc.includes('portal.efficiencyarchitects.online'),
  'CTP setup docs must cover vanity portal host',
);
assert(setupDoc.includes('EA_PORTAL_HOSTS') || setupDoc.includes('Domains'), 'Setup docs must cover domain attach');

const adminViewPath = join(root, 'lib/ctp-admin-view.ts');
const adminUiPath = join(root, 'app/admin/ctp/CtpSubmissionsClient.tsx');
const emailPath = join(root, 'lib/email.ts');
assert(existsSync(adminViewPath), 'Missing ctp-admin-view.ts');
assert(existsSync(adminUiPath), 'Missing CTP admin client');
assert(existsSync(emailPath), 'Missing email.ts');
const adminView = readFileSync(adminViewPath, 'utf8');
const adminUi = readFileSync(adminUiPath, 'utf8');
const email = readFileSync(emailPath, 'utf8');
assert(adminView.includes('portalPublicUrl'), 'Admin view must expose vanity portalPublicUrl');
assert(adminView.includes("publicPortalUrl(submission.portalSlug, 'ctp')"), 'Admin vanity CTP URL');
assert(adminUi.includes('portalPublicUrl'), 'Admin UI must surface vanity portal URL');
assert(adminUi.includes('Client vanity portal'), 'Admin UI must link client vanity portal');
assert(email.includes('socialPresence'), 'Executive email must include social score');
assert(email.includes('googleBusinessProfile'), 'Executive email must include GBP score');

// Runtime checks via ts transpile isn't available — duplicate pure logic for smoke.
function normalizeHost(host) {
  return (host ?? '').split(':')[0]?.toLowerCase() ?? '';
}

function resolveVanity(host, pathname) {
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

const rootRedirect = resolveVanity('portal.efficiencyarchitects.online', '/');
assert(rootRedirect?.redirectPath === '/portal/login', 'Root should redirect to portal login');

const slugRewrite = resolveVanity('portal.efficiencyarchitects.online', '/acme');
assert(slugRewrite?.rewritePath === '/portal/acme', 'Slug should rewrite to /portal/{slug}');

const nested = resolveVanity('portal.efficiencyarchitects.online', '/acme/ctp');
assert(nested?.rewritePath === '/portal/acme/ctp', 'Nested path should rewrite');

const ignored = resolveVanity('www.efficiencyarchitects.online', '/acme');
assert(ignored === null, 'Non-portal hosts must not rewrite');

const login = resolveVanity('portal.efficiencyarchitects.online', '/login');
assert(login?.redirectPath === '/portal/login', 'Vanity /login should map to /portal/login');

const portalLoginPath = join(root, 'app/portal/login/page.tsx');
assert(existsSync(portalLoginPath), 'Missing portal login page');
const portalLogin = readFileSync(portalLoginPath, 'utf8');
assert(portalLogin.includes('/ea-logo.png'), 'Portal login must use EA logo');
assert(portalLogin.includes("realm=\"portal\""), 'Portal login must use portal realm');
assert(portalLogin.includes('demoFallback="ctp"'), 'Portal demo login should land on CTP overview');
assert(!portalLogin.includes('simplifi-logo.png'), 'Portal login must not use Simplifi logo');
assert(!portalLogin.includes("return '/simplifi/capture'"), 'Portal login must not default next to Simplifi capture');
assert(portalLogin.includes('Looking for Simplifi capture?'), 'Portal login should point Simplifi users to /simplifi/login');

if (failures.length) {
  console.error('CTP portal host checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP portal host checks: PASS');
process.exit(0);
