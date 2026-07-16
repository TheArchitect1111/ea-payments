#!/usr/bin/env node
/**
 * Simplifi Goal B Pass 4 — extension session + server watch lists.
 * Run: node scripts/test-simplifi-goal-b-pass4.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const sessionLib = join(root, 'lib/extension-session.ts');
const authLib = join(root, 'lib/extension-api-auth.ts');
const chassis = join(root, 'lib/chassis/ea-extension.ts');
const watchStore = join(root, 'lib/simplifi-watch-list-store.ts');
const bootstrap = join(root, 'app/api/extension/bootstrap/route.ts');
const refresh = join(root, 'app/api/extension/session/refresh/route.ts');
const watchRoute = join(root, 'app/api/extension/watch-list/route.ts');
const watchItemRoute = join(root, 'app/api/extension/watch-list/[id]/route.ts');
const portalWatch = join(root, 'app/api/portal/simplifi/watch-list/route.ts');
const brief = join(root, 'app/api/extension/brief/route.ts');
const ingest = join(root, 'app/api/capture/ingest/route.ts');
const apiClient = join(root, 'extension/api-client.js');
const background = join(root, 'extension/background.js');
const opsDoc = join(root, 'docs/SIMPLIFI-GOAL-B-OPERATOR.md');

for (const [p, label] of [
  [sessionLib, 'extension-session'],
  [authLib, 'extension-api-auth'],
  [chassis, 'ea-extension chassis'],
  [watchStore, 'watch-list store'],
  [bootstrap, 'bootstrap'],
  [refresh, 'session refresh'],
  [watchRoute, 'watch-list route'],
  [watchItemRoute, 'watch-list item route'],
  [portalWatch, 'portal watch-list'],
  [opsDoc, 'operator checklist'],
]) {
  assert(existsSync(p), `missing ${label}`);
}

const sessionSrc = readFileSync(sessionLib, 'utf8');
assert(sessionSrc.includes('signExtensionSession'), 'signExtensionSession required');
assert(sessionSrc.includes('verifyExtensionSession'), 'verifyExtensionSession required');
assert(sessionSrc.includes('EXTENSION_SESSION_SCOPE'), 'scoped capability required');

const chassisSrc = readFileSync(chassis, 'utf8');
assert(chassisSrc.includes('EXTENSION_SESSION_TTL_MS'), 'TTL constant required');
assert(chassisSrc.includes('simplifi:extension'), 'chassis scope string required');

const bootSrc = readFileSync(bootstrap, 'utf8');
assert(bootSrc.includes('extensionToken'), 'bootstrap must return extensionToken');
assert(!bootSrc.includes('createCaptureTenantToken'), 'bootstrap must not mint non-expiring tenant apiKey');
assert(bootSrc.includes('tokenExpiresAt'), 'bootstrap must return tokenExpiresAt');

const refreshSrc = readFileSync(refresh, 'utf8');
assert(refreshSrc.includes('signExtensionSession'), 'refresh must rotate tokens');

const briefSrc = readFileSync(brief, 'utf8');
assert(briefSrc.includes('resolveExtensionAccess'), 'brief must use shared extension auth');

const ingestSrc = readFileSync(ingest, 'utf8');
assert(ingestSrc.includes('verifyExtensionSession'), 'ingest must accept extension sessions');

const storeSrc = readFileSync(watchStore, 'utf8');
assert(storeSrc.includes('listWatchListItems'), 'listWatchListItems required');
assert(storeSrc.includes('createWatchListItem'), 'createWatchListItem required');
assert(storeSrc.includes('archiveWatchListItem'), 'archiveWatchListItem required');
assert(storeSrc.includes('Portal Slug'), 'store must scope by Portal Slug');

const watchSrc = readFileSync(watchRoute, 'utf8');
assert(watchSrc.includes('assertExtensionTenant'), 'watch-list must assert tenant');

const clientSrc = readFileSync(apiClient, 'utf8');
assert(clientSrc.includes('extensionToken'), 'api-client must store extensionToken');
assert(clientSrc.includes('X-EA-Extension-Token'), 'api-client must send extension token');
assert(clientSrc.includes('/api/extension/session/refresh'), 'api-client must refresh sessions');
assert(clientSrc.includes('getWatchList'), 'api-client must expose watch list helpers');

const bgSrc = readFileSync(background, 'utf8');
assert(bgSrc.includes('hydrateWatchListFromServer'), 'background must hydrate watch list');
assert(bgSrc.includes('extensionToken'), 'background must persist extensionToken');

const opsSrc = readFileSync(opsDoc, 'utf8');
assert(opsSrc.includes('Pass 4'), 'operator doc must cover Pass 4');

if (failures.length) {
  console.error('simplifi goal-b pass4: FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('simplifi goal-b pass4: PASS');
