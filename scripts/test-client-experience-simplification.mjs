/**
 * Contract: Client Experience nav order, secondary Journey, single float help,
 * Help-page FAQ, portal routing labels, mobile/a11y chrome hooks.
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
const navUi = read('app/portal/components/ClientExperienceNav.tsx');
const shellCss = read('app/portal/components/client-experience-shell.css');
const subpage = read('app/portal/components/PortalSubpage.tsx');
const layout = read('app/portal/[slug]/layout.tsx');
const support = read('app/portal/[slug]/ctp/support/page.tsx');
const faqSection = read('app/portal/components/PortalCtpFaqSection.tsx');
const faq = read('lib/ctp-faq.ts');
const guide = read('lib/ctp-guide-progress.ts');
const assistant = read('app/components/ea-assistant/EAAssistant.tsx');
const assistantTrigger = read('app/components/ea-assistant/AssistantTrigger.tsx');
const emotion = read('lib/ctp-emotional-copy.ts');

// --- Navigation order ---
const navBlock = nav.slice(nav.indexOf('return ['), nav.indexOf('];', nav.indexOf('return [')) + 2);
const labelOrder = [...navBlock.matchAll(/label:\s*'([^']+)'/g)].map((m) => m[1]);
assert(
  labelOrder.join(' / ') === 'Your Project / Documents / Contact / Help / Journey',
  `nav order exact: got ${labelOrder.join(' / ')}`,
);

assert(navUi.includes("item.id !== 'journey'"), 'Journey excluded from primary map');
assert(navUi.includes('cex-shell-link-quiet'), 'Journey uses quiet secondary class');
assert(navUi.includes('cex-shell-account'), 'Account secondary access for logout');
assert(navUi.includes('aria-label="Your project"'), 'nav landmark labeled');
assert(navUi.includes('aria-current={isActive ? \'page\' : undefined}') || navUi.includes('aria-current'), 'active page announced');

// --- Mobile chrome ---
assert(shellCss.includes('@media (max-width: 720px)'), 'mobile breakpoint for CX shell');
assert(shellCss.includes('.cex-shell-link-quiet'), 'quiet Journey styled');
assert(shellCss.includes('min-height: 2.75rem'), 'touch-sized nav targets on mobile');

// --- Help: no FAQ FAB; Assistant only float; FAQ on Help page ---
assert(!subpage.includes('PortalCtpHelpDrawer'), 'PortalSubpage does not mount FAQ drawer');
assert(!subpage.includes('cex-help-fab'), 'PortalSubpage has no FAQ FAB');
assert(!existsSync(resolve(root, 'app/portal/components/PortalCtpHelpDrawer.tsx')), 'FAQ FAB component removed');
assert(layout.includes('EAAssistant'), 'portal layout retains EA Assistant');
assert(support.includes('PortalCtpFaqSection'), 'Help page mounts FAQ section');
assert(faqSection.includes('CTP_FAQ_ITEMS'), 'FAQ section reuses CTP_FAQ_ITEMS');
assert(faqSection.includes('id="faq"'), 'FAQ section supports #faq deep link');
assert(faqSection.includes('<details'), 'FAQ items are keyboard-openable details');
assert(faqSection.includes('summary:focus-visible') || shellCss.includes('.cex-help-drawer-item summary:focus-visible'), 'FAQ summary focus-visible');
assert(!faqSection.includes('cex-help-fab'), 'FAQ section is not a float');
assert(assistantTrigger.includes('useAssistantLabels') || assistant.includes('AssistantTrigger'), 'Assistant trigger remains');
assert(assistant.includes('CX_ASSISTANT_LABELS'), 'CX Assistant labels retained');

// --- Copy alignment ---
assert(!faq.includes('Messages & Support'), 'FAQ has no Messages & Support');
assert(!faq.includes('Overview'), 'FAQ has no Overview nav claim');
assert(faq.includes('Journey in the menu'), 'FAQ names Journey as menu item');
assert(!guide.includes('Checking Progress here'), 'Guide copy no longer says Progress');
assert(guide.includes('Checking Your Project here'), 'Guide copy says Your Project');
assert(guide.includes('Open Journey in the menu'), 'Guide orients to Journey menu label');
assert(emotion.includes('CX_EMOTION') && emotion.includes('Need a hand?'), 'CX_EMOTION module present for Help/FAQ');

const layoutChassis = read('lib/chassis/PortalLayout.tsx');
const signals = read('lib/assistant/signals.ts');

// --- Assistant client-shell marker + route-aware CTP context ---
assert(
  layoutChassis.includes('data-ea-experience="client"'),
  'PortalLayout marks client presentation boundary',
);
assert(
  layoutChassis.includes('data-portal-slug={slug}'),
  'PortalLayout exposes portal slug for tenant isolation',
);
assert(assistant.includes('data-ea-experience'), 'EAAssistant reads client-experience marker');
assert(assistant.includes('pathname,'), 'EAAssistant passes pathname into CTP live signals');
assert(assistant.includes('clientShellTrusted') || assistant.includes('shellSlug === slug'), 'shell marker requires matching portal slug');
assert(signals.includes('pathname?: string'), 'PortalLiveSignals carries pathname');
assert(signals.includes('ctpClientActionsForPath'), 'CTP overlay is route-aware');
assert(signals.includes('applyCtpClientSignals'), 'CTP overlay preserves page brief');
assert(signals.includes('onSegment'), 'CTP route matching uses segment boundaries');

process.exit(failed ? 1 : 0);
