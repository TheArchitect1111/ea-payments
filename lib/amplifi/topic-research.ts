/**
 * Amplifi topic research , open-web gather for social drafts within a date window.
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
  postCount?: 1 | 2 | 3;
  objective?: string;
  audience?: string;
  tone?: string;
  callToAction?: string;
  ctaUrl?: string;
};

export type AmplifiTopicResearchResult = {
  topic: string;
  dateFrom: string;
  dateTo: string;
  sources: AmplifiResearchSource[];
  draft: AmplifiSocialDraft;
  drafts: AmplifiSocialDraft[];
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
  imageDirection?: string;
  posts?: Array<{ linkedIn?: string; shortCaption?: string; hashtags?: string[]; imageDirection?: string }>;
};

function cleanGeneratedText(value: unknown): string {
  return String(value || '')
    .replace(/[\u2013\u2014]/g, ',')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .trim();
}

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
    'After researching, act as a senior advertising creative director and conversion copywriter.',
    'Treat the topic and sources as raw material, not copy to summarize or repeat.',
    'Create original, source-grounded posts with slogan-quality hooks and persuasive angles that make the research useful to the audience.',
    'Do not echo the topic as the opening or merely list article titles. Synthesize the facts into a fresh point of view.',
    'Give every requested post a different job, in order: attract with a surprising angle; inform or reveal a pain point; build trust and invite a useful next step.',
    'Each post must make a distinct point and must not repeat wording, hooks or conclusions from another post.',
    'Never use an em dash or en dash. Use a period, comma, colon or parentheses instead.',
    'Use plain, guided language, not consultant terminology, generic openings, interchangeable business fluff or unsupported hype.',
    'Return ONLY JSON with this shape:',
    '{',
    '  "draftTitle": string,',
    '  "sources": [{"title": string, "url": string, "snippet": string, "kind": "article"|"video"|"news"|"other", "publishedAt": "YYYY-MM-DD"|null}],',
    '  "linkedIn": string,',
    '  "shortCaption": string,',
    '  "hashtags": string[],',
    '  "imageDirection": string,',
    '  "posts": [{"linkedIn": string, "shortCaption": string, "hashtags": string[], "imageDirection": string}],',
    '  "notes": string',
    '}',
    `Topic: ${input.topic}`,
    `Campaign objective: ${input.objective || 'Inform the audience and create useful interest.'}`,
    `Audience: ${input.audience || 'People affected by this topic.'}`,
    `Tone: ${input.tone || 'Clear, confident and human.'}`,
    `Required next step: ${input.callToAction || 'Invite the reader to learn more.'}`,
    `Next-step URL: ${input.ctaUrl || 'None provided.'}`,
    `Date window (inclusive): ${input.dateFrom} to ${input.dateTo}`,
    `Max sources: ${maxSources}`,
    `Create exactly ${input.postCount ?? 1} distinct, source-grounded social post(s) in posts.`,
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
  _dateFrom: string,
  _dateTo: string,
): AmplifiSocialDraft {
  const top = sources.slice(0, 3);
  const firstUrl = top[0]?.url || '';
  const sourceSignal = top[0]?.snippet || top[0]?.title || `Recent reporting about ${topic.trim()}`;
  const linkedIn = [
    'The headline is only the beginning.',
    '',
    `${sourceSignal.replace(/\s+/g, ' ').trim().slice(0, 360)}`,
    '',
    `The useful question now: what should people notice, reconsider or do differently because of it? That is where information becomes an advantage.`,
    '',
    firstUrl ? `Explore the source: ${firstUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return {
    linkedIn,
    shortCaption: `Do not stop at the headline. Turn fresh information into a smarter next move.${firstUrl ? ` ${firstUrl}` : ''}`,
    hashtags: ['#Insights', '#WhatsNext', '#Amplifi'],
    imageDirection: 'An editorial social graphic that turns the strongest research insight into one short visual idea.',
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
      'No source had a confirmed publish date inside the window , drafts cite available material and mark uncertain dates.',
    );
  }
  if (payload.notes) warnings.push(String(payload.notes).slice(0, 300));

  const draft: AmplifiSocialDraft = {
    linkedIn: cleanGeneratedText(payload.linkedIn),
    shortCaption: cleanGeneratedText(payload.shortCaption),
    hashtags: Array.isArray(payload.hashtags)
      ? payload.hashtags.map((h) => String(h)).filter(Boolean).slice(0, 8)
      : [],
    imageDirection: cleanGeneratedText(payload.imageDirection),
  };
  if (!draft.linkedIn || !draft.shortCaption) {
    const fallback = fallbackDraft(input.topic, preferred, input.dateFrom, input.dateTo);
    draft.linkedIn = draft.linkedIn || fallback.linkedIn;
    draft.shortCaption = draft.shortCaption || fallback.shortCaption;
    draft.hashtags = draft.hashtags.length ? draft.hashtags : fallback.hashtags;
    draft.imageDirection = draft.imageDirection || fallback.imageDirection;
    warnings.push('Draft fields were completed with a grounded fallback template.');
  }

  const requestedPostCount = Math.min(3, Math.max(1, input.postCount ?? 1));
  const drafts: AmplifiSocialDraft[] = (payload.posts || []).slice(0, requestedPostCount).map((post) => ({
    linkedIn: cleanGeneratedText(post.linkedIn),
    shortCaption: cleanGeneratedText(post.shortCaption),
    hashtags: Array.isArray(post.hashtags) ? post.hashtags.map(String).filter(Boolean).slice(0, 8) : [],
    imageDirection: cleanGeneratedText(post.imageDirection) || 'An original editorial social graphic built around the post’s strongest idea.',
  })).filter((post) => post.linkedIn && post.shortCaption);
  if (!drafts.length) drafts.push(draft);
  while (drafts.length < requestedPostCount) {
    const number = drafts.length + 1;
    const source = preferred[(number - 1) % Math.max(preferred.length, 1)];
    const sourceUrl = source?.url || preferred[0]?.url || '';
    const sourceIdea = (source?.snippet || source?.title || input.topic).replace(/\s+/g, ' ').trim().slice(0, 320);
    const angle = number === 2
      ? {
          hook: 'The real risk is missing what the news changes.',
          bridge: 'A useful update should do more than inform people. It should help them recognize a pressure, opportunity or decision that deserves attention now.',
          caption: 'Fresh information matters most when it reveals what deserves attention next.',
        }
      : {
          hook: 'Information becomes valuable when it changes the next move.',
          bridge: 'The strongest response is not more commentary. It is a clear takeaway that helps people decide what to notice, question or do next.',
          caption: 'Turn the latest signal into a clearer, more confident next step.',
        };
    drafts.push({
      linkedIn: [angle.hook, '', sourceIdea, '', angle.bridge, '', sourceUrl ? `See the source: ${sourceUrl}` : ''].filter(Boolean).join('\n'),
      shortCaption: `${angle.caption}${sourceUrl ? ` ${sourceUrl}` : ''}`,
      hashtags: ['#Insights', '#WhatsNext', '#Amplifi'],
      imageDirection: number === 2
        ? 'A bold editorial graphic that visualizes the consequence of overlooking an important change.'
        : 'A clear forward-motion graphic that turns the research signal into an inviting next step.',
    });
  }

  const imageOrigin = (process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_BASE_URL?.trim() || 'https://efficiencyarchitects.online').replace(/\/$/, '');
  const draftsWithImages = drafts.map((post, index) => ({
    ...post,
    imageUrl: `${imageOrigin}/api/amplifi/post-image?title=${encodeURIComponent(post.shortCaption)}&variant=${index % 3}`,
  }));

  return {
    topic: input.topic,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    sources: preferred.slice(0, input.maxSources ?? 8),
    draft: draftsWithImages[0] || draft,
    drafts: draftsWithImages,
    draftTitle: cleanGeneratedText(payload.draftTitle || input.topic).slice(0, 120),
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
