/**
 * PraisonAI workforce registry — add agents here without changing orchestrator framework.
 */

import type { WorkforceAgentId } from './types';

export interface WorkforceAgentDefinition {
  id: WorkforceAgentId;
  label: string;
  department: string;
  responsibilities: string[];
  outputLabel: string;
  /** Parallel batch — agents in same batch run concurrently */
  batch: number;
  dependsOn?: WorkforceAgentId[];
  /** Maps to existing EA agent when available */
  eaAgentAlias?: string;
}

export const PRAISON_WORKFORCE: WorkforceAgentDefinition[] = [
  {
    id: 'research',
    label: 'Research Agent',
    department: 'Business Intelligence',
    responsibilities: ['Company research', 'Website', 'Reviews', 'Social', 'Competitors', 'Industry'],
    outputLabel: 'Business Intelligence Report',
    batch: 1,
    eaAgentAlias: 'research',
  },
  {
    id: 'website-auditor',
    label: 'Website Auditor',
    department: 'Digital Experience',
    responsibilities: ['UX', 'Storytelling', 'Branding', 'Performance', 'Accessibility', 'Mobile', 'SEO', 'CTAs'],
    outputLabel: 'Website Score & Recommendations',
    batch: 1,
  },
  {
    id: 'operations-analyst',
    label: 'Operations Analyst',
    department: 'Operations',
    responsibilities: ['Workflow', 'Manual effort', 'Bottlenecks', 'Communication', 'Repetitive work'],
    outputLabel: 'Operational Opportunity Report',
    batch: 1,
  },
  {
    id: 'financial-analyst',
    label: 'Financial Analyst',
    department: 'Finance',
    responsibilities: ['Revenue model', 'Payment systems', 'Billing', 'Financial workflow'],
    outputLabel: 'Money & Payments Assessment',
    batch: 1,
  },
  {
    id: 'marketing-analyst',
    label: 'Marketing Analyst',
    department: 'Marketing',
    responsibilities: ['Messaging', 'Positioning', 'Brand consistency', 'Digital presence', 'Conversion'],
    outputLabel: 'Marketing Opportunity Summary',
    batch: 1,
  },
  {
    id: 'proposal-architect',
    label: 'Proposal Architect',
    department: 'Strategy',
    responsibilities: ['Operational blueprint', 'Website blueprint', 'Portal blueprint', 'Scope', 'Pricing', 'Timeline'],
    outputLabel: 'Proposal Blueprint',
    batch: 2,
    dependsOn: ['research', 'operations-analyst', 'financial-analyst'],
    eaAgentAlias: 'intake',
  },
  {
    id: 'portal-architect',
    label: 'Portal Architect',
    department: 'Platform',
    responsibilities: ['Portal modules', 'Client portal', 'HR', 'Learning', 'Dashboard', 'CRM', 'Scheduling'],
    outputLabel: 'Portal Module Recommendations',
    batch: 2,
    dependsOn: ['research', 'operations-analyst'],
  },
  {
    id: 'executive-writer',
    label: 'Executive Writer',
    department: 'Communications',
    responsibilities: ['Executive summary', 'Confirmation email', 'Proposal language', 'Presentation narrative'],
    outputLabel: 'Executive Narrative',
    batch: 3,
    dependsOn: ['proposal-architect', 'portal-architect'],
  },
  {
    id: 'qa',
    label: 'QA Agent',
    department: 'Quality Assurance',
    responsibilities: ['Hallucination check', 'Missing sections', 'Pricing consistency', 'Writing quality', 'Client experience'],
    outputLabel: 'QA Report',
    batch: 4,
    dependsOn: ['executive-writer'],
  },
  {
    id: 'executive',
    label: 'Executive Agent',
    department: 'Executive Office',
    responsibilities: ['Coordinate agents', 'Assign work', 'Combine findings', 'Final recommendations'],
    outputLabel: 'Executive Intelligence Summary',
    batch: 5,
    dependsOn: ['qa'],
  },
];

export const FUTURE_WORKFORCE_AGENTS = [
  'legal',
  'compliance',
  'grant-writer',
  'hr',
  'training',
  'cybersecurity',
  'sales-coach',
  'presentation-designer',
  'financial-coach',
  'accessibility-reviewer',
  'voice-agent',
] as const;

export function getWorkforceAgent(id: WorkforceAgentId): WorkforceAgentDefinition | undefined {
  return PRAISON_WORKFORCE.find((a) => a.id === id);
}

export function agentsInBatch(batch: number): WorkforceAgentDefinition[] {
  return PRAISON_WORKFORCE.filter((a) => a.batch === batch);
}

export function maxBatch(): number {
  return Math.max(...PRAISON_WORKFORCE.map((a) => a.batch));
}
