/**
 * Factory research provider: UXG deep crawl → research_crawl_result artifact.
 */
import type { ArtifactDraft } from '@/lib/factory-artifact';
import type { ProjectContext } from '@/lib/factory-project-context';
import type { ResearchProvider } from '@/lib/factory-research/types';
import { getFactoryProject } from '@/lib/factory-project-store';
import { runUxgResearchPipeline } from '@/lib/uxg/research/pipeline';
import { appendProjectContextOutput } from '@/lib/factory-project-context';

export const uxgDeepCrawlProvider: ResearchProvider = {
  id: 'uxg-deep-crawl',
  canCollect(context: ProjectContext): boolean {
    const provider = (process.env.UXG_RESEARCH_PROVIDER || '').trim().toLowerCase();
    if (provider === 'off') return false;
    if (provider === 'firecrawl') return Boolean(process.env.FIRECRAWL_API_KEY?.trim());
    return Boolean(
      process.env.UXG_RESEARCH_WORKER_URL?.trim() &&
        process.env.UXG_RESEARCH_WORKER_TOKEN?.trim(),
    );
  },
  async collect(context: ProjectContext): Promise<ArtifactDraft[]> {
    const project = await getFactoryProject(context.projectId);
    if (!project) return [];

    const result = await runUxgResearchPipeline(project);
    const now = new Date().toISOString();

    await appendProjectContextOutput(context.projectId, {
      kind: 'research',
      worker: 'uxg-research-pipeline',
      payload: {
        ok: result.ok,
        skipped: result.skipped,
        reason: result.reason,
        providerId: result.providerId,
        completeness: result.completeness,
        job: result.crawl?.job || null,
        // Diagnostics collapsed for admin; omit raw page HTML.
        diagnostics: result.crawl?.diagnostics || null,
      },
    });

    if (!result.crawl) return [];

    const drafts: ArtifactDraft[] = [
      {
        kind: 'research_crawl_result',
        title: `UXG research crawl — ${project.client}`,
        summary: `provider=${result.providerId} completeness=${result.completeness}`,
        data: {
          ...result.crawl,
          // Strip nothing required; admin UI should collapse diagnostics.
        },
        provenance: {
          capabilityId: 'research',
          sourceType: 'uxg-deep-crawl',
          collectedAt: now,
          confidence: result.completeness,
        },
      },
    ];

    if (result.knowledge) {
      drafts.push({
        kind: 'subject_knowledge_pack',
        title: `Subject knowledge (crawl) — ${project.client}`,
        summary: result.knowledge.verifiedIdentity.reason,
        data: result.knowledge as unknown as Record<string, unknown>,
        provenance: {
          capabilityId: 'research',
          sourceType: 'uxg-deep-crawl',
          collectedAt: now,
          confidence: result.knowledge.verifiedIdentity.confidence,
        },
      });
    }

    if (result.media) {
      drafts.push({
        kind: 'media_brand_pack',
        title: `Brand/media (crawl) — ${project.client}`,
        summary: `${result.media.assets.length} assets`,
        data: result.media as unknown as Record<string, unknown>,
        provenance: {
          capabilityId: 'research',
          sourceType: 'uxg-deep-crawl',
          collectedAt: now,
          confidence: result.media.completenessScore,
        },
      });
    }

    return drafts;
  },
};
