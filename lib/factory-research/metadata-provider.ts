import { provenanceFromContext, type ArtifactDraft } from '@/lib/factory-artifact';
import {
  planMetadataArtifact,
  providerCanCollect,
} from '@/lib/factory-research/providers.mjs';
import type { ResearchProvider } from '@/lib/factory-research/types';
import type { ProjectContext } from '@/lib/factory-project-context';

export const metadataProvider: ResearchProvider = {
  id: 'metadata',
  canCollect(context) {
    return providerCanCollect('metadata', context);
  },
  async collect(context: ProjectContext): Promise<ArtifactDraft[]> {
    const plan = planMetadataArtifact(context);
    console.info('[factory-research:metadata] collect', {
      projectId: context.projectId,
      primarySourceType: plan.data.primarySourceType,
    });
    return [
      {
        kind: 'metadata',
        providerId: 'metadata',
        provenance: provenanceFromContext(context, plan.sourceType),
        data: plan.data,
      },
    ];
  },
};
