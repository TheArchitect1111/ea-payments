import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [catalog, registry, api, panel, events] = await Promise.all([
  read('lib/modules/business-options.ts'),
  read('lib/modules/registry.ts'),
  read('app/api/admin/entitlements/route.ts'),
  read('app/admin/capability-marketplace/EntitlementsPanel.tsx'),
  read('app/portal/[slug]/events/page.tsx'),
]);

const optionIds = [
  'calendar-shared-scheduling',
  'forms-intake-applications',
  'approval-workflows',
  'reports-dashboards',
  'people-directory',
  'training-learning',
  'resource-library',
  'event-registration-ticketing',
  'updates-change-requests',
  'website-page-editor',
  'member-directory',
  'opportunities-recommendations',
  'roles-permissions',
];

for (const optionId of optionIds) {
  assert.match(catalog, new RegExp(`['\"]${optionId}['\"]`), `missing ${optionId}`);
}

assert.match(registry, /Calendar & Event Hub/);
assert.match(registry, /EA Shared Calendar/);
assert.match(catalog, /moduleIds: \['calendar'\]/);
assert.match(api, /set-business-option/);
assert.match(api, /BUSINESS_OPTION_CATALOG/);
assert.match(panel, /Enable complete portal options/);
assert.match(panel, /toggleBusinessOption/);
assert.match(events, /Calendar & shared scheduling/);

console.log(`universal business options ok (${optionIds.length} options)`);
