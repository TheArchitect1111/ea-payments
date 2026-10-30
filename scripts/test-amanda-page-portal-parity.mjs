import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (pathname) => readFileSync(new URL(`../${pathname}`, import.meta.url), 'utf8');
const publicPage = `${read('app/amanda-catherine/page.tsx')}\n${read('app/amanda-catherine/ClientRequestedUpdates.tsx')}`;
const ownerLayout = read('app/portal/amanda-catherine/owner/layout.tsx');
const ownerNav = JSON.parse(read('knowledge/eva-menu-sources/amanda-owner.json'));
const ownerDashboard = read('app/portal/amanda-catherine/owner/page.tsx');
const ownerSections = read('app/portal/amanda-catherine/owner/[section]/page.tsx');

const ownerDestinations = [
  ['Appointments / Jane', 'appointments'],
  ['AesthetiKine Academy', 'academy'],
  ['Practitioner Starter Kit', 'practitioner-kit'],
  ['LIFELINE', 'lifeline'],
  ['Empower Art Collective', 'empower-art'],
  ['Founder Advisory', 'advisory'],
  ['Founder Clarity', 'clarity'],
  ['Speaking & Media', 'speaking'],
  ['The Entrepreneurial Artist', 'book'],
  ['RIMAN Canada', 'riman'],
  ['Reviews & Testimonials', 'reviews'],
];

assert.ok(ownerLayout.includes("from '@/knowledge/eva-menu-sources/amanda-owner.json'"), 'owner layout must use the canonical menu source');
assert.ok(ownerLayout.includes('ownerNav.items.map'), 'owner layout must render the canonical menu items');
for (const [label, slug] of ownerDestinations) {
  const destination = `/portal/amanda-catherine/owner/${slug}`;
  assert.ok(ownerNav.items.some((item) => item.label === label && item.href === destination), `owner menu source is missing ${label}`);
  assert.ok(ownerSections.includes(`${slug.includes('-') ? `'${slug}'` : slug}:`), `owner section registry is missing ${slug}`);
}

const grid = read('components/amanda/AmandaClassesGrid.tsx');
const policy = read('lib/amanda-catherine/class-cta-policy.ts');
assert.ok(publicPage.includes('<AmandaClassesGrid courses={courses}/>'), 'homepage must use shared registry grid');
assert.ok(grid.includes('id="classes-grid"') && grid.includes('getCTA(c)'), 'shared grid anchor and CTA policy required');
assert.ok(policy.includes("label:'Register'") && policy.includes("label:'Join Waitlist'"), 'two-state CTA labels required');
assert.ok(policy.includes("action:'/courses/'+encodeURIComponent(course.key)+'#waitlist'"), 'existing waitlist route must remain');
assert.ok(publicPage.includes('/portal/login?next=%2Fportal%2Famanda-catherine%2Flearning'), 'returning-student learning route is missing');
assert.ok(!publicPage.includes('/amanda-catherine/private/practitioner-kit'), 'public practitioner-kit checkout must not be linked');
assert.ok(!publicPage.includes('/portal/amanda-catherine/owner'), 'public visitors must never be routed into the owner portal');

console.log('Amanda page-to-portal parity: PASS');
