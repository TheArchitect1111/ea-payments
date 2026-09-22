import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const contract = readFileSync('specs/amanda-page-portal-wiring/run-0-intake-contract.md', 'utf8');

const mappings = [
  ['founder-advisory', '/portal/amanda-catherine/owner/advisory'],
  ['speaking-media', '/portal/amanda-catherine/owner/speaking'],
  ['lifeline-media-guest', '/portal/amanda-catherine/owner/lifeline'],
  ['partner-vendor-application', '/portal/amanda-catherine/owner/lifeline'],
];

for (const [formId, ownerRoute] of mappings) {
  assert.ok(contract.includes(formId), `missing form contract: ${formId}`);
  assert.ok(contract.includes(ownerRoute), `missing owner queue: ${ownerRoute}`);
}

for (const boundary of [
  'Preserve the approved public page design',
  'Keep Amanda\'s email visible as a secondary fallback',
  'Application forms require no sign-in',
  'one, and only one',
  'Production and the frozen Portal V2 baseline remain untouched',
]) assert.ok(contract.includes(boundary), `missing Run 0 boundary: ${boundary}`);

console.log('Amanda intake Run 0 contract: PASS');
