import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [engine, theme, preview, components] = await Promise.all([
  read('vendor/theme-engine/src/index.ts'),
  read('vendor/theme-engine/src/themes/amanda-editorial/theme.ts'),
  read('app/preview/experience/[slug]/[pageId]/ExperiencePreview.tsx'),
  read('app/components/experience/themes/amanda-editorial/AmandaEditorialTheme.tsx'),
]);

assert.match(engine, /amandaEditorialTheme/);
assert.match(theme, /id: AMANDA_EDITORIAL_THEME_ID/);
assert.match(preview, /themeId === 'amanda-editorial'/);
for (const component of [
  'EditorialNavigation', 'EditorialHero', 'EditorialSection', 'EditorialCardRail',
  'EditorialImageMosaic', 'EditorialQuote', 'EditorialCta', 'EditorialFooter',
]) assert.match(components, new RegExp(`function ${component}`));

for (const forbidden of ['fetch(', 'createClient(', 'stripe.', 'signIn(', 'router.push(']) {
  assert.doesNotMatch(components, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

console.log('Amanda Editorial theme contract: PASS');
