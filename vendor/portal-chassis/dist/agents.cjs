'use strict';

// lib/airtable-client.ts
var BASE_URL = "https://api.airtable.com/v0";
function headers() {
  const pat = process.env.AIRTABLE_PAT;
  if (!pat) throw new Error("AIRTABLE_PAT is not set");
  return { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" };
}
async function airtableGet(baseId, tableId, params) {
  const url = new URL(`${BASE_URL}/${baseId}/${tableId}`);
  if (params?.filterByFormula) url.searchParams.set("filterByFormula", params.filterByFormula);
  if (params?.maxRecords) url.searchParams.set("maxRecords", String(params.maxRecords));
  params?.fields?.forEach((f) => url.searchParams.append("fields[]", f));
  params?.sort?.forEach((s, i) => {
    url.searchParams.set(`sort[${i}][field]`, s.field);
    url.searchParams.set(`sort[${i}][direction]`, s.direction);
  });
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(`airtableGet ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.records;
}
async function airtableCreate(baseId, tableId, fields) {
  const res = await fetch(`${BASE_URL}/${baseId}/${tableId}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ fields })
  });
  if (!res.ok) throw new Error(`airtableCreate ${res.status}: ${await res.text()}`);
  return res.json();
}

// lib/activity-events.ts
var ACTIVITY_EVENTS_TABLE = "ActivityEvents";
function normalizeActivityEvent(input, id = "") {
  return {
    id,
    organizationId: input.organizationId,
    module: input.module,
    eventType: input.eventType,
    title: input.title,
    summary: input.summary,
    priority: clampScore(input.priority ?? 0),
    metric: input.metric,
    actionLabel: input.actionLabel,
    actionUrl: input.actionUrl,
    personId: input.personId,
    createdAt: input.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    metadata: input.metadata ?? {}
  };
}
async function publishActivityEvent(baseId, tableId = ACTIVITY_EVENTS_TABLE, input) {
  const event = normalizeActivityEvent(input);
  const record = await airtableCreate(baseId, tableId, toAirtableFields(event));
  return fromAirtableRecord(record);
}
async function listActivityEvents(baseId, tableId = ACTIVITY_EVENTS_TABLE, options = {}) {
  const filters = [
    options.organizationId ? `{organizationId} = '${escapeFormulaValue(options.organizationId)}'` : "",
    options.module ? `{module} = '${escapeFormulaValue(options.module)}'` : ""
  ].filter(Boolean);
  const records = await airtableGet(baseId, tableId, {
    filterByFormula: filters.length === 1 ? filters[0] : filters.length > 1 ? `AND(${filters.join(", ")})` : void 0,
    maxRecords: options.maxRecords ?? 100,
    sort: [{ field: "createdAt", direction: "desc" }]
  });
  return records.map(fromAirtableRecord);
}
function fromAirtableRecord(record) {
  const fields = record.fields;
  return normalizeActivityEvent(
    {
      organizationId: readString(fields.organizationId),
      module: readString(fields.module),
      eventType: readString(fields.eventType),
      title: readString(fields.title),
      summary: readString(fields.summary),
      priority: readNumber(fields.priority),
      metric: readOptionalString(fields.metric),
      actionLabel: readOptionalString(fields.actionLabel),
      actionUrl: readOptionalString(fields.actionUrl),
      personId: readOptionalString(fields.personId),
      createdAt: readOptionalString(fields.createdAt) ?? record.createdTime,
      metadata: readMetadata(fields.metadata)
    },
    record.id
  );
}
function toAirtableFields(event) {
  return {
    organizationId: event.organizationId,
    module: event.module,
    eventType: event.eventType,
    priority: event.priority,
    title: event.title,
    summary: event.summary,
    metric: event.metric,
    actionLabel: event.actionLabel,
    actionUrl: event.actionUrl,
    personId: event.personId,
    createdAt: event.createdAt,
    metadata: JSON.stringify(event.metadata)
  };
}
function clampScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
function escapeFormulaValue(value) {
  return value.replace(/'/g, "\\'");
}
function readString(value) {
  return typeof value === "string" ? value : "";
}
function readOptionalString(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function readNumber(value) {
  return typeof value === "number" ? value : void 0;
}
function readMetadata(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

// lib/platform-events.ts
function fromActivityEvent(event) {
  const source = event.module === "agent" || event.metadata.agentKind ? "agent" : event.metadata.source === "pulse" ? "pulse" : "activity";
  return enrichPlatformEvent(event, source, inferCategory(event));
}
function enrichPlatformEvent(event, source, category) {
  const why = readStr(event.metadata.whyRecommended) || readStr(event.metadata.recommendationReason) || buildDefaultWhy(event);
  return {
    ...event,
    source,
    category,
    whyRecommended: why || void 0
  };
}
function inferCategory(event) {
  if (event.module === "agent" || event.metadata.agentKind) return "agent";
  if (event.metadata.continueUrl || event.eventType.toLowerCase().includes("continue")) {
    return "continue";
  }
  if (event.metadata.momentum) return "momentum";
  if (event.priority >= 60) return "attention";
  return "activity";
}
function buildDefaultWhy(event) {
  const due = event.metadata.dueDate;
  if (typeof due === "string") {
    return `Prioritized because the deadline is ${new Date(due).toLocaleDateString()}.`;
  }
  if (event.priority >= 80) {
    return "Prioritized because this is high-impact work that needs a decision soon.";
  }
  return void 0;
}
function readStr(value) {
  return typeof value === "string" ? value : "";
}

// lib/agent-events.ts
var EA_AGENT_REGISTRY = [
  { kind: "research", label: "Research Agent", description: "Finds opportunities and context" },
  { kind: "proposal", label: "Proposal Agent", description: "Drafts client proposals" },
  { kind: "qa", label: "QA Agent", description: "Tests deployments and flows" },
  { kind: "training", label: "Training Agent", description: "Builds courses and guides" },
  { kind: "content", label: "Content Agent", description: "Prepares newsletters and posts" },
  { kind: "launch", label: "Launch Agent", description: "Runs launch verification" },
  { kind: "deployment", label: "Deployment Agent", description: "Coordinates releases" }
];
async function publishAgentRun(baseId, tableId = ACTIVITY_EVENTS_TABLE, input) {
  const status = input.status ?? "running";
  const progress = clamp(input.progress ?? (status === "completed" ? 100 : 10), 0, 100);
  const label = EA_AGENT_REGISTRY.find((a) => a.kind === input.agentKind)?.label ?? input.agentKind;
  const record = await publishActivityEvent(baseId, tableId, {
    organizationId: input.organizationId,
    module: "agent",
    eventType: `agent.${status}`,
    title: `${label}: ${input.task}`,
    summary: statusSummary(status, input.task, progress),
    priority: status === "review_required" ? 95 : status === "running" ? 70 : 50,
    metric: `${progress}%`,
    actionLabel: status === "review_required" ? "Review" : "Open",
    actionUrl: input.actionUrl,
    personId: input.clientSlug,
    metadata: {
      agentKind: input.agentKind,
      agentStatus: status,
      task: input.task,
      progress,
      estimatedCompletion: input.estimatedCompletion,
      reviewRequired: input.reviewRequired ?? status === "review_required",
      clientSlug: input.clientSlug,
      projectId: input.projectId,
      category: "agent",
      source: "agent",
      ...input.metadata
    }
  });
  return toAgentRun(record);
}
async function listAgentRuns(baseId, tableId = ACTIVITY_EVENTS_TABLE, organizationId, maxRecords = 20) {
  const events = await listActivityEvents(baseId, tableId, {
    organizationId,
    module: "agent",
    maxRecords
  });
  return events.map(toAgentRun);
}
function toAgentRun(event) {
  const platform = fromActivityEvent(event);
  const meta = event.metadata;
  return {
    ...platform,
    source: "agent",
    category: "agent",
    agentKind: readStr2(meta.agentKind) || "research",
    status: readStr2(meta.agentStatus) || "running",
    task: readStr2(meta.task) || event.title,
    progress: clamp(readNum(meta.progress) ?? 0, 0, 100),
    estimatedCompletion: readStr2(meta.estimatedCompletion) || void 0,
    reviewRequired: Boolean(meta.reviewRequired) || meta.agentStatus === "review_required"
  };
}
function isActiveAgent(run) {
  return run.status === "running" || run.status === "queued" || run.status === "review_required";
}
function statusSummary(status, task, progress) {
  switch (status) {
    case "review_required":
      return `${task} \u2014 ready for your review`;
    case "completed":
      return `${task} \u2014 completed`;
    case "failed":
      return `${task} \u2014 needs attention`;
    case "paused":
      return `${task} \u2014 paused at ${progress}%`;
    case "queued":
      return `${task} \u2014 queued`;
    default:
      return `${task} \u2014 ${progress}% complete`;
  }
}
function readStr2(value) {
  return typeof value === "string" ? value : "";
}
function readNum(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

exports.EA_AGENT_REGISTRY = EA_AGENT_REGISTRY;
exports.isActiveAgent = isActiveAgent;
exports.listAgentRuns = listAgentRuns;
exports.publishAgentRun = publishAgentRun;
exports.toAgentRun = toAgentRun;
//# sourceMappingURL=agents.cjs.map
//# sourceMappingURL=agents.cjs.map