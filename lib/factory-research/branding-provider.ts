import { provenanceFromContext, type ArtifactDraft } from '@/lib/factory-artifact';
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
    return plans.map(
      (plan): ArtifactDraft => ({
        kind: 'branding',
        providerId: 'branding',
        provenance: provenanceFromContext(context, plan.sourceType, {
          sourceName: plan.sourceName,
          sourceUrl: plan.sourceUrl,
        }),
        data: plan.data,
      }),
    );
  },
};
