#!/usr/bin/env node
/**
 * CTP Phase 4B — portal asset gallery on Opportunity Dashboard landing.
 * Run: node scripts/test-ctp-portal-asset-gallery.mjs
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

const pagePath = join(root, 'app/portal/[slug]/ctp/page.tsx');
const galleryPath = join(root, 'app/portal/components/PortalCtpAssetGallery.tsx');
const statusPath = join(root, 'lib/ctp-portal-status.ts');
const apiPath = join(root, 'app/api/portal/ctp/route.ts');

assert(existsSync(pagePath), 'missing portal CTP page');
assert(existsSync(galleryPath), 'missing PortalCtpAssetGallery');
assert(existsSync(statusPath), 'missing ctp-portal-status');
assert(existsSync(apiPath), 'missing portal CTP API');

const page = readFileSync(pagePath, 'utf8');
const gallery = readFileSync(galleryPath, 'utf8');
const status = readFileSync(statusPath, 'utf8');
const api = readFileSync(apiPath, 'utf8');

assert(page.includes('PortalCtpAssetGallery'), 'CTP landing must mount asset gallery');
assert(page.includes('buildCtpPortalStatusView') || page.includes('assets'), 'landing must supply assets');
assert(gallery.includes('if (!assets.length) return null'), 'empty gallery must hide');
assert(gallery.includes('/api/ctp/assets') || gallery.includes('asset.url'), 'asset links required');
assert(status.includes('assets:'), 'portal status view must include assets');
assert(status.includes('buildCtpAdminAssetViews'), 'status must project asset manifest');
assert(api.includes('buildCtpPortalStatusView'), 'portal API must return status view with assets');

if (failures.length) {
  console.error('CTP portal asset gallery checks FAILED:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('CTP portal asset gallery checks: PASS');
