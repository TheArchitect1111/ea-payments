#!/usr/bin/env node
/**
 * Contract: Chrome Fade (Step 5) — opt-in thinner nav; Brief stays home.
 * Run: node scripts/test-simplifi-chrome-fade-contract.mjs
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

const fadePath = join(root, 'lib/simplifi/chrome-fade.ts');
assert(existsSync(fadePath), 'missing lib/simplifi/chrome-fade.ts');
const fade = existsSync(fadePath) ? readFileSync(fadePath, 'utf8') : '';
assert(fade.includes('CHROME_FADE_COOKIE'), 'cookie constant required');
assert(fade.includes('ea-simplifi-chrome-fade'), 'cookie name must be ea-simplifi-chrome-fade');
assert(fade.includes('NEXT_PUBLIC_SIMPLIFI_CHROME_FADE'), 'env flag required');
assert(fade.includes('writeChromeFadePreference'), 'client writer required');
assert(fade.includes('resolveChromeFadeClient'), 'client resolver required');

const apiPath = join(root, 'app/api/simplifi/chrome-fade/route.ts');
assert(existsSync(apiPath), 'missing chrome-fade API route');

const chrome = readFileSync(join(root, 'app/simplifi/components/SimplifiAppChrome.tsx'), 'utf8');
assert(chrome.includes('chromeFade'), 'AppChrome must accept chromeFade');
assert(chrome.includes('primary'), 'primary nav items must be marked for fade hide');
assert(chrome.includes('sw-header--fade'), 'fade header class required');
assert(chrome.includes('Settings'), 'Settings must remain available');
assert(chrome.includes('SIMPLIFI'), 'brand mark must remain');

const shell = readFileSync(join(root, 'app/simplifi/components/SimplifiProductShell.tsx'), 'utf8');
assert(shell.includes('resolveChromeFadeClient'), 'ProductShell must resolve fade client-side');
assert(shell.includes('CHROME_FADE_CHANGE_EVENT'), 'ProductShell must listen for toggle events');
assert(shell.includes('chromeFade={chromeFade}'), 'ProductShell must pass fade to AppChrome');

const togglePath = join(root, 'app/simplifi/settings/ChromeFadeToggle.tsx');
assert(existsSync(togglePath), 'missing ChromeFadeToggle');
const settings = readFileSync(join(root, 'app/simplifi/settings/page.tsx'), 'utf8');
assert(settings.includes('ChromeFadeToggle'), 'Settings must render ChromeFadeToggle');

const orbPage = readFileSync(join(root, 'app/simplifi/orb/page.tsx'), 'utf8');
assert(
  orbPage.includes('workspace') || orbPage.includes('redirect'),
  'Orb page must not become default home via chrome fade',
);
assert(!fade.includes('/simplifi/orb'), 'chrome fade must not redirect to chat-first Orb');

const envExample = readFileSync(join(root, '.env.example'), 'utf8');
assert(envExample.includes('NEXT_PUBLIC_SIMPLIFI_CHROME_FADE'), '.env.example must document fade flag');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS simplifi-chrome-fade-contract');
