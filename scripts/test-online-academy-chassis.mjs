import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [catalog, pack, registry] = await Promise.all([
  read('lib/modules/business-options.ts'),
  read('lib/portal-universal/packs/online-academy.ts'),
  read('lib/portal-universal/packs/index.ts'),
]);

assert.match(catalog, /id: 'online-academy-student-portal'/);
for (const moduleId of ['landing', 'training', 'calendar', 'documents', 'resources', 'billing', 'people', 'intake', 'applications', 'reports', 'messaging', 'settings']) {
  assert.match(catalog, new RegExp(`['"]${moduleId}['"]`), `academy option missing ${moduleId}`);
}

assert.match(pack, /title: 'Online Academy \+ Student Portal'/);
assert.match(pack, /label: 'Courses & Learning'/);
assert.match(pack, /label: 'Students'/);
assert.match(pack, /label: 'Progress & Revenue'/);
assert.match(pack, /academy-public-course-cta/);
assert.match(pack, /academy-payment-and-access/);
assert.match(pack, /academy-welcome-and-sign-in/);
assert.match(pack, /academy-progress-and-certificate/);
assert.match(pack, /academy-protected-course-materials/);
assert.match(pack, /academy-scheduled-lesson-release/);
assert.match(pack, /academy-assignment-and-practical-completion/);
assert.match(pack, /academy-student-progress-alerts/);
assert.match(pack, /academy-instructor-messaging/);
assert.match(pack, /academy-practitioner-pathway/);
assert.match(pack, /Assignment and Practical Submission/);
assert.match(pack, /Certified Practitioner Directory Application/);
assert.match(pack, /label: 'Training Calendar'/);
assert.match(pack, /label: 'Assignments & Uploads'/);
assert.match(pack, /label: 'Progress & Certificates'/);
assert.match(pack, /create student access automatically/);
assert.match(registry, /ONLINE_ACADEMY_PACK/);

console.log('online academy chassis option ok');
