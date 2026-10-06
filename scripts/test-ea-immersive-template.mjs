import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const theme=read('vendor/theme-engine/src/themes/ea-immersive/theme.ts');
const themeIndex=read('vendor/theme-engine/src/index.ts');
const immersive=read('vendor/website-engine/src/immersive.ts');
const registry=read('vendor/website-engine/src/registry.ts');
const bridge=read('lib/platform/website-bridge.ts');
const preview=read('app/preview/experience/[slug]/[pageId]/ExperiencePreview.tsx');
const css=read('app/components/experience/themes/ea-immersive/ea-immersive.css');

assert.match(theme,/EA_IMMERSIVE_THEME_ID = 'ea-immersive'/);
assert.match(themeIndex,/eaImmersiveTheme/);
for(const id of ['immersive.hero','immersive.editorialFeature','immersive.productStage','immersive.cinematicMedia','immersive.benefitPair','immersive.trustStory','immersive.proofStatement','immersive.conversionFinale']) assert.ok(immersive.includes(id), 'missing '+id);
assert.match(immersive,/themeId: input.themeId \|\| 'ea-immersive'/);
assert.match(registry,/EA_IMMERSIVE_SECTIONS/);
assert.match(bridge,/assembleImmersiveTemplate/);
assert.match(preview,/themeId === 'ea-immersive'/);
assert.match(css,/\.ea-immersive-theme \.eb-hero/);
assert.match(css,/prefers-reduced-motion/);
console.log('PASS ea-immersive template contract');
