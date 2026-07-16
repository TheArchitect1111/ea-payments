/**
 * PraisonAI — EA intelligence workforce orchestration layer.
 */

export type {
  BusinessIntelligenceReport,
  ExecutiveIntelligencePackage,
  ExecutiveIntelligenceSummary,
  PortalModuleRecommendation,
  ProposalBlueprint,
  QaReport,
  SpecialistAgentOutput,
  WebsiteAuditReport,
  WorkforceAgentId,
  WorkforceAgentLog,
  WorkforceEvidence,
  WorkforceReviewStatus,
  WorkforceRunStatus,
  WorkforceTriggerInput,
} from './types';

export {
  buildKnowledgeGraph,
  getKnowledgeGraph,
  searchKnowledgeGraph,
  type KnowledgeGraphIndex,
  type KnowledgeGraphNode,
} from './knowledge-graph';

export {
  buildWorkforceAttentionItems,
  MISSION_CONTROL_WORKFORCE_LABELS,
  workforceStatusLabel,
} from './mission-control';

export { buildPraisonMakePayload, firePraisonPackageWebhook } from './make-bridge';

export {
  FUTURE_WORKFORCE_AGENTS,
  PRAISON_WORKFORCE,
  agentsInBatch,
  getWorkforceAgent,
  maxBatch,
} from './workforce-registry';

export {
  runPraisonWorkforce,
  schedulePraisonWorkforce,
  triggerInputFromSubmission,
  workforceAgentCount,
} from './orchestrator';

export { praisonExternalConfigured } from './client';

import type { CtpSubmission } from '@/lib/ctp-submissions';
import type { ExecutiveIntelligenceInput } from '@/lib/open-design/types';
import type { ExecutiveIntelligencePackage } from './types';

/** Map workforce package → Open Design executive intelligence input. */
export function executiveInputFromWorkforcePackage(
  pkg: ExecutiveIntelligencePackage,
  submission: CtpSubmission,
): ExecutiveIntelligenceInput {
  return {
    organizationId: pkg.organizationId,
    organizationName: pkg.businessName,
    industry: pkg.research?.data?.industry as string | undefined,
    mission: submission.discoveryAnswers?.mission as string | undefined,
    audience: submission.contactName,
    differentiators: submission.desiredExperiences,
    executiveSummary: pkg.executiveSummary.narrative,
    websiteAuditNotes: pkg.websiteAudit?.summary,
    portalRecommendations: pkg.portal?.data?.recommendedModules,
    marketingNotes: pkg.marketing?.summary,
    discoveryAnswers: submission.discoveryAnswers as Record<string, unknown> | undefined,
  };
}
