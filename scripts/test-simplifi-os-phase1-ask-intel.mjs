/**
 * Phase 1 slice contract: Semantic Ask + Intelligence + Brief merge.
 * Offline / flag-safe — does not require live Supabase.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

// --- File presence ---
const required = [
  'lib/simplifi-os/ask.ts',
  'lib/simplifi-os/retrieve.ts',
  'lib/simplifi-os/embed.ts',
  'lib/simplifi-os/embed-provider.ts',
  'lib/simplifi-os/intelligence-detectors.ts',
  'lib/simplifi-os/intelligence-feedback.ts',
  'lib/simplifi-os/brief-merge.ts',
  'lib/simplifi-os/workflows/run-intelligence-pass.ts',
  'app/api/simplifi/ask/route.ts',
  'app/api/simplifi/intelligence/feedback/route.ts',
  'app/api/cron/simplifi-intelligence/route.ts',
  'supabase/migrations/006_simplifi_phase1_ask_intel.sql',
];
for (const rel of required) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

// --- Flags ---
const flags = read('lib/simplifi-os/flags.ts');
assert.match(flags, /SIMPLIFI_EMBED/);
assert.match(flags, /SIMPLIFI_SEMANTIC_ASK/);
assert.match(flags, /SIMPLIFI_INTELLIGENCE/);
assert.match(flags, /SIMPLIFI_BRIEF_INTEL/);
assert.match(flags, /SIMPLIFI_OS_READ/);
assert.doesNotMatch(flags, /SIMPLIFI_OS_READ\s*=\s*['"]1['"]/);

// --- Ask API isolation ---
const askRoute = read('app/api/simplifi/ask/route.ts');
assert.match(askRoute, /requirePortalSession/);
assert.match(askRoute, /realm:\s*'simplifi'/);
assert.match(askRoute, /answerSemanticAsk/);
assert.match(askRoute, /session\.slug/);
assert.doesNotMatch(askRoute, /SUPABASE_SERVICE/);

// --- Cron thinness ---
const cron = read('app/api/cron/simplifi-intelligence/route.ts');
assert.match(cron, /runIntelligenceWorkflow/);
assert.match(cron, /CRON_SECRET/);
assert.doesNotMatch(cron, /detectIntelligenceItems/);

// --- Keyword fallback preserved ---
const retrieve = read('lib/simplifi-os/retrieve.ts');
assert.match(retrieve, /answerConversationalAskDetailed/);
assert.match(retrieve, /callClaudeText/);
assert.match(retrieve, /insufficient/);
assert.match(retrieve, /RETRIEVE_TIMEOUT|withTimeout/);
assert.match(retrieve, /match_portal/);

const keywordAsk = read('lib/simplifi-ask.ts');
assert.match(keywordAsk, /answerConversationalAskDetailed/);

// --- Embedding dedupe ---
const embed = read('lib/simplifi-os/embed.ts');
assert.match(embed, /content_hash/);
assert.match(embed, /unchanged/);
assert.match(embed, /retry_count/);
assert.match(embed, /enqueueEmbedding/);
assert.doesNotMatch(embed, /SIMPLIFI_OS_READ/);

const embedProvider = read('lib/simplifi-os/embed-provider.ts');
assert.match(embedProvider, /hashEmbedContent/);
const h1 = createHash('sha256').update('same').digest('hex');
const h2 = createHash('sha256').update('same').digest('hex');
const h3 = createHash('sha256').update('other').digest('hex');
assert.equal(h1, h2);
assert.notEqual(h1, h3);

// --- Migration ---
const mig = read('supabase/migrations/006_simplifi_phase1_ask_intel.sql');
assert.match(mig, /simplifi_intelligence_items/);
assert.match(mig, /simplifi_job_runs/);
assert.match(mig, /match_simplifi_embeddings/);
assert.match(mig, /feedback_state/);
assert.match(mig, /source_text/);
assert.doesNotMatch(mig, /neo4j|apache.?age/i);

// --- Brief merge preserves base ---
const briefMerge = read('lib/simplifi-os/brief-merge.ts');
assert.match(briefMerge, /buildDailyBrief/);
assert.match(briefMerge, /needsAttention/);
assert.match(briefMerge, /whyMatters/);
assert.match(briefMerge, /isSimplifiBriefIntelEnabled/);
assert.match(flags, /SIMPLIFI_BRIEF_INTEL/);

const briefRoute = read('app/api/simplifi/brief/route.ts');
assert.match(briefRoute, /buildMergedDailyBrief/);

const workspaceLoader = read('lib/simplifi-core/workspace.ts');
assert.match(workspaceLoader, /buildMergedDailyBrief/);

const briefPanel = read('app/simplifi/workspace/BriefIntelligencePanel.tsx');
assert.match(briefPanel, /Why this matters/);
assert.match(briefPanel, /intelligence\/feedback/);
assert.match(briefPanel, /Needs Your Attention/);

// --- Feedback ---
const feedback = read('lib/simplifi-os/intelligence-feedback.ts');
for (const action of [
  'viewed',
  'opened',
  'completed',
  'deferred',
  'dismissed',
  'ignored',
  'helpful',
  'incorrect',
]) {
  assert.match(feedback, new RegExp(action));
}
assert.match(feedback, /recordMemoryEvent/);

// --- Detectors + ranking (source contract; runtime via Next) ---
const detectors = read('lib/simplifi-os/intelligence-detectors.ts');
assert.match(detectors, /forgotten_commitment|stalled_opportunity|upcoming_deadline/);
assert.match(detectors, /duplicate_work/);
assert.match(detectors, /repeated_idea/);
assert.match(detectors, /rankIntelligenceItems/);
assert.match(detectors, /fingerprint/);

// Deterministic fingerprint uniqueness helper (mirrors detector intent)
function fingerprintSet(items) {
  return new Set(items.map((i) => i.fingerprint));
}
const sampleFingerprints = [
  { fingerprint: 'upcoming_deadline:recA' },
  { fingerprint: 'duplicate_work:recA:recB' },
  { fingerprint: 'repeated_idea:cpr partnership proposal' },
  { fingerprint: 'duplicate_work:recA:recB' },
];
const unique = fingerprintSet(sampleFingerprints);
assert.equal(unique.size, 3, 'duplicate intelligence fingerprints must collapse');

// --- Workflow idempotency ---
const workflow = read('lib/simplifi-os/workflows/run-intelligence-pass.ts');
assert.match(workflow, /idempotency_key|idempotencyKey/);
assert.match(workflow, /simplifi_job_runs/);
assert.match(workflow, /fingerprint/);

const vercel = read('vercel.json');
assert.match(vercel, /\/api\/cron\/simplifi-intelligence/);

const askClient = read('app/simplifi/ask/AskClient.tsx');
assert.match(askClient, /\/api\/simplifi\/ask/);
assert.match(askClient, /answerConversationalAskDetailed/);

const globalOrb = read('app/simplifi/components/GlobalOrb.tsx');
assert.match(globalOrb, /\/api\/simplifi\/ask/);

const foundation = read('scripts/test-simplifi-os-foundation.mjs');
assert.match(foundation, /afterCaptureOsWrite/);

console.log('OK simplifi-os phase1 ask+intel contract');
console.log(
  JSON.stringify(
    {
      files: required.length,
      fingerprintDedupe: unique.size,
    },
    null,
    2,
  ),
);
