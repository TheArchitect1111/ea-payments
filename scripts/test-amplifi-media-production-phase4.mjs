/**
 * Amplifi Phase 4 media production contract.
 * Run: node scripts/test-amplifi-media-production-phase4.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function read(rel) {
  const path = join(root, rel);
  if (!existsSync(path)) throw new Error(`Missing ${rel}`);
  return readFileSync(path, 'utf8');
}
let failed = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failed += 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const types = read('lib/creative-studio/types.ts');
const validation = read('lib/creative-studio/media-validation.ts');
const mediaRoute = read('app/api/creative-studio/media/route.ts');
const attachRoute = read('app/api/creative-studio/campaigns/[id]/media/route.ts');
const publisher = read('lib/creative-studio/publish-asset.ts');
const provider = read('lib/amplifi-publish.ts');
const library = read('app/admin/creative-studio/media/MediaLibraryClient.tsx');
const dashboard = read('app/admin/creative-studio/campaigns/[id]/CampaignDashboardClient.tsx');

for (const field of ['width?: number', 'height?: number', 'altText?: string', 'rightsConfirmed?: boolean', 'rightsSource?: string']) {
  assert(types.includes(field), `media models ${field}`);
}
assert(validation.includes('Media usage rights must be confirmed.'), 'validation requires media rights');
assert(validation.includes('Image alternative text is required.'), 'validation requires alt text');
assert(validation.includes('aspect ratio between 4:5 and 1.91:1'), 'Instagram aspect ratio is validated');
assert(validation.includes('Facebook image width must be at least 600 pixels.'), 'Facebook dimensions are validated');
assert(mediaRoute.includes('A public HTTPS media URL is required.'), 'library requires durable HTTPS media');
assert(attachRoute.includes('validateMediaForAsset'), 'campaign attachment validates media');
assert(publisher.includes('socialAssetRequiresMedia(asset)'), 'social publishing enforces the media gate');
assert(publisher.includes("status: 'blocked'"), 'invalid media blocks publishing');
assert(provider.includes('media: input.media'), 'provider receives validated media');
assert(library.includes('I confirm EA or the client has permission'), 'operator confirms media rights');
assert(dashboard.includes('Select validated media'), 'campaign dashboard attaches media');

process.exit(failed ? 1 : 0);
