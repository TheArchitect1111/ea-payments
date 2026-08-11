/**
 * Amplifi topic research — open-web gather for social drafts within a date window.
 * Reuses OpenAI web_search (+ optional Firecrawl scrape). Does not invent facts.
 */
import { scrapeUrl } from '@/lib/firecrawl';
import type { AmplifiSocialDraft } from '@/lib/amplifi-draft';

export type AmplifiResearchSourceKind = 'article' | 'video' | 'news' | 'other';

export type AmplifiResearchSource = {
  title: string;
  url: string;
  snippet: string;
  kind: AmplifiResearchSourceKind;
  publishedAt?: string | null | undefined;
  provider: string;
  withinRange: boolean;
};

export type AmplifiTopicResearchRequest = {
  topic: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  maxSources?: number;
  scrapeTop?: number;
};

export type AmplifiTopicResearchResult = {
  topic: string;
  dateFrom: string;
  dateTo: string;
  sources: AmplifiResearchSource[];
  draft: AmplifiSocialDraft;
  draftTitle: string;
  warnings: string[];
  researchedAt: string;
};

function isoDateOnly(value: string): string | null {
  const m = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1]! : null;
}

function parseFlexibleDate(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;
  const iso = isoDateOnly(raw);
  if (iso) return iso;
  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

function inRange(publishedAt: string | null | undefined, from: string, to: string): boolean {
  if (!publishedAt) return false;
  return publishedAt >= from && publishedAt <= to;
}

function classifyKind(url: string, title: string, text: string): AmplifiResearchSourceKind {
  const blob = `${url} ${title} ${text}`.toLowerCase();
  if (/youtube\.com|youtu\.be|vimeo\.com|wistia|video/.test(blob)) return 'video';
  if (/news|press|reuters|apnews|bloomberg|cnbc|wsj|nytimes|bbc/.test(blob)) return 'news';
  if (/blog|article|medium\.com|substack/.test(blob)) return 'article';
  return 'other';
}

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] || text).trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Research response missing JSON object');
  return JSON.parse(raw.slice(start, end + 1));
}

type ModelSource = {
  title?: string;
  url?: string;
  snippet?: string;
  kind?: string;
  publishedAt?: string | null;
};

type ModelPayload = {
  sources?: ModelSource[];
  linkedIn?: string;
  shortCaption?: string;
  hashtags?: string[];
  draftTitle?: string;
  notes?: string;
};

async function runTopicWebResearch(input: AmplifiTopicResearchRequest): Promise<{
  payload: ModelPayload;
  provider: string;
}> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('OPENAI_API_KEY is not configured');

  const maxSources = Math.min(Math.max(input.maxSources ?? 8, 3), 12);
  const prompt = [
    'You are Amplifi research for Efficiency Architects portals.',
    'Find public articles, news, and videos relevant to the topic within the date window.',
    'Prefer primary journalism, reputable trade press, and official reports.',
    'Do not invent URLs, titles, or dates. If a publish date is unknown, set publishedAt to null.',
    'Reject generic openings and interchangeable business fluff when drafting posts.',
    'Drafts must be specific to the topic and grounded in the sources you return.',
    'Return ONLY JSON with this shape:',
    '{',
    '  "draftTitle": string,',
    '  "sources": [{"title": string, "url": string, "snippet": string, "kind": "article"|"video"|"news"|"other", "publishedAt": "YYYY-MM-DD"|null}],',
    '  "linkedIn": string,',
    '  "shortCaption": string,',
    '  "hashtags": string[],',
    '  "notes": string',
    '}',
    `Topic: ${input.topic}`,
    `Date window (inclusive): ${input.dateFrom} to ${input.dateTo}`,
    `Max sources: ${maxSources}`,
    'Include at least 3 sources when the web has material in-range; otherwise return fewer and explain in notes.',
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model:
        process.env.AMPLIFI_RESEARCH_MODEL?.trim() ||
        process.env.FACTORY_RESEARCH_MODEL?.trim() ||
        process.env.AI_MODEL_RESEARCH ||
        'gpt-4.1-mini',
      tools: [{ type: 'web_search' }],
      input: prompt,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    throw new Error(`Amplifi topic research failed (${response.status})`);
  }

  const body = (await response.json()) as {
    output?: Array<{
      content?: Array<{ text?: string; annotations?: Array<{ url?: string; title?: string }> }>;
    }>;
  };

  let text = '';
  const annotationHits: ModelSource[] = [];
  const seen = new Set<string>();
  for (const output of body.output || []) {
    for (const content of output.content || []) {
      if (content.text) text += `${content.text}\n`;
      for (const annotation of content.annotations || []) {
        const url = annotation.url?.trim();
        if (!url || seen.has(url)) continue;
        seen.add(url);
        annotationHits.push({
          title: annotation.title || url,
          url,
          snippet: content.text?.slice(0, 280),
          kind: 'other',
          publishedAt: null,
        });
      }
    }
  }

  let payload: ModelPayload = {};
  try {
    payload = extractJsonObject(text) as ModelPayload;
  } catch {
    payload = {
      sources: annotationHits.slice(0, maxSources),
      draftTitle: input.topic.slice(0, 80),
      linkedIn: '',
      shortCaption: '',
      hashtags: ['#Amplifi'],
      notes: 'Model returned unstructured research; used annotated URLs only.',
    };
  }

  if (!payload.sources?.length && annotationHits.length) {
    payload.sources = annotationHits.slice(0, maxSources);
  }

  return { payload, provider: 'openai-web-search' };
}

