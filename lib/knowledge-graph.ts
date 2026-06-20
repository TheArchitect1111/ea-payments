import type { CaptureRecord } from './capture-records';
import type { ProposalWithAssessment } from './airtable';
import type { OpportunityRecord } from './partner-network';
import type { PartnerRecord } from './airtable';
import { PROOF_LIBRARY } from './proof-library';

export type GraphNodeType =
  | 'organization'
  | 'capture'
  | 'product'
  | 'partner'
  | 'proof'
  | 'proposal'
  | 'satellite';

export type GraphRelationship =
  | 'aligned_with'
  | 'captured_from'
  | 'refers_to'
  | 'similar_to'
  | 'partner_referred'
  | 'proof_for'
  | 'operates';

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  score?: number;
  meta?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: GraphRelationship;
  label?: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    nodeCount: number;
    edgeCount: number;
    topProducts: string[];
  };
  generatedAt: string;
}

const SATELLITE_HUBS = [
  { id: 'sat-cpr', label: 'CPR', href: 'https://cpr-site.vercel.app', products: ['Amplifi', 'CPR'] },
  { id: 'sat-brotherhub', label: 'BrotherHub', href: 'https://brother-hub.vercel.app', products: ['Community Hub', 'BrotherHub'] },
  { id: 'sat-sisterhub', label: 'SisterHub', href: 'https://sister-hub.vercel.app', products: ['Community Hub', 'SisterHub'] },
  { id: 'sat-ea', label: 'EA Payments', href: 'https://ea-payments.vercel.app', products: ['Mission Control', 'Simplifi'] },
];

const CORE_PRODUCTS = [
  'Magnifi',
  'Simplifi',
  'Pulse',
  'Amplifi',
  'Mission Control',
  'Community Hub',
  'Update Hub',
  'Training Transformation',
  'Resource Radar',
  'EA Capture Engine',
];

export function buildKnowledgeGraph(input: {
  captures: CaptureRecord[];
  proposals: ProposalWithAssessment[];
  partners: PartnerRecord[];
  opportunities: OpportunityRecord[];
}): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();

  function addNode(node: GraphNode) {
    if (nodeIds.has(node.id)) return;
    nodeIds.add(node.id);
    nodes.push(node);
  }

  function addEdge(edge: GraphEdge) {
    edges.push(edge);
  }

  for (const product of CORE_PRODUCTS) {
    addNode({ id: `product-${product.toLowerCase().replace(/\s+/g, '-')}`, label: product, type: 'product' });
  }

  for (const hub of SATELLITE_HUBS) {
    addNode({ id: hub.id, label: hub.label, type: 'satellite', meta: hub.href });
    for (const product of hub.products) {
      const productId = `product-${product.toLowerCase().replace(/\s+/g, '-')}`;
      addEdge({
        id: `${hub.id}-${productId}`,
        source: hub.id,
        target: productId,
        relationship: 'operates',
        label: 'uses',
      });
    }
  }

  for (const proof of PROOF_LIBRARY) {
    addNode({
      id: `proof-${proof.id}`,
      label: proof.title,
      type: 'proof',
      meta: proof.pattern,
    });
    for (const product of proof.products) {
      const productId = `product-${product.toLowerCase().replace(/\s+/g, '-')}`;
      addEdge({
        id: `proof-${proof.id}-${productId}`,
        source: `proof-${proof.id}`,
        target: productId,
        relationship: 'proof_for',
      });
    }
  }

  for (const capture of input.captures) {
    const captureId = `capture-${capture.id}`;
    addNode({
      id: captureId,
      label: capture.title.slice(0, 60),
      type: 'capture',
      score: capture.eaFitScore,
      meta: capture.category,
    });

    if (capture.sourceUrl) {
      try {
        const urlId = `url-${slug(capture.sourceUrl)}`;
        addNode({
          id: urlId,
          label: new URL(capture.sourceUrl).hostname,
          type: 'capture',
          meta: capture.sourceUrl,
        });
        addEdge({
          id: `${captureId}-${urlId}`,
          source: captureId,
          target: urlId,
          relationship: 'captured_from',
        });
      } catch {
        /* skip invalid URL */
      }
    }

    for (const product of capture.productAlignment ?? []) {
      const productId = `product-${product.toLowerCase().replace(/\s+/g, '-')}`;
      addNode({ id: productId, label: product, type: 'product' });
      addEdge({
        id: `${captureId}-${productId}`,
        source: captureId,
        target: productId,
        relationship: 'aligned_with',
      });
    }

    const orgKey = capture.title.split(/[|\-–—]/)[0]?.trim().slice(0, 40) || capture.title.slice(0, 40);
    const orgId = `org-${slug(orgKey)}`;
    addNode({ id: orgId, label: orgKey, type: 'organization', score: capture.opportunityScore });
    addEdge({
      id: `${orgId}-${captureId}`,
      source: orgId,
      target: captureId,
      relationship: 'refers_to',
    });
  }

  for (const proposal of input.proposals.slice(0, 30)) {
    const propId = `proposal-${proposal.id}`;
    addNode({
      id: propId,
      label: proposal.businessName || proposal.contactName,
      type: 'proposal',
      score: proposal.capacityScore,
      meta: proposal.status,
    });

    const orgId = `org-${slug(proposal.businessName || proposal.contactName)}`;
    addNode({ id: orgId, label: proposal.businessName || proposal.contactName, type: 'organization' });
    addEdge({
      id: `${orgId}-${propId}`,
      source: orgId,
      target: propId,
      relationship: 'refers_to',
    });

    const productLabel = proposal.projectTypeLabel || 'Simplifi';
    const productId = `product-simplifi`;
    addEdge({
      id: `${propId}-simplifi`,
      source: propId,
      target: productId,
      relationship: 'aligned_with',
    });
  }

  for (const partner of input.partners) {
    const partnerId = `partner-${slug(partner.partnerName)}`;
    addNode({
      id: partnerId,
      label: partner.partnerName,
      type: 'partner',
      meta: partner.status,
    });
  }

  for (const opp of input.opportunities.slice(0, 20)) {
    const partnerId = `partner-${slug(opp.partnerName)}`;
    addNode({ id: partnerId, label: opp.partnerName, type: 'partner' });
    const orgId = `org-${slug(opp.referralOrganization || opp.opportunityName)}`;
    if (opp.referralOrganization) {
      addNode({ id: orgId, label: opp.referralOrganization, type: 'organization' });
      addEdge({
        id: `${partnerId}-${orgId}`,
        source: partnerId,
        target: orgId,
        relationship: 'partner_referred',
        label: opp.status,
      });
    }
  }

  const productCounts = new Map<string, number>();
  for (const edge of edges) {
    if (edge.relationship === 'aligned_with' || edge.relationship === 'proof_for') {
      const node = nodes.find((n) => n.id === edge.target);
      if (node?.type === 'product') {
        productCounts.set(node.label, (productCounts.get(node.label) ?? 0) + 1);
      }
    }
  }

  const topProducts = [...productCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  return {
    nodes,
    edges,
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      topProducts,
    },
    generatedAt: new Date().toISOString(),
  };
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'unknown';
}

export function searchGraph(
  graph: KnowledgeGraph,
  query: string
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const q = query.toLowerCase().trim();
  if (!q) return { nodes: graph.nodes.slice(0, 20), edges: [] };

  const nodes = graph.nodes.filter(
    (n) =>
      n.label.toLowerCase().includes(q) ||
      n.type.includes(q) ||
      n.meta?.toLowerCase().includes(q)
  );

  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => nodeIds.has(e.source) || nodeIds.has(e.target));

  return { nodes, edges };
}
