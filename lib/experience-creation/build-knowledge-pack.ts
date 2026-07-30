/**
 * Build subject_knowledge_pack from ProjectContext research + live multi-query research.
 */
import { listArtifacts } from '@/lib/factory-artifact';
import { parseDistinguishingDetail } from '@/lib/factory-identity-gate';
import {
  createArtifactMeta,
  scoreCompleteness,
} from '@/lib/experience-creation/meta';
import {
  createDefaultResearchAdapter,
  multiQueryResearch,
  type ResearchProviderAdapter,
} from '@/lib/experience-creation/research-adapter';
import type {
  KnowledgeClaim,
  SubjectKnowledgePack,
} from '@/lib/experience-creation/types';
import type { FactoryProject } from '@/lib/factory-project-store';
import { projectContextFromProject } from '@/lib/factory-project-context';
import {
  containsForbiddenPublicCopy,
  scrubForbiddenPublicCopy,
} from '@/lib/factory-forbidden-copy.mjs';
import {
  evaluateEvidenceQuality,
  isEvidenceRelevantToSubject,
} from '@/lib/factory-evidence-quality';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function pushUnique(list: string[], value: string | undefined) {
  const cleaned = scrubForbiddenPublicCopy(value);
  if (!cleaned) return;
  if (list.some((item) => item.toLowerCase() === cleaned.toLowerCase())) return;
  list.push(cleaned);
}

function claimId(index: number) {
  return `claim-${index + 1}`;
}

export function evaluateKnowledgeGate(pack: SubjectKnowledgePack): {
  ok: boolean;
  reasons: string[];
} {
  const evidence = evaluateEvidenceQuality({
    subjectName: pack.verifiedIdentity.name,
    identityStatus: pack.verifiedIdentity.status,
    claims: pack.claims.map((c) => ({
      text: c.text,
      status: c.status,
      sourceUrls: c.sourceUrls,
    })),
    organizations: pack.organizations,
    professionalRoles: pack.professionalRoles,
    currentWork: pack.currentWork,
    biography: pack.biography,
    sources: pack.citations.map((c) => ({ url: c.url })),
    officialWebsite: pack.officialWebsite,
  });
  return {
    ok: evidence.ok,
    reasons: evidence.ok
      ? evidence.reasons.filter((r) => /Limited personal/i.test(r))
      : evidence.reasons,
  };
}

