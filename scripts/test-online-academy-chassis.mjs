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
for (const moduleId of ['landing', 'training', 'resources', 'billing', 'people', 'applications', 'reports', 'settings']) {
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
assert.match(pack, /create student access automatically/);
assert.match(registry, /ONLINE_ACADEMY_PACK/);

console.log('online academy chassis option ok');
