import type { SimplifiObject } from '@/lib/simplifi-objects';
import type { ActionCenterPayload } from '@/lib/action-center';
import {
  answerConversationalAskDetailed,
  type AskCitation,
  type ConversationalAskResult,
} from '@/lib/simplifi-ask';
import { isSimplifiOsConfigured, isSimplifiSemanticAskEnabled } from './flags';
import { embedText } from './embed-provider';
import { supabaseRest } from './supabase';
import { recordMemoryEvent } from './memory-events';

export type AskEvidence = {
  id: string;
  title: string;
  href: string;
  type?: string;
  similarity?: number;
  snippet?: string;
};

export type SemanticAskResult = ConversationalAskResult & {
  mode: 'semantic' | 'keyword' | 'insufficient';
  evidence: AskEvidence[];
  insufficientEvidence: boolean;
};

type MatchRow = {
  id: string;
  object_id: string | null;
  airtable_record_id: string | null;
  source_object_type: string | null;
  content_hash: string;
  similarity: number;
};

const RETRIEVE_TIMEOUT_MS = 800;
const LLM_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch(() => {
        clearTimeout(t);
        resolve(null);
      });
  });
}

async function vectorMatches(
  portalSlug: string,
  question: string,
): Promise<MatchRow[] | null> {
  const embedded = await withTimeout(embedText(question), RETRIEVE_TIMEOUT_MS);
  if (!embedded) return null;

  const rpc = await withTimeout(
    supabaseRest<MatchRow[]>('rpc/match_simplifi_embeddings', {
      method: 'POST',
      body: JSON.stringify({
        query_embedding: `[${embedded.embedding.join(',')}]`,
        match_portal: portalSlug,
        match_count: 8,
        match_threshold: 0.5,
      }),
    }),
    RETRIEVE_TIMEOUT_MS,
  );

  if (!rpc || !rpc.ok || !Array.isArray(rpc.data)) return null;
  // Strict tenant isolation — trust RPC filter but re-check portal via airtable map only
  return rpc.data.filter((row) => Boolean(row.airtable_record_id));
}

async function expandRelatedAirtableIds(
  portalSlug: string,
  seedAirtableIds: string[],
): Promise<string[]> {
  if (seedAirtableIds.length === 0) return [];
  // Resolve object UUIDs for seeds
  const idList = seedAirtableIds.map(encodeURIComponent).join(',');
  const objects = await supabaseRest<Array<{ id: string; airtable_record_id: string }>>(
    `simplifi_objects?portal_slug=eq.${encodeURIComponent(portalSlug)}&airtable_record_id=in.(${idList})&select=id,airtable_record_id`,
    { method: 'GET' },
  );
  if (!objects.ok || !Array.isArray(objects.data) || objects.data.length === 0) {
    return seedAirtableIds;
  }
  const uuidToAirtable = new Map(objects.data.map((o) => [o.id, o.airtable_record_id]));
  const uuids = objects.data.map((o) => o.id);
  const uuidList = uuids.join(',');
  const rels = await supabaseRest<
    Array<{ object_id: string; related_object_id: string; dismissed_at: string | null }>
  >(
    `simplifi_relationships?portal_slug=eq.${encodeURIComponent(portalSlug)}&or=(object_id.in.(${uuidList}),related_object_id.in.(${uuidList}))&dismissed_at=is.null&select=object_id,related_object_id,dismissed_at&limit=40`,
    { method: 'GET' },
  );
  const expanded = new Set(seedAirtableIds);
  if (rels.ok && Array.isArray(rels.data)) {
    const allUuids = new Set<string>();
    for (const r of rels.data) {
      allUuids.add(r.object_id);
      allUuids.add(r.related_object_id);
    }
    const missing = [...allUuids].filter((id) => !uuidToAirtable.has(id));
    if (missing.length > 0) {
      const more = await supabaseRest<Array<{ id: string; airtable_record_id: string }>>(
        `simplifi_objects?portal_slug=eq.${encodeURIComponent(portalSlug)}&id=in.(${missing.join(',')})&select=id,airtable_record_id`,
        { method: 'GET' },
      );
      if (more.ok && Array.isArray(more.data)) {
        for (const o of more.data) uuidToAirtable.set(o.id, o.airtable_record_id);
      }
    }
    for (const id of allUuids) {
      const air = uuidToAirtable.get(id);
      if (air) expanded.add(air);
    }
  }
  return [...expanded];
}

async function recentMemorySnippets(
  portalSlug: string,
  airtableIds: string[],
): Promise<string[]> {
  if (!isSimplifiOsConfigured()) return [];
  const events = await supabaseRest<
    Array<{ event_type: string; metadata: Record<string, unknown>; correlation_id: string | null }>
  >(
    `simplifi_memory_events?portal_slug=eq.${encodeURIComponent(portalSlug)}&order=created_at.desc&limit=20&select=event_type,metadata,correlation_id`,
    { method: 'GET' },
  );
  if (!events.ok || !Array.isArray(events.data)) return [];
  const idSet = new Set(airtableIds);
  return events.data
    .filter((e) => {
      const corr = e.correlation_id;
      const metaId = typeof e.metadata?.airtable_record_id === 'string' ? e.metadata.airtable_record_id : '';
      return (corr && idSet.has(corr)) || (metaId && idSet.has(metaId));
    })
    .slice(0, 6)
    .map((e) => `${e.event_type}: ${JSON.stringify(e.metadata ?? {}).slice(0, 160)}`);
}

