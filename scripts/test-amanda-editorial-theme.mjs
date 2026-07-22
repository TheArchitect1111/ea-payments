import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [engine, theme, preview, components, publishGate, portalChrome, portalLayout, factoryUi] = await Promise.all([
  read('vendor/theme-engine/src/index.ts'),
  read('vendor/theme-engine/src/themes/amanda-editorial/theme.ts'),
  read('app/preview/experience/[slug]/[pageId]/ExperiencePreview.tsx'),
  read('app/components/experience/themes/amanda-editorial/AmandaEditorialTheme.tsx'),
  read('lib/website-publish-gate.ts'),
  read('lib/platform/portal-workspace.ts'),
  read('lib/chassis/PortalLayout.tsx'),
  read('app/admin/ea-factory/experience-director/ExperienceDirectorClient.tsx'),
]);

assert.match(engine, /amandaEditorialTheme/);
assert.match(theme, /id: AMANDA_EDITORIAL_THEME_ID/);
assert.match(preview, /themeId === 'amanda-editorial'/);
assert.match(publishGate, /themeId: input\.themeId\?\.trim\(\) \|\| 'ea-default-theme'/);
assert.match(publishGate, /themeId: input\.themeId/);
assert.match(portalChrome, /themeId: shell\.theme\.id/);
assert.match(portalLayout, /data-workspace-theme=\{themeId\}/);
assert.match(factoryUi, /Amanda Editorial/);
assert.match(factoryUi, /portalLoginUrl/);
for (const component of [
  'EditorialNavigation', 'EditorialHero', 'EditorialSection', 'EditorialCardRail',
  'EditorialImageMosaic', 'EditorialQuote', 'EditorialCta', 'EditorialFooter',
]) assert.match(components, new RegExp(`function ${component}`));

for (const forbidden of ['fetch(', 'createClient(', 'stripe.', 'signIn(', 'router.push(']) {
  assert.doesNotMatch(components, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

console.log('Amanda Editorial theme contract: PASS');
