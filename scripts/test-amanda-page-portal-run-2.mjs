import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('app/portal/amanda-catherine/owner/[section]/page.tsx', 'utf8');

for (const dependency of [
  'ENTREPRENEURIAL_ARTIST_COURSE',
  'AMANDA_PRACTITIONER_KIT',
  'DEFAULT_AMANDA_SITE_CONTENT',
]) assert.ok(source.includes(dependency), `Run 2 is missing verified source: ${dependency}`);

for (const route of [
  '/amanda-catherine/private/practitioner-kit',
  '/portal/amanda-catherine/learning',
]) assert.ok(source.includes(route), `Run 2 is missing connected route: ${route}`);

for (const url of [
  'https://www.empowerartcollective.com/',
  'https://empowerartcollective.com/events/',
  'https://empowerartcollective.com/contact-us/',
  'https://empowerartcollective.com/about-us/',
]) assert.ok(source.includes(url), `Run 2 is missing approved Empower Art URL: ${url}`);

assert.ok(source.includes("section === 'practitioner-kit'"));
assert.ok(source.includes("section === 'empower-art'"));
assert.ok(source.includes("section === 'book'"));

console.log('Amanda page-to-portal Run 2 wiring: PASS');
