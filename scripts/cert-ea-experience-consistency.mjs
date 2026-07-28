/**
 * EA Ecosystem Experience Consistency Certification
 * Gold standard: CTP Guide + Client Experience shell (CX_EMOTION + client nav labels).
 * Run: node scripts/cert-ea-experience-consistency.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

function read(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) return '';
  return readFileSync(p, 'utf8');
}

const findings = [];

function check(id, area, severity, ok, before, after, evidence) {
  findings.push({ id, area, severity, status: ok ? 'FIXED' : 'OPEN', before, after, evidence });
}

const emotion = read('lib/ctp-emotional-copy.ts');
const nav = read('lib/ctp-client-nav.ts');
const cex = read('app/portal/components/ClientExperience.tsx');
const dash = read('app/portal/components/OpportunityDashboard.tsx');
const review = read('app/portal/components/OpportunityReviewExperience.tsx');
const oppDetail = read('app/portal/[slug]/ctp/opportunities/[opportunityId]/page.tsx');
const oppView = read('lib/ctp-opportunity-view.ts');
const email = read('lib/email.ts');
const oppEmail = read('lib/ctp-opportunity-email.ts');
const support = read('lib/ctp-support-view.ts');
const messaging = read('app/portal/[slug]/messaging/page.tsx');
const documents = read('app/portal/[slug]/documents/page.tsx');
const resources = read('app/portal/[slug]/resources/page.tsx');
const notifications = read('app/portal/[slug]/notifications/page.tsx');
const notifyUi = read('lib/chassis/NotificationCenter.tsx');
const layout = read('lib/chassis/PortalLayout.tsx');
const assistant = read('app/components/ea-assistant/EAAssistant.tsx');
const realm = read('lib/auth/realm-login-copy.ts');
const login = read('app/portal/login/page.tsx');
const register = read('components/auth/RegisterForm.tsx');
const legalGate = read('app/components/trust/LegalReacceptanceGate.tsx');
const guideNotify = read('lib/ctp-guide-notifications.ts');
const magic = read('app/api/auth/magic-link/route.ts');

check(
  'gold.emotion',
  'Gold standard',
  'high',
  emotion.includes('CX_EMOTION') && emotion.includes('Open Your Project') && emotion.includes('Need a hand?'),
  'Scattered hospitality copy',
  'Single CX_EMOTION module for ecosystem voice',
  'lib/ctp-emotional-copy.ts',
);

check(
  'gold.nav',
  'Gold standard',
  'high',
  nav.includes("label: 'Your Project'") &&
    nav.includes("label: 'Contact'") &&
    nav.includes("label: 'Help'") &&
    nav.includes("label: 'Journey'"),
  'Mixed Progress/Support/Dashboard labels',
  'Your Project · Documents · Contact · Help · Journey',
  'lib/ctp-client-nav.ts',
);

check(
  'journey.escape',
  'Journey',
  'high',
  cex.includes('>Your Project</Link>') && cex.includes('>Help</Link>') && !cex.includes('>Progress</Link>'),
  'Escape nav: Progress / Support',
  'Escape nav: Your Project / Help',
  'ClientExperience.tsx',
);

check(
  'journey.comm',
  'Journey',
  'high',
  dash.includes('CX_EMOTION.journey') && !dash.includes('Communication Center'),
  'Communication Center · messages & support',
  'Stay close · Contact your guide',
  'OpportunityDashboard.tsx',
);

check(
  'journey.snapshot',
  'Journey',
  'med',
  dash.includes('snapshotTitle') && !dash.includes('Executive Snapshot'),
  'Executive Snapshot',
  'Where you stand',
  'OpportunityDashboard.tsx',
);

check(
  'journey.review',
  'Journey',
  'high',
  review.includes('Continue in Your Project') && !review.includes('Continue Exploring My Dashboard'),
  'Continue Exploring My Dashboard',
  'Continue in Your Project',
  'OpportunityReviewExperience.tsx',
);

check(
  'journey.back',
  'Journey',
  'high',
  oppDetail.includes('Back to Journey') && !oppDetail.includes('Opportunity Dashboard'),
  'Back to Opportunity Dashboard',
  'Back to Journey',
  'opportunities/[id]/page.tsx',
);

check(
  'journey.pages',
  'Journey',
  'med',
  oppView.includes("pages: ['Your Project', 'Documents', 'Contact', 'Help']"),
  'Dashboard / Updates / Resources / Support',
  'Your Project / Documents / Contact / Help',
  'ctp-opportunity-view.ts',
);

check(
  'email.cta',
  'Email',
  'high',
  email.includes('Open Your Project') && !email.includes('Access Your Portal') && !email.includes('Access My Portal'),
  'Access Your Portal / Access My Portal / View Progress',
  'Open Your Project across client emails',
  'lib/email.ts',
);

check(
  'email.opp',
  'Email',
  'high',
  oppEmail.includes("ctaLabel: 'Open Your Project'"),
  'Open My Personalized Portal',
  'Open Your Project',
  'ctp-opportunity-email.ts',
);

check(
  'email.review_body',
  'Email',
  'high',
  email.includes('Glance at Your Project beforehand') && !email.includes('Opportunity Dashboard beforehand'),
  'Open your Opportunity Dashboard beforehand…',
  'Glance at Your Project beforehand…',
  'sendCtpReviewReminderEmail',
);

check(
  'help.email_action',
  'Help',
  'med',
  support.includes("title: 'Contact your guide'") && !support.includes("title: 'Email support'"),
  'Email support',
  'Contact your guide',
  'ctp-support-view.ts',
);

check(
  'exec.messaging',
  'Executive dual',
  'high',
  messaging.includes('CX_EMOTION.contact') && !messaging.includes('not a chat inbox'),
  'This is not a chat inbox',
  'CX_EMOTION.contact.lede',
  'messaging/page.tsx',
);

check(
  'exec.documents',
  'Executive dual',
  'high',
  documents.includes('executiveLede') && !documents.includes('Trust Engine legal status'),
  'Your EA document hub · Trust Engine',
  'Documents · never a homework pile',
  'documents/page.tsx',
);

check(
  'exec.resources',
  'Executive dual',
  'high',
  resources.includes('redirectCtpClientFromExecutiveSurface'),
  'CTP clients saw Simplifi capture library',
  'Soft-redirect to Your Project',
  'resources/page.tsx',
);

check(
  'exec.notifications',
  'Executive dual',
  'high',
  notifications.includes('redirectCtpClientFromExecutiveSurface') &&
    notifications.includes('CX_EMOTION.notifications'),
  'Notification center · Pulse/Simplifi',
  'What’s new + CTP soft-redirect',
  'notifications/page.tsx',
);

check(
  'notify.panel',
  'Notifications',
  'med',
  notifyUi.includes('Nothing waiting — rest easy') && notifyUi.includes('See everything'),
  'You’re all caught up · View all activity',
  'Nothing waiting — rest easy · See everything',
  'NotificationCenter.tsx',
);

check(
  'assistant.shell',
  'AI',
  'high',
  layout.includes('data-ea-experience="client"') && assistant.includes('data-ea-experience'),
  'CTP mode only on /ctp path',
  'CTP mode whenever Client Experience shell mounts',
  'PortalLayout + EAAssistant',
);

check(
  'auth.realm',
  'Auth',
  'high',
  realm.includes('Your Client Experience') && realm.includes('Send my sign-in code'),
  'Welcome to your portal · Email me a login code',
  'Your Client Experience · Send my sign-in code',
  'realm-login-copy.ts',
);

check(
  'auth.login',
  'Auth',
  'med',
  login.includes('Sign in to your Client Experience') && !login.includes('Client Experience portal'),
  'Sign in to your Client Experience portal',
  'Sign in to your Client Experience',
  'portal/login/page.tsx',
);

check(
  'auth.register',
  'Auth',
  'med',
  register.includes('Ask to join your Client Experience') && register.includes('Send note'),
  'Request portal access · Submit request',
  'Ask to join · Send note',
  'RegisterForm.tsx',
);

check(
  'auth.magic',
  'Auth',
  'med',
  magic.includes('email from your welcome message') && !magic.includes('Client Record'),
  'Client Record / Portal Username jargon',
  'Welcome-message email guidance',
  'magic-link/route.ts',
);

check(
  'legal.gate',
  'Legal',
  'med',
  legalGate.includes('CX_EMOTION.legal') || legalGate.includes('quiet look') || legalGate.includes('A quiet pause'),
  'Updated documents require your review',
  'A quiet pause · quiet look',
  'LegalReacceptanceGate.tsx',
);

check(
  'guide.notify',
  'Email',
  'med',
  guideNotify.includes('Open Your Project') && !guideNotify.includes('Open your project Progress'),
  'Open your project Progress',
  'Open Your Project',
  'ctp-guide-notifications.ts',
);

const fixed = findings.filter((f) => f.status === 'FIXED').length;
const open = findings.filter((f) => f.status === 'OPEN').length;
const highOpen = findings.filter((f) => f.status === 'OPEN' && f.severity === 'high').length;
const score = Math.round((fixed / findings.length) * 100);

console.log('EA Ecosystem Experience Consistency Certification');
console.log('Gold standard: CTP Guide + Client Experience shell');
console.log('');
console.log(`Checks: ${findings.length}  Fixed: ${fixed}  Open: ${open}  High open: ${highOpen}`);
console.log(`Ecosystem consistency score: ${score}/100`);
console.log('');
for (const f of findings) {
  const mark = f.status === 'FIXED' ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${f.id} (${f.severity}) — ${f.evidence}`);
  if (f.status === 'OPEN') {
    console.log(`       before: ${f.before}`);
    console.log(`       after target: ${f.after}`);
  }
}

if (open > 0 || score < 90) {
  process.exit(1);
}
process.exit(0);
