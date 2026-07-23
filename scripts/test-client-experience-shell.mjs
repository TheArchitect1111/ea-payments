/**
 * Contract: Client Experience shell + nav order, quiet Journey, no FAQ FAB,
 * assistant shell marker — scoped to the authorized CX simplification slice.
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
const support = read('app/portal/[slug]/ctp/support/page.tsx');
const navUi = read('app/portal/components/ClientExperienceNav.tsx');
const emotion = read('lib/ctp-emotional-copy.ts');
const assistant = read('app/components/ea-assistant/EAAssistant.tsx');
const signals = read('lib/assistant/signals.ts');
const portalLayout = read('app/portal/[slug]/layout.tsx');

assert(nav.includes("label: 'Your Project'"), 'nav includes Your Project');
assert(nav.includes("label: 'Documents'"), 'nav includes Documents');
assert(nav.includes("label: 'Contact'"), 'nav includes Contact');
assert(nav.includes("label: 'Help'"), 'nav includes Help');
assert(nav.includes("label: 'Journey'"), 'nav includes Journey as secondary');
{
  const block = nav.slice(nav.indexOf('return ['), nav.indexOf('];', nav.indexOf('return [')) + 2);
  const labels = [...block.matchAll(/label:\s*'([^']+)'/g)].map((m) => m[1]);
  assert(
    labels.join(' / ') === 'Your Project / Documents / Contact / Help / Journey',
    `nav order locked (got ${labels.join(' / ')})`,
  );
}
assert(!/label:\s*'(Pulse|Simplifi|Amplifi|Dashboard|Command Center|Mission Control)'/.test(nav), 'client nav has no Executive labels');
assert(nav.includes("return 'progress'"), 'default active nav is Your Project');

assert(layout.includes("presentation === 'client'"), 'PortalLayout renders client presentation');
assert(layout.includes('ClientExperienceNav'), 'PortalLayout mounts ClientExperienceNav');
assert(layout.includes('data-ea-experience="client"'), 'PortalLayout marks client experience');
assert(layout.includes('data-portal-slug={slug}'), 'PortalLayout exposes portal slug');
assert(shell.includes('shouldUseClientExperienceShell'), 'PortalShell coerces CTP portals to client');
assert(shell.includes("shellNavGroups={effectivePresentation === 'client' ? []"), 'Executive sidebar groups cleared for client');

assert(subpage.includes('clientNavActive'), 'PortalSubpage accepts clientNavActive');
assert(subpage.includes("Back to {clientShell ? 'Your Project'"), 'PortalSubpage back link is client-safe');
assert(!subpage.includes('PortalCtpHelpDrawer'), 'PortalSubpage does not mount FAQ FAB drawer');
assert(!subpage.includes('cex-help-fab'), 'no FAQ FAB on subpages');
assert(!existsSync(resolve(root, 'app/portal/components/PortalCtpHelpDrawer.tsx')), 'FAQ FAB component removed');
assert(support.includes('PortalCtpFaqSection'), 'Help page mounts FAQ section');
assert(support.includes('clientNavActive="support"'), 'Help page uses client nav');
assert(emotion.includes('CX_EMOTION'), 'CX_EMOTION present for Help/FAQ');

assert(
  navUi.includes('aria-label="Your project"') || navUi.includes('aria-label="Client experience"'),
  'Client nav labeled for a11y',
);
assert(navUi.includes('cex-shell-link-quiet'), 'Journey is quiet secondary');
assert(navUi.includes('cex-shell-account') || navUi.includes('Log out'), 'Client nav exposes Log out');
assert(navUi.includes('aria-label="Account menu"') || navUi.includes('Account'), 'Account control present');

assert(portalLayout.includes('EAAssistant'), 'portal layout retains EA Assistant');
assert(assistant.includes('CX_ASSISTANT_LABELS'), 'CX Assistant labels retained');
assert(assistant.includes('clientShellTrusted') || assistant.includes('shellSlug === slug'), 'assistant shell tenant gate');
assert(assistant.includes('pathname,'), 'assistant passes route pathname');
assert(signals.includes('applyCtpClientSignals'), 'CTP route-aware overlay');
assert(signals.includes('onSegment'), 'CTP segment route matching');

process.exit(failed ? 1 : 0);
