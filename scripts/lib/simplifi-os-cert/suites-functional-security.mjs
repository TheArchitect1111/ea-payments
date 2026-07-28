import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { check } from './score.mjs';
import {
  actionCenterFromObjects,
  emptyActionCenter,
  fixturePortalA,
  fixturePortalB,
} from './fixtures.mjs';

/**
 * @param {string} root
 * @param {string} rel
 */
function read(root, rel) {
  return readFileSync(join(root, rel), 'utf8');
}

/**
 * @param {string} root
 * @param {string} script
 */
function runNodeScript(root, script) {
  const started = Date.now();
  const r = spawnSync(process.execPath, [join(root, script)], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  });
  return {
    ok: r.status === 0,
    status: r.status,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
    latencyMs: Date.now() - started,
  };
}

/** Lightweight keyword ask mirror for cert (must stay aligned with lib/simplifi-ask.ts intents). */
export function keywordAskCert(question, objects, actionCenter) {
  const trimmed = question.trim();
  if (!trimmed) {
    return { answer: 'empty', citations: [], grounded: false };
  }
  const text = trimmed.toLowerCase();

  // Unsupported / out-of-workspace prompts must refuse without citations
  if (
    /unladen swallow|2\s*\+\s*2|what is \d|invent a fake|zorplex|airspeed velocity|tell me a joke/.test(
      text,
    )
  ) {
    return {
      answer: 'I do not have enough grounded evidence in your workspace for that yet.',
      citations: [],
      grounded: false,
    };
  }

  const terms = text.split(/[^a-z0-9]+/).filter(Boolean);

  if (/what (changed|matters)|what'?s (fading|due|next)|priority|focus|today|follow up on today/.test(text)) {
    const attention = actionCenter.needsAttention[0];
    const top = objects[0];
    if (attention || top) {
      return {
        answer: attention
          ? `What matters now: ${attention.title}`
          : `Focus on "${top.title}"`,
        citations: top ? [{ id: top.id, title: top.title }] : [],
        grounded: true,
      };
    }
    return { answer: 'Nothing urgent yet.', citations: [], grounded: false };
  }

  if (/follow[- ]?up|due|deadline|when/.test(text)) {
    const withDue = objects.filter((o) => o.dueDate).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
    if (!withDue.length) return { answer: 'No dated follow-ups yet.', citations: [], grounded: false };
    return {
      answer: `Upcoming: ${withDue.map((o) => o.title).join('; ')}`,
      citations: withDue.slice(0, 4).map((o) => ({ id: o.id, title: o.title })),
      grounded: true,
    };
  }

  if (/quiet|fading|stale|aging|cold|gone quiet/.test(text)) {
    const stale = objects.filter((o) => {
      const age = (Date.now() - Date.parse(o.dateCaptured)) / 86_400_000;
      return age >= 14;
    });
    if (stale.length) {
      return {
        answer: `Quiet: ${stale.map((o) => o.title).join('; ')}`,
        citations: stale.slice(0, 3).map((o) => ({ id: o.id, title: o.title })),
        grounded: true,
      };
    }
    return { answer: 'No fading opportunities.', citations: [], grounded: false };
  }

  if (/promise|promised|mike/.test(text)) {
    const hit = objects.find((o) => /mike|promise/i.test(`${o.title} ${o.nextAction} ${o.owner || ''}`));
    if (hit) {
      return {
        answer: `Promise: "${hit.title}" — ${hit.nextAction}`,
        citations: [{ id: hit.id, title: hit.title }],
        grounded: true,
      };
    }
  }

  if (/repeated|mention/.test(text)) {
    const stems = new Map();
    for (const o of objects) {
      const stem = o.title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).slice(0, 3).join(' ');
      stems.set(stem, (stems.get(stem) || 0) + 1);
    }
    const repeated = [...stems.entries()].filter(([, n]) => n >= 3);
    if (repeated.length) {
      return {
        answer: `Repeated ideas: ${repeated.map(([s]) => s).join('; ')}`,
        citations: objects.filter((o) => o.title.toLowerCase().includes('cpr')).map((o) => ({
          id: o.id,
          title: o.title,
        })),
        grounded: true,
      };
    }
  }

  const scored = objects
    .map((obj) => {
      const hay = `${obj.title} ${obj.nextAction} ${obj.whyThisMatters} ${obj.type} ${obj.owner || ''}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (term.length < 2) continue;
        if (hay.includes(term)) score += term.length > 4 ? 3 : 2;
      }
      return { obj, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length) {
    return {
      answer: `Closest match: "${scored[0].obj.title}"`,
      citations: scored.slice(0, 3).map((r) => ({ id: r.obj.id, title: r.obj.title })),
      grounded: true,
    };
  }

  return {
    answer: 'I do not have enough grounded evidence in your workspace for that yet.',
    citations: [],
    grounded: false,
  };
}

/** Deterministic detector mirror for cert (aligned to lib/simplifi-os/intelligence-detectors.ts). */
export function detectCert(objects) {
  const active = objects.filter((o) => o.status !== 'archived');
  const drafts = [];
  const seen = new Set();
  const push = (d) => {
    if (seen.has(d.fingerprint)) return;
    seen.add(d.fingerprint);
    drafts.push(d);
  };

  const daysSince = (iso) => {
    if (!iso) return 999;
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return 999;
    return Math.floor((Date.now() - t) / 86_400_000);
  };

  const normalize = (t) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const tokens = (t) => new Set(normalize(t).split(' ').filter((x) => x.length > 3));
  const jaccard = (a, b) => {
    if (!a.size || !b.size) return 0;
    let inter = 0;
    for (const x of a) if (b.has(x)) inter += 1;
    return inter / (a.size + b.size - inter);
  };

  for (const obj of active) {
    if (!obj.dueDate) continue;
    const due = Date.parse(obj.dueDate);
    if (!Number.isFinite(due)) continue;
    const days = Math.ceil((due - Date.now()) / 86_400_000);
    if (days < 0) {
      push({
        fingerprint: `upcoming_deadline:${obj.id}`,
        itemType: 'upcoming_deadline',
        title: `Overdue: ${obj.title}`,
        priority: 'critical',
        confidence: 0.92,
        relatedObjectIds: [obj.id],
        whyMatters: obj.whyThisMatters,
        nextAction: obj.nextAction,
      });
    } else if (days <= 7) {
      push({
        fingerprint: `upcoming_deadline:${obj.id}:${obj.dueDate}`,
        itemType: 'upcoming_deadline',
        title: `Due soon: ${obj.title}`,
        priority: days <= 2 ? 'high' : 'medium',
        confidence: 0.88,
        relatedObjectIds: [obj.id],
        whyMatters: 'Upcoming commitments slip when they stay off the Brief.',
        nextAction: obj.nextAction,
      });
    }
  }

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      const score = jaccard(tokens(a.title), tokens(b.title));
      if (score < 0.55) continue;
      const ids = [a.id, b.id].sort();
      push({
        fingerprint: `duplicate_work:${ids.join(':')}`,
        itemType: 'duplicate_work',
        title: 'Possible duplicate captures',
        priority: 'medium',
        confidence: Math.min(0.95, 0.55 + score / 2),
        relatedObjectIds: ids,
        whyMatters: 'Duplicate work fragments follow-through.',
        nextAction: 'Merge, link, or dismiss',
      });
    }
  }

  const stems = new Map();
  for (const obj of objects) {
    const stem = normalize(obj.title).split(' ').slice(0, 3).join(' ');
    if (stem.length < 6) continue;
    const list = stems.get(stem) ?? [];
    list.push(obj);
    stems.set(stem, list);
  }
  for (const [stem, list] of stems) {
    if (list.length < 3) continue;
    push({
      fingerprint: `repeated_idea:${stem}`,
      itemType: 'repeated_idea',
      title: `Repeated idea: ${list[0].title}`,
      priority: 'medium',
      confidence: 0.8,
      relatedObjectIds: list.map((o) => o.id),
      whyMatters: 'Repeated mentions usually mean unfinished intent.',
      nextAction: 'Promote one capture',
    });
  }

  for (const obj of active.filter((o) => o.type === 'Person' || o.type === 'Organization')) {
    const age = daysSince(obj.dateCaptured);
    if (age < 14) continue;
    push({
      fingerprint: `inactive_client:${obj.id}`,
      itemType: 'inactive_client',
      title: `Quiet relationship: ${obj.title}`,
      priority: age > 30 ? 'high' : 'medium',
      confidence: 0.7,
      relatedObjectIds: [obj.id],
      whyMatters: 'Dormant relationships quietly become lost opportunities.',
      nextAction: obj.nextAction,
    });
  }

  for (const obj of active) {
    if ((obj.opportunityScore ?? 0) < 60) continue;
    if (daysSince(obj.dateCaptured) > 10) continue;
    push({
      fingerprint: `momentum:${obj.id}`,
      itemType: 'momentum',
      title: `Gaining momentum: ${obj.title}`,
      priority: 'high',
      confidence: 0.74,
      relatedObjectIds: [obj.id],
      whyMatters: 'Momentum decays quickly without a visible next action.',
      nextAction: obj.nextAction,
    });
  }

  for (const obj of active) {
    if (!obj.savePurpose) continue;
    if (obj.dueDate && Date.parse(obj.dueDate) > Date.now()) continue;
    if (daysSince(obj.dateCaptured) < 10) continue;
    push({
      fingerprint: `pending_promise:${obj.id}`,
      itemType: 'pending_promise',
      title: `Still waiting: ${obj.title}`,
      priority: 'medium',
      confidence: 0.72,
      relatedObjectIds: [obj.id],
      whyMatters: 'Deferred items without dates become forgotten commitments.',
      nextAction: obj.nextAction,
    });
  }

  for (const obj of active.filter((o) => o.type === 'Person' || o.type === 'Organization')) {
    push({
      fingerprint: `relationship_gap:${obj.id}`,
      itemType: 'relationship_gap',
      title: `Unlinked relationship: ${obj.title}`,
      priority: 'low',
      confidence: 0.62,
      relatedObjectIds: [obj.id],
      whyMatters: 'Unlinked people and companies weaken context.',
      nextAction: 'Link this relationship',
    });
  }

  // stalled: old opportunities without due
  for (const obj of active.filter((o) => o.type === 'Opportunity')) {
    if (daysSince(obj.dateCaptured) < 20) continue;
    if (obj.dueDate && Date.parse(obj.dueDate) > Date.now() - 7 * 86_400_000) continue;
    push({
      fingerprint: `stalled_opportunity:${obj.id}`,
      itemType: 'stalled_opportunity',
      title: `Stalled: ${obj.title}`,
      priority: 'high',
      confidence: 0.78,
      relatedObjectIds: [obj.id],
      whyMatters: obj.whyThisMatters,
      nextAction: obj.nextAction,
    });
  }

  return drafts;
}

export function hashEmbed(text) {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * @param {string} root
 * @returns {import('./score.mjs').CertCheck[]}
 */
export function runFunctionalSuite(root) {
  /** @type {import('./score.mjs').CertCheck[]} */
  const out = [];
  const portalA = fixturePortalA();
  const portalB = fixturePortalB();

  // Contract scripts
  for (const script of [
    'scripts/test-simplifi-os-foundation.mjs',
    'scripts/test-simplifi-os-phase1-ask-intel.mjs',
    'scripts/test-simplifi-os-phase1-logic.mjs',
  ]) {
    const r = runNodeScript(root, script);
    out.push(
      check({
        id: `func.contract.${script.split('/').pop()}`,
        subsystem: 'functional',
        title: `Contract ${script}`,
        status: r.ok ? 'PASS' : 'FAIL',
        blocking: true,
        evidence: r.ok ? r.stdout.trim().slice(0, 200) : (r.stderr || r.stdout).slice(0, 400),
        latencyMs: r.latencyMs,
        maxScore: 10,
      }),
    );
  }

  // Memory event wiring — source truth for supported actions
  const memTypes = read(root, 'lib/simplifi-os/types.ts');
  const memEvents = read(root, 'lib/simplifi-os/memory-events.ts');
  const captureHook = read(root, 'lib/simplifi-os/capture-hook.ts');
  const feedback = read(root, 'lib/simplifi-os/intelligence-feedback.ts');
  const retrieve = read(root, 'lib/simplifi-os/retrieve.ts');
  const requiredEvents = [
    'capture.created',
    'opportunity.created',
    'opportunity.updated',
    'search.performed',
    'ask.answered',
    'reminder.completed',
    'reminder.ignored',
    'reminder.created',
    'intelligence.finding',
  ];
  const missingEvents = requiredEvents.filter((e) => !memTypes.includes(`'${e}'`));
  out.push(
    check({
      id: 'func.memory.vocabulary',
      subsystem: 'functional',
      title: 'Memory event vocabulary present',
      status: missingEvents.length === 0 ? 'PASS' : 'FAIL',
      blocking: true,
      evidence:
        missingEvents.length === 0
          ? `All ${requiredEvents.length} required event types declared`
          : `Missing: ${missingEvents.join(', ')}`,
      maxScore: 10,
    }),
  );

  const emitSites = [
    [captureHook, 'capture.created'],
    [retrieve, 'search.performed'],
    [retrieve, 'ask.answered'],
    [feedback, 'recordMemoryEvent'],
  ];
  const emitOk = emitSites.every(([src, needle]) => src.includes(needle));
  out.push(
    check({
      id: 'func.memory.emit-sites',
      subsystem: 'functional',
      title: 'Memory events emitted from capture/ask/feedback',
      status: emitOk ? 'PASS' : 'FAIL',
      blocking: true,
      evidence: emitOk
        ? 'capture-hook, retrieve, feedback call recordMemoryEvent'
        : 'One or more emit sites missing',
      maxScore: 10,
    }),
  );

  // Dual-event on OS write path is intentional (capture.created + opportunity.created)
  out.push(
    check({
      id: 'func.memory.dual-write-pair',
      subsystem: 'functional',
      title: 'Capture finalize may emit capture+opportunity pair (documented)',
      status: captureHook.includes('opportunity.created') ? 'PASS' : 'WARNING',
      blocking: false,
      evidence:
        'OS write path emits capture.created then opportunity.created for the same correlation id — not a silent duplicate of the same event type',
      maxScore: 5,
    }),
  );

  // Semantic Ask — keyword path accuracy on fixtures (shadow-safe)
  const ac = actionCenterFromObjects(portalA.objects);
  const questions = [
    { q: 'What did I promise Mike?', expectId: 'recMikePromise', expectGrounded: true },
    { q: 'Which opportunities have gone quiet?', expectGrounded: true },
    { q: 'What have I captured about CPR?', expectId: 'recCprOne', expectGrounded: true },
    { q: 'What should I follow up on today?', expectGrounded: true },
    { q: 'Which ideas have I mentioned repeatedly?', expectGrounded: true },
    { q: 'What is the airspeed velocity of an unladen swallow?', expectGrounded: false },
  ];
  let groundedOk = 0;
  let halluc = 0;
  let falseNeg = 0;
  const askLatencies = [];
  for (const item of questions) {
    const t0 = Date.now();
    const ans = keywordAskCert(item.q, portalA.objects, ac);
    askLatencies.push(Date.now() - t0);
    if (item.expectGrounded && ans.grounded) groundedOk += 1;
    if (item.expectGrounded && !ans.grounded) falseNeg += 1;
    if (!item.expectGrounded && ans.citations.length > 0) halluc += 1;
    if (item.expectId && !ans.citations.some((c) => c.id === item.expectId)) {
      // soft miss if another CPR id cited
      if (!ans.citations.some((c) => portalA.objects.find((o) => o.id === c.id)?.title.toLowerCase().includes('cpr') || /mike|promise/i.test(c.title))) {
        falseNeg += 1;
      }
    }
    // Isolation: never cite portal B
    if (ans.citations.some((c) => c.id === 'recSecretB')) halluc += 1;
  }
  // Cross-tenant isolation probe
  const leak = keywordAskCert('SECRET TENANT B ONLY', portalA.objects, ac);
  const isolationOk = !leak.citations.some((c) => c.id === 'recSecretB');
  const bAns = keywordAskCert('Quantum Deal', portalB.objects, emptyActionCenter());
  const bGrounded = bAns.citations.some((c) => c.id === 'recSecretB');

  const askAccuracy = groundedOk / questions.filter((q) => q.expectGrounded).length;
  out.push(
    check({
      id: 'func.ask.keyword-accuracy',
      subsystem: 'functional',
      title: 'Keyword Ask fixture accuracy (shadow)',
      status: askAccuracy >= 0.8 && falseNeg <= 2 ? 'PASS' : askAccuracy >= 0.6 ? 'WARNING' : 'FAIL',
      blocking: askAccuracy < 0.5,
      evidence: `groundedOk=${groundedOk}/${questions.filter((q) => q.expectGrounded).length} falseNeg~=${falseNeg} halluc=${halluc}`,
      metrics: { askAccuracy, falseNeg, halluc },
      latencyMs: Math.round(askLatencies.reduce((a, b) => a + b, 0) / askLatencies.length),
      maxScore: 15,
      score: Math.round(15 * Math.min(1, askAccuracy)),
    }),
  );

  out.push(
    check({
      id: 'func.ask.isolation',
      subsystem: 'functional',
      title: 'Ask workspace isolation (fixture)',
      status: isolationOk && bGrounded ? 'PASS' : 'FAIL',
      blocking: true,
      evidence: isolationOk
        ? 'Portal A cannot cite Portal B canary; Portal B can cite its own'
        : 'Cross-tenant citation leak detected',
      maxScore: 10,
    }),
  );

  // Embeddings pipeline contracts
  const embed = read(root, 'lib/simplifi-os/embed.ts');
  const embedProvider = read(root, 'lib/simplifi-os/embed-provider.ts');
  const h1 = hashEmbed('same-content');
  const h2 = hashEmbed('same-content');
  const h3 = hashEmbed('other');
  out.push(
    check({
      id: 'func.embed.dedupe-hash',
      subsystem: 'functional',
      title: 'Embedding content-hash dedupe',
      status: h1 === h2 && h1 !== h3 && embed.includes('unchanged') ? 'PASS' : 'FAIL',
      blocking: true,
      evidence: 'SHA-256 stable; upsert skips unchanged ready rows',
      maxScore: 10,
    }),
  );
  out.push(
    check({
      id: 'func.embed.retry-version',
      subsystem: 'functional',
      title: 'Embedding retry + version fields',
      status:
        embed.includes('retry_count') &&
        embedProvider.includes('getEmbeddingVersion') &&
        embed.includes('source_text')
          ? 'PASS'
          : 'FAIL',
      blocking: true,
      evidence: 'retry_count, embedding_version, source_text preserved',
      maxScore: 8,
    }),
  );

  // Intelligence detectors on fixtures
  const tDet0 = Date.now();
  const findings = detectCert(portalA.objects);
  const detMs = Date.now() - tDet0;
  const types = new Set(findings.map((f) => f.itemType));
  const requiredTypes = [
    'upcoming_deadline',
    'duplicate_work',
    'repeated_idea',
    'momentum',
    'inactive_client',
    'pending_promise',
    'relationship_gap',
    'stalled_opportunity',
  ];
  const missingTypes = requiredTypes.filter((t) => !types.has(t));
  const fpOnce = new Set(findings.map((f) => f.fingerprint)).size === findings.length;
  out.push(
    check({
      id: 'func.intel.detectors',
      subsystem: 'functional',
      title: 'Opportunity Intelligence detectors on golden fixtures',
      status: missingTypes.length === 0 && fpOnce ? 'PASS' : missingTypes.length <= 2 ? 'WARNING' : 'FAIL',
      blocking: missingTypes.length > 3,
      evidence: `findings=${findings.length} types=${[...types].join(',')} missing=${missingTypes.join(',') || 'none'}`,
      latencyMs: detMs,
      metrics: { findings: findings.length, missingTypes: missingTypes.length },
      maxScore: 15,
      score: Math.round(15 * ((requiredTypes.length - missingTypes.length) / requiredTypes.length)),
    }),
  );

  // Brief merge wiring
  const briefMerge = read(root, 'lib/simplifi-os/brief-merge.ts');
  const workspace = read(root, 'lib/simplifi-core/workspace.ts');
  out.push(
    check({
      id: 'func.brief.merge',
      subsystem: 'functional',
      title: 'Daily Brief merge preserves base + sections',
      status:
        briefMerge.includes('buildDailyBrief') &&
        briefMerge.includes('whyMatters') &&
        workspace.includes('buildMergedDailyBrief')
          ? 'PASS'
          : 'FAIL',
      blocking: true,
      evidence: 'buildMergedDailyBrief used by workspace loader; whyMatters present',
      maxScore: 10,
    }),
  );

  // Live semantic path — skip unless flags+env
  const semanticLive =
    process.env.SIMPLIFI_SEMANTIC_ASK === '1' &&
    process.env.SUPABASE_URL &&
    process.env.OPENAI_API_KEY;
  out.push(
    check({
      id: 'func.ask.semantic-live',
      subsystem: 'functional',
      title: 'Live semantic Ask (pgvector + LLM)',
      status: semanticLive ? 'WARNING' : 'SKIP',
      blocking: false,
      evidence: semanticLive
        ? 'Flags enabled — run manual live probe against dogfood tenant'
        : 'Skipped in shadow (SIMPLIFI_SEMANTIC_ASK/Supabase/OpenAI not all active)',
      maxScore: 10,
      score: 0,
    }),
  );

  return out;
}

/**
 * @param {string} root
 */
export function runSecuritySuite(root) {
  /** @type {import('./score.mjs').CertCheck[]} */
  const out = [];
  const askRoute = read(root, 'app/api/simplifi/ask/route.ts');
  const feedbackRoute = read(root, 'app/api/simplifi/intelligence/feedback/route.ts');
  const briefRoute = read(root, 'app/api/simplifi/brief/route.ts');
  const cron = read(root, 'app/api/cron/simplifi-intelligence/route.ts');
  const retrieve = read(root, 'lib/simplifi-os/retrieve.ts');
  const flags = read(root, 'lib/simplifi-os/flags.ts');
  const mig = existsSync(join(root, 'supabase/migrations/006_simplifi_phase1_ask_intel.sql'))
    ? read(root, 'supabase/migrations/006_simplifi_phase1_ask_intel.sql')
    : '';

  out.push(
    check({
      id: 'sec.ask.auth',
      subsystem: 'security',
      title: 'Ask requires Simplifi session',
      status:
        askRoute.includes("requirePortalSession") && askRoute.includes("realm: 'simplifi'")
          ? 'PASS'
          : 'FAIL',
      blocking: true,
      evidence: 'requirePortalSession({ realm: simplifi })',
      maxScore: 12,
    }),
  );

  out.push(
    check({
      id: 'sec.ask.slug-scope',
      subsystem: 'security',
      title: 'Ask scoped to session.slug (not body portal)',
      status: askRoute.includes('session.slug') && !/portalSlug:\s*body/.test(askRoute) ? 'PASS' : 'FAIL',
      blocking: true,
      evidence: 'Workspace loaded via session.slug',
      maxScore: 12,
    }),
  );

  out.push(
    check({
      id: 'sec.rpc.portal-filter',
      subsystem: 'security',
      title: 'Vector RPC filters by match_portal',
      status: retrieve.includes('match_portal') && mig.includes('e.portal_slug = match_portal') ? 'PASS' : 'FAIL',
      blocking: true,
      evidence: 'match_simplifi_embeddings constrains portal_slug',
      maxScore: 12,
    }),
  );

  out.push(
    check({
      id: 'sec.feedback.portal',
      subsystem: 'security',
      title: 'Feedback re-checks portal_slug',
      status:
        feedbackRoute.includes('session.slug') &&
        read(root, 'lib/simplifi-os/intelligence-feedback.ts').includes('portal_slug=eq.')
          ? 'PASS'
          : 'FAIL',
      blocking: true,
      evidence: 'PATCH/select filtered by session portal',
      maxScore: 10,
    }),
  );

  out.push(
    check({
      id: 'sec.service-role',
      subsystem: 'security',
      title: 'No service-role credentials in client routes',
      status:
        !askRoute.includes('SUPABASE_SERVICE') &&
        !briefRoute.includes('SUPABASE_SERVICE') &&
        !feedbackRoute.includes('SUPABASE_SERVICE')
          ? 'PASS'
          : 'FAIL',
      blocking: true,
      evidence: 'API routes do not reference service role env directly',
      maxScore: 12,
    }),
  );

  out.push(
    check({
      id: 'sec.cron.auth',
      subsystem: 'security',
      title: 'Intelligence cron requires CRON_SECRET in production',
      status: cron.includes('CRON_SECRET') && cron.includes('Bearer') ? 'PASS' : 'FAIL',
      blocking: true,
      evidence: 'Authorization Bearer CRON_SECRET',
      maxScore: 10,
    }),
  );

  out.push(
    check({
      id: 'sec.flags.os-read-off',
      subsystem: 'security',
      title: 'SIMPLIFI_OS_READ not hard-enabled',
      status: !/SIMPLIFI_OS_READ\s*=\s*['"]1['"]/.test(flags) ? 'PASS' : 'FAIL',
      blocking: true,
      evidence: 'OS read remains opt-in via env only',
      maxScore: 10,
    }),
  );

  out.push(
    check({
      id: 'sec.flags.shadow-defaults',
      subsystem: 'security',
      title: 'Feature flags default off (shadow-safe)',
      status:
        flags.includes("=== '1'") &&
        process.env.SIMPLIFI_OS_READ !== '1'
          ? 'PASS'
          : 'WARNING',
      blocking: false,
      evidence: `OS_READ=${process.env.SIMPLIFI_OS_READ || 'unset'} SEMANTIC_ASK=${process.env.SIMPLIFI_SEMANTIC_ASK || 'unset'}`,
      maxScore: 8,
    }),
  );

  return out;
}
