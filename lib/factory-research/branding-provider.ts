import { provenanceFromContext, type ArtifactDraft } from '@/lib/factory-artifact';
import {
  analyzeFactoryLaunchImage,
} from '@/lib/factory-research/image-signal';
import {
  planBrandingArtifacts,
  providerCanCollect,
} from '@/lib/factory-research/providers.mjs';
import type { ResearchProvider } from '@/lib/factory-research/types';
import type { ProjectContext } from '@/lib/factory-project-context';

export const brandingProvider: ResearchProvider = {
  id: 'branding',
  canCollect(context) {
    return providerCanCollect('branding', context);
  },
  async collect(context: ProjectContext): Promise<ArtifactDraft[]> {
    const plans = planBrandingArtifacts(context);
    console.info('[factory-research:branding] collect', {
      projectId: context.projectId,
      count: plans.length,
    });

    const drafts: ArtifactDraft[] = [];
    for (const plan of plans) {
      let data: Record<string, unknown> = { ...plan.data };

      if (plan.sourceType === 'image' && (plan.sourceUrl || data.url)) {
        try {
          const signal = await analyzeFactoryLaunchImage({
            url: plan.sourceUrl || (typeof data.url === 'string' ? data.url : undefined),
            name: plan.sourceName || (typeof data.name === 'string' ? data.name : undefined),
            type: 'image',
          });
          if (signal) {
            data = {
              ...data,
              brandName: signal.suggestedClientName,
              suggestedClientName: signal.suggestedClientName,
              visionSummary: signal.summary,
              whatTheyDo: signal.whatTheyDo || null,
              audience: signal.audience || null,
              cta: signal.cta || null,
              detectedUrl: signal.url || null,
              opportunities: signal.opportunities,
              textPreview: signal.visionText.slice(0, 2000),
              visionText: signal.visionText.slice(0, 4000),
              imageUrl: signal.imageUrl || data.url || null,
              url: signal.imageUrl || data.url || null,
              hasVision: true,
              assetId: signal.assetId || null,
              note: 'Branding enriched from launch photo vision',
            };
            console.info('[factory-research:branding] vision ok', {
              projectId: context.projectId,
              suggestedClientName: signal.suggestedClientName,
            });
          } else {
            data = { ...data, hasVision: false, note: 'Image present but vision unavailable' };
          }
        } catch (err) {
          console.error('[factory-research:branding] vision failed', context.projectId, err);
          data = {
            ...data,
            hasVision: false,
            note: err instanceof Error ? err.message : 'Vision failed',
          };
        }
      }

      drafts.push({
        kind: 'branding',
        providerId: 'branding',
        provenance: provenanceFromContext(context, plan.sourceType, {
          sourceName: plan.sourceName,
          sourceUrl: plan.sourceUrl,
        }),
        data,
      });
    }

    return drafts;
  },
};
