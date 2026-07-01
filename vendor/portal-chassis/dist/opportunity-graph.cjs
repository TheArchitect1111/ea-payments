'use strict';

// lib/opportunity-graph.ts
var OPPORTUNITY_EVENT_MARKERS = [
  "capture",
  "opportunity",
  "ctp",
  "proposal",
  "assessment",
  "apply"
];
function buildOpportunityGraph(input) {
  const nodes = [];
  const edges = [];
  const nodeIds = /* @__PURE__ */ new Set();
  function addNode(node) {
    if (nodeIds.has(node.id)) return;
    nodeIds.add(node.id);
    nodes.push(node);
  }
  function addEdge(edge) {
    edges.push(edge);
  }
  for (const seed of input.seedNodes ?? []) {
    addNode({ ...seed, organizationId: seed.organizationId ?? input.organizationId });
  }
  for (const seed of input.seedEdges ?? []) {
    addEdge(seed);
  }
  const orgId = `org-${slugify(input.organizationId)}`;
  addNode({
    id: orgId,
    label: input.organizationId,
    type: "organization",
    organizationId: input.organizationId
  });
  for (const intent of input.intents ?? []) {
    const intentNodeId = `intent-${intent.id}`;
    addNode({
      id: intentNodeId,
      label: truncate(intent.text, 80),
      type: "intent",
      summary: intent.orchestratorIntent ? `Routed to ${intent.orchestratorIntent}` : `Routed as ${intent.routeType}`,
      href: intent.href,
      organizationId: intent.organizationId,
      score: intent.confidence,
      createdAt: intent.createdAt,
      metadata: {
        routeType: intent.routeType,
        orchestratorIntent: intent.orchestratorIntent,
        rawText: intent.text
      }
    });
    addEdge({
      id: `edge-${intentNodeId}-${orgId}`,
      source: intentNodeId,
      target: orgId,
      relationship: "triggered_by",
      label: "intent for org"
    });
    if (intent.orchestratorIntent) {
      const workflowId = `workflow-${slugify(intent.orchestratorIntent)}`;
      addNode({
        id: workflowId,
        label: humanize(intent.orchestratorIntent),
        type: "action",
        organizationId: intent.organizationId
      });
      addEdge({
        id: `edge-${intentNodeId}-${workflowId}`,
        source: intentNodeId,
        target: workflowId,
        relationship: "suggests",
        weight: intent.confidence
      });
    }
  }
  for (const event of input.events ?? []) {
    if (event.organizationId !== input.organizationId) continue;
    const isOpportunity = OPPORTUNITY_EVENT_MARKERS.some(
      (m) => event.eventType.toLowerCase().includes(m)
    );
    const nodeType = event.eventType.includes("ctp") ? "ctp_submission" : isOpportunity ? event.eventType.includes("capture") ? "capture" : "opportunity" : "action";
    const eventNodeId = `event-${event.id || slugify(`${event.eventType}-${event.createdAt}`)}`;
    addNode({
      id: eventNodeId,
      label: event.title,
      type: nodeType,
      summary: event.summary,
      href: event.actionUrl,
      organizationId: event.organizationId,
      score: event.priority,
      createdAt: event.createdAt,
      metadata: event.metadata
    });
    addEdge({
      id: `edge-${eventNodeId}-${orgId}`,
      source: eventNodeId,
      target: orgId,
      relationship: "relates_to"
    });
    if (event.personId) {
      const personId = `org-${slugify(event.personId)}`;
      addNode({
        id: personId,
        label: event.personId,
        type: "organization",
        organizationId: event.organizationId
      });
      addEdge({
        id: `edge-${eventNodeId}-${personId}`,
        source: eventNodeId,
        target: personId,
        relationship: "refers_to"
      });
    }
    const linkedIntent = readStr(event.metadata.intentId);
    if (linkedIntent) {
      const intentNodeId = `intent-${linkedIntent}`;
      if (nodeIds.has(intentNodeId)) {
        addEdge({
          id: `edge-${intentNodeId}-${eventNodeId}`,
          source: intentNodeId,
          target: eventNodeId,
          relationship: "follows",
          label: "intent led to event"
        });
      }
    }
  }
  const opportunityCount = nodes.filter(
    (n) => ["opportunity", "capture", "ctp_submission"].includes(n.type)
  ).length;
  const intentCount = nodes.filter((n) => n.type === "intent").length;
  return {
    nodes,
    edges,
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      opportunityCount,
      intentCount
    },
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function searchOpportunityGraph(graph, query) {
  const q = query.trim().toLowerCase();
  if (!q) return graph;
  const matchedNodeIds = new Set(
    graph.nodes.filter((n) => {
      const hay = [n.label, n.type, n.summary ?? "", JSON.stringify(n.metadata ?? {})].join(" ").toLowerCase();
      return hay.includes(q);
    }).map((n) => n.id)
  );
  for (const edge of graph.edges) {
    if (matchedNodeIds.has(edge.source)) matchedNodeIds.add(edge.target);
    if (matchedNodeIds.has(edge.target)) matchedNodeIds.add(edge.source);
  }
  const nodes = graph.nodes.filter((n) => matchedNodeIds.has(n.id));
  const nodeIdSet = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter(
    (e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target)
  );
  return {
    nodes,
    edges,
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      opportunityCount: nodes.filter(
        (n) => ["opportunity", "capture", "ctp_submission"].includes(n.type)
      ).length,
      intentCount: nodes.filter((n) => n.type === "intent").length
    },
    generatedAt: graph.generatedAt
  };
}
function linkIntentToOpportunity(graph, intentNodeId, opportunityNodeId, label = "intent surfaced opportunity") {
  const edge = {
    id: `edge-${intentNodeId}-${opportunityNodeId}-suggests`,
    source: intentNodeId,
    target: opportunityNodeId,
    relationship: "suggests",
    label
  };
  return {
    ...graph,
    edges: [...graph.edges, edge],
    stats: {
      ...graph.stats,
      edgeCount: graph.stats.edgeCount + 1
    }
  };
}
function intentToActivityEventInput(intent) {
  return {
    organizationId: intent.organizationId,
    module: "pulse",
    eventType: "intent.resolved",
    title: truncate(intent.text, 120),
    summary: intent.orchestratorIntent ? `Intent routed to ${intent.orchestratorIntent}` : `Intent routed as ${intent.routeType}`,
    priority: Math.round(intent.confidence ?? 50),
    actionUrl: intent.href,
    createdAt: intent.createdAt,
    metadata: {
      category: "agent",
      intentId: intent.id,
      routeType: intent.routeType,
      orchestratorIntent: intent.orchestratorIntent,
      rawText: intent.text,
      graphNodeType: "intent"
    }
  };
}
function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "unknown";
}
function truncate(value, max) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}\u2026`;
}
function humanize(value) {
  return value.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function readStr(value) {
  return typeof value === "string" ? value : "";
}

exports.buildOpportunityGraph = buildOpportunityGraph;
exports.intentToActivityEventInput = intentToActivityEventInput;
exports.linkIntentToOpportunity = linkIntentToOpportunity;
exports.searchOpportunityGraph = searchOpportunityGraph;
//# sourceMappingURL=opportunity-graph.cjs.map
//# sourceMappingURL=opportunity-graph.cjs.map