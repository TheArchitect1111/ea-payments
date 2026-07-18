/**
 * Run research providers against ProjectContext and collect Artifact drafts.
 * Does not persist — caller uses ArtifactService.appendArtifacts.
 */
import type { ArtifactDraft } from '@/lib/factory-artifact';
import { brandingProvider } from '@/lib/factory-research/branding-provider';
import { documentProvider } from '@/lib/factory-research/document-provider';
import { metadataProvider } from '@/lib/factory-research/metadata-provider';
import { organizationProvider } from '@/lib/factory-research/organization-provider';
import type { ProviderRunResult, ResearchProvider } from '@/lib/factory-research/types';
import { websiteProvider } from '@/lib/factory-research/website-provider';
import type { ProjectContext } from '@/lib/factory-project-context';

/** Stable provider order for deterministic artifact collections. */
export const RESEARCH_PROVIDERS: ResearchProvider[] = [
  metadataProvider,
  organizationProvider,
  websiteProvider,
  documentProvider,
  brandingProvider,
];

export async function collectResearchArtifacts(
  context: ProjectContext,
  providers: ResearchProvider[] = RESEARCH_PROVIDERS,
): Promise<{ drafts: ArtifactDraft[]; runs: ProviderRunResult[] }> {
  const drafts: ArtifactDraft[] = [];
  const runs: ProviderRunResult[] = [];

  for (const provider of providers) {
    if (!provider.canCollect(context)) {
      console.info('[factory-research] provider skip', {
        projectId: context.projectId,
        providerId: provider.id,
      });
      continue;
    }

    try {
      const collected = await provider.collect(context);
      drafts.push(...collected);
      runs.push({
        providerId: provider.id,
        ok: true,
        artifactCount: collected.length,
      });
      console.info('[factory-research] provider complete', {
        projectId: context.projectId,
        providerId: provider.id,
        artifactCount: collected.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'provider failed';
      console.error('[factory-research] provider error', {
        projectId: context.projectId,
        providerId: provider.id,
        error: message,
      });
      runs.push({
        providerId: provider.id,
        ok: false,
        artifactCount: 0,
        error: message,
      });
    }
  }

  return { drafts, runs };
}
