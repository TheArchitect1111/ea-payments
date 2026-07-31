import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const [registry, catalog, page, client, api, provider, orgs] = await Promise.all([
  read('lib/modules/registry.ts'),
  read('lib/modules/business-options.ts'),
  read('app/portal/[slug]/calendar/page.tsx'),
  read('app/portal/[slug]/calendar/PortalCalendar.tsx'),
  read('app/api/portal/calendar/route.ts'),
  read('lib/calendar/nylas.ts'),
  read('lib/organizations.ts'),
]);

assert.match(registry, /id: 'calendar'/);
assert.match(catalog, /calendar-shared-scheduling[\s\S]*moduleIds: \['calendar'\]/);
assert.match(page, /requirePortalModule\(slug, 'calendar'\)/);
assert.match(client, /@fullcalendar\/react/);
assert.match(client, /timeGridWeek/);
assert.match(api, /session\.slug/);
assert.match(api, /moduleId: 'calendar'/);
assert.match(provider, /NYLAS_API_KEY/);
assert.match(provider, /Authorization: `Bearer \$\{apiKey\}`/);
assert.match(orgs, /nylasGrantId/);
assert.match(orgs, /nylasCalendarId/);

console.log('universal Nylas + FullCalendar module contract ok');
