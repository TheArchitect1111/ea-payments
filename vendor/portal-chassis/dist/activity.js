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

export { ACTIVITY_EVENTS_TABLE, fromAirtableRecord, listActivityEvents, normalizeActivityEvent, publishActivityEvent };
//# sourceMappingURL=activity.js.map
//# sourceMappingURL=activity.js.map