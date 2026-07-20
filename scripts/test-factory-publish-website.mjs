#!/usr/bin/env node
/**
 * Contract: Factory OIB brand → Publish Future Website → /sites/{slug}.
 * Run: node scripts/test-factory-publish-website.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(rel) {
  const path = join(root, rel);
  assert(existsSync(path), `missing ${rel}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const publish = read('lib/factory-publish-website.ts');
assert(publish.includes('publishFactoryWebsite'), 'publishFactoryWebsite required');
assert(publish.includes('assertWebsitePublishGate'), 'publish gate required');
assert(publish.includes('assertExperienceDirectorPublishGate'), 'Experience Director gate required');
assert(publish.includes('provisionWebsitePortalSite'), 'must reuse provisionWebsitePortalSite');
assert(publish.includes('buildFactoryConceptPackAsync'), 'must load concept/OIB pack');
assert(publish.includes('primaryColor'), 'must pass primary color');
assert(publish.includes('headline'), 'must pass headline');

const director = read('lib/factory-experience-review.ts');
assert(director.includes('Approved'), 'Experience Review statuses required');
assert(director.includes('assertExperienceDirectorPublishGate'), 'director publish gate helper');

const directorDash = read('app/admin/ea-factory/experience-director/page.tsx');
assert(directorDash.includes('Experience Director'), 'Experience Director dashboard page required');
assert(
  read('app/admin/ea-factory/experience-director/ExperienceDirectorClient.tsx').includes(
    'canPublish',
  ),
  'dashboard must gate Publish on Approved',
);

const provision = read('lib/provision-website-portal.ts');
assert(provision.includes('primaryColor'), 'starter Puck must accept primaryColor');
assert(provision.includes('headline'), 'starter Puck must accept headline');
assert(provision.includes('ensureOrganizationForPortal'), 'must ensure durable org');
assert(provision.includes('findOrganizationByPortalSlug'), 'findPublishedSitePage must resolve org');
assert(!provision.includes('listExperiencePages(portalSlug)'), 'must not call listExperiencePages with one arg');

const api = read('app/api/admin/factory/publish-website/route.ts');
assert(api.includes('publishFactoryWebsite'), 'admin API must call publishFactoryWebsite');
assert(api.includes('requireAdminActionFromRequest'), 'admin API must require admin auth');

const projects = read('app/admin/ea-factory/projects/ProjectsClient.tsx');
assert(projects.includes('Publish Future Website'), 'Factory desk must offer Publish Future Website');
assert(projects.includes('/api/admin/factory/publish-website'), 'UI must call publish API');

const preview = read('app/preview/experience/[slug]/[pageId]/ExperiencePreview.tsx');
assert(preview.includes('primaryColor') || preview.includes('--ea-navy'), 'preview must apply brand colors');

const fulfill = read('lib/fulfill-paid-client.ts');
assert(
  fulfill.includes('organizationId: orgId') || fulfill.includes('orgId: run.organizationId'),
  'fulfill must pass org id into site provision',
);

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS factory-publish-website-contract');