function pickObjects(
  objects: SimplifiObject[],
  airtableIds: string[],
): SimplifiObject[] {
  const map = new Map(objects.map((o) => [o.id, o]));
  const out: SimplifiObject[] = [];
  for (const id of airtableIds) {
    const obj = map.get(id);
    if (obj) out.push(obj);
  }
  return out;
}

async function reasonWithClaude(
  question: string,
  evidenceObjects: SimplifiObject[],
  memorySnippets: string[],
): Promise<string | null> {
  const { callClaudeText } = await import('@/lib/ai');
  const evidenceBlock = evidenceObjects
    .slice(0, 8)
    .map(
      (o, i) =>
        `[${i + 1}] id=${o.id} title="${o.title}" type=${o.type} next="${o.nextAction}" due=${o.dueDate ?? 'n/a'} why=${(o.whyThisMatters || '').slice(0, 180)}`,
    )
    .join('\n');
  const prompt = `You are Orbie for Simplifi Orb. Answer ONLY from the evidence below for this single user's workspace. If evidence is thin, say you do not have enough information and suggest what to capture. Cite evidence by title. Be concise.

Question: ${question}

Evidence objects:
${evidenceBlock || '(none)'}

Recent related memory events:
${memorySnippets.join('\n') || '(none)'}

Answer:`;

  return withTimeout(callClaudeText(prompt, { maxTokens: 500 }), LLM_TIMEOUT_MS);
}

/**
 * Hybrid Semantic Ask. Workspace objects always from Airtable loader (no OS_READ).
 * Semantic path uses embeddings when flag + Supabase healthy; else keyword fallback.
 */
export async function answerSemanticAsk(input: {
  portalSlug: string;
  question: string;
  objects: SimplifiObject[];
  actionCenter: ActionCenterPayload;
  actorId?: string;
}): Promise<SemanticAskResult> {
  const question = input.question.trim();
  const keyword = answerConversationalAskDetailed(question, input.objects, input.actionCenter);

  if (!question) {
    return {
      ...keyword,
      mode: 'keyword',
      evidence: keyword.citations.map((c) => ({ ...c })),
      insufficientEvidence: true,
    };
  }

  let mode: SemanticAskResult['mode'] = 'keyword';
  let evidenceObjects: SimplifiObject[] = [];
  let similarities = new Map<string, number>();

  if (isSimplifiSemanticAskEnabled() && isSimplifiOsConfigured()) {
    try {
      const matches = await vectorMatches(input.portalSlug, question);
      if (matches && matches.length > 0) {
        const seedIds = matches
          .map((m) => m.airtable_record_id)
          .filter((id): id is string => Boolean(id));
        const expandedIds = await expandRelatedAirtableIds(input.portalSlug, seedIds);
        evidenceObjects = pickObjects(input.objects, expandedIds);
        for (const m of matches) {
          if (m.airtable_record_id) similarities.set(m.airtable_record_id, m.similarity);
        }
        if (evidenceObjects.length > 0) mode = 'semantic';
      }
    } catch (err) {
      console.error('[simplifi-os] semantic retrieve failed; keyword fallback', err);
    }
  }

  if (mode !== 'semantic') {
    // Keyword path — still the production-safe answer
    void recordMemoryEvent({
      portalSlug: input.portalSlug,
      eventType: 'search.performed',
      actorId: input.actorId,
      client: 'web',
      metadata: { query: question.slice(0, 200), mode: 'keyword' },
    });
    const insufficient = keyword.citations.length === 0;
    return {
      answer: insufficient
        ? `${keyword.answer}${keyword.answer.includes('enough') ? '' : ' I do not have enough grounded evidence in your workspace for a stronger answer yet.'}`
        : keyword.answer,
      citations: keyword.citations,
      mode: insufficient ? 'insufficient' : 'keyword',
      evidence: keyword.citations.map((c) => ({ ...c })),
      insufficientEvidence: insufficient,
    };
  }

  const memorySnippets = await recentMemorySnippets(
    input.portalSlug,
    evidenceObjects.map((o) => o.id),
  );
  const llm = await reasonWithClaude(question, evidenceObjects, memorySnippets);
  const citations: AskCitation[] = evidenceObjects.slice(0, 5).map((o) => ({
    id: o.id,
    title: o.title,
    href: `/simplifi/opportunity/${o.id}`,
  }));
  const evidence: AskEvidence[] = evidenceObjects.slice(0, 5).map((o) => ({
    id: o.id,
    title: o.title,
    href: `/simplifi/opportunity/${o.id}`,
    type: o.type,
    similarity: similarities.get(o.id),
    snippet: o.nextAction || o.whyThisMatters?.slice(0, 120),
  }));

  const insufficient = evidenceObjects.length === 0 || (!llm && citations.length === 0);
  const answer =
    llm ||
    (evidenceObjects.length > 0
      ? `Based on your captures: ${evidenceObjects
          .slice(0, 3)
          .map((o) => `"${o.title}" (next: ${o.nextAction})`)
          .join('; ')}.`
      : 'I do not have enough evidence in your workspace to answer that yet.');

  void recordMemoryEvent({
    portalSlug: input.portalSlug,
    eventType: 'ask.answered',
    actorId: input.actorId,
    client: 'web',
    metadata: {
      query: question.slice(0, 200),
      mode: 'semantic',
      citation_ids: citations.map((c) => c.id),
    },
  });

  return {
    answer,
    citations,
    mode: insufficient ? 'insufficient' : 'semantic',
    evidence,
    insufficientEvidence: insufficient,
  };
}
