/**
 * CTP portal documents vault wiring checks.
 * Run: node scripts/test-ctp-portal-documents.mjs
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

const viewPath = join(root, 'lib/ctp-documents-view.ts');
const pagePath = join(root, 'app/portal/[slug]/ctp/documents/page.tsx');
const ctpPagePath = join(root, 'app/portal/[slug]/ctp/page.tsx');
const adminPath = join(root, 'app/admin/ctp/CtpSubmissionsClient.tsx');

for (const [path, label] of [
  [viewPath, 'ctp-documents-view.ts'],
  [pagePath, 'documents page'],
  [ctpPagePath, 'portal CTP page'],
  [adminPath, 'admin CTP client'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const view = readFileSync(viewPath, 'utf8');
const page = readFileSync(pagePath, 'utf8');
const ctpPage = readFileSync(ctpPagePath, 'utf8');
const admin = readFileSync(adminPath, 'utf8');

assert(view.includes('buildCtpDocumentsView'), 'Must export documents view builder');
assert(view.includes('deliverables'), 'Must include generated deliverables');
assert(view.includes('assetManifest') || view.includes('buildCtpAdminAssetViews'), 'Must include uploads');
assert(page.includes('buildCtpDocumentsView'), 'Page must use documents view');
assert(page.includes('Generated deliverables'), 'Page must list deliverables');
assert(page.includes('PortalCtpAssetGallery'), 'Page must show upload gallery when present');
assert(page.includes('requirePortalModule'), 'Page must require ctp module');
assert(ctpPage.includes('/ctp/documents'), 'Progress must link to documents');
assert(admin.includes('/ctp/documents'), 'Admin must link to documents');

if (failures.length) {
  console.error('CTP portal documents checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP portal documents checks: PASS');
process.exit(0);
