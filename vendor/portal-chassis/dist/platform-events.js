// lib/activity-events.ts
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
function clampScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

// lib/platform-events.ts
var PULSE_TYPE_IMPORTANCE = {
  "assessment.submitted": 70,
  "payment.received": 85,
  "portal.login": 40,
  "apply.submitted": 75,
  "capture.completed": 55,
  "launch.verification.completed": 90,
  "missed follow-up": 100
};
function fromPulseAirtableRecord(record) {
  const fields = record.fields;
  const row = {
    id: record.id,
    organizationId: readStr(fields.organizationId) || readStr(fields.Organization) || "ea",
    clientSlug: readStr(fields.clientSlug) || readStr(fields.ClientSlug),
    eventType: readStr(fields.eventType) || readStr(fields.Type) || readStr(fields.type),
    title: readStr(fields.title) || readStr(fields.Title),
    summary: readStr(fields.summary) || readStr(fields.Summary) || readStr(fields.description),
    priority: readNum(fields.priority) ?? readNum(fields.Priority),
    module: readStr(fields.module) || readStr(fields.Module),
    metric: readStr(fields.metric),
    actionLabel: readStr(fields.actionLabel),
    actionUrl: readStr(fields.actionUrl),
    personId: readStr(fields.personId) || readStr(fields.clientSlug),
    createdAt: readStr(fields.createdAt) || record.createdTime,
    metadata: readMeta(fields.metadata ?? fields.Metadata ?? fields.payload)
  };
  return fromPulseEventRow(row, record.id);
}
function fromPulseEventRow(row, id = "") {
  const eventType = (row.eventType ?? row.type ?? "pulse.event").toLowerCase();
  const module = row.module ?? inferModuleFromPulseType(eventType);
  const priority = row.priority ?? PULSE_TYPE_IMPORTANCE[eventType] ?? 50;
  const base = normalizeActivityEvent(
    {
      organizationId: row.organizationId ?? "ea",
      module,
      eventType,
      title: row.title ?? humanizeEventType(eventType),
      summary: row.summary ?? row.description ?? "",
      priority,
      metric: row.metric,
      actionLabel: row.actionLabel,
      actionUrl: row.actionUrl,
      personId: row.personId ?? row.clientSlug ?? row.clientId,
      createdAt: row.createdAt,
      metadata: {
        ...typeof row.metadata === "object" ? row.metadata : {},
        source: "pulse",
        clientSlug: row.clientSlug
      }
    },
    id
  );
  return enrichPlatformEvent(base, "pulse", inferCategory(base));
}
function fromActivityEvent(event) {
  const source = event.module === "agent" || event.metadata.agentKind ? "agent" : event.metadata.source === "pulse" ? "pulse" : "activity";
  return enrichPlatformEvent(event, source, inferCategory(event));
}
function toActivityEventInput(event) {
  return {
    organizationId: event.organizationId,
    module: event.module,
    eventType: event.eventType,
    title: event.title,
    summary: event.summary,
    priority: event.priority,
    metric: event.metric,
    actionLabel: event.actionLabel,
    actionUrl: event.actionUrl,
    personId: event.personId,
    createdAt: event.createdAt,
    metadata: {
      ...event.metadata,
      source: event.source,
      category: event.category,
      whyRecommended: event.whyRecommended
    }
  };
}
function mergeEventStreams(activity, pulse = []) {
  const seen = /* @__PURE__ */ new Set();
  const merged = [];
  for (const event of [...pulse, ...activity.map(fromActivityEvent)]) {
    const key = event.id || `${event.eventType}:${event.createdAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(event);
  }
  return merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
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
function inferModuleFromPulseType(eventType) {
  if (eventType.includes("capture")) return "simplifi";
  if (eventType.includes("apply")) return "portal";
  if (eventType.includes("payment") || eventType.includes("launch")) return "pulse";
  if (eventType.includes("assessment")) return "simplifi";
  return "pulse";
}
function humanizeEventType(eventType) {
  return eventType.split(/[._]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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
function readNum(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function readMeta(value) {
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

export { fromActivityEvent, fromPulseAirtableRecord, fromPulseEventRow, mergeEventStreams, toActivityEventInput };
//# sourceMappingURL=platform-events.js.map
//# sourceMappingURL=platform-events.js.map