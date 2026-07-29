import {
  EXPERIENCE_CREATION_SCHEMA_VERSION,
  type ArtifactMeta,
} from '@/lib/experience-creation/types';

export function createArtifactMeta(input: {
  projectId: string;
  subjectIdentity: string;
  providerId: string;
  model?: string;
  notes?: string;
  inputArtifactIds?: string[];
  provenanceNotes?: string;
  confidence?: number;
  completeness?: number;
  warnings?: string[];
  validationOk?: boolean;
  validationReasons?: string[];
}): ArtifactMeta {
  const now = new Date().toISOString();
  return {
    schemaVersion: EXPERIENCE_CREATION_SCHEMA_VERSION,
    projectId: input.projectId,
    subjectIdentity: input.subjectIdentity,
    createdAt: now,
    updatedAt: now,
    provider: {
      id: input.providerId,
      model: input.model,
      notes: input.notes,
    },
    inputArtifactIds: input.inputArtifactIds || [],
    provenanceNotes: input.provenanceNotes || '',
    confidence: input.confidence ?? 0,
    completeness: input.completeness ?? 0,
    warnings: input.warnings || [],
    validation: {
      ok: input.validationOk ?? false,
      reasons: input.validationReasons || [],
    },
  };
}

export function scoreCompleteness(parts: boolean[]): number {
  if (!parts.length) return 0;
  const hit = parts.filter(Boolean).length;
  return Math.round((hit / parts.length) * 100);
}
