import { ActivityEventInput } from './activity.js';
import { PlatformEvent } from './platform-events.js';
import './airtable.js';

/**
 * Opportunity Graph — chassis contract linking intents, opportunities,
 * captures, CTP signals, and user actions into one queryable graph.
 *
 * Read path: merge ActivityEvents + optional seed nodes (from knowledge graph).
 * Write path: publish intent/opportunity nodes via ActivityEvents metadata.
 */

type OpportunityNodeType = 'organization' | 'capture' | 'product' | 'partner' | 'proof' | 'proposal' | 'satellite' | 'intent' | 'opportunity' | 'ctp_submission' | 'action';
type OpportunityEdgeType = 'aligned_with' | 'captured_from' | 'refers_to' | 'partner_referred' | 'proof_for' | 'operates' | 'triggered_by' | 'suggests' | 'relates_to' | 'follows';
interface OpportunityGraphNode {
    id: string;
    label: string;
    type: OpportunityNodeType;
    score?: number;
    summary?: string;
    href?: string;
    organizationId?: string;
    metadata?: Record<string, unknown>;
    createdAt?: string;
}
interface OpportunityGraphEdge {
    id: string;
    source: string;
    target: string;
    relationship: OpportunityEdgeType;
    weight?: number;
    label?: string;
}
interface OpportunityGraph {
    nodes: OpportunityGraphNode[];
    edges: OpportunityGraphEdge[];
    stats: {
        nodeCount: number;
        edgeCount: number;
        opportunityCount: number;
        intentCount: number;
    };
    generatedAt: string;
}
interface ResolvedIntentRecord {
    id: string;
    text: string;
    routeType: string;
    orchestratorIntent?: string;
    href?: string;
    confidence?: number;
    organizationId: string;
    createdAt: string;
}
interface OpportunityGraphInput {
    organizationId: string;
    events?: PlatformEvent[];
    seedNodes?: OpportunityGraphNode[];
    seedEdges?: OpportunityGraphEdge[];
    intents?: ResolvedIntentRecord[];
}
/** Build a merged opportunity graph from events, intents, and optional seed data. */
declare function buildOpportunityGraph(input: OpportunityGraphInput): OpportunityGraph;
/** Return a subgraph whose nodes/edges match the query (label, type, summary). */
declare function searchOpportunityGraph(graph: OpportunityGraph, query: string): OpportunityGraph;
/** Immutable append — link a resolved intent to an opportunity node. */
declare function linkIntentToOpportunity(graph: OpportunityGraph, intentNodeId: string, opportunityNodeId: string, label?: string): OpportunityGraph;
/** ActivityEvents write shape when persisting a resolved intent for graph replay. */
declare function intentToActivityEventInput(intent: ResolvedIntentRecord): ActivityEventInput;

export { type OpportunityEdgeType, type OpportunityGraph, type OpportunityGraphEdge, type OpportunityGraphInput, type OpportunityGraphNode, type OpportunityNodeType, type ResolvedIntentRecord, buildOpportunityGraph, intentToActivityEventInput, linkIntentToOpportunity, searchOpportunityGraph };