async function enrichSource(
  source: AmplifiResearchSource,
  dateFrom: string,
  dateTo: string,
): Promise<AmplifiResearchSource> {
  try {
    const page = await scrapeUrl(source.url);
    const publishedAt =
      source.publishedAt ||
      parseFlexibleDate(
        (page as { publishedAt?: string }).publishedAt ||
          page.description?.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1] ||
          null,
      );
    const kind = classifyKind(source.url, page.title || source.title, page.markdown || source.snippet);
    return {
      ...source,
      title: source.title || page.title || source.url,
      snippet: source.snippet || page.description || page.markdown.slice(0, 280),
      kind,
      publishedAt,
      withinRange: inRange(publishedAt, dateFrom, dateTo),
      provider: page.source || source.provider,
    };
  } catch {
    return source;
  }
}

function fallbackDraft(
  topic: string,
  sources: AmplifiResearchSource[],
  dateFrom: string,
  dateTo: string,
): AmplifiSocialDraft {
  const top = sources.slice(0, 3);
  const bullets = top
    .map((s) => `• ${s.title}${s.publishedAt ? ` (${s.publishedAt})` : ''}`)
    .join('\n');
  const firstUrl = top[0]?.url || '';
  const linkedIn = [
    `What ${topic.trim()} means for operators right now (${dateFrom} → ${dateTo}):`,
    '',
    bullets || '• Fresh public reporting on this topic',
    '',
    firstUrl ? `Worth a look: ${firstUrl}` : '',
    '',
    'Drafted in Amplifi™ for review — not auto-published.',
  ]
    .filter(Boolean)
    .join('\n');
  return {
    linkedIn,
    shortCaption: `${topic.trim()}: key takeaways from recent coverage (${dateFrom}–${dateTo}).${firstUrl ? ` ${firstUrl}` : ''}`,
    hashtags: ['#Amplifi', '#Business', '#Automation'].slice(0, 4),
  };
}

export function validateTopicResearchInput(input: {
  topic?: string;
  dateFrom?: string;
  dateTo?: string;
}): { ok: true; value: AmplifiTopicResearchRequest } | { ok: false; error: string } {
  const topic = String(input.topic || '').trim();
  const dateFrom = isoDateOnly(String(input.dateFrom || ''));
  const dateTo = isoDateOnly(String(input.dateTo || ''));
  if (topic.length < 8) return { ok: false, error: 'Enter a clearer topic (at least a short sentence).' };
  if (!dateFrom || !dateTo) return { ok: false, error: 'Enter a valid date range (YYYY-MM-DD).' };
  if (dateFrom > dateTo) return { ok: false, error: 'Start date must be on or before end date.' };
  const spanDays =
    (Date.parse(`${dateTo}T00:00:00Z`) - Date.parse(`${dateFrom}T00:00:00Z`)) / 86_400_000;
  if (spanDays > 366) return { ok: false, error: 'Date range cannot exceed 366 days.' };
  return { ok: true, value: { topic, dateFrom, dateTo } };
}

