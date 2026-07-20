/**
 * Contract: Website + Portal / CTP clients get Client Experience shell + nav,
 * not Executive Workspace (Pulse / Simplifi / Amplifi / Dashboard).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
function read(rel) {
  const p = resolve(root, rel);
  if (!existsSync(p)) throw new Error(`Missing ${rel}`);
  return readFileSync(p, 'utf8');
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`PASS: ${msg}`);
  }
}

const nav = read('lib/ctp-client-nav.ts');
const layout = read('lib/chassis/PortalLayout.tsx');
const shell = read('lib/chassis/PortalShell.tsx');
const subpage = read('app/portal/components/PortalSubpage.tsx');
const ctpPage = read('app/portal/[slug]/ctp/page.tsx');
const progress = read('app/portal/[slug]/ctp/progress/page.tsx');
const messages = read('app/portal/[slug]/ctp/messages/page.tsx');
const navUi = read('app/portal/components/ClientExperienceNav.tsx');

assert(nav.includes("label: 'Your Journey'"), 'nav includes Your Journey');
assert(nav.includes("label: 'Progress'"), 'nav includes Progress');
assert(nav.includes("label: 'Documents'"), 'nav includes Documents');
assert(nav.includes("label: 'Messages'"), 'nav includes Messages');
assert(nav.includes("label: 'Support'"), 'nav includes Support');
assert(!/label:\s*'(Pulse|Simplifi|Amplifi|Dashboard)'/.test(nav), 'client nav has no Executive labels');

assert(layout.includes("presentation === 'client'"), 'PortalLayout renders client presentation');
assert(layout.includes('ClientExperienceNav'), 'PortalLayout mounts ClientExperienceNav');
assert(shell.includes('shouldUseClientExperienceShell'), 'PortalShell coerces CTP portals to client');
assert(shell.includes("shellNavGroups={effectivePresentation === 'client' ? []"), 'Executive sidebar groups cleared for client');

assert(subpage.includes('clientNavActive'), 'PortalSubpage accepts clientNavActive');
assert(subpage.includes("Back to {clientShell ? 'Your Journey'"), 'PortalSubpage back link is client-safe');

assert(ctpPage.includes('clientNavActive="journey"'), 'CTP journey uses client nav');
assert(progress.includes('clientNavActive="progress"'), 'Progress uses client nav');
assert(messages.includes('clientNavActive="messages"'), 'Messages page exists under client nav');
assert(navUi.includes('aria-label="Client experience"'), 'Client nav labeled for a11y');

process.exit(failed ? 1 : 0);
