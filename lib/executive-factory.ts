/**
 * Executive Factory catalog — Understand → Grow stage map for admin factory UI.
 */

export type FactoryStage = 'Understand' | 'Plan' | 'Build' | 'Launch' | 'Operate' | 'Grow';
export type FactoryOutputStatus = 'Live' | 'Partial' | 'Planned';

export type FactoryOutput = {
  slug: string;
  title: string;
  stage: FactoryStage;
  purpose: string;
  status: FactoryOutputStatus;
  requiredInputs: string[];
  executeHref: string;
  knowledgeSlug?: string;
  relatedCapability: string;
  followOnSlugs: string[];
  completionCriteria: string[];
  provenance: { source: string; confidence: 'High' | 'Medium' | 'Low' };
  executiveSummary: string;
};

export const FACTORY_STAGES: FactoryStage[] = [
  'Understand',
  'Plan',
  'Build',
  'Launch',
  'Operate',
  'Grow',
];

const STAGE_PURPOSE: Record<FactoryStage, string> = {
  Understand: 'Discover needs and surface the right starting path.',
  Plan: 'Turn discovery into a clear scope and investment path.',
  Build: 'Assemble the website, portal, and operating pieces.',
  Launch: 'Go live with guided access and next steps.',
  Operate: 'Keep the system healthy day to day.',
  Grow: 'Expand capacity once the foundation is stable.',
};

export const EXECUTIVE_FACTORY_CATALOG: FactoryOutput[] = [
  {
    slug: 'ctp',
    title: 'Consider the Possibilities™',
    stage: 'Understand',
    purpose: 'Guided discovery that opens a branded workspace.',
    status: 'Live',
    requiredInputs: ['Organization profile', 'Goals', 'Contact'],
    executeHref: 'https://cc.efficiencyarchitects.online/ctp',
    relatedCapability: 'Discovery',
    followOnSlugs: ['portal', 'website'],
    completionCriteria: ['Assessment submitted', 'Workspace ready'],
    provenance: { source: 'EA Factory catalog', confidence: 'High' },
    executiveSummary: 'Canonical CTP intake that routes into the client portal.',
  },
  {
    slug: 'portal',
    title: 'Client Portal',
    stage: 'Build',
    purpose: 'Private branded workspace for progress, assets, and next steps.',
    status: 'Live',
    requiredInputs: ['Organization', 'Contact email'],
    executeHref: '/admin/clients',
    relatedCapability: 'Portal Chassis',
    followOnSlugs: ['operate'],
    completionCriteria: ['Portal provisioned', 'Welcome sent'],
    provenance: { source: 'EA Factory catalog', confidence: 'High' },
    executiveSummary: 'Provision and guide clients inside their portal.',
  },
  {
    slug: 'website',
    title: 'Website / Landing Presence',
    stage: 'Build',
    purpose: 'Public digital front door for the organization.',
    status: 'Partial',
    requiredInputs: ['Brand basics', 'Offer message'],
    executeHref: '/admin/products',
    relatedCapability: 'Digital Presence',
    followOnSlugs: ['launch'],
    completionCriteria: ['Site live', 'Lead path working'],
    provenance: { source: 'EA Factory catalog', confidence: 'Medium' },
    executiveSummary: 'Ship a clear public presence tied to the portal journey.',
  },
];

export function resolveFactoryStage(value?: string): FactoryStage | undefined {
  if (!value) return undefined;
  const match = FACTORY_STAGES.find((stage) => stage.toLowerCase() === value.toLowerCase());
  return match;
}

export function listFactoryOutputs(filters?: { stage?: FactoryStage | string }): FactoryOutput[] {
  const stage = resolveFactoryStage(
    typeof filters?.stage === 'string' ? filters.stage : filters?.stage,
  );
  if (!stage) return EXECUTIVE_FACTORY_CATALOG;
  return EXECUTIVE_FACTORY_CATALOG.filter((item) => item.stage === stage);
}

export function getFactoryOutput(slug: string): FactoryOutput | undefined {
  return EXECUTIVE_FACTORY_CATALOG.find((item) => item.slug === slug);
}

export function getFactoryStageSummary(): { stage: FactoryStage; count: number; purpose: string }[] {
  return FACTORY_STAGES.map((stage) => ({
    stage,
    count: EXECUTIVE_FACTORY_CATALOG.filter((item) => item.stage === stage).length,
    purpose: STAGE_PURPOSE[stage],
  }));
}

export function getFactoryStatusSummary(): { status: FactoryOutputStatus; count: number }[] {
  const statuses: FactoryOutputStatus[] = ['Live', 'Partial', 'Planned'];
  return statuses.map((status) => ({
    status,
    count: EXECUTIVE_FACTORY_CATALOG.filter((item) => item.status === status).length,
  }));
}

export function getFactoryCatalogStats(): { total: number; live: number; partial: number } {
  return {
    total: EXECUTIVE_FACTORY_CATALOG.length,
    live: EXECUTIVE_FACTORY_CATALOG.filter((item) => item.status === 'Live').length,
    partial: EXECUTIVE_FACTORY_CATALOG.filter((item) => item.status === 'Partial').length,
  };
}