export async function runAmplifiTopicResearch(
  input: AmplifiTopicResearchRequest,
): Promise<AmplifiTopicResearchResult> {
  const warnings: string[] = [];
  const { payload, provider } = await runTopicWebResearch(input);

  let sources: AmplifiResearchSource[] = (payload.sources || [])
    .map((s) => {
      const url = String(s.url || '').trim();
      if (!url.startsWith('http')) return null;
      const publishedAt = parseFlexibleDate(s.publishedAt);
      const title = String(s.title || url).trim();
      const snippet = String(s.snippet || '').trim().slice(0, 400);
      const kindRaw = String(s.kind || 'other').toLowerCase();
      const kind: AmplifiResearchSourceKind =
        kindRaw === 'article' || kindRaw === 'video' || kindRaw === 'news' || kindRaw === 'other'
          ? kindRaw
          : classifyKind(url, title, snippet);
      return {
        title,
        url,
        snippet,
        kind,
        publishedAt,
        provider,
        withinRange: inRange(publishedAt, input.dateFrom, input.dateTo),
      } satisfies AmplifiResearchSource;
    })
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const scrapeTop = Math.min(Math.max(input.scrapeTop ?? 3, 0), 5);
  if (scrapeTop > 0) {
    sources = await Promise.all(
      sources.map(async (source, index) =>
        index < scrapeTop ? enrichSource(source, input.dateFrom, input.dateTo) : source,
      ),
    );
  }

  const inWindow = sources.filter((s) => s.withinRange || !s.publishedAt);
  const preferred = inWindow.length ? inWindow : sources;
  if (!sources.length) {
    warnings.push('No public sources found for this topic and window.');
  } else if (!sources.some((s) => s.withinRange)) {
    warnings.push(
      'No source had a confirmed publish date inside the window — drafts cite available material and mark uncertain dates.',
    );
  }
  if (payload.notes) warnings.push(String(payload.notes).slice(0, 300));

  const draft: AmplifiSocialDraft = {
    linkedIn: String(payload.linkedIn || '').trim(),
    shortCaption: String(payload.shortCaption || '').trim(),
    hashtags: Array.isArray(payload.hashtags)
      ? payload.hashtags.map((h) => String(h)).filter(Boolean).slice(0, 8)
      : [],
  };
  if (!draft.linkedIn || !draft.shortCaption) {
    const fallback = fallbackDraft(input.topic, preferred, input.dateFrom, input.dateTo);
    draft.linkedIn = draft.linkedIn || fallback.linkedIn;
    draft.shortCaption = draft.shortCaption || fallback.shortCaption;
    draft.hashtags = draft.hashtags.length ? draft.hashtags : fallback.hashtags;
    warnings.push('Draft fields were completed with a grounded fallback template.');
  }

  return {
    topic: input.topic,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    sources: preferred.slice(0, input.maxSources ?? 8),
    draft,
    draftTitle: String(payload.draftTitle || input.topic).trim().slice(0, 120),
    warnings,
    researchedAt: new Date().toISOString(),
  };
}

export type AmplifiResearchNotes = {
  source: 'amplifi-topic-research';
  topic: string;
  dateFrom: string;
  dateTo: string;
  researchedAt: string;
  sources: Array<{ title: string; url: string; kind: string; publishedAt?: string | null }>;
  warnings?: string[];
};

export function parseAmplifiResearchNotes(raw?: string | null): AmplifiResearchNotes | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AmplifiResearchNotes>;
    if (parsed.source !== 'amplifi-topic-research') return null;
    if (!parsed.topic || !parsed.dateFrom || !parsed.dateTo) return null;
    return {
      source: 'amplifi-topic-research',
      topic: String(parsed.topic),
      dateFrom: String(parsed.dateFrom),
      dateTo: String(parsed.dateTo),
      researchedAt: String(parsed.researchedAt || ''),
      sources: Array.isArray(parsed.sources)
        ? parsed.sources.map((s) => ({
            title: String(s.title || s.url || ''),
            url: String(s.url || ''),
            kind: String(s.kind || 'other'),
            publishedAt: s.publishedAt ?? null,
          }))
        : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String) : undefined,
    };
  } catch {
    return null;
  }
}
