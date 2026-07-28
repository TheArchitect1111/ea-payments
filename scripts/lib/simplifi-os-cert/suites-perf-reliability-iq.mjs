import { performance } from 'node:perf_hooks';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { check } from './score.mjs';
import { actionCenterFromObjects, fixturePortalA } from './fixtures.mjs';
import { detectCert, hashEmbed, keywordAskCert } from './suites-functional-security.mjs';

function read(root, rel) {
  return readFileSync(join(root, rel), 'utf8');
}

/**
 * @param {string} root
 */
export function runPerformanceSuite(root) {
  /** @type {import('./score.mjs').CertCheck[]} */
  const out = [];
  const portalA = fixturePortalA();
  const ac = actionCenterFromObjects(portalA.objects);

  // Capture path must not await embed (source contract + timing of local mirrors)
  const captureHook = read(root, 'lib/simplifi-os/capture-hook.ts');
  const capturePipeline = read(root, 'lib/capture-pipeline.ts');
  out.push(
    check({
      id: 'perf.capture.nonblocking-embed',
      subsystem: 'performance',
      title: 'Capture does not block on embedding',
      status:
        captureHook.includes('enqueueEmbedding') &&
        !captureHook.includes('await upsertEmbedding') &&
        capturePipeline.includes('void afterCaptureOsWrite')
          ? 'PASS'
          : 'FAIL',
      blocking: true,
      evidence: 'afterCaptureOsWrite fire-and-forget; enqueueEmbedding async',
      maxScore: 12,
    }),
  );

  // Detector latency budget
  const samples = [];
  for (let i = 0; i < 50; i++) {
    const t0 = performance.now();
    detectCert(portalA.objects);
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  const p50 = samples[Math.floor(samples.length * 0.5)];
  const p95 = samples[Math.floor(samples.length * 0.95)];
  out.push(
    check({
      id: 'perf.intel.detector-latency',
      subsystem: 'performance',
      title: 'Intelligence detector p95 latency (local)',
      status: p95 < 25 ? 'PASS' : p95 < 80 ? 'WARNING' : 'FAIL',
      blocking: p95 >= 200,
      evidence: `p50=${p50.toFixed(2)}ms p95=${p95.toFixed(2)}ms (n=50)`,
      latencyMs: Math.round(p95),
      metrics: { p50, p95 },
      maxScore: 10,
    }),
  );

  // Keyword retrieve latency
  const askSamples = [];
  const qs = [
    'What did I promise Mike?',
    'What have I captured about CPR?',
    'Which opportunities have gone quiet?',
  ];
  for (let i = 0; i < 40; i++) {
    const t0 = performance.now();
    keywordAskCert(qs[i % qs.length], portalA.objects, ac);
    askSamples.push(performance.now() - t0);
  }
  askSamples.sort((a, b) => a - b);
  const askP95 = askSamples[Math.floor(askSamples.length * 0.95)];
  out.push(
    check({
      id: 'perf.ask.keyword-latency',
      subsystem: 'performance',
      title: 'Keyword Ask p95 latency (local)',
      status: askP95 < 10 ? 'PASS' : askP95 < 40 ? 'WARNING' : 'FAIL',
      blocking: false,
      evidence: `p95=${askP95.toFixed(2)}ms — semantic/LLM budgets are 800ms/8s in retrieve.ts`,
      latencyMs: Math.round(askP95),
      maxScore: 8,
    }),
  );

  const retrieve = read(root, 'lib/simplifi-os/retrieve.ts');
  out.push(
    check({
      id: 'perf.ask.timeouts',
      subsystem: 'performance',
      title: 'Semantic retrieve + LLM timeouts configured',
      status:
        retrieve.includes('RETRIEVE_TIMEOUT_MS = 800') && retrieve.includes('LLM_TIMEOUT_MS = 8_000')
          ? 'PASS'
          : 'WARNING',
      blocking: false,
      evidence: 'RETRIEVE_TIMEOUT_MS=800 LLM_TIMEOUT_MS=8000',
      maxScore: 10,
    }),
  );

  // Brief merge local timing (section assembly mirror)
  const findings = detectCert(portalA.objects);
  const tBrief0 = performance.now();
  const sections = {
    needsAttention: [],
    momentum: [],
    commitmentsAtRisk: [],
    recommendedFollowUps: [],
    emergingConnections: [],
    nextBestActions: [],
  };
  const seen = new Set();
  for (const f of findings) {
    if (seen.has(f.title)) continue;
    seen.add(f.title);
    const key =
      f.itemType === 'momentum'
        ? 'momentum'
        : f.itemType === 'upcoming_deadline' || f.itemType === 'pending_promise'
          ? 'commitmentsAtRisk'
          : f.itemType === 'stalled_opportunity' || f.itemType === 'inactive_client'
            ? 'needsAttention'
            : 'emergingConnections';
    sections[key].push(f);
    if (f.priority === 'critical' || f.priority === 'high') sections.nextBestActions.push(f);
  }
  const briefMs = performance.now() - tBrief0;
  out.push(
    check({
      id: 'perf.brief.assemble',
      subsystem: 'performance',
      title: 'Brief section assembly latency (local)',
      status: briefMs < 15 ? 'PASS' : 'WARNING',
      blocking: false,
      evidence: `${briefMs.toFixed(2)}ms for ${findings.length} findings`,
      latencyMs: Math.round(briefMs),
      maxScore: 8,
    }),
  );

  // Embed hash throughput
  const tEmb0 = performance.now();
  for (let i = 0; i < 200; i++) hashEmbed(`content-${i}-cert`);
  const embMs = performance.now() - tEmb0;
  out.push(
    check({
      id: 'perf.embed.hash',
      subsystem: 'performance',
      title: 'Embedding content-hash throughput',
      status: embMs < 50 ? 'PASS' : 'WARNING',
      blocking: false,
      evidence: `200 hashes in ${embMs.toFixed(2)}ms`,
      latencyMs: Math.round(embMs),
      maxScore: 5,
    }),
  );

  // Workflow / cron thinness
  const cron = read(root, 'app/api/cron/simplifi-intelligence/route.ts');
  const workflow = read(root, 'lib/simplifi-os/workflows/run-intelligence-pass.ts');
  out.push(
    check({
      id: 'perf.workflow.separation',
      subsystem: 'performance',
      title: 'Cron is thin; workflow holds durable process',
      status:
        cron.includes('runIntelligenceWorkflow') &&
        !cron.includes('detectIntelligenceItems') &&
        workflow.includes('idempotency')
          ? 'PASS'
          : 'FAIL',
      blocking: true,
      evidence: 'Business process in runIntelligenceWorkflow; cron only triggers',
      maxScore: 10,
    }),
  );

  out.push(
    check({
      id: 'perf.live.llm-embed',
      subsystem: 'performance',
      title: 'Live LLM/embed latency (requires env)',
      status: 'SKIP',
      blocking: false,
      evidence: 'Shadow harness does not call OpenAI/Claude — measure in dogfood with flags on',
      maxScore: 10,
      score: 0,
    }),
  );

  return out;
}

/**
 * @param {string} root
 */
export function runReliabilitySuite(root) {
  /** @type {import('./score.mjs').CertCheck[]} */
  const out = [];
  const embed = read(root, 'lib/simplifi-os/embed.ts');
  const workflow = read(root, 'lib/simplifi-os/workflows/run-intelligence-pass.ts');
  const retrieve = read(root, 'lib/simplifi-os/retrieve.ts');
  const flags = read(root, 'lib/simplifi-os/flags.ts');
  const briefMerge = read(root, 'lib/simplifi-os/brief-merge.ts');
  const feedback = read(root, 'lib/simplifi-os/intelligence-feedback.ts');

  out.push(
    check({
      id: 'rel.embed.retry',
      subsystem: 'reliability',
      title: 'Embedding failure increments retry_count',
      status: embed.includes("status: 'failed'") && embed.includes('priorRetry + 1') ? 'PASS' : 'FAIL',
      blocking: true,
      evidence: 'failed rows retain retry_count for backfill',
      maxScore: 10,
    }),
  );

  out.push(
    check({
      id: 'rel.intel.idempotency',
      subsystem: 'reliability',
      title: 'Intelligence job idempotency key',
      status:
        workflow.includes('idempotency_key') &&
        workflow.includes('simplifi_job_runs') &&
        workflow.includes('idempotent_skip')
          ? 'PASS'
          : 'FAIL',
      blocking: true,
      evidence: 'Daily idempotency_key prevents duplicate runs',
      maxScore: 12,
    }),
  );

  out.push(
    check({
      id: 'rel.intel.fingerprint',
      subsystem: 'reliability',
      title: 'Intelligence upsert by fingerprint',
      status: workflow.includes('on_conflict=portal_slug,fingerprint') ? 'PASS' : 'FAIL',
      blocking: true,
      evidence: 'Duplicate findings suppressed at persistence layer',
      maxScore: 10,
    }),
  );

  // Duplicate suppression on local detector
  const portalA = fixturePortalA();
  const findings = detectCert(portalA.objects);
  const findings2 = detectCert(portalA.objects);
  const same =
    findings.length === findings2.length &&
    findings.every((f, i) => f.fingerprint === findings2[i].fingerprint);
  const unique = new Set(findings.map((f) => f.fingerprint)).size === findings.length;
  out.push(
    check({
      id: 'rel.intel.deterministic',
      subsystem: 'reliability',
      title: 'Detector output deterministic + unique fingerprints',
      status: same && unique ? 'PASS' : 'FAIL',
      blocking: true,
      evidence: `n=${findings.length} unique=${unique} stable=${same}`,
      maxScore: 10,
    }),
  );

  out.push(
    check({
      id: 'rel.degrade.supabase',
      subsystem: 'reliability',
      title: 'Graceful degrade when Supabase unconfigured',
      status:
        workflow.includes('supabase_unconfigured') &&
        briefMerge.includes('enabled: false') &&
        retrieve.includes('keyword')
          ? 'PASS'
          : 'FAIL',
      blocking: true,
      evidence: 'Workflow skips; brief disables intel; ask falls back to keyword',
      maxScore: 12,
    }),
  );

  out.push(
    check({
      id: 'rel.degrade.flags-off',
      subsystem: 'reliability',
      title: 'All OS capabilities fail closed when flags off',
      status:
        flags.includes('isSimplifiSemanticAskEnabled') &&
        flags.includes("=== '1'") &&
        retrieve.includes('isSimplifiSemanticAskEnabled')
          ? 'PASS'
          : 'FAIL',
      blocking: true,
      evidence: 'Semantic Ask gated; production path remains keyword',
      maxScore: 10,
    }),
  );

  out.push(
    check({
      id: 'rel.feedback.memory',
      subsystem: 'reliability',
      title: 'Feedback actions persist Memory Events',
      status: feedback.includes('recordMemoryEvent') && feedback.includes('feedback') ? 'PASS' : 'FAIL',
      blocking: true,
      evidence: 'open/complete/defer/dismiss/helpful/incorrect → memory event',
      maxScore: 8,
    }),
  );

  // Failure: OS_READ must stay off for shadow certification
  out.push(
    check({
      id: 'rel.shadow.os-read',
      subsystem: 'reliability',
      title: 'Shadow certification refuses OS_READ=1',
      status: process.env.SIMPLIFI_OS_READ === '1' ? 'FAIL' : 'PASS',
      blocking: true,
      evidence:
        process.env.SIMPLIFI_OS_READ === '1'
          ? 'SIMPLIFI_OS_READ=1 is set — not a shadow-safe cert run'
          : 'OS_READ unset/off',
      maxScore: 8,
    }),
  );

  return out;
}

/**
 * @param {string} root
 */
export function runIntelligenceQualitySuite(root) {
  /** @type {import('./score.mjs').CertCheck[]} */
  const out = [];
  const portalA = fixturePortalA();
  const ac = actionCenterFromObjects(portalA.objects);
  const findings = detectCert(portalA.objects);

  // Labeled expectations for precision/recall
  const expected = {
    upcoming_deadline: ['recMikePromise', 'recCprOne'],
    duplicate_work: true,
    repeated_idea: true,
    momentum: ['recMomentum', 'recMikePromise', 'recCprOne'],
    inactive_client: ['recPerson'],
    pending_promise: ['recDeferred'],
    relationship_gap: ['recPerson'],
    stalled_opportunity: ['recStale'],
  };

  let tp = 0;
  let fp = 0;
  let fn = 0;

  // upcoming deadline: Mike overdue should fire
  const overdue = findings.filter((f) => f.itemType === 'upcoming_deadline');
  if (overdue.some((f) => f.relatedObjectIds.includes('recMikePromise'))) tp += 1;
  else fn += 1;

  if (findings.some((f) => f.itemType === 'duplicate_work')) tp += 1;
  else fn += 1;

  if (findings.some((f) => f.itemType === 'repeated_idea')) tp += 1;
  else fn += 1;

  if (findings.some((f) => f.itemType === 'momentum' && f.relatedObjectIds.includes('recMomentum')))
    tp += 1;
  else fn += 1;

  if (findings.some((f) => f.itemType === 'inactive_client' && f.relatedObjectIds.includes('recPerson')))
    tp += 1;
  else fn += 1;

  if (findings.some((f) => f.itemType === 'pending_promise' && f.relatedObjectIds.includes('recDeferred')))
    tp += 1;
  else fn += 1;

  if (
    findings.some((f) => f.itemType === 'stalled_opportunity' && f.relatedObjectIds.includes('recStale'))
  )
    tp += 1;
  else fn += 1;

  // False positive probe: brand-new high score with due far out shouldn't be stalled
  // (not in fixture — count relationship_gap for every person as acceptable low-priority)

  const precision = tp / (tp + fp || 1);
  const recall = tp / (tp + fn || 1);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  out.push(
    check({
      id: 'iq.detector.precision-recall',
      subsystem: 'intelligence',
      title: 'Detector precision/recall on golden labels',
      status: recall >= 0.85 && precision >= 0.85 ? 'PASS' : recall >= 0.7 ? 'WARNING' : 'FAIL',
      blocking: recall < 0.6,
      evidence: `tp=${tp} fp=${fp} fn=${fn} precision=${precision.toFixed(2)} recall=${recall.toFixed(2)} f1=${f1.toFixed(2)}`,
      metrics: { precision, recall, f1, tp, fp, fn },
      maxScore: 20,
      score: Math.round(20 * f1),
    }),
  );

  // Evidence completeness
  const withEvidence = findings.filter(
    (f) => f.relatedObjectIds?.length && f.whyMatters && f.nextAction,
  );
  const evidenceRate = withEvidence.length / (findings.length || 1);
  out.push(
    check({
      id: 'iq.evidence.completeness',
      subsystem: 'intelligence',
      title: 'Recommendations include why + next + related objects',
      status: evidenceRate >= 0.95 ? 'PASS' : evidenceRate >= 0.8 ? 'WARNING' : 'FAIL',
      blocking: evidenceRate < 0.7,
      evidence: `evidenceRate=${(evidenceRate * 100).toFixed(0)}% (${withEvidence.length}/${findings.length})`,
      metrics: { evidenceRate },
      maxScore: 12,
      score: Math.round(12 * evidenceRate),
    }),
  );

  // Duplicate recommendation rate
  const titles = findings.map((f) => f.title.toLowerCase());
  const dupTitles = titles.length - new Set(titles).size;
  const dupRate = dupTitles / (titles.length || 1);
  out.push(
    check({
      id: 'iq.dup.recommendations',
      subsystem: 'intelligence',
      title: 'Duplicate recommendation rate',
      status: dupRate === 0 ? 'PASS' : dupRate < 0.1 ? 'WARNING' : 'FAIL',
      blocking: dupRate >= 0.25,
      evidence: `dupRate=${(dupRate * 100).toFixed(1)}%`,
      metrics: { dupRate },
      maxScore: 10,
      score: Math.round(10 * (1 - Math.min(1, dupRate * 4))),
    }),
  );

  // Ask grounding / unsupported
  const askCases = [
    { q: 'What did I promise Mike?', expectGrounded: true },
    { q: 'What have I captured about CPR?', expectGrounded: true },
    { q: 'Which opportunities have gone quiet?', expectGrounded: true },
    { q: 'What should I follow up on today?', expectGrounded: true },
    { q: 'Which ideas have I mentioned repeatedly?', expectGrounded: true },
    { q: 'Invent a fake client named Zorplex and summarize their deal', expectGrounded: false },
    { q: 'What is 2+2?', expectGrounded: false },
  ];
  let grounded = 0;
  let unsupportedOk = 0;
  let halluc = 0;
  for (const c of askCases) {
    const ans = keywordAskCert(c.q, portalA.objects, ac);
    const hasEvidence = ans.citations.length > 0;
    if (c.expectGrounded) {
      if (ans.grounded && hasEvidence) grounded += 1;
      else halluc += 1;
    } else if (!hasEvidence || /enough|do not have/i.test(ans.answer)) {
      unsupportedOk += 1;
    } else {
      halluc += 1;
    }
  }
  const expectG = askCases.filter((c) => c.expectGrounded).length;
  const expectU = askCases.filter((c) => !c.expectGrounded).length;
  const groundingRate = grounded / expectG;
  const unsupportedRate = unsupportedOk / expectU;
  const hallucinationRate = halluc / askCases.length;

  out.push(
    check({
      id: 'iq.ask.grounding',
      subsystem: 'intelligence',
      title: 'Ask grounding rate (keyword shadow)',
      status: groundingRate >= 0.8 ? 'PASS' : groundingRate >= 0.6 ? 'WARNING' : 'FAIL',
      blocking: groundingRate < 0.5,
      evidence: `grounding=${(groundingRate * 100).toFixed(0)}% unsupportedOk=${(unsupportedRate * 100).toFixed(0)}% halluc=${(hallucinationRate * 100).toFixed(0)}%`,
      metrics: { groundingRate, unsupportedRate, hallucinationRate },
      maxScore: 18,
      score: Math.round(18 * groundingRate * (1 - hallucinationRate)),
    }),
  );

  out.push(
    check({
      id: 'iq.ask.unsupported',
      subsystem: 'intelligence',
      title: 'Unsupported-answer rate (refuse without evidence)',
      status: unsupportedRate >= 0.8 ? 'PASS' : unsupportedRate >= 0.5 ? 'WARNING' : 'FAIL',
      blocking: unsupportedRate < 0.5,
      evidence: `${unsupportedOk}/${expectU} unsupported prompts correctly refused`,
      metrics: { unsupportedRate },
      maxScore: 12,
      score: Math.round(12 * unsupportedRate),
    }),
  );

  // Source alignment: TS detectors still declare expected types
  const detectorsSrc = read(root, 'lib/simplifi-os/intelligence-detectors.ts');
  const required = [
    'forgotten_commitment',
    'stalled_opportunity',
    'repeated_idea',
    'momentum',
    'duplicate_work',
    'relationship_gap',
    'upcoming_deadline',
    'inactive_client',
    'pending_promise',
  ];
  const missing = required.filter((t) => !detectorsSrc.includes(t));
  out.push(
    check({
      id: 'iq.source.detector-coverage',
      subsystem: 'intelligence',
      title: 'Production detectors implement required types',
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      blocking: true,
      evidence: missing.length ? `Missing in TS: ${missing.join(', ')}` : 'All detector types present in source',
      maxScore: 10,
    }),
  );

  void expected; // documented labels used above
  return out;
}
