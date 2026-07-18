import { provenanceFromContext, type ArtifactDraft } from '@/lib/factory-artifact';
import {
  planOrganizationArtifact,
  providerCanCollect,
} from '@/lib/factory-research/providers.mjs';
import type { ResearchProvider } from '@/lib/factory-research/types';
import type { ProjectContext } from '@/lib/factory-project-context';

export const organizationProvider: ResearchProvider = {
  id: 'organization',
  canCollect(context) {
    return providerCanCollect('organization', context);
  },
  async collect(context: ProjectContext): Promise<ArtifactDraft[]> {
    const plan = planOrganizationArtifact(context);
    console.info('[factory-research:organization] collect', {
      projectId: context.projectId,
      organizationName: plan.data.organizationName,
    });
    return [
      {
        kind: 'organization',
        providerId: 'organization',
        provenance: provenanceFromContext(context, plan.sourceType, {
          sourceName: plan.sourceName,
          sourceUrl: plan.data.primaryUrl || undefined,
        }),
        data: plan.data,
      },
    ];
  },
};
