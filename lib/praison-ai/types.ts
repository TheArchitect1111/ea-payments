/**
 * PraisonAI workforce — structured JSON contracts (not free-form text).
 */

export type WorkforceAgentId =
  | 'executive'
  | 'research'
  | 'website-auditor'
  | 'operations-analyst'
  | 'financial-analyst'
  | 'marketing-analyst'
  | 'proposal-architect'
  | 'portal-architect'
  | 'executive-writer'
  | 'qa';

export type WorkforceRunStatus = 'pending' | 'running' | 'complete' | 'failed' | 'skipped';

export type WorkforceReviewStatus =
  | 'research-complete'
  | 'website-review-complete'
  | 'proposal-draft-ready'
  | 'qa-passed'
  | 'qa-failed'
  | 'blueprint-ready'
  | 'awaiting-executive-review'
  | 'approved';

export interface WorkforceEvidence {
  source: string;
  excerpt?: string;
  url?: string;
}

export interface WorkforceAgentLog {
  agentId: WorkforceAgentId;
  status: WorkforceRunStatus;
  startedAt: string;
  completedAt?: string;
  executionTimeMs?: number;
  confidence: number;
  recommendations: string[];
  evidence: WorkforceEvidence[];
  error?: string;
}

export interface StructuredFinding {
  title: string;
  detail: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

/** Base output every specialist agent returns. */
export interface SpecialistAgentOutput {
  agentId: WorkforceAgentId;
  summary: string;
  findings: StructuredFinding[];
  recommendations: string[];
  opportunities: StructuredFinding[];
  risks: StructuredFinding[];
  confidence: number;
  evidence: WorkforceEvidence[];
  /** Agent-specific structured payload */
  data?: Record<string, unknown>;
}

export interface BusinessIntelligenceReport extends SpecialistAgentOutput {
  agentId: 'research';
  data?: {
    industry?: string;
    competitors?: string[];
    socialPresence?: string;
    publicReputation?: string;
  };
}

export interface WebsiteAuditReport extends SpecialistAgentOutput {
  agentId: 'website-auditor';
  data?: {
    overallScore?: number;
    ux?: string;
    storytelling?: string;
    branding?: string;
    performance?: string;
    accessibility?: string;
    mobile?: string;
    seo?: string;
    callsToAction?: string;
  };
}

export interface ProposalBlueprint extends SpecialistAgentOutput {
  agentId: 'proposal-architect';
  data?: {
    operationalBlueprint?: string;
    websiteBlueprint?: string;
    portalBlueprint?: string;
    scope?: string[];
    pricingNotes?: string;
    timeline?: string;
    investmentRange?: { low?: number; high?: number };
  };
}

export interface PortalModuleRecommendation extends SpecialistAgentOutput {
  agentId: 'portal-architect';
  data?: {
    recommendedModules?: string[];
    examples?: string[];
    rationale?: string;
  };
}

export interface QaReport {
  agentId: 'qa';
  passed: boolean;
  checks: Array<{ id: string; label: string; passed: boolean; detail?: string }>;
  blockers: string[];
  confidence: number;
  reviewedAt: string;
}

export interface ExecutiveIntelligenceSummary {
  headline: string;
  narrative: string;
  topOpportunities: StructuredFinding[];
  topRisks: StructuredFinding[];
  recommendedActions: string[];
  confidence: number;
}

/** Full package delivered to Make.com, Open Design, and Mission Control. */
export interface ExecutiveIntelligencePackage {
  id: string;
  organizationId: string;
  submissionId: string;
  businessName: string;
  reviewStatus: WorkforceReviewStatus;
  executiveSummary: ExecutiveIntelligenceSummary;
  research?: SpecialistAgentOutput;
  websiteAudit?: WebsiteAuditReport;
  operations?: SpecialistAgentOutput;
  finance?: SpecialistAgentOutput;
  marketing?: SpecialistAgentOutput;
  proposal?: ProposalBlueprint;
  portal?: PortalModuleRecommendation;
  executiveWriter?: SpecialistAgentOutput;
  qa?: QaReport;
  agentLogs: WorkforceAgentLog[];
  pulseInsights: string[];
  generatedAt: string;
  /** For Organizational Knowledge Graph */
  knowledgeGraphRef: string;
}

export interface WorkforceTriggerInput {
  submissionId: string;
  organizationId: string;
  businessName: string;
  contactName: string;
  email: string;
  query: string;
  context: Record<string, unknown>;
  siteUrl?: string;
  digitalAudit?: unknown;
}
