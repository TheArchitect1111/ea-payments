import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (pathname) => readFileSync(new URL(`../${pathname}`, import.meta.url), 'utf8');
const publicPage = `${read('app/amanda-catherine/page.tsx')}\n${read('app/amanda-catherine/ClientRequestedUpdates.tsx')}`;
const ownerLayout = read('app/portal/amanda-catherine/owner/layout.tsx');
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

for (const [label, slug] of ownerDestinations) {
  assert.ok(ownerLayout.includes(label), `owner navigation is missing ${label}`);
  assert.ok(ownerLayout.includes(`/portal/amanda-catherine/owner/${slug}`), `owner navigation is missing ${slug}`);
  assert.ok(ownerDashboard.includes(`'${slug}'`), `owner Quick Actions are missing ${slug}`);
  assert.ok(ownerSections.includes(`${slug.includes('-') ? `'${slug}'` : slug}:`), `owner section registry is missing ${slug}`);
}

assert.ok(publicPage.includes('/portal/amanda-catherine/enroll?course='), 'public course enrollment route is missing');
assert.ok(publicPage.includes('/portal/login?next=%2Fportal%2Famanda-catherine%2Flearning'), 'returning-student learning route is missing');
assert.ok(publicPage.includes('/amanda-catherine/private/practitioner-kit'), 'public practitioner-kit route is missing');
assert.ok(!publicPage.includes('/portal/amanda-catherine/owner'), 'public visitors must never be routed into the owner portal');

console.log('Amanda page-to-portal parity: PASS');
