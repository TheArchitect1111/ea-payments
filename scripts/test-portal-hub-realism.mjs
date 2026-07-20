/**
 * Portal hub realism pack (S4) — documents, events, messaging, landing.
 * Run: node scripts/test-portal-hub-realism.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

assert(existsSync(join(root, 'lib/portal-document-hub.ts')), 'portal-document-hub missing');
assert(existsSync(join(root, 'lib/portal-event-hub.ts')), 'portal-event-hub missing');
assert(existsSync(join(root, 'lib/portal-messaging-hub.ts')), 'portal-messaging-hub missing');
assert(existsSync(join(root, 'app/portal/[slug]/landing/page.tsx')), 'landing hub page missing');

const docs = read('lib/portal-document-hub.ts');
assert(docs.includes('getCtpSubmissionForPortal'), 'documents must pull CTP submission');
assert(docs.includes('buildCtpDocumentsView'), 'documents must use CTP vault view');
assert(docs.includes('getContentRequestsForClient'), 'documents must include Update Hub files');

const events = read('lib/portal-event-hub.ts');
assert(events.includes('buildCtpScheduleView'), 'events must use CTP schedule');
assert(events.includes('ctpCalendlyUrl'), 'events must include Calendly');
assert(events.includes('listConnectOrgs'), 'events may merge matching Connect org events');

const eventsPage = read('app/portal/[slug]/events/page.tsx');
assert(eventsPage.includes('listPortalEvents'), 'events page must call listPortalEvents');
assert(!eventsPage.includes('UPCOMING_EVENTS'), 'events page must not use static UPCOMING_EVENTS');

const messaging = read('lib/portal-messaging-hub.ts');
assert(messaging.includes('getContentRequestsForClient'), 'messaging threads from Update Hub');
assert(messaging.includes('getPendingRequests'), 'messaging must surface pending request counts');

const messagingPage = read('app/portal/[slug]/messaging/page.tsx');
assert(messagingPage.includes('listPortalMessagingThreads'), 'messaging page uses hub view');
assert(messagingPage.includes('/updates/new'), 'messaging still launches Update Hub compose');

const landing = read('app/portal/[slug]/landing/page.tsx');
assert(landing.includes("requirePortalModule(slug, 'landing')"), 'landing page gated on landing');
assert(landing.includes('experience-builder'), 'landing must link Experience Builder');
assert(landing.includes('findPublishedSitePage'), 'landing must resolve live site');

const registry = read('lib/modules/registry.ts');
assert(registry.includes("requiredRole: 'owner'"), 'landing role should allow package owners');
assert(registry.includes("pathSegment: 'landing'"), 'landing pathSegment intact');

const experience = read('lib/experience-registry.ts');
assert(experience.includes("'/landing'"), 'capability routePatterns include /landing');
assert(experience.includes("'/experience-builder'"), 'capability routePatterns include EB');

const presets = read('vendor/payments-contract/src/presets.ts');
assert(
  /WEBSITE_PORTAL_MODULES[\s\S]*'events'/.test(presets),
  'WEBSITE_PORTAL_MODULES must include events',
);

if (failures.length) {
  console.error('Portal hub realism checks failed:');
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('Portal hub realism (S4) contract checks passed.');
