#!/usr/bin/env node
/**
 * Contract: Field-stretch — share images, offline file queue, Ask citations + session history.
 * Run: node scripts/test-simplifi-field-stretch-contract.mjs
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

function read(rel) {
  const path = join(root, rel);
  assert(existsSync(path), `missing ${rel}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const ask = read('lib/simplifi-ask.ts');
assert(ask.includes('answerConversationalAskDetailed'), 'detailed ask result required');
assert(ask.includes('AskCitation'), 'AskCitation type required');
assert(ask.includes('citations'), 'citations on ask result required');

const history = read('lib/simplifi/ask-session-history.ts');
assert(history.includes('pushAskHistory'), 'session history writer required');
assert(history.includes('sessionStorage'), 'history must use sessionStorage');

const askBody = read('app/simplifi/components/AskAnswerBody.tsx');
assert(askBody.includes('Open this opportunity'), 'citation CTA required');
assert(askBody.includes('citations'), 'AskAnswerBody must render citations');

const askClient = read('app/simplifi/ask/AskClient.tsx');
assert(askClient.includes('answerConversationalAskDetailed'), 'AskClient must use detailed ask');
assert(askClient.includes('AskAnswerBody'), 'AskClient must render AskAnswerBody');
assert(askClient.includes('loadAskHistory'), 'AskClient must load session history');
assert(askClient.includes('This session'), 'AskClient must show session history');

const globalOrb = read('app/simplifi/components/GlobalOrb.tsx');
assert(globalOrb.includes('answerConversationalAskDetailed'), 'GlobalOrb must use detailed ask');
assert(globalOrb.includes('AskAnswerBody'), 'GlobalOrb must render citations');
assert(globalOrb.includes('onOpenOpportunity'), 'Orb citations must open session opportunity');

const captureApp = read('app/simplifi/capture/SimplifiCaptureApp.tsx');
assert(captureApp.includes('takePendingSharedFile'), 'capture must consume shared files');
assert(captureApp.includes("kind: 'file'"), 'capture must enqueue offline files');
assert(captureApp.includes('expectSharedFile'), 'capture must accept sharedFile seed');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS simplifi-field-stretch-contract');
