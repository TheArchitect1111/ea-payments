import { provenanceFromContext, type ArtifactDraft } from '@/lib/factory-artifact';
import {
  planDocumentArtifacts,
  providerCanCollect,
} from '@/lib/factory-research/providers.mjs';
import type { ResearchProvider } from '@/lib/factory-research/types';
import type { ProjectContext } from '@/lib/factory-project-context';

export const documentProvider: ResearchProvider = {
  id: 'document',
  canCollect(context) {
    return providerCanCollect('document', context);
  },
  async collect(context: ProjectContext): Promise<ArtifactDraft[]> {
    const plans = planDocumentArtifacts(context);
    console.info('[factory-research:document] collect', {
      projectId: context.projectId,
      count: plans.length,
    });
    return plans.map(
      (plan): ArtifactDraft => ({
        kind: 'document',
        providerId: 'document',
        provenance: provenanceFromContext(context, plan.sourceType, {
          sourceName: plan.sourceName,
          sourceUrl: plan.sourceUrl,
        }),
        data: plan.data,
      }),
    );
  },
};
