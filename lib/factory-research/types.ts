import type { ArtifactDraft } from '@/lib/factory-artifact';
import type { ProjectContext } from '@/lib/factory-project-context';

export type ResearchProviderId =
  | 'website'
  | 'organization'
  | 'document'
  | 'branding'
  | 'metadata';

export type ResearchProvider = {
  id: ResearchProviderId;
  canCollect(context: ProjectContext): boolean;
  collect(context: ProjectContext): Promise<ArtifactDraft[]>;
};

export type ProviderRunResult = {
  providerId: ResearchProviderId;
  ok: boolean;
  artifactCount: number;
  error?: string;
};
