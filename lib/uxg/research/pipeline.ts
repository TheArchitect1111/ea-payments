/**
 * UXG deep-research pipeline:
 * Name → OpenAI web search → identity → Crawl4AI/Firecrawl → packs.
 */
import { randomUUID } from 'node:crypto';
import type { FactoryProject } from '@/lib/factory-project-store';
import { selectUxgResearchProvider } from '@/lib/uxg/research/select-provider';
import { resolveIdentityCandidates } from '@/lib/uxg/research/identity-resolve';
import { materializeDurableMedia } from '@/lib/uxg/research/durable-assets';
import {
  mapCrawlToKnowledgePack,
  mapCrawlToMediaBrandPack,
  buildBrandProfile,
} from '@/lib/uxg/research/map-to-packs';
import {
  parseResearchCrawlRequest,
  scoreResearchCrawlCompleteness,
  type ResearchCrawlResult,
} from '@/lib/uxg/research/schemas';
import type { MediaBrandPack, SubjectKnowledgePack } from '@/lib/experience-creation/types';
import type { UxgResearchProvider } from '@/lib/uxg/research/provider';

export const UXG_RESEARCH_PIPELINE_WORKER = 'uxg-research-pipeline';

export type UxgResearchPipelineResult = {
  ok: boolean;
  providerId: string;
  skipped: boolean;
  reason?: string;
  needsClarification?: boolean;
  clarificationQuestion?: string | null;
  crawl: ResearchCrawlResult | null;
  knowledge: SubjectKnowledgePack | null;
  media: MediaBrandPack | null;
  completeness: number;
  completenessPass: boolean;
};

function envInt(name: string, fallback: number, max: number): number {
  const n = Number(process.env[name] || fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(n)));
}

function applyOwnership(
  crawl: ResearchCrawlResult,
  employerAffiliated: boolean,
): ResearchCrawlResult {
  if (!employerAffiliated) {
    return {
      ...crawl,
      brandAssets: crawl.brandAssets.map((b) => ({
        ...b,
        ownership: b.ownership || 'subject_owned',
      })),
      mediaAssets: crawl.mediaAssets.map((m) => ({
        ...m,
        ownership: m.ownership || 'subject_owned',
      })),
    };
  }
  return {
    ...crawl,
    brandAssets: crawl.brandAssets.map((b) => ({
      ...b,
      ownership: 'employer_affiliated' as const,
      notes: [b.notes, 'employer-affiliated — not personally owned']
        .filter(Boolean)
        .join('; '),
    })),
    mediaAssets: crawl.mediaAssets.map((m) => ({
      ...m,
      ownership: 'employer_affiliated' as const,
      attribution: m.attribution || 'Employer-affiliated asset (not personal likeness/ownership)',
      licenseEvidence:
        m.licenseEvidence ||
        'employer-site-discovered; not personal property; not an official employer website implication',
    })),
  };
}

export async function runUxgResearchPipeline(
  project: FactoryProject,
  options?: {
    provider?: UxgResearchProvider;
    knownUrls?: string[];
    skipDurable?: boolean;
  },
): Promise<UxgResearchPipelineResult> {
  const provider = options?.provider || selectUxgResearchProvider();
  if (provider.id === 'off' || !provider.configured) {
    return {
      ok: false,
      providerId: provider.id,
      skipped: true,
      reason: 'uxg research provider unavailable — using existing research fallback',
      crawl: null,
      knowledge: null,
      media: null,
      completeness: 0,
      completenessPass: false,
    };
  }

  const knownUrls = [
    ...(options?.knownUrls || []),
    ...(project.url ? [project.url] : []),
  ].filter(Boolean) as string[];

  const identity = await resolveIdentityCandidates({
    subjectName: project.client,
    distinguishingDetail: project.notes,
    knownUrls,
  });

  if (identity.identityStatus === 'needs_clarification') {
    return {
      ok: false,
      providerId: provider.id,
      skipped: false,
      needsClarification: true,
      clarificationQuestion: identity.clarificationQuestion,
      reason: identity.clarificationQuestion || 'Conflicting identity candidates — clarification required',
      crawl: null,
      knowledge: null,
      media: null,
      completeness: 0,
      completenessPass: false,
    };
  }

  // Primary seeds = user-supplied only; search cannot expand officialDomains.
  const request = parseResearchCrawlRequest({
    subjectName: project.client,
    distinguishingDetail: project.notes || undefined,
    knownUrls: identity.primarySeedUrls.length ? identity.primarySeedUrls : knownUrls,
    candidateUrls: identity.candidateUrls.filter((u) => {
      try {
        const host = new URL(u).hostname.replace(/^www\./, '').toLowerCase();
        return identity.lockedOfficialDomains.some(
          (d) => host === d || host.endsWith(`.${d}`),
        );
      } catch {
        return false;
      }
    }),
    maxPages: envInt('UXG_RESEARCH_MAX_PAGES', 12, 25),
    crawlDepth: envInt('UXG_RESEARCH_MAX_DEPTH', 2, 4),
    allowDomains: identity.lockedOfficialDomains,
    jobId: `uxg-${project.id}-${randomUUID().slice(0, 8)}`,
  });

  let crawl = await provider.crawl(request);
  if (!crawl) {
    return {
      ok: false,
      providerId: provider.id,
      skipped: false,
      reason: 'crawl returned null — graceful fallback to existing research',
      crawl: null,
      knowledge: null,
      media: null,
      completeness: 0,
      completenessPass: false,
    };
  }

  crawl = {
    ...crawl,
    identity: {
      ...crawl.identity,
      canonicalName: project.client,
      entityType: identity.entityTypeHint === 'unknown' ? crawl.identity.entityType : identity.entityTypeHint,
      officialDomains: [...identity.lockedOfficialDomains],
      socialProfiles: [
        ...identity.socialProfiles,
        ...crawl.identity.socialProfiles,
      ].slice(0, 12),
      identityVerified: identity.identityVerified,
      identityStatus: identity.identityStatus,
      clarificationQuestion: identity.clarificationQuestion,
      employerAffiliated: identity.employerAffiliation.active,
      employerDomain: identity.employerAffiliation.employerDomain,
      rejectedDomains: identity.rejectedDomains,
      organization: identity.employerAffiliation.employerNameHint || crawl.identity.organization,
    },
  };

  crawl = applyOwnership(crawl, identity.employerAffiliation.active);

  if (!options?.skipDurable) {
    crawl = await materializeDurableMedia(crawl, {
      projectId: project.id,
      organizationId: 'ea-factory',
    });
  }

  crawl = {
    ...crawl,
    brandProfile: {
      ...buildBrandProfile(crawl),
      employerAffiliated: identity.employerAffiliation.active,
    },
  };

  const knowledge = mapCrawlToKnowledgePack(project, crawl);
  const media = mapCrawlToMediaBrandPack(project, crawl, knowledge);
  const completeness = scoreResearchCrawlCompleteness(crawl);

  return {
    ok:
      completeness.pass &&
      (crawl.job.status === 'succeeded' || crawl.job.status === 'partial'),
    providerId: provider.id,
    skipped: false,
    crawl,
    knowledge,
    media,
    completeness: completeness.score,
    completenessPass: completeness.pass,
  };
}