export async function buildSubjectKnowledgePack(
  project: FactoryProject,
  adapter: ResearchProviderAdapter = createDefaultResearchAdapter(),
): Promise<SubjectKnowledgePack> {
  const context = project.context ? projectContextFromProject(project) : null;

  // Prefer structured UXG crawl pack when present (Factory consumes packs, not raw crawl text).
  if (context) {
    const crawlKnowledge = listArtifacts(context, 'subject_knowledge_pack').find((a) => {
      const provider = asRecord(asRecord(a.data)?.provider);
      return str(provider?.id) === 'uxg-research-crawl';
    });
    if (crawlKnowledge?.data) {
      return crawlKnowledge.data as unknown as SubjectKnowledgePack;
    }
    const crawlOnly = listArtifacts(context, 'research_crawl_result').at(-1);
    if (crawlOnly?.data && asRecord(crawlOnly.data)?.schemaVersion === 1) {
      try {
        const { mapCrawlToKnowledgePack } = await import('@/lib/uxg/research/map-to-packs');
        const { parseResearchCrawlResult } = await import('@/lib/uxg/research/schemas');
        return mapCrawlToKnowledgePack(project, parseResearchCrawlResult(crawlOnly.data));
      } catch {
        // Fall through to legacy path.
      }
    }
  }

  const name = project.client.trim();
  const detail = parseDistinguishingDetail(project.notes) || '';
  const inputArtifactIds: string[] = [];
  const warnings: string[] = [];
  const claims: KnowledgeClaim[] = [];
  const citations: SubjectKnowledgePack['citations'] = [];
  const locations: string[] = [];
  const professionalRoles: string[] = [];
  const timeline: SubjectKnowledgePack['timeline'] = [];
  const education: string[] = [];
  const careerHistory: string[] = [];
  const organizations: string[] = [];
  const accomplishments: string[] = [];
  const programs: string[] = [];
  const currentWork: string[] = [];
  const audiences: string[] = [];
  const interviewsAndMedia: SubjectKnowledgePack['interviewsAndMedia'] = [];
  const quotes: SubjectKnowledgePack['quotes'] = [];
  const unknowns: string[] = [];
  const conflictingClaims: string[] = [];
  const unsupportedClaims: string[] = [];
  const alternativeIdentities: SubjectKnowledgePack['alternativeIdentities'] = [];

  let officialWebsite: string | null = null;
  let identityStatus: SubjectKnowledgePack['verifiedIdentity']['status'] = 'incomplete';
  let identityConfidence = 0.2;
  let identityReason = 'Awaiting research evidence.';
  let selectedUrl: string | null = null;

  if (context) {
    const prospect = listArtifacts(context, 'prospect_profile').at(-1);
    if (prospect?.id) inputArtifactIds.push(prospect.id);
    const prospectData = asRecord(prospect?.data) || {};
    const identity = asRecord(prospectData.identity) || {};
    selectedUrl = str(identity.selectedUrl) || null;
    officialWebsite = selectedUrl;
    identityStatus =
      (str(identity.status) as SubjectKnowledgePack['verifiedIdentity']['status']) ||
      'incomplete';
    identityConfidence = typeof identity.confidence === 'number' ? identity.confidence : 0.2;
    identityReason = str(identity.reason) || identityReason;

    const evidence = Array.isArray(prospectData.evidence) ? prospectData.evidence : [];
    for (const item of evidence.slice(0, 20)) {
      const rec = asRecord(item);
      const text = scrubForbiddenPublicCopy(str(rec?.text) || str(item));
      const url = str(rec?.url);
      if (!text || containsForbiddenPublicCopy(text)) continue;
      claims.push({
        id: claimId(claims.length),
        text,
        status: url ? 'verified' : 'supported_inference',
        sourceUrls: url ? [url] : [],
        category: 'other',
      });
      if (url) {
        citations.push({ url, title: str(rec?.title), usedFor: [text.slice(0, 80)] });
      }
    }
    const citeList = Array.isArray(prospectData.citations) ? prospectData.citations : [];
    for (const item of citeList.slice(0, 20)) {
      const rec = asRecord(item);
      const url = str(rec?.url);
      if (!url) continue;
      if (!citations.some((c) => c.url === url)) {
        citations.push({ url, title: str(rec?.title), usedFor: ['prospect citation'] });
      }
    }

    const website = listArtifacts(context, 'website').at(-1);
    if (website?.id) inputArtifactIds.push(website.id);
    const websiteData = asRecord(website?.data) || {};
    const extracted = asRecord(websiteData.extracted) || {};
    officialWebsite = str(websiteData.url) || officialWebsite;
    for (const text of [
      str(extracted.title),
      str(extracted.description),
      str(extracted.textPreview)?.slice(0, 280),
    ]) {
      const cleaned = scrubForbiddenPublicCopy(text);
      if (!cleaned) continue;
      claims.push({
        id: claimId(claims.length),
        text: cleaned,
        status: 'verified',
        sourceUrls: officialWebsite ? [officialWebsite] : [],
        category: 'identity',
      });
    }

    const branding = listArtifacts(context, 'branding').at(-1);
    if (branding?.id) inputArtifactIds.push(branding.id);
    const brandingData = asRecord(branding?.data) || {};
    pushUnique(audiences, str(brandingData.audience));
    pushUnique(currentWork, str(brandingData.whatTheyDo));
  }

  // Administrator clarification — supported inference, never launch goals.
  if (detail && !containsForbiddenPublicCopy(detail)) {
    for (const part of detail.split(/[.;]/).map((p) => p.trim()).filter((p) => p.length > 12)) {
      if (containsForbiddenPublicCopy(part)) continue;
      claims.push({
        id: claimId(claims.length),
        text: part,
        status: 'supported_inference',
        sourceUrls: [],
        category: /duke|basketball|captain|coach/i.test(part)
          ? 'accomplishment'
          : /founder|architect/i.test(part)
            ? 'organization'
            : 'biography',
      });
      if (/duke/i.test(part)) {
        pushUnique(organizations, 'Duke University');
        pushUnique(education, 'Duke University');
        timeline.push({ label: 'Duke basketball', detail: part });
        pushUnique(accomplishments, part);
        pushUnique(professionalRoles, 'Basketball captain');
      }
      if (/efficiency architects/i.test(part)) {
        pushUnique(organizations, 'Efficiency Architects');
        pushUnique(currentWork, 'Founder of Efficiency Architects');
        pushUnique(professionalRoles, 'Founder');
      }
      if (/charlotte/i.test(part)) pushUnique(locations, 'Charlotte, North Carolina');
    }
  }

  // Live multi-query research (does not fabricate when unconfigured).
  const queries = [
    `${name} ${detail}`.trim(),
    `${name} official website`,
    `${name} interview OR news OR podcast`,
    `${name} career OR biography`,
  ].filter(Boolean);
  const live = await multiQueryResearch(adapter, queries);
  warnings.push(...live.warnings);
  for (const hit of live.hits) {
    if (!citations.some((c) => c.url === hit.url)) {
      citations.push({
        url: hit.url,
        title: hit.title,
        usedFor: [hit.description?.slice(0, 80) || 'search hit'],
      });
    }
    if (hit.description && !containsForbiddenPublicCopy(hit.description)) {
      claims.push({
        id: claimId(claims.length),
        text: scrubForbiddenPublicCopy(hit.description) || hit.description.slice(0, 240),
        status: 'unverified_lead',
        sourceUrls: [hit.url],
        category: 'media',
      });
    }
  }
  for (const page of live.pages) {
    if (!officialWebsite && page.url.startsWith('http')) officialWebsite = page.url;
    const snippet = scrubForbiddenPublicCopy(page.description || page.text.slice(0, 280));
    if (snippet) {
      claims.push({
        id: claimId(claims.length),
        text: snippet,
        status: 'verified',
        sourceUrls: [page.url],
        category: 'biography',
      });
    }
    interviewsAndMedia.push({ title: page.title, url: page.url });
  }

  // Deduplicate + subject-relevance filter (drop confused near-name hits).
  const deduped: KnowledgeClaim[] = [];
  for (const claim of claims) {
    if (deduped.some((c) => c.text.toLowerCase() === claim.text.toLowerCase())) continue;
    if (containsForbiddenPublicCopy(claim.text)) continue;
    if (!isEvidenceRelevantToSubject(name, claim.text, claim.sourceUrls[0])) {
      unsupportedClaims.push(`Rejected off-subject evidence: ${claim.text.slice(0, 120)}`);
      continue;
    }
    deduped.push(claim);
  }

  const biography =
    scrubForbiddenPublicCopy(
      [
        ...deduped.filter((c) => c.category === 'biography' || c.category === 'accomplishment').map((c) => c.text),
        ...timeline.map((t) => t.detail),
        ...currentWork,
      ]
        .slice(0, 6)
        .join(' '),
    ) ||
    scrubForbiddenPublicCopy(deduped.slice(0, 4).map((c) => c.text).join(' ')) ||
    '';

  if (!biography) unknowns.push('Substantive biography not yet established from public sources.');
  if (!officialWebsite) unknowns.push('Official website not confirmed.');
  if (!interviewsAndMedia.length) unknowns.push('No interviews or media pages captured yet.');
  if (live.hits.length === 0 && !adapter.configured) {
    unknowns.push('Live web research unavailable — OPENAI_API_KEY not configured.');
  }

  const meaningful = deduped.filter(
    (c) => c.status === 'verified' || c.status === 'supported_inference',
  );
  const completeness = scoreCompleteness([
    Boolean(name),
    Boolean(officialWebsite || selectedUrl),
    meaningful.length >= 3,
    meaningful.length >= 8,
    biography.length >= 80,
    currentWork.length > 0,
    audiences.length > 0 || Boolean(detail),
    citations.length >= 2,
    organizations.length > 0,
    timeline.length > 0,
  ]);

  const draft: SubjectKnowledgePack = {
    ...createArtifactMeta({
      projectId: project.id,
      subjectIdentity: name,
      providerId: 'experience-creation-research',
      model: process.env.FACTORY_RESEARCH_MODEL || process.env.AI_MODEL_RESEARCH,
      inputArtifactIds,
      provenanceNotes: 'Built from ProjectContext research artifacts + live multi-query research',
      confidence: identityConfidence,
      completeness,
      warnings,
    }),
    kind: 'subject_knowledge_pack',
    verifiedIdentity: {
      name,
      status: identityStatus === 'resolved' || meaningful.length >= 3 ? (identityStatus === 'ambiguous' ? 'ambiguous' : 'resolved') : identityStatus,
      confidence: Math.max(identityConfidence, meaningful.length >= 5 ? 0.7 : 0.4),
      selectedUrl: selectedUrl || officialWebsite,
      reason: identityReason,
    },
    alternativeIdentities,
    officialWebsite,
    socialProfiles: [],
    locations,
    professionalRoles,
    biography,
    timeline,
    education,
    careerHistory,
    organizations,
    accomplishments,
    programs,
    currentWork,
    audiences: audiences.length
      ? audiences
      : ['People seeking clarity, structure, and a trusted next step'],
    interviewsAndMedia,
    quotes,
    callsToAction: ['Continue the conversation', 'Explore the work'],
    citations,
    conflictingClaims,
    unsupportedClaims,
    unknowns,
    claims: deduped,
  };

  const gate = evaluateKnowledgeGate(draft);
  draft.validation = { ok: gate.ok, reasons: gate.reasons };
  draft.warnings = [...draft.warnings, ...gate.reasons.filter((r) => gate.ok)];
  return draft;
}
