/**
 * EA Opportunity Graph — merges knowledge graph seed data, ActivityEvents,
 * and persisted intent resolutions into the chassis opportunity graph contract.
 */

import {
  buildOpportunityGraph,
  searchOpportunityGraph,
  type OpportunityEdgeType,
  type OpportunityGraph,
  type OpportunityGraphNode,
  type OpportunityNodeType,
  type ResolvedIntentRecord,
} from '@ea/portal-chassis/opportunity-graph';
import { fromActivityEvent } from '@ea/portal-chassis/platform-events';
import type { ActivityEvent } from '@ea/portal-chassis/activity';
import { getCaptures } from './capture-records';
import { getProposalsWithAssessments, getPartnerRecords } from './airtable';
import { getOpportunities } from './partner-network';
import { buildKnowledgeGraph, type KnowledgeGraph } from './knowledge-graph';
import { listEAActivityEvents } from './ea-activity-events';

const EA_ORG = 'ea';

function knowledgeGraphToSeed(kg: KnowledgeGraph): {
  seedNodes: OpportunityGraphNode[];
  seedEdges: Array<{
    id: string;
    source: string;
    target: string;
    relationship: OpportunityEdgeType;
    label?: string;
  }>;
} {
  return {
    seedNodes: kg.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type as OpportunityNodeType,
      score: n.score,
      summary: n.meta,
      organizationId: EA_ORG,
    })),
    seedEdges: kg.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      relationship: e.relationship as OpportunityEdgeType,
      label: e.label,
    })),
  };
}

function intentsFromActivity(events: ActivityEvent[]): ResolvedIntentRecord[] {
  return events
    .filter((e) => e.eventType === 'intent.resolved')
    .map((e) => ({
      id: readStr(e.metadata.intentId) || e.id,
      text: readStr(e.metadata.rawText) || e.title,
      routeType: readStr(e.metadata.routeType) || 'unknown',
      orchestratorIntent: readStr(e.metadata.orchestratorIntent) || undefined,
      href: e.actionUrl,
      confidence: e.priority,
      organizationId: e.organizationId,
      createdAt: e.createdAt,
    }));
}

export async function buildEAOpportunityGraph(query?: string): Promise<OpportunityGraph> {
  const [captures, proposals, partners, opportunities, activity] = await Promise.all([
    getCaptures(50),
    getProposalsWithAssessments(),
    getPartnerRecords(),
    getOpportunities(),
    listEAActivityEvents(100),
  ]);

  const kg = buildKnowledgeGraph({ captures, proposals, partners, opportunities });
  const { seedNodes, seedEdges } = knowledgeGraphToSeed(kg);
  const platformEvents = activity.map(fromActivityEvent);

  let graph = buildOpportunityGraph({
    organizationId: EA_ORG,
    events: platformEvents,
    seedNodes,
    seedEdges,
    intents: intentsFromActivity(activity),
  });

  if (query?.trim()) {
    graph = searchOpportunityGraph(graph, query.trim());
  }

  return graph;
}

function readStr(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
