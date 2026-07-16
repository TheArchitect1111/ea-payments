/**
 * Organizational Knowledge Graph — searchable intelligence memory per org/submission.
 */

import type { ExecutiveIntelligencePackage, WorkforceAgentId } from './types';

export type KnowledgeGraphNodeKind =
  | 'research'
  | 'website'
  | 'portal'
  | 'finance'
  | 'marketing'
  | 'operations'
  | 'proposal'
  | 'recommendation'
  | 'client-conversation'
  | 'business-profile';

export interface KnowledgeGraphNode {
  id: string;
  organizationId: string;
  submissionId: string;
  kind: KnowledgeGraphNodeKind;
  title: string;
  content: string;
  agentId?: WorkforceAgentId;
  confidence: number;
  evidence: string[];
  tags: string[];
  createdAt: string;
}

export interface KnowledgeGraphIndex {
  ref: string;
  organizationId: string;
  submissionId: string;
  nodes: KnowledgeGraphNode[];
  updatedAt: string;
}

const MEMORY = new Map<string, KnowledgeGraphIndex>();

const AGENT_KIND: Partial<Record<WorkforceAgentId, KnowledgeGraphNodeKind>> = {
  research: 'research',
  'website-auditor': 'website',
  'operations-analyst': 'operations',
  'financial-analyst': 'finance',
  'marketing-analyst': 'marketing',
  'proposal-architect': 'proposal',
  'portal-architect': 'portal',
  'executive-writer': 'recommendation',
  executive: 'recommendation',
};

function nodeId(orgId: string, submissionId: string, suffix: string): string {
  return `kg-${orgId}-${submissionId}-${suffix}`;
}

export function buildKnowledgeGraph(pkg: ExecutiveIntelligencePackage): KnowledgeGraphIndex {
  const nodes: KnowledgeGraphNode[] = [];
  const now = new Date().toISOString();

  nodes.push({
    id: nodeId(pkg.organizationId, pkg.submissionId, 'profile'),
    organizationId: pkg.organizationId,
    submissionId: pkg.submissionId,
    kind: 'business-profile',
    title: pkg.businessName,
    content: pkg.executiveSummary.narrative,
    agentId: 'executive',
    confidence: pkg.executiveSummary.confidence,
    evidence: [],
    tags: ['executive', 'profile'],
    createdAt: now,
  });

  const outputs = [
    pkg.research,
    pkg.websiteAudit,
    pkg.operations,
    pkg.finance,
    pkg.marketing,
    pkg.proposal,
    pkg.portal,
    pkg.executiveWriter,
  ].filter(Boolean);

  for (const out of outputs) {
    if (!out) continue;
    const kind = AGENT_KIND[out.agentId] ?? 'recommendation';
    nodes.push({
      id: nodeId(pkg.organizationId, pkg.submissionId, out.agentId),
      organizationId: pkg.organizationId,
      submissionId: pkg.submissionId,
      kind,
      title: `${out.agentId} summary`,
      content: out.summary,
      agentId: out.agentId,
      confidence: out.confidence,
      evidence: out.evidence.map((e) => e.excerpt ?? e.source),
      tags: [out.agentId, kind],
      createdAt: now,
    });

    for (const rec of out.recommendations.slice(0, 5)) {
      nodes.push({
        id: nodeId(pkg.organizationId, pkg.submissionId, `${out.agentId}-rec-${rec.slice(0, 12)}`),
        organizationId: pkg.organizationId,
        submissionId: pkg.submissionId,
        kind: 'recommendation',
        title: rec.slice(0, 80),
        content: rec,
        agentId: out.agentId,
        confidence: out.confidence,
        evidence: [],
        tags: ['recommendation', out.agentId],
        createdAt: now,
      });
    }
  }

  const ref = `kg://${pkg.organizationId}/${pkg.submissionId}`;
  const index: KnowledgeGraphIndex = {
    ref,
    organizationId: pkg.organizationId,
    submissionId: pkg.submissionId,
    nodes,
    updatedAt: now,
  };

  MEMORY.set(ref, index);
  return index;
}

export function getKnowledgeGraph(ref: string): KnowledgeGraphIndex | undefined {
  return MEMORY.get(ref);
}

export function searchKnowledgeGraph(query: string, organizationId?: string, limit = 20): KnowledgeGraphNode[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const hits: KnowledgeGraphNode[] = [];
  for (const index of MEMORY.values()) {
    if (organizationId && index.organizationId !== organizationId) continue;
    for (const node of index.nodes) {
      if (
        node.title.toLowerCase().includes(q) ||
        node.content.toLowerCase().includes(q) ||
        node.tags.some((t) => t.includes(q))
      ) {
        hits.push(node);
      }
    }
  }

  return hits
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}
