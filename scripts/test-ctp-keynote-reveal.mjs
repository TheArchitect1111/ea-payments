/**
 * CTP keynote reveal wiring checks.
 * Run: node scripts/test-ctp-keynote-reveal.mjs
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

const revealLib = join(root, 'lib/ctp-reveal.ts');
const pagePath = join(root, 'app/reveal/[slug]/page.tsx');
const experiencePath = join(root, 'app/reveal/[slug]/RevealExperience.tsx');
const cssPath = join(root, 'app/reveal/[slug]/reveal.module.css');

for (const [path, label] of [
  [revealLib, 'ctp-reveal.ts'],
  [pagePath, 'reveal page'],
  [experiencePath, 'RevealExperience'],
  [cssPath, 'reveal.module.css'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const lib = readFileSync(revealLib, 'utf8');
const page = readFileSync(pagePath, 'utf8');
const experience = readFileSync(experiencePath, 'utf8');
const css = readFileSync(cssPath, 'utf8');

assert(lib.includes('buildCtpRevealView'), 'Must export reveal view builder');
assert(lib.includes('executiveSnapshot'), 'Reveal should use executive snapshot when present');
assert(lib.includes('productionPackage'), 'Reveal should surface production artifacts');
assert(page.includes('RevealExperience'), 'Page must mount keynote experience');
assert(page.includes('buildCtpRevealView'), 'Page must build reveal view model');
assert(experience.includes('Continue'), 'Keynote must support staged continue');
assert(experience.includes('Fraunces') || experience.includes('next/font'), 'Must use expressive display font');
assert(css.includes('ctpRevealShimmer'), 'Must include shimmer motion');
assert(css.includes('ctpRevealItem'), 'Must include cascade motion');

if (failures.length) {
  console.error('CTP keynote reveal checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP keynote reveal checks: PASS');
process.exit(0);
