// lib/bricks/module-install.ts
import { z as z5 } from "zod";

// lib/calendar/nylas.ts
function eventToPortal(event) {
  const when = event.when;
  if (!event.id || !when) return null;
  const allDay = when.object === "date" || when.object === "datespan";
  const start = allDay ? when.date || when.start_date : when.start_time ? new Date(when.start_time * 1e3).toISOString() : void 0;
  const end = allDay ? when.end_date : when.end_time ? new Date(when.end_time * 1e3).toISOString() : void 0;
  if (!start) return null;
  return {
    id: event.id,
    title: event.title?.trim() || "Calendar event",
    start,
    end,
    allDay,
    location: event.location?.trim() || void 0,
    description: event.description?.trim() || void 0
  };
}
async function listPortalNylasEvents(input) {
  const apiKey = process.env.NYLAS_API_KEY?.trim();
  if (!apiKey) throw new Error("NYLAS_API_KEY is not configured.");
  const base = process.env.NYLAS_API_URI?.trim() || "https://api.us.nylas.com";
  const url = new URL(`/v3/grants/${encodeURIComponent(input.grantId)}/events`, base);
  url.searchParams.set("calendar_id", input.calendarId);
  url.searchParams.set("start", String(Math.floor(input.start.getTime() / 1e3)));
  url.searchParams.set("end", String(Math.floor(input.end.getTime() / 1e3)));
  url.searchParams.set("limit", "200");
  const response = await fetch(url, {
    headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15e3)
  });
  if (!response.ok) {
    console.error("[portal-calendar] Nylas list failed", { status: response.status });
    throw new Error("Nylas calendar request failed.");
  }
  const payload = await response.json();
  return (payload.data ?? []).map(eventToPortal).filter((event) => event !== null);
}

// lib/calendar/storage.ts
import { z as z2 } from "zod";

// lib/bricks/durable.ts
import { createHash as createHash2 } from "node:crypto";

// ports:@/lib/creative-studio/persistence
var db = () => globalThis.__chassisTest;
async function saveStudioRecord(row) {
  db().writes.push(row.id);
  if (db().durable) db().records.set(row.recordType + ":" + row.id, structuredClone(row.payload));
  return { ok: true, persistedToAirtable: db().durable };
}
async function loadStudioRecordFromAirtable(type, id2) {
  return structuredClone(db().records.get(type + ":" + id2) ?? null);
}

// lib/portal-universal/bricks/amanda/index.ts
import { createHash } from "node:crypto";
import { z } from "zod";
var AMANDA_BRICK_MODULES = ["member", "training", "billing", "intake", "applications", "reports", "messaging", "settings"];
var AmandaInstallSchema = z.object({
  brandName: z.string().trim().min(1).max(120),
  confirmationSubject: z.string().trim().min(1).max(200),
  confirmationHtml: z.string().min(1).max(2e4),
  offers: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]{1,80}$/),
    title: z.string().trim().min(1).max(200),
    amount: z.number().int().positive(),
    currency: z.string().regex(/^[a-z]{3}$/)
  }).strict()).min(1).max(100)
}).strict().superRefine((config, ctx) => {
  if (new Set(config.offers.map((x) => x.id)).size !== config.offers.length)
    ctx.addIssue({ code: "custom", message: "Offer IDs must be unique" });
});
var hash = (value) => createHash("sha256").update(value).digest("hex");
function assertBrickTenant(tenant) {
  if (!/^rec[a-zA-Z0-9]+$/.test(tenant.organizationId) || !/^[a-z0-9-]+$/.test(tenant.portalSlug))
    throw new Error("Persisted tenant identity required");
}
function installId(tenant) {
  assertBrickTenant(tenant);
  return "amanda-install-" + hash(tenant.organizationId);
}
async function durable(tenant, id2, payload) {
  const saved = await saveStudioRecord({
    recordType: "experience",
    id: id2,
    organizationId: tenant.organizationId,
    title: "Enrollment service",
    payload
  });
  if (!saved.ok || !saved.persistedToAirtable) throw new Error("Enrollment durable write failed");
}
async function installAmandaBrick(tenant, input) {
  const config = AmandaInstallSchema.parse(input);
  await durable(tenant, installId(tenant), { ...tenant, brickId: "amanda", version: 1, config });
  return loadAmandaInstall(tenant);
}
async function loadAmandaInstall(tenant) {
  const row = await loadStudioRecordFromAirtable("experience", installId(tenant));
  if (!row || row.organizationId !== tenant.organizationId || row.portalSlug !== tenant.portalSlug)
    throw new Error("Enrollment service is not installed for this tenant");
  return AmandaInstallSchema.parse(row.config);
}
async function readAmandaRegistration(tenant, id2) {
  assertBrickTenant(tenant);
  if (!/^[a-f0-9]{64}$/.test(id2)) throw new Error("Invalid registration");
  const row = await loadStudioRecordFromAirtable("experience", "enrollment-" + id2);
  if (!row || row.organizationId !== tenant.organizationId || row.portalSlug !== tenant.portalSlug)
    throw new Error("Matching tenant registration not found");
  return row;
}
async function signupAmandaBrick(tenant, input) {
  const config = await loadAmandaInstall(tenant);
  const data = z.object({
    email: z.string().email().transform((s) => s.trim().toLowerCase()),
    name: z.string().trim().min(1).max(200),
    offerId: z.string()
  }).strict().parse(input);
  if (!config.offers.some((x) => x.id === data.offerId)) throw new Error("Unknown offer");
  const id2 = hash(JSON.stringify([tenant.organizationId, data.email, data.offerId]));
  const previous = await loadStudioRecordFromAirtable("experience", "enrollment-" + id2);
  if (previous && (previous.organizationId !== tenant.organizationId || previous.portalSlug !== tenant.portalSlug))
    throw new Error("Registration tenant mismatch");
  const row = previous ?? { ...tenant, ...data, registration_id: id2, payment_status: "unpaid", payment_reference: null };
  await durable(tenant, "enrollment-" + id2, row);
  await durable(tenant, "enrollment-signup-" + id2, { ...row, event_type: "signup" });
  return readAmandaRegistration(tenant, id2);
}
async function payAmandaBrick(tenant, id2, reference, ports) {
  const config = await loadAmandaInstall(tenant);
  const row = await readAmandaRegistration(tenant, id2);
  const offer = config.offers.find((x) => x.id === row.offerId);
  const payment = await ports.verify(reference);
  if (!offer || !payment.paid || payment.reference !== reference || payment.organizationId !== tenant.organizationId || payment.registrationId !== id2 || payment.offerId !== row.offerId || payment.amount !== offer.amount || payment.currency !== offer.currency)
    throw new Error("Verified matching payment required");
  if (row.payment_reference && row.payment_reference !== reference) throw new Error("Conflicting payment");
  const next = { ...row, payment_status: "paid", payment_reference: reference };
  await durable(tenant, "enrollment-" + id2, next);
  await durable(tenant, "enrollment-payment-" + id2, { ...next, event_type: "payment_confirmed" });
  if (!next.confirmationSent) {
    const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    await ports.confirm({
      to: row.email,
      subject: config.confirmationSubject.replace(/{{class_name}}/g, offer.title),
      html: config.confirmationHtml.replace(/{{first_name}}/g, escape(row.name.split(/\s+/)[0])).replace(/{{class_name}}/g, escape(offer.title))
    });
    await durable(tenant, "enrollment-" + id2, { ...next, confirmationSent: true });
  }
  return readAmandaRegistration(tenant, id2);
}

// lib/bricks/durable.ts
var brickHash = (value) => createHash2("sha256").update(JSON.stringify(value)).digest("hex");
async function readBrickRecord(tenant, id2) {
  assertBrickTenant(tenant);
  const row = await loadStudioRecordFromAirtable("experience", id2);
  if (row && (row.organizationId !== tenant.organizationId || row.portalSlug !== tenant.portalSlug)) throw new Error("Brick record tenant mismatch");
  return row;
}
async function writeBrickRecord(tenant, id2, row) {
  assertBrickTenant(tenant);
  if (row.organizationId !== tenant.organizationId || row.portalSlug !== tenant.portalSlug) throw new Error("Brick write tenant mismatch");
  const result = await saveStudioRecord({ recordType: "experience", id: id2, organizationId: tenant.organizationId, title: "Tenant brick record", payload: row });
  if (!result.ok || !result.persistedToAirtable) throw new Error("Brick durable write failed");
  const actual = await readBrickRecord(tenant, id2);
  if (!actual || JSON.stringify(actual) !== JSON.stringify(row)) throw new Error("Brick durable read-back mismatch");
  return actual;
}

// lib/calendar/storage.ts
var CalendarConfig = z2.discriminatedUnion("provider", [
  z2.object({ provider: z2.literal("internal") }).strict(),
  z2.object({ provider: z2.literal("nylas"), grantId: z2.string().trim().min(1).max(200), calendarId: z2.string().trim().min(1).max(200) }).strict()
]);
var installKey = (tenant) => "calendar-install-" + brickHash(tenant.organizationId);
async function installCalendar(tenant, input = { provider: "internal" }) {
  const config = CalendarConfig.parse(input);
  if (config.provider === "nylas") await listPortalNylasEvents({ ...config, start: /* @__PURE__ */ new Date(), end: new Date(Date.now() + 864e5) });
  await writeBrickRecord(tenant, installKey(tenant), { ...tenant, version: 2, config });
  if (config.provider === "internal" && !await readBrickRecord(tenant, "calendar-events-" + brickHash(tenant.organizationId)))
    await writeBrickRecord(tenant, "calendar-events-" + brickHash(tenant.organizationId), { ...tenant, events: [] });
}
var Event = z2.object({
  id: z2.string().regex(/^[a-zA-Z0-9-]{1,100}$/),
  title: z2.string().trim().min(1).max(200),
  start: z2.string().datetime(),
  end: z2.string().datetime().optional(),
  allDay: z2.boolean().default(false),
  location: z2.string().max(200).optional(),
  description: z2.string().max(2e3).optional()
}).strict().refine((x) => !x.end || new Date(x.end) > new Date(x.start), "Event end must follow start");

// lib/discovery/storage.ts
import { z as z3 } from "zod";

// lib/analysis-engine.ts
var OPERATIONAL_CHALLENGES = [
  { id: "manual_scheduling", label: "Manual scheduling and booking" },
  { id: "no_client_database", label: "No centralized client or customer database" },
  { id: "inconsistent_follow_up", label: "Inconsistent follow-up with leads or clients" },
  { id: "manual_invoicing", label: "Manual invoicing or billing processes" },
  { id: "disconnected_systems", label: "Disconnected systems requiring duplicate data entry" },
  { id: "no_centralized_reporting", label: "No centralized reporting or performance dashboards" },
  { id: "leadership_lacks_visibility", label: "Leadership lacks real-time operational data" },
  { id: "manual_data_entry", label: "Manual data entry between multiple tools" },
  { id: "inconsistent_communication", label: "Inconsistent client or customer communication" },
  { id: "manual_onboarding", label: "Manual onboarding or offboarding processes" },
  { id: "compliance_reporting", label: "Compliance or regulatory reporting done manually" },
  { id: "vendor_management_manual", label: "Vendor or supplier management in spreadsheets" },
  { id: "team_scaling_issues", label: "Difficulty scaling operations with team growth" },
  { id: "no_sops", label: "No documented standard operating procedures" },
  { id: "project_tracking_gaps", label: "Project or task tracking gaps" }
];

// ports:@/lib/ea-auth-email
async function sendAuthEmail() {
  globalThis.__chassisTest.confirmations++;
  return { ok: true };
}

// lib/discovery/storage.ts
var DiscoveryConfig = z3.object({ brandName: z3.string().trim().min(1).max(120).default("Efficiency Architects") }).strict();
var DiscoveryInput = z3.object({
  requestId: z3.string().regex(/^[a-zA-Z0-9-]{8,100}$/),
  name: z3.string().trim().min(1).max(200),
  teamSize: z3.number().int().min(1).max(1e5),
  revenueRange: z3.enum(["under_100k", "100k_500k", "500k_1m", "1m_5m", "5m_plus"]),
  systemsCount: z3.number().int().min(0).max(100),
  operationalChallenges: z3.array(z3.string()).max(15).refine((xs) => xs.every((x) => OPERATIONAL_CHALLENGES.some((c) => c.id === x)), "Unknown challenge"),
  complexity: z3.enum(["low", "medium", "high"]),
  goals: z3.string().trim().max(4e3).default("")
}).strict();
var installKey2 = (t) => "discovery-install-" + brickHash(t.organizationId);
async function installDiscovery(tenant, input = {}) {
  const config = DiscoveryConfig.parse(input);
  await writeBrickRecord(tenant, installKey2(tenant), { ...tenant, version: 2, config });
}

// lib/people/errors.ts
var HTTP_STATUS = {
  unavailable: 503,
  conflict: 409,
  // INV-20: an illegal flag combination must look like the module does not exist.
  illegal_flag: 404,
  not_found: 404,
  validation: 400
};
var PeoplePersistError = class extends Error {
  constructor(code, message, options = {}) {
    super(message, options.cause === void 0 ? void 0 : { cause: options.cause });
    this.name = "PeoplePersistError";
    this.code = code;
    this.httpStatus = HTTP_STATUS[code];
    this.retryable = options.retryable ?? (code === "unavailable" || code === "conflict");
    this.details = options.details;
  }
};
function peopleUnavailable(message, details) {
  return new PeoplePersistError("unavailable", message, { retryable: true, details });
}
function peopleConflict(message, details) {
  return new PeoplePersistError("conflict", message, { retryable: true, details });
}
function peopleValidation(message, details) {
  return new PeoplePersistError("validation", message, { retryable: false, details });
}
function peopleIllegalFlag(message) {
  return new PeoplePersistError("illegal_flag", message, { retryable: false });
}

// lib/people/postgres-client.ts
import { createHmac } from "node:crypto";
function base64url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}
function mintPeopleAppJwt(secret) {
  const now = Math.floor(Date.now() / 1e3);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      role: "people_app",
      iss: "supabase",
      iat: now - 30,
      exp: now + 5 * 60
    })
  );
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}
function peopleDbConfig() {
  const url = (process.env.PEOPLE_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || "").replace(/\/$/, "");
  const apiKey = process.env.PEOPLE_SUPABASE_API_KEY?.trim() || process.env.PEOPLE_SUPABASE_ANON_KEY?.trim() || "";
  const jwtSecret = process.env.PEOPLE_SUPABASE_JWT_SECRET?.trim() || "";
  const accessToken = jwtSecret ? mintPeopleAppJwt(jwtSecret) : process.env.PEOPLE_SUPABASE_KEY?.trim() || process.env.PEOPLE_SUPABASE_APP_KEY?.trim() || "";
  if (!url || !apiKey || !accessToken) return null;
  return { url, apiKey, accessToken };
}
function isPeoplePostgresConfigured() {
  return peopleDbConfig() !== null;
}
async function peopleRest(path, init = {}) {
  const cfg = peopleDbConfig();
  if (!cfg) {
    return { ok: false, error: "People Postgres not configured" };
  }
  const headers = new Headers(init.headers);
  headers.set("apikey", cfg.apiKey);
  headers.set("Authorization", `Bearer ${cfg.accessToken}`);
  headers.set("Content-Type", "application/json");
  headers.set("Accept-Profile", "people");
  headers.set("Content-Profile", "people");
  if (init.prefer) headers.set("Prefer", init.prefer);
  if (init.organizationId) {
    headers.set("X-People-Organization-Id", init.organizationId);
  }
  try {
    const res = await fetch(`${cfg.url}/rest/v1/${path.replace(/^\//, "")}`, {
      ...init,
      headers
    });
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!res.ok) {
      const msg = typeof data === "object" && data && "message" in data ? String(data.message) : text || res.statusText;
      return { ok: false, error: msg, status: res.status };
    }
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "People Postgres request failed"
    };
  }
}
async function peopleRpc(fn, args) {
  const cfg = peopleDbConfig();
  if (!cfg) {
    throw peopleUnavailable("People persistence enabled without Postgres credentials");
  }
  return peopleRest(`rpc/${fn}`, {
    method: "POST",
    body: JSON.stringify(args)
  });
}
function assertPeoplePostgresReady() {
  if (!isPeoplePostgresConfigured()) {
    throw peopleUnavailable(
      "People persistence enabled without PEOPLE_SUPABASE_URL / PEOPLE_SUPABASE_API_KEY / People JWT credentials"
    );
  }
}

// lib/people/flags.ts
function envOn(name) {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}
function isUniversalPeopleEnabled() {
  return envOn("UNIVERSAL_PEOPLE");
}
function isUniversalPeoplePersistEnabled() {
  return envOn("UNIVERSAL_PEOPLE_PERSIST");
}
function isPeopleCertMemoryForced() {
  return envOn("PEOPLE_CERT_MEMORY");
}
function isPeopleSharedMemoryEnabled() {
  return envOn("PEOPLE_SHARED_MEMORY");
}
function isPeopleProductionMode() {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv === "production" || vercelEnv === "preview") return true;
  return process.env.NODE_ENV === "production";
}
function isPeopleRuntimeAllowed() {
  if (!isUniversalPeopleEnabled()) return false;
  if (isPeopleProductionMode() && !isUniversalPeoplePersistEnabled()) return false;
  return true;
}
function assertPeoplePersistReady() {
  if (!isUniversalPeoplePersistEnabled()) return;
  if (isPeopleCertMemoryForced() && !isPeopleProductionMode()) return;
  if (!isPeoplePostgresConfigured()) {
    throw peopleUnavailable(
      "People persistence enabled without PEOPLE_SUPABASE_URL / PEOPLE_SUPABASE_KEY"
    );
  }
}

// lib/people/types.ts
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// lib/people/keys.ts
var SEP = "#";
function part(value) {
  return value.trim();
}
function orgPart(organizationId) {
  const org = part(organizationId);
  if (!org) throw new Error("organizationId required for People key derivation");
  return org;
}
function orgEmailKey(organizationId, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error("email required for OrgEmailKey");
  return `${orgPart(organizationId)}${SEP}${normalized}`;
}
function orgExternalKey(organizationId, system, value) {
  const sys = part(String(system)).toLowerCase();
  const val = part(value);
  if (!sys || !val) throw new Error("system and value required for OrgExternalKey");
  return `${orgPart(organizationId)}${SEP}${sys}${SEP}${val}`;
}
function edgeKey(organizationId, fromPersonId, toPersonId, type) {
  return [orgPart(organizationId), part(fromPersonId), part(toPersonId), part(type)].join(SEP);
}
function directoryMembershipKey(organizationId, personId) {
  return `${orgPart(organizationId)}${SEP}${part(personId)}`;
}
function programLinkKey(organizationId, personId, kind, externalRef) {
  return [orgPart(organizationId), part(personId), part(kind), part(externalRef)].join(SEP);
}
function householdMemberKey(householdId, personId) {
  return `${part(householdId)}${SEP}${part(personId)}`;
}
function consentKey(organizationId, personId, purpose) {
  return [orgPart(organizationId), part(personId), part(purpose)].join(SEP);
}
function grantKey(organizationId, resourceType, resourceId, grantee, relation) {
  const granteePart = grantee.kind === "user_email" ? `email:${normalizeEmail(grantee.email)}` : grantee.kind === "person" ? `person:${part(grantee.personId)}` : `role:${part(grantee.role)}`;
  return [
    orgPart(organizationId),
    part(resourceType),
    part(resourceId),
    granteePart,
    part(relation)
  ].join(SEP);
}
function mergeJobKey(organizationId, absorbedPersonId) {
  return `${orgPart(organizationId)}${SEP}${part(absorbedPersonId)}`;
}
function importRowKey(importJobId, rowNumber) {
  return `${part(importJobId)}${SEP}${rowNumber}`;
}
function migrationCheckpointKey(organizationId, jobId) {
  return `${orgPart(organizationId)}${SEP}${part(jobId)}`;
}
function personParticipatesInEmailUniqueness(person) {
  if (person.mergedIntoPersonId) return false;
  return person.lifecycleStatus !== "archived" && person.lifecycleStatus !== "deceased";
}
function personParticipatesInExternalUniqueness(person) {
  return !person.mergedIntoPersonId;
}
function orgEmailKeysForPerson(person) {
  const keys = /* @__PURE__ */ new Set();
  for (const email of person.emails || []) {
    const normalized = normalizeEmail(email.value);
    if (!normalized) continue;
    keys.add(orgEmailKey(person.organizationId, normalized));
  }
  return [...keys];
}
function orgExternalKeysForPerson(person) {
  const keys = /* @__PURE__ */ new Set();
  for (const ext of person.externalIds || []) {
    if (!ext?.system || !ext?.value) continue;
    keys.add(orgExternalKey(person.organizationId, ext.system, ext.value));
  }
  return [...keys];
}

// lib/people/store.ts
import { randomUUID } from "node:crypto";
function emptyStore() {
  return {
    persons: /* @__PURE__ */ new Map(),
    directoryMemberships: /* @__PURE__ */ new Map(),
    households: /* @__PURE__ */ new Map(),
    householdMembers: /* @__PURE__ */ new Map(),
    relationships: /* @__PURE__ */ new Map(),
    programLinks: /* @__PURE__ */ new Map(),
    consents: /* @__PURE__ */ new Map(),
    aclGrants: /* @__PURE__ */ new Map(),
    audit: [],
    emailIndex: /* @__PURE__ */ new Map(),
    externalIndex: /* @__PURE__ */ new Map(),
    personEmailKeys: /* @__PURE__ */ new Map(),
    personExternalKeys: /* @__PURE__ */ new Map(),
    mergeJobs: /* @__PURE__ */ new Map(),
    importJobs: /* @__PURE__ */ new Map(),
    importRowResults: /* @__PURE__ */ new Map(),
    migrationCheckpoints: /* @__PURE__ */ new Map(),
    locks: /* @__PURE__ */ new Map()
  };
}
var SHARED_KEY = "__eaPeopleMemoryStore__";
var localStore = emptyStore();
function store() {
  if (!isPeopleSharedMemoryEnabled()) return localStore;
  const g = globalThis;
  if (!g[SHARED_KEY]) g[SHARED_KEY] = emptyStore();
  return g[SHARED_KEY];
}
function newPeopleId(prefix = "ppl") {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
function withPeopleIdentityLock(key, fn) {
  const locks = store().locks;
  const previous = locks.get(key) ?? Promise.resolve();
  const run = previous.then(
    () => fn(),
    () => fn()
  );
  const chained = run.then(
    () => void 0,
    () => void 0
  );
  locks.set(key, chained);
  void chained.then(() => {
    if (locks.get(key) === chained) locks.delete(key);
  });
  return run;
}
function withPeopleIdentityLocks(keys, fn) {
  const unique = [...new Set(keys.filter((k) => Boolean(k)))].sort();
  if (unique.length === 0) return Promise.resolve().then(fn);
  return unique.reduce(
    (next, key) => () => withPeopleIdentityLock(key, next),
    () => Promise.resolve().then(fn)
  )();
}
function nextTimestamp(previous) {
  const now = Date.now();
  const prev = previous ? new Date(previous).getTime() : 0;
  const next = Number.isFinite(prev) && prev >= now ? prev + 1 : now;
  return new Date(next).toISOString();
}
function releaseIndexes(personId) {
  const s = store();
  for (const key of s.personEmailKeys.get(personId) || []) {
    if (s.emailIndex.get(key) === personId) s.emailIndex.delete(key);
  }
  for (const key of s.personExternalKeys.get(personId) || []) {
    if (s.externalIndex.get(key) === personId) s.externalIndex.delete(key);
  }
  s.personEmailKeys.delete(personId);
  s.personExternalKeys.delete(personId);
}
function reindexPerson(person) {
  const s = store();
  const emailKeys = personParticipatesInEmailUniqueness(person) ? orgEmailKeysForPerson(person) : [];
  const externalKeys = personParticipatesInExternalUniqueness(person) ? orgExternalKeysForPerson(person) : [];
  for (const key of emailKeys) {
    const owner = s.emailIndex.get(key);
    if (owner && owner !== person.id) {
      throw new Error(
        `Duplicate email ${key.slice(key.indexOf("#") + 1)} in org ${person.organizationId}`
      );
    }
  }
  for (const key of externalKeys) {
    const owner = s.externalIndex.get(key);
    if (owner && owner !== person.id) {
      const [, system, value] = key.split("#");
      throw new Error(
        `Duplicate external id ${system}:${value} in org ${person.organizationId}`
      );
    }
  }
  releaseIndexes(person.id);
  s.personEmailKeys.set(person.id, emailKeys);
  s.personExternalKeys.set(person.id, externalKeys);
  for (const key of emailKeys) s.emailIndex.set(key, person.id);
  for (const key of externalKeys) s.externalIndex.set(key, person.id);
}
function createPerson(input) {
  if (!input.organizationId?.trim() || input.organizationId.startsWith("org_")) {
    if (process.env.NODE_ENV === "production" && input.organizationId?.startsWith("org_")) {
      throw new Error("Synthetic org_* not allowed for People writes in production");
    }
  }
  if (!input.organizationId?.trim()) {
    throw new Error("organizationId required");
  }
  for (const email of input.emails || []) {
    if (!normalizeEmail(email?.value || "")) {
      throw peopleValidation("email value required");
    }
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const person = {
    ...input,
    id: input.id || newPeopleId("person"),
    organizationId: input.organizationId.trim(),
    emails: (input.emails || []).map((e) => ({ ...e, value: normalizeEmail(e.value) })),
    phones: input.phones || [],
    createdAt: now,
    updatedAt: now
  };
  reindexPerson(person);
  store().persons.set(person.id, person);
  return { ...person };
}
function updatePerson(personId, patch, options = {}) {
  const s = store();
  const existing = s.persons.get(personId);
  if (!existing) throw new Error("Person not found");
  if (patch && "organizationId" in patch) {
    throw new Error("organizationId is immutable");
  }
  if (options.expectedUpdatedAt && options.expectedUpdatedAt !== existing.updatedAt) {
    throw peopleConflict("Person changed since read", { personId });
  }
  const next = {
    ...existing,
    ...patch,
    id: existing.id,
    organizationId: existing.organizationId,
    emails: patch.emails ? patch.emails.map((e) => ({ ...e, value: normalizeEmail(e.value) })) : existing.emails,
    updatedAt: nextTimestamp(existing.updatedAt)
  };
  reindexPerson(next);
  s.persons.set(personId, next);
  return { ...next };
}
function getPersonById(personId) {
  const p = store().persons.get(personId);
  return p ? { ...p } : null;
}
function listPersonsByOrg(organizationId) {
  return [...store().persons.values()].filter((p) => p.organizationId === organizationId).map((p) => ({ ...p }));
}
function findPersonByExternalId(organizationId, system, value) {
  if (!organizationId?.trim() || !value?.trim()) return null;
  const id2 = store().externalIndex.get(orgExternalKey(organizationId, system, value));
  if (!id2) return null;
  const person = store().persons.get(id2);
  return person ? { ...person } : null;
}
function findPersonByPrimaryEmail(organizationId, email) {
  const target = normalizeEmail(email);
  if (!organizationId?.trim() || !target) return null;
  const id2 = store().emailIndex.get(orgEmailKey(organizationId, target));
  if (!id2) return null;
  const person = store().persons.get(id2);
  return person ? { ...person } : null;
}
function findPersonByOrgEmailKey(key) {
  const id2 = store().emailIndex.get(key);
  if (!id2) return null;
  const person = store().persons.get(id2);
  return person ? { ...person } : null;
}
function findPersonByOrgExternalKey(key) {
  const id2 = store().externalIndex.get(key);
  if (!id2) return null;
  const person = store().persons.get(id2);
  return person ? { ...person } : null;
}
function upsertDirectoryMembership(input) {
  const s = store();
  const key = directoryMembershipKey(input.organizationId, input.personId);
  const existing = [...s.directoryMemberships.values()].find(
    (m) => directoryMembershipKey(m.organizationId, m.personId) === key
  );
  const row = {
    ...input,
    id: existing?.id || input.id || newPeopleId("pdm")
  };
  s.directoryMemberships.set(row.id, row);
  return { ...row };
}
function listDirectoryMembershipsForPerson(personId) {
  return [...store().directoryMemberships.values()].filter((m) => m.personId === personId).map((m) => ({ ...m }));
}
function getDirectoryMembership(organizationId, personId) {
  const m = [...store().directoryMemberships.values()].find(
    (x) => x.organizationId === organizationId && x.personId === personId
  );
  return m ? { ...m } : null;
}
function createHousehold(input) {
  const row = { ...input, id: input.id || newPeopleId("hh") };
  store().households.set(row.id, row);
  return { ...row };
}
function upsertHouseholdMember(input) {
  const s = store();
  const key = householdMemberKey(input.householdId, input.personId);
  const existing = [...s.householdMembers.values()].find(
    (m) => householdMemberKey(m.householdId, m.personId) === key
  );
  const row = { ...input, id: existing?.id || input.id || newPeopleId("hhm") };
  s.householdMembers.set(row.id, row);
  return { ...row };
}
function listHouseholdMembers(householdId) {
  return [...store().householdMembers.values()].filter((m) => m.householdId === householdId).map((m) => ({ ...m }));
}
function listHouseholdMembersForPerson(personId) {
  return [...store().householdMembers.values()].filter((m) => m.personId === personId).map((m) => ({ ...m }));
}
function upsertRelationship(input) {
  const s = store();
  const key = edgeKey(input.organizationId, input.fromPersonId, input.toPersonId, input.type);
  const existing = [...s.relationships.values()].find(
    (r) => edgeKey(r.organizationId, r.fromPersonId, r.toPersonId, r.type) === key
  );
  const row = { ...input, id: existing?.id || input.id || newPeopleId("rel") };
  s.relationships.set(row.id, row);
  return { ...row };
}
function listRelationshipsForOrg(organizationId) {
  return [...store().relationships.values()].filter((r) => r.organizationId === organizationId).map((r) => ({ ...r }));
}
function upsertProgramLink(input) {
  const s = store();
  const key = programLinkKey(input.organizationId, input.personId, input.kind, input.externalRef);
  const existing = [...s.programLinks.values()].find(
    (l) => programLinkKey(l.organizationId, l.personId, l.kind, l.externalRef) === key
  );
  const row = { ...input, id: existing?.id || input.id || newPeopleId("pplnk") };
  s.programLinks.set(row.id, row);
  return { ...row };
}
function listProgramLinks(personId) {
  return [...store().programLinks.values()].filter((l) => l.personId === personId).map((l) => ({ ...l }));
}
function upsertConsent(input) {
  const s = store();
  const key = consentKey(input.organizationId, input.personId, input.purpose);
  const existing = [...s.consents.values()].find(
    (c) => consentKey(c.organizationId, c.personId, c.purpose) === key
  );
  const row = { ...input, id: existing?.id || input.id || newPeopleId("cns") };
  s.consents.set(row.id, row);
  return { ...row };
}
function listConsents(personId) {
  return [...store().consents.values()].filter((c) => c.personId === personId).map((c) => ({ ...c }));
}
function upsertAclGrant(input) {
  const s = store();
  const key = grantKey(
    input.organizationId,
    input.resourceType,
    input.resourceId,
    input.grantee,
    input.relation
  );
  const existing = [...s.aclGrants.values()].find(
    (g) => grantKey(g.organizationId, g.resourceType, g.resourceId, g.grantee, g.relation) === key
  );
  const row = { ...input, id: existing?.id || input.id || newPeopleId("acl") };
  s.aclGrants.set(row.id, row);
  return { ...row };
}
function listAclGrantsForResource(organizationId, resourceType, resourceId) {
  return [...store().aclGrants.values()].filter(
    (g) => g.organizationId === organizationId && g.resourceType === resourceType && g.resourceId === resourceId
  ).map((g) => ({ ...g }));
}
function appendPeopleAudit(input) {
  const event = {
    id: newPeopleId("aud"),
    organizationId: input.organizationId,
    actorEmail: input.actorEmail,
    actorPersonId: input.actorPersonId,
    action: input.action,
    subjectPersonId: input.subjectPersonId,
    at: (/* @__PURE__ */ new Date()).toISOString(),
    meta: input.meta
  };
  store().audit.push(event);
  return { ...event };
}
function listPeopleAudit(organizationId) {
  return store().audit.filter((a) => a.organizationId === organizationId).map((a) => ({ ...a }));
}
function createMergeJobRecord(input) {
  const s = store();
  const key = mergeJobKey(input.organizationId, input.absorbedPersonId);
  const existing = [...s.mergeJobs.values()].find((j) => j.jobKey === key);
  if (existing) return { ...existing, completedSteps: [...existing.completedSteps] };
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const job = {
    id: newPeopleId("mrgjob"),
    organizationId: input.organizationId,
    jobKey: key,
    survivorPersonId: input.survivorPersonId,
    absorbedPersonId: input.absorbedPersonId,
    status: "queued",
    completedSteps: [],
    attempts: 0,
    actorEmail: input.actorEmail,
    meta: input.meta,
    createdAt: now,
    updatedAt: now
  };
  s.mergeJobs.set(job.id, job);
  return { ...job, completedSteps: [] };
}
function getMergeJobRecord(jobId) {
  const job = store().mergeJobs.get(jobId);
  return job ? { ...job, completedSteps: [...job.completedSteps] } : null;
}
function findMergeJobByAbsorbedRecord(organizationId, absorbedPersonId) {
  const key = mergeJobKey(organizationId, absorbedPersonId);
  const job = [...store().mergeJobs.values()].find((j) => j.jobKey === key);
  return job ? { ...job, completedSteps: [...job.completedSteps] } : null;
}
function updateMergeJobRecord(jobId, patch) {
  const s = store();
  const existing = s.mergeJobs.get(jobId);
  if (!existing) throw peopleValidation("Merge job not found");
  const completedSteps = patch.completedStep ? [.../* @__PURE__ */ new Set([...existing.completedSteps, patch.completedStep])] : existing.completedSteps;
  const next = {
    ...existing,
    status: patch.status ?? existing.status,
    completedSteps,
    attempts: patch.attempts ?? existing.attempts,
    lastError: patch.lastError ?? existing.lastError,
    meta: patch.meta ? { ...existing.meta, ...patch.meta } : existing.meta,
    updatedAt: nextTimestamp(existing.updatedAt)
  };
  s.mergeJobs.set(jobId, next);
  return { ...next, completedSteps: [...next.completedSteps] };
}
function createImportJobRecord(input) {
  const s = store();
  const existing = [...s.importJobs.values()].find(
    (j) => j.organizationId === input.organizationId && j.idempotencyKey === input.idempotencyKey
  );
  if (existing) return { ...existing };
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const job = {
    id: newPeopleId("impjob"),
    organizationId: input.organizationId,
    idempotencyKey: input.idempotencyKey,
    source: input.source,
    status: "queued",
    rowCount: input.rowCount,
    okCount: 0,
    failedCount: 0,
    actorEmail: input.actorEmail,
    dryRun: input.dryRun,
    meta: input.meta,
    createdAt: now,
    updatedAt: now
  };
  s.importJobs.set(job.id, job);
  return { ...job };
}
function getImportJobRecord(jobId) {
  const job = store().importJobs.get(jobId);
  return job ? { ...job } : null;
}
function findImportJobByIdempotencyKeyRecord(organizationId, idempotencyKey) {
  const job = [...store().importJobs.values()].find(
    (j) => j.organizationId === organizationId && j.idempotencyKey === idempotencyKey
  );
  return job ? { ...job } : null;
}
function updateImportJobRecord(jobId, patch) {
  const s = store();
  const existing = s.importJobs.get(jobId);
  if (!existing) throw peopleValidation("Import job not found");
  const next = {
    ...existing,
    status: patch.status ?? existing.status,
    okCount: patch.okCount ?? existing.okCount,
    failedCount: patch.failedCount ?? existing.failedCount,
    rowCount: patch.rowCount ?? existing.rowCount,
    lastError: patch.lastError ?? existing.lastError,
    meta: patch.meta ? { ...existing.meta, ...patch.meta } : existing.meta,
    updatedAt: nextTimestamp(existing.updatedAt)
  };
  s.importJobs.set(jobId, next);
  return { ...next };
}
function recordImportRowResultRecord(input) {
  const s = store();
  const rowKey = importRowKey(input.importJobId, input.rowNumber);
  const existing = [...s.importRowResults.values()].find((r) => r.rowKey === rowKey);
  const row = {
    id: existing?.id || newPeopleId("improw"),
    organizationId: input.organizationId,
    importJobId: input.importJobId,
    rowNumber: input.rowNumber,
    rowKey,
    status: input.status,
    personId: input.personId ?? existing?.personId,
    error: input.error,
    createdAt: existing?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
  };
  s.importRowResults.set(row.id, row);
  return { ...row };
}
function listImportRowResultsRecord(importJobId) {
  return [...store().importRowResults.values()].filter((r) => r.importJobId === importJobId).sort((a, b) => a.rowNumber - b.rowNumber).map((r) => ({ ...r }));
}
function saveMigrationCheckpointRecord(input) {
  const s = store();
  const key = migrationCheckpointKey(input.organizationId, input.jobId);
  const existing = [...s.migrationCheckpoints.values()].find((c) => c.checkpointKey === key);
  const row = {
    id: existing?.id || newPeopleId("mchk"),
    organizationId: input.organizationId,
    jobId: input.jobId,
    checkpointKey: key,
    lastClientRecordId: input.lastClientRecordId ?? existing?.lastClientRecordId,
    processed: input.processed,
    created: input.created,
    linked: input.linked,
    status: input.status,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  s.migrationCheckpoints.set(row.id, row);
  return { ...row };
}
function getMigrationCheckpointRecord(organizationId, jobId) {
  const key = migrationCheckpointKey(organizationId, jobId);
  const row = [...store().migrationCheckpoints.values()].find((c) => c.checkpointKey === key);
  return row ? { ...row } : null;
}

// lib/people/memory-repository.ts
var MemoryPeopleRepository = class {
  constructor() {
    this.kind = "memory";
  }
  async createPerson(input) {
    return createPerson(input);
  }
  async updatePerson(personId, patch, options) {
    return updatePerson(personId, patch, options);
  }
  async getPerson(personId) {
    return getPersonById(personId);
  }
  async listPersonsByOrg(organizationId) {
    return listPersonsByOrg(organizationId);
  }
  async findPersonByEmail(organizationId, email) {
    return findPersonByPrimaryEmail(organizationId, email);
  }
  async findPersonByExternalId(organizationId, system, value) {
    return findPersonByExternalId(organizationId, system, value);
  }
  /** ADV-P-1 — serialized per identity key; the loser of the race reads the winner. */
  async upsertPersonByIdentity(input, identity) {
    const emailKey = identity.emailKey || (input.emails?.[0]?.value ? orgEmailKey(input.organizationId, input.emails[0].value) : void 0);
    const externalKey = identity.externalKey || (input.externalIds?.[0] ? orgExternalKey(
      input.organizationId,
      input.externalIds[0].system,
      input.externalIds[0].value
    ) : void 0);
    if (!emailKey && !externalKey) {
      throw peopleValidation("identity key required for upsert");
    }
    return withPeopleIdentityLocks([externalKey, emailKey], () => {
      const existing = (externalKey ? findPersonByOrgExternalKey(externalKey) : null) || (emailKey ? findPersonByOrgEmailKey(emailKey) : null);
      if (existing) return { person: existing, created: false };
      return { person: createPerson(input), created: true };
    });
  }
  async upsertDirectoryMembership(input) {
    return upsertDirectoryMembership(input);
  }
  async getDirectoryMembership(organizationId, personId) {
    return getDirectoryMembership(organizationId, personId);
  }
  async listDirectoryMembershipsForPerson(personId) {
    return listDirectoryMembershipsForPerson(personId);
  }
  async createHousehold(input) {
    return createHousehold(input);
  }
  async upsertHouseholdMember(input) {
    return upsertHouseholdMember(input);
  }
  async listHouseholdMembers(householdId) {
    return listHouseholdMembers(householdId);
  }
  async listHouseholdMembersForPerson(personId) {
    return listHouseholdMembersForPerson(personId);
  }
  async upsertRelationship(input) {
    return upsertRelationship(input);
  }
  async listRelationshipsForOrg(organizationId) {
    return listRelationshipsForOrg(organizationId);
  }
  async upsertProgramLink(input) {
    return upsertProgramLink(input);
  }
  async listProgramLinks(personId) {
    return listProgramLinks(personId);
  }
  async upsertConsent(input) {
    return upsertConsent(input);
  }
  async listConsents(personId) {
    return listConsents(personId);
  }
  async upsertAclGrant(input) {
    return upsertAclGrant(input);
  }
  async listAclGrantsForResource(organizationId, resourceType, resourceId) {
    return listAclGrantsForResource(organizationId, resourceType, resourceId);
  }
  async appendAudit(input) {
    return appendPeopleAudit(input);
  }
  async listAudit(organizationId) {
    return listPeopleAudit(organizationId);
  }
  async createMergeJob(input) {
    return createMergeJobRecord(input);
  }
  async getMergeJob(jobId) {
    return getMergeJobRecord(jobId);
  }
  async findMergeJobByAbsorbed(organizationId, absorbedPersonId) {
    return findMergeJobByAbsorbedRecord(organizationId, absorbedPersonId);
  }
  async updateMergeJob(jobId, patch) {
    return updateMergeJobRecord(jobId, patch);
  }
  async createImportJob(input) {
    if (!input.idempotencyKey?.trim()) {
      throw peopleValidation("idempotencyKey required for import job");
    }
    return createImportJobRecord(input);
  }
  async getImportJob(jobId) {
    return getImportJobRecord(jobId);
  }
  async findImportJobByIdempotencyKey(organizationId, idempotencyKey) {
    return findImportJobByIdempotencyKeyRecord(organizationId, idempotencyKey);
  }
  async updateImportJob(jobId, patch) {
    return updateImportJobRecord(jobId, patch);
  }
  async recordImportRowResult(input) {
    return recordImportRowResultRecord(input);
  }
  async listImportRowResults(importJobId) {
    return listImportRowResultsRecord(importJobId);
  }
  async saveMigrationCheckpoint(input) {
    return saveMigrationCheckpointRecord(input);
  }
  async getMigrationCheckpoint(organizationId, jobId) {
    return getMigrationCheckpointRecord(organizationId, jobId);
  }
};
var instance = null;
function memoryPeopleRepository() {
  if (!instance) instance = new MemoryPeopleRepository();
  return instance;
}

// lib/people/metrics.ts
var counters = /* @__PURE__ */ new Map();
function metricKey(name, label) {
  const safeLabel = (label || "").replace(/[^a-z0-9_.:-]/gi, "").slice(0, 48);
  return safeLabel ? `${name}{${safeLabel}}` : name;
}
function incPeopleMetric(name, label, by = 1) {
  const key = metricKey(name, label);
  counters.set(key, (counters.get(key) || 0) + by);
}

// lib/people/postgres-repository.ts
import { createHash as createHash3, randomUUID as randomUUID2 } from "node:crypto";
function newId(prefix) {
  return `${prefix}_${randomUUID2().replace(/-/g, "").slice(0, 16)}`;
}
function rowToPerson(row) {
  return {
    id: String(row.person_key),
    organizationId: String(row.organization_id),
    portalSlug: row.portal_slug ? String(row.portal_slug) : void 0,
    displayName: String(row.display_name || ""),
    legalName: row.legal_name ? String(row.legal_name) : void 0,
    preferredName: row.preferred_name ? String(row.preferred_name) : void 0,
    emails: row.emails || [],
    phones: row.phones || [],
    dateOfBirth: row.date_of_birth ? String(row.date_of_birth) : void 0,
    isMinor: typeof row.is_minor === "boolean" ? row.is_minor : void 0,
    externalIds: row.external_ids || [],
    lifecycleStatus: row.lifecycle_status,
    deceasedAt: row.deceased_at ? String(row.deceased_at) : void 0,
    mergedIntoPersonId: row.merged_into_person_key ? String(row.merged_into_person_key) : void 0,
    duplicateOfPersonId: row.duplicate_of_person_key ? String(row.duplicate_of_person_key) : void 0,
    source: row.source || "manual",
    createdByUserEmail: row.created_by_user_email ? String(row.created_by_user_email) : void 0,
    ownerUserEmail: row.owner_user_email ? String(row.owner_user_email) : void 0,
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || "")
  };
}
var PostgresPeopleRepository = class {
  constructor() {
    this.kind = "postgres";
  }
  async must(result) {
    if (!result.ok) {
      if (result.status === 409) throw peopleConflict(result.error);
      throw peopleUnavailable(result.error, {
        status: result.status ?? null
      });
    }
    return result.data;
  }
  async createPerson(input) {
    const upsert = await this.upsertPersonByIdentity(input, {});
    if (!upsert.created) throw peopleConflict("Person identity already exists");
    return upsert.person;
  }
  async upsertPersonByIdentity(input, identity) {
    assertPeoplePostgresReady();
    const email = identity.emailKey?.split("#").pop() || normalizeEmail(input.emails?.[0]?.value || "");
    const clientRecordId = input.externalIds?.find((e) => e.system === "client-record")?.value || null;
    if (!email && !clientRecordId) {
      throw peopleValidation("identity key required for upsert");
    }
    const personKey = input.id || newId("person");
    const result = await peopleRpc("ensure_person", {
      p_organization_id: input.organizationId,
      p_person_key: personKey,
      p_display_name: input.displayName,
      p_email: email || "",
      p_portal_slug: input.portalSlug || null,
      p_client_record_id: clientRecordId,
      p_source: input.source || "manual"
    });
    const data = await this.must(result);
    const payload = Array.isArray(data) ? data[0] : data;
    return { person: rowToPerson(payload.person), created: Boolean(payload.created) };
  }
  async updatePerson(personId, patch, options = {}) {
    if (patch && "organizationId" in patch) {
      throw peopleValidation("organizationId is immutable");
    }
    const existing = await this.getPerson(personId);
    if (!existing) throw peopleValidation("Person not found");
    if (!options.expectedUpdatedAt) {
      throw peopleValidation("expectedUpdatedAt required for Postgres OCC updates");
    }
    if (options.expectedUpdatedAt !== existing.updatedAt) {
      throw peopleConflict("Person changed since read", { personId });
    }
    const rpcPatch = {};
    if (patch.displayName !== void 0) rpcPatch.display_name = patch.displayName;
    if (patch.emails !== void 0) {
      rpcPatch.emails = patch.emails;
      rpcPatch.primary_email = normalizeEmail(patch.emails[0]?.value || "") || null;
    }
    if (patch.phones !== void 0) rpcPatch.phones = patch.phones;
    if (patch.lifecycleStatus !== void 0) rpcPatch.lifecycle_status = patch.lifecycleStatus;
    if (patch.dateOfBirth !== void 0) rpcPatch.date_of_birth = patch.dateOfBirth;
    const result = await peopleRpc("update_person", {
      p_organization_id: existing.organizationId,
      p_person_key: personId,
      p_expected_updated_at: options.expectedUpdatedAt,
      p_patch: rpcPatch
    });
    if (!result.ok) {
      if (/conflict/i.test(result.error) || result.status === 409) {
        throw peopleConflict("Person changed since read", { personId });
      }
      throw peopleUnavailable(result.error, { status: result.status ?? null });
    }
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    return rowToPerson(row);
  }
  async getPerson(personId) {
    const result = await peopleRpc("get_person", {
      p_person_key: personId
    });
    if (!result.ok) throw peopleUnavailable(result.error, { status: result.status ?? null });
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!row || !row.person_key) return null;
    return rowToPerson(row);
  }
  async listPersonsByOrg(organizationId) {
    const res = await peopleRest(
      `persons?organization_id=eq.${encodeURIComponent(organizationId)}&select=*`,
      { organizationId }
    );
    const rows = await this.must(res);
    return (rows || []).map(rowToPerson);
  }
  async findPersonByExternalId(organizationId, system, value) {
    const res = await peopleRest(
      `person_external_keys?organization_id=eq.${encodeURIComponent(organizationId)}&system=eq.${encodeURIComponent(system)}&value=eq.${encodeURIComponent(value)}&limit=1`,
      { organizationId }
    );
    if (!res.ok) throw peopleUnavailable(res.error, { status: res.status ?? null });
    const key = res.data?.[0]?.person_key;
    return key ? this.getPerson(key) : null;
  }
  async findPersonByEmail(organizationId, email) {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    const res = await peopleRest(
      `person_email_keys?organization_id=eq.${encodeURIComponent(organizationId)}&email_normalized=eq.${encodeURIComponent(normalized)}&limit=1`,
      { organizationId }
    );
    if (!res.ok) throw peopleUnavailable(res.error, { status: res.status ?? null });
    const key = res.data?.[0]?.person_key;
    return key ? this.getPerson(key) : null;
  }
  // --- Remaining methods: thin REST wrappers (same org scoping) -------------
  async upsertDirectoryMembership(input) {
    const existing = await this.getDirectoryMembership(input.organizationId, input.personId);
    const id2 = existing?.id || "pmem_" + createHash3("sha256").update(JSON.stringify([input.organizationId, input.personId])).digest("hex");
    const row = {
      membership_key: id2,
      organization_id: input.organizationId,
      person_key: input.personId,
      roles: input.roles,
      status: input.status,
      title: input.title || null,
      portal_membership_id: input.portalMembershipId || null,
      client_record_id: input.clientRecordId || null,
      started_at: input.startedAt || null,
      ended_at: input.endedAt || null
    };
    const res = await peopleRest("org_memberships", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: JSON.stringify(row),
      organizationId: input.organizationId
    });
    await this.must(res);
    return { ...input, id: id2 };
  }
  async getDirectoryMembership(organizationId, personId) {
    const res = await peopleRest(
      `org_memberships?organization_id=eq.${encodeURIComponent(organizationId)}&person_key=eq.${encodeURIComponent(personId)}&status=neq.ended&limit=1`,
      { organizationId }
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    const r = res.data?.[0];
    if (!r) return null;
    return {
      id: String(r.membership_key),
      organizationId,
      personId,
      roles: r.roles || [],
      status: r.status,
      title: r.title ? String(r.title) : void 0,
      portalMembershipId: r.portal_membership_id ? String(r.portal_membership_id) : void 0,
      clientRecordId: r.client_record_id ? String(r.client_record_id) : void 0,
      startedAt: r.started_at ? String(r.started_at) : void 0,
      endedAt: r.ended_at ? String(r.ended_at) : void 0
    };
  }
  async listDirectoryMembershipsForPerson(personId) {
    const res = await peopleRest(
      `org_memberships?person_key=eq.${encodeURIComponent(personId)}`
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.membership_key),
      organizationId: String(r.organization_id),
      personId,
      roles: r.roles || [],
      status: r.status
    }));
  }
  async createHousehold(input) {
    const id2 = input.id || newId("hh");
    await this.must(
      await peopleRest("households", {
        method: "POST",
        body: JSON.stringify({
          household_key: id2,
          organization_id: input.organizationId,
          display_name: input.displayName || null,
          status: input.status,
          primary_contact_person_key: input.primaryContactPersonId || null
        }),
        organizationId: input.organizationId
      })
    );
    return { ...input, id: id2 };
  }
  async upsertHouseholdMember(input) {
    const id2 = input.id || newId("hhm");
    await this.must(
      await peopleRest("household_members", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=minimal",
        body: JSON.stringify({
          member_key: id2,
          organization_id: input.organizationId,
          household_key: input.householdId,
          person_key: input.personId,
          role: input.role,
          is_authorized_representative: Boolean(input.isAuthorizedRepresentative),
          authz_expires_at: input.authzExpiresAt || null
        }),
        organizationId: input.organizationId
      })
    );
    return { ...input, id: id2 };
  }
  async listHouseholdMembers(householdId) {
    const res = await peopleRest(
      `household_members?household_key=eq.${encodeURIComponent(householdId)}`
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.member_key),
      organizationId: String(r.organization_id),
      householdId,
      personId: String(r.person_key),
      role: r.role,
      isAuthorizedRepresentative: Boolean(r.is_authorized_representative),
      authzExpiresAt: r.authz_expires_at ? String(r.authz_expires_at) : void 0
    }));
  }
  async listHouseholdMembersForPerson(personId) {
    const res = await peopleRest(
      `household_members?person_key=eq.${encodeURIComponent(personId)}`
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.member_key),
      organizationId: String(r.organization_id),
      householdId: String(r.household_key),
      personId,
      role: r.role,
      isAuthorizedRepresentative: Boolean(r.is_authorized_representative),
      authzExpiresAt: r.authz_expires_at ? String(r.authz_expires_at) : void 0
    }));
  }
  async upsertRelationship(input) {
    const id2 = input.id || newId("rel");
    const result = await peopleRpc("upsert_relationship", {
      p_organization_id: input.organizationId,
      p_edge_key: id2,
      p_from_person_key: input.fromPersonId,
      p_to_person_key: input.toPersonId,
      p_type: input.type,
      p_status: input.status,
      p_expires_at: input.expiresAt || null,
      p_notes: input.notes || null
    });
    const row = await this.must(result);
    const payload = Array.isArray(row) ? row[0] : row;
    return {
      id: String(payload.edge_key || id2),
      organizationId: input.organizationId,
      fromPersonId: String(payload.from_person_key || input.fromPersonId),
      toPersonId: String(payload.to_person_key || input.toPersonId),
      type: payload.type || input.type,
      status: payload.status || input.status,
      expiresAt: payload.expires_at ? String(payload.expires_at) : input.expiresAt,
      notes: payload.notes ? String(payload.notes) : input.notes
    };
  }
  async listRelationshipsForOrg(organizationId) {
    const res = await peopleRest(
      `relationships?organization_id=eq.${encodeURIComponent(organizationId)}`,
      { organizationId }
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.edge_key),
      organizationId,
      fromPersonId: String(r.from_person_key),
      toPersonId: String(r.to_person_key),
      type: r.type,
      status: r.status,
      expiresAt: r.expires_at ? String(r.expires_at) : void 0,
      notes: r.notes ? String(r.notes) : void 0
    }));
  }
  async upsertProgramLink(input) {
    const id2 = input.id || newId("plink");
    await this.must(
      await peopleRest("program_links", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=minimal",
        body: JSON.stringify({
          link_key: id2,
          organization_id: input.organizationId,
          person_key: input.personId,
          kind: input.kind,
          external_ref: input.externalRef || null,
          label: input.label || null,
          status: input.status,
          role_in_program: input.roleInProgram || null
        }),
        organizationId: input.organizationId
      })
    );
    return { ...input, id: id2 };
  }
  async listProgramLinks(personId) {
    const res = await peopleRest(
      `program_links?person_key=eq.${encodeURIComponent(personId)}`
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.link_key),
      organizationId: String(r.organization_id),
      personId,
      kind: r.kind,
      externalRef: r.external_ref ? String(r.external_ref) : void 0,
      label: r.label ? String(r.label) : void 0,
      status: r.status,
      roleInProgram: r.role_in_program ? String(r.role_in_program) : void 0
    }));
  }
  async upsertConsent(input) {
    const id2 = input.id || newId("cns");
    await this.must(
      await peopleRest("consents", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=minimal",
        body: JSON.stringify({
          consent_key: id2,
          organization_id: input.organizationId,
          person_key: input.personId,
          purpose: input.purpose,
          status: input.status,
          captured_at: input.capturedAt || null,
          expires_at: input.expiresAt || null,
          source: input.source || null
        }),
        organizationId: input.organizationId
      })
    );
    return { ...input, id: id2 };
  }
  async listConsents(personId) {
    const res = await peopleRest(
      `consents?person_key=eq.${encodeURIComponent(personId)}`
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.consent_key),
      organizationId: String(r.organization_id),
      personId,
      purpose: String(r.purpose),
      status: r.status,
      capturedAt: r.captured_at ? String(r.captured_at) : void 0,
      expiresAt: r.expires_at ? String(r.expires_at) : void 0,
      source: r.source ? String(r.source) : "staff"
    }));
  }
  async upsertAclGrant(input) {
    const id2 = input.id || newId("acl");
    await this.must(
      await peopleRest("acl_grants", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=minimal",
        body: JSON.stringify({
          grant_key: id2,
          organization_id: input.organizationId,
          resource_type: input.resourceType,
          resource_id: input.resourceId,
          grantee_kind: input.grantee.kind,
          grantee_value: input.grantee.kind === "user_email" ? input.grantee.email : input.grantee.kind === "person" ? input.grantee.personId : input.grantee.role,
          relation: input.relation,
          fields_allow: input.fieldsAllow || null,
          fields_deny: input.fieldsDeny || null,
          expires_at: input.expiresAt || null
        }),
        organizationId: input.organizationId
      })
    );
    return { ...input, id: id2 };
  }
  async listAclGrantsForResource(organizationId, resourceType, resourceId) {
    const res = await peopleRest(
      `acl_grants?organization_id=eq.${encodeURIComponent(organizationId)}&resource_type=eq.${encodeURIComponent(resourceType)}&resource_id=eq.${encodeURIComponent(resourceId)}`,
      { organizationId }
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.grant_key),
      organizationId,
      resourceType: r.resource_type,
      resourceId: String(r.resource_id),
      grantee: { kind: "user_email", email: String(r.grantee_value) },
      relation: r.relation,
      fieldsAllow: r.fields_allow,
      fieldsDeny: r.fields_deny,
      expiresAt: r.expires_at ? String(r.expires_at) : void 0
    }));
  }
  async appendAudit(input) {
    const id2 = newId("aud");
    const at = (/* @__PURE__ */ new Date()).toISOString();
    await this.must(
      await peopleRest("audit_events", {
        method: "POST",
        body: JSON.stringify({
          audit_key: id2,
          organization_id: input.organizationId,
          actor_email: input.actorEmail,
          actor_person_key: input.actorPersonId || null,
          action: input.action,
          subject_person_key: input.subjectPersonId || null,
          at,
          meta: input.meta || null
        }),
        organizationId: input.organizationId
      })
    );
    return {
      id: id2,
      organizationId: input.organizationId,
      actorEmail: input.actorEmail,
      actorPersonId: input.actorPersonId,
      action: input.action,
      subjectPersonId: input.subjectPersonId,
      at,
      meta: input.meta
    };
  }
  async listAudit(organizationId) {
    const res = await peopleRest(
      `audit_events?organization_id=eq.${encodeURIComponent(organizationId)}&order=at.asc`,
      { organizationId }
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.audit_key),
      organizationId,
      actorEmail: String(r.actor_email),
      actorPersonId: r.actor_person_key ? String(r.actor_person_key) : void 0,
      action: r.action,
      subjectPersonId: r.subject_person_key ? String(r.subject_person_key) : void 0,
      at: String(r.at),
      meta: r.meta
    }));
  }
  async createMergeJob(input) {
    const id2 = newId("mrgjob");
    const jobKey = `${input.organizationId}#${input.absorbedPersonId}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = await this.findMergeJobByAbsorbed(
      input.organizationId,
      input.absorbedPersonId
    );
    if (existing) return existing;
    await this.must(
      await peopleRest("merge_jobs", {
        method: "POST",
        body: JSON.stringify({
          job_id: id2,
          job_key: jobKey,
          organization_id: input.organizationId,
          survivor_person_key: input.survivorPersonId,
          absorbed_person_key: input.absorbedPersonId,
          status: "queued",
          completed_steps: [],
          attempts: 0,
          actor_email: input.actorEmail,
          meta: input.meta || null,
          created_at: now,
          updated_at: now
        }),
        organizationId: input.organizationId
      })
    );
    return {
      id: id2,
      organizationId: input.organizationId,
      jobKey,
      survivorPersonId: input.survivorPersonId,
      absorbedPersonId: input.absorbedPersonId,
      status: "queued",
      completedSteps: [],
      attempts: 0,
      actorEmail: input.actorEmail,
      meta: input.meta,
      createdAt: now,
      updatedAt: now
    };
  }
  async getMergeJob(jobId) {
    const res = await peopleRest(
      `merge_jobs?job_id=eq.${encodeURIComponent(jobId)}&limit=1`
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    const r = res.data?.[0];
    if (!r) return null;
    return this.mapMergeJob(r);
  }
  async findMergeJobByAbsorbed(organizationId, absorbedPersonId) {
    const jobKey = `${organizationId}#${absorbedPersonId}`;
    const res = await peopleRest(
      `merge_jobs?job_key=eq.${encodeURIComponent(jobKey)}&limit=1`,
      { organizationId }
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    const r = res.data?.[0];
    return r ? this.mapMergeJob(r) : null;
  }
  async updateMergeJob(jobId, patch) {
    const body = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    if (patch.status) body.status = patch.status;
    if (patch.attempts !== void 0) body.attempts = patch.attempts;
    if (patch.lastError !== void 0) body.last_error = patch.lastError;
    if (patch.completedStep) {
      const current = await this.getMergeJob(jobId);
      const steps = new Set(current?.completedSteps || []);
      steps.add(patch.completedStep);
      body.completed_steps = [...steps];
    }
    if (patch.status === "completed") {
      const job = await this.getMergeJob(jobId);
      if (job) {
        await this.must(
          await peopleRpc("merge_finalize", {
            p_organization_id: job.organizationId,
            p_survivor_key: job.survivorPersonId,
            p_absorbed_key: job.absorbedPersonId,
            p_job_id: jobId
          })
        );
        return await this.getMergeJob(jobId);
      }
    }
    const res = await peopleRest(
      `merge_jobs?job_id=eq.${encodeURIComponent(jobId)}`,
      {
        method: "PATCH",
        prefer: "return=representation",
        body: JSON.stringify(body)
      }
    );
    const rows = await this.must(res);
    return this.mapMergeJob(rows[0]);
  }
  mapMergeJob(r) {
    return {
      id: String(r.job_id),
      organizationId: String(r.organization_id),
      jobKey: String(r.job_key),
      survivorPersonId: String(r.survivor_person_key),
      absorbedPersonId: String(r.absorbed_person_key),
      status: r.status,
      completedSteps: r.completed_steps || [],
      attempts: Number(r.attempts || 0),
      actorEmail: String(r.actor_email),
      lastError: r.last_error ? String(r.last_error) : void 0,
      meta: r.meta,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at)
    };
  }
  async createImportJob(input) {
    const existing = await this.findImportJobByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey
    );
    if (existing) return existing;
    const id2 = newId("impjob");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await this.must(
      await peopleRest("import_jobs", {
        method: "POST",
        body: JSON.stringify({
          job_id: id2,
          organization_id: input.organizationId,
          idempotency_key: input.idempotencyKey,
          source: input.source,
          status: "queued",
          row_count: input.rowCount,
          ok_count: 0,
          failed_count: 0,
          actor_email: input.actorEmail,
          dry_run: input.dryRun || false,
          meta: input.meta || null,
          created_at: now,
          updated_at: now
        }),
        organizationId: input.organizationId
      })
    );
    return {
      id: id2,
      organizationId: input.organizationId,
      idempotencyKey: input.idempotencyKey,
      source: input.source,
      status: "queued",
      rowCount: input.rowCount,
      okCount: 0,
      failedCount: 0,
      actorEmail: input.actorEmail,
      dryRun: input.dryRun,
      meta: input.meta,
      createdAt: now,
      updatedAt: now
    };
  }
  async getImportJob(jobId) {
    const res = await peopleRest(
      `import_jobs?job_id=eq.${encodeURIComponent(jobId)}&limit=1`
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    const r = res.data?.[0];
    if (!r) return null;
    return this.mapImportJob(r);
  }
  async findImportJobByIdempotencyKey(organizationId, idempotencyKey) {
    const res = await peopleRest(
      `import_jobs?organization_id=eq.${encodeURIComponent(organizationId)}&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`,
      { organizationId }
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    const r = res.data?.[0];
    return r ? this.mapImportJob(r) : null;
  }
  async updateImportJob(jobId, patch) {
    const body = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    if (patch.status) body.status = patch.status;
    if (patch.okCount !== void 0) body.ok_count = patch.okCount;
    if (patch.failedCount !== void 0) body.failed_count = patch.failedCount;
    if (patch.rowCount !== void 0) body.row_count = patch.rowCount;
    if (patch.lastError !== void 0) body.last_error = patch.lastError;
    const res = await peopleRest(
      `import_jobs?job_id=eq.${encodeURIComponent(jobId)}`,
      { method: "PATCH", prefer: "return=representation", body: JSON.stringify(body) }
    );
    const rows = await this.must(res);
    return this.mapImportJob(rows[0]);
  }
  mapImportJob(r) {
    return {
      id: String(r.job_id),
      organizationId: String(r.organization_id),
      idempotencyKey: String(r.idempotency_key),
      source: r.source,
      status: r.status,
      rowCount: Number(r.row_count || 0),
      okCount: Number(r.ok_count || 0),
      failedCount: Number(r.failed_count || 0),
      actorEmail: String(r.actor_email),
      dryRun: Boolean(r.dry_run),
      lastError: r.last_error ? String(r.last_error) : void 0,
      meta: r.meta,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at)
    };
  }
  async recordImportRowResult(input) {
    const rowKey = `${input.importJobId}#${input.rowNumber}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await this.must(
      await peopleRest("import_row_results", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=minimal",
        body: JSON.stringify({
          row_key: rowKey,
          organization_id: input.organizationId,
          import_job_id: input.importJobId,
          row_number: input.rowNumber,
          status: input.status,
          person_key: input.personId || null,
          error: input.error || null,
          created_at: now
        }),
        organizationId: input.organizationId
      })
    );
    return {
      id: rowKey,
      organizationId: input.organizationId,
      importJobId: input.importJobId,
      rowNumber: input.rowNumber,
      rowKey,
      status: input.status,
      personId: input.personId,
      error: input.error,
      createdAt: now
    };
  }
  async listImportRowResults(importJobId) {
    const res = await peopleRest(
      `import_row_results?import_job_id=eq.${encodeURIComponent(importJobId)}&order=row_number.asc`
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.row_key),
      organizationId: String(r.organization_id),
      importJobId,
      rowNumber: Number(r.row_number),
      rowKey: String(r.row_key),
      status: r.status,
      personId: r.person_key ? String(r.person_key) : void 0,
      error: r.error ? String(r.error) : void 0,
      createdAt: String(r.created_at)
    }));
  }
  async saveMigrationCheckpoint(input) {
    const checkpointKey = `${input.organizationId}#${input.jobId}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await this.must(
      await peopleRest("migration_checkpoints", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=representation",
        body: JSON.stringify({
          checkpoint_key: checkpointKey,
          organization_id: input.organizationId,
          job_id: input.jobId,
          last_client_record_id: input.lastClientRecordId || null,
          processed: input.processed,
          created: input.created,
          linked: input.linked,
          status: input.status,
          updated_at: now
        }),
        organizationId: input.organizationId
      })
    );
    return {
      id: checkpointKey,
      organizationId: input.organizationId,
      jobId: input.jobId,
      checkpointKey,
      lastClientRecordId: input.lastClientRecordId,
      processed: input.processed,
      created: input.created,
      linked: input.linked,
      status: input.status,
      updatedAt: now
    };
  }
  async getMigrationCheckpoint(organizationId, jobId) {
    const checkpointKey = `${organizationId}#${jobId}`;
    const res = await peopleRest(
      `migration_checkpoints?checkpoint_key=eq.${encodeURIComponent(checkpointKey)}&limit=1`,
      { organizationId }
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    const r = res.data?.[0];
    if (!r) return null;
    return {
      id: String(r.checkpoint_key),
      organizationId,
      jobId,
      checkpointKey: String(r.checkpoint_key),
      lastClientRecordId: r.last_client_record_id ? String(r.last_client_record_id) : void 0,
      processed: Number(r.processed || 0),
      created: Number(r.created || 0),
      linked: Number(r.linked || 0),
      status: r.status,
      updatedAt: String(r.updated_at)
    };
  }
};
var singleton = null;
function postgresPeopleRepository() {
  assertPeoplePostgresReady();
  if (!singleton) singleton = new PostgresPeopleRepository();
  return singleton;
}

// lib/people/adapter.ts
function getPeopleRepository() {
  if (isPeopleCertMemoryForced() && !isPeopleProductionMode()) {
    return memoryPeopleRepository();
  }
  if (isUniversalPeoplePersistEnabled()) {
    assertPeoplePersistReady();
    return postgresPeopleRepository();
  }
  if (isUniversalPeopleEnabled() && isPeopleProductionMode()) {
    incPeopleMetric("people_illegal_flag_denied", "adapter");
    throw peopleIllegalFlag(
      "UNIVERSAL_PEOPLE requires UNIVERSAL_PEOPLE_PERSIST in production/preview"
    );
  }
  return memoryPeopleRepository();
}

// lib/bricks/commerce-family.ts
import { z as z4 } from "zod";

// lib/modules/tenant-install.ts
import { createHash as createHash4 } from "node:crypto";

// config/capability-inventory.json
var capability_inventory_default = {
  version: 1,
  standardVersion: 1,
  policy: {
    certifiedCoreRequiredInEveryPortal: [
      "dashboard",
      "amplifi",
      "update-hub"
    ],
    nonCertifiedModulesFailClosed: true,
    assemblyStatuses: [
      "certified",
      "inventoried",
      "review-required"
    ],
    certificationSource: "This inventory is the canonical assembly certification truth. capability-certifications.json is historical evidence only."
  },
  modules: [
    {
      id: "dashboard",
      name: "Dashboard",
      class: "core",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-home",
        implementation: "existing"
      },
      routes: [
        "/portal/{slug}"
      ],
      navigation: {
        required: true,
        placement: "core"
      },
      data: {
        authority: "existing EA platform sources",
        newStoreRequired: false
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: [
        "EA capability registry",
        "EA module registry"
      ],
      integrations: [],
      provisioning: {
        mode: "automatic-with-tenant",
        required: true
      },
      healthCheck: {
        type: "route-smoke",
        path: "/portal/{slug}"
      },
      tests: [
        "module-registry-contract",
        "portal-smoke"
      ],
      rollback: {
        mode: "release-rollback",
        removable: false
      },
      costLicense: {
        decision: "approved",
        mandatoryVendorFee: false,
        boundary: "EA-owned application code"
      }
    },
    {
      id: "amplifi",
      name: "Amplifi",
      class: "core",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module",
        implementation: "existing"
      },
      routes: [
        "/portal/{slug}/amplifi"
      ],
      navigation: {
        required: true,
        placement: "growth",
        pillNav: true
      },
      data: {
        authority: "existing Amplifi application services",
        newStoreRequired: false
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: [
        "EA capability registry",
        "EA module registry"
      ],
      integrations: [
        "existing Amplifi providers only"
      ],
      provisioning: {
        mode: "automatic-with-tenant",
        required: true
      },
      healthCheck: {
        type: "route-smoke",
        path: "/portal/{slug}/amplifi"
      },
      tests: [
        "module-registry-contract",
        "amplifi-route-smoke"
      ],
      rollback: {
        mode: "release-rollback",
        removable: false
      },
      costLicense: {
        decision: "approved",
        mandatoryVendorFee: false,
        boundary: "No new paid vendor account required by Run 1"
      }
    },
    {
      id: "update-hub",
      name: "Update Hub",
      class: "core",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module",
        implementation: "existing"
      },
      routes: [
        "/portal/{slug}/updates"
      ],
      navigation: {
        required: true,
        placement: "core",
        pillNav: true
      },
      data: {
        authority: "existing EA update/activity sources",
        newStoreRequired: false
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: [
        "EA capability registry",
        "EA module registry"
      ],
      integrations: [],
      provisioning: {
        mode: "automatic-with-tenant",
        required: true
      },
      healthCheck: {
        type: "route-smoke",
        path: "/portal/{slug}/updates"
      },
      tests: [
        "module-registry-contract",
        "updates-route-smoke"
      ],
      rollback: {
        mode: "release-rollback",
        removable: false
      },
      costLicense: {
        decision: "approved",
        mandatoryVendorFee: false,
        boundary: "EA-owned application code"
      }
    },
    {
      id: "events",
      name: "Calendar & Event Hub",
      class: "business",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/events"
      ],
      navigation: {
        placement: "operations"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required",
        candidates: [
          "pretix"
        ]
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run4-starter-package-contract",
        "events-optional-provider-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA Calendar & Event Hub route, shared scheduling, and EA registration ledger are certified. Pretix is an optional extension only and remains isolated from the assembly requirement; no Pretix account is required to provision the module."
      }
    },
    {
      id: "calendar",
      name: "EA Shared Calendar",
      class: "business",
      assemblyStatus: "certified",
      version: 2,
      ui: {
        surface: "portal-module",
        implementation: "existing-plus-functional-lifecycle"
      },
      routes: [
        "/portal/{slug}/calendar"
      ],
      navigation: {
        placement: "operations"
      },
      data: {
        authority: "tenant-scoped Creative Studio durable records",
        newStoreRequired: false
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "verified",
        boundary: "existing EA storage and tenant identity; providers checked before installation"
      },
      integrations: {
        status: "verified",
        provider: "internal; optional Nylas"
      },
      provisioning: {
        mode: "automatic-with-certified-selection",
        required: true,
        installer: "lib/bricks/module-install.ts"
      },
      healthCheck: {
        type: "tenant-provision-test",
        path: "/api/calendar/tenant-provision-test",
        productionStatus: 404
      },
      tests: {
        status: "executable",
        suite: "tests/blockers-certified.test.mts"
      },
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        mandatoryVendorFee: false,
        boundary: "EA-owned implementation over existing platform infrastructure; optional Nylas connection excluded from license approval"
      }
    },
    {
      id: "billing",
      name: "Billing",
      class: "business",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/billing"
      ],
      navigation: {
        placement: "platform"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "owner"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run4-starter-package-contract",
        "billing-platform-adapter-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA billing workspace, authorization boundary, and existing platform-managed Stripe adapter are certified. No client Stripe account or per-client software license is required for provisioning; payment-processing charges apply only when commerce is used."
      }
    },
    {
      id: "documents",
      name: "Document Hub",
      class: "business",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/documents"
      ],
      navigation: {
        placement: "operations"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required",
        candidates: [
          "documenso"
        ]
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run4-canonical-entitlement-contract",
        "documents-native-boundary",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA-owned Document Hub using existing tenant uploads, CTP deliverables, and Update Hub files. Documenso is not required for this certified boundary and remains isolated as an optional signing provider."
      }
    },
    {
      id: "training",
      name: "Training Hub",
      class: "business",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/learning"
      ],
      navigation: {
        placement: "operations"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run4-canonical-entitlement-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA-owned Training Hub and existing published-training/course services; no new vendor account or per-client license required"
      }
    },
    {
      id: "messaging",
      name: "Messaging",
      class: "business",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/messaging"
      ],
      navigation: {
        placement: "operations"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required",
        candidates: [
          "novu"
        ]
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run4-canonical-entitlement-contract",
        "messaging-native-boundary",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA-owned messaging surface backed by Update Hub and existing portal communication services. Novu is not required for this certified boundary and remains an optional future provider extension."
      }
    },
    {
      id: "people",
      name: "People",
      class: "business",
      assemblyStatus: "certified",
      version: 2,
      ui: {
        surface: "portal-module",
        implementation: "existing-plus-functional-lifecycle"
      },
      routes: [
        "/portal/{slug}/people"
      ],
      navigation: {
        placement: "operations"
      },
      data: {
        authority: "existing people Postgres schema",
        newStoreRequired: false
      },
      permissions: {
        minimumRole: "staff"
      },
      dependencies: {
        status: "verified",
        boundary: "existing EA storage and tenant identity; providers checked before installation"
      },
      integrations: {
        status: "verified",
        provider: "Postgres people_app"
      },
      provisioning: {
        mode: "automatic-with-certified-selection",
        required: true,
        installer: "lib/bricks/module-install.ts"
      },
      healthCheck: {
        type: "tenant-provision-test",
        path: "/api/people/tenant-provision-test",
        productionStatus: 404
      },
      tests: {
        status: "executable",
        suite: "tests/blockers-certified.test.mts"
      },
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        mandatoryVendorFee: false,
        boundary: "EA-owned implementation over existing platform infrastructure; optional Nylas connection excluded from license approval"
      }
    },
    {
      id: "intake",
      name: "Intake",
      class: "business",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/intake"
      ],
      navigation: {
        placement: "operations"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run3-business-wave-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "Existing EA portal route and application services only; no new paid vendor dependency"
      }
    },
    {
      id: "applications",
      name: "Applications",
      class: "business",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/applications"
      ],
      navigation: {
        placement: "operations"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run3-business-wave-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "Existing EA portal route and application services only; no new paid vendor dependency"
      }
    },
    {
      id: "reports",
      name: "Reports",
      class: "business",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/reports"
      ],
      navigation: {
        placement: "operations"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run3-business-wave-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "Existing EA portal route and application services only; no new paid vendor dependency"
      }
    },
    {
      id: "pulse",
      name: "Pulse",
      class: "specialized",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/pulse"
      ],
      navigation: {
        placement: "core"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run4-canonical-entitlement-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA-owned Pulse operational-health and tenant activity surfaces using existing EA data services; no new vendor account or per-client license required"
      }
    },
    {
      id: "simplifi",
      name: "Simplifi",
      class: "specialized",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/simplifi"
      ],
      navigation: {
        placement: "growth"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "staff"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run6-simplifi-native-boundary",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA-owned Simplifi portal workspace, capture records, content-request visibility, and Magnifi linking using existing EA services. No new vendor account or per-client software license is required for provisioning."
      }
    },
    {
      id: "connect",
      name: "EA Connect",
      class: "specialized",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/connect"
      ],
      navigation: {
        placement: "growth"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "staff"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run4-canonical-entitlement-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA-owned Connect relationship-capture workspace and existing EA routing services; no new vendor account or per-client software license required for provisioning"
      }
    },
    {
      id: "landing",
      name: "Landing Pages",
      class: "specialized",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/landing"
      ],
      navigation: {
        placement: "growth"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "owner"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run4-canonical-entitlement-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA-owned live-site and Experience Builder workspace surfaces using existing EA publish services; no new vendor account or per-client license required"
      }
    },
    {
      id: "discovery",
      name: "Discovery",
      class: "specialized",
      assemblyStatus: "certified",
      version: 2,
      ui: {
        surface: "assessment",
        implementation: "existing-plus-functional-lifecycle"
      },
      routes: [
        "/portal/{slug}/discovery",
        "/assessment"
      ],
      navigation: {
        placement: "growth"
      },
      data: {
        authority: "tenant-scoped Creative Studio durable records",
        newStoreRequired: false
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "verified",
        boundary: "existing EA storage and tenant identity; providers checked before installation"
      },
      integrations: {
        status: "verified",
        provider: "existing email adapter"
      },
      provisioning: {
        mode: "automatic-with-certified-selection",
        required: true,
        installer: "lib/bricks/module-install.ts"
      },
      healthCheck: {
        type: "tenant-provision-test",
        path: "/api/assessment/tenant-provision-test",
        productionStatus: 404
      },
      tests: {
        status: "executable",
        suite: "tests/blockers-certified.test.mts"
      },
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        mandatoryVendorFee: false,
        boundary: "EA-owned implementation over existing platform infrastructure; optional Nylas connection excluded from license approval"
      }
    },
    {
      id: "resources",
      name: "Resource Library",
      class: "specialized",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/resources"
      ],
      navigation: {
        placement: "operations"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run4-canonical-entitlement-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA-owned Resource Library using existing tenant resources and workspace links; no new vendor account or per-client license required"
      }
    },
    {
      id: "ask",
      name: "Guide",
      class: "specialized",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/ask"
      ],
      navigation: {
        placement: "operations"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run4-canonical-entitlement-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA-owned Guide request surface using existing portal and Update Hub services; no new vendor account or per-client license required"
      }
    },
    {
      id: "ctp",
      name: "Consider the Possibilities",
      class: "specialized",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/ctp"
      ],
      navigation: {
        placement: "operations"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run4-canonical-entitlement-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA-owned Consider the Possibilities workspace and existing CTP project-state services; no new vendor account or per-client license required"
      }
    },
    {
      id: "member",
      name: "Member Experience",
      class: "specialized",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/member"
      ],
      navigation: {
        placement: "operations"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run4-starter-package-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA-owned Member Experience route and existing tenant/member data only; no new vendor account or per-client license required"
      }
    },
    {
      id: "settings",
      name: "Settings",
      class: "specialized",
      assemblyStatus: "certified",
      version: 1,
      ui: {
        surface: "portal-module"
      },
      routes: [
        "/portal/{slug}/settings"
      ],
      navigation: {
        placement: "platform"
      },
      data: {
        status: "existing"
      },
      permissions: {
        minimumRole: "guest"
      },
      dependencies: {
        status: "review-required"
      },
      integrations: {
        status: "review-required"
      },
      provisioning: {
        status: "review-required"
      },
      healthCheck: {
        type: "route-smoke"
      },
      tests: [
        "module-registry-contract",
        "run4-starter-package-contract",
        "portal-build-smoke"
      ],
      rollback: {
        mode: "module-disable-or-release-rollback"
      },
      costLicense: {
        decision: "approved",
        boundary: "EA-owned portal preferences and business-presence surfaces only; no new vendor account or per-client license required"
      }
    }
  ]
};

// config/module-certification-evidence.json
var module_certification_evidence_default = {
  version: 2,
  status: "certified-bin",
  policy: "Fail-closed exact-version certificate authority. This ledger is the only step that may promote a module to reusable certified status after executable evidence validation.",
  requiredEvidenceClasses: [
    "route-render",
    "responsive-ui",
    "authorization-tenant-isolation",
    "durable-persistence",
    "dependency-integration-readiness",
    "success-empty-failure-states",
    "observability",
    "rollback-disable",
    "business-lifecycle",
    "immutable-version-fingerprint"
  ],
  certificates: [
    {
      moduleId: "dashboard",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "b2540e6959188e107b84744a85b680376aaee12aa367b6ccbeb849f136559041",
      evidenceFingerprint: "d0d328923c335a02ed9c4729c6ebe7ead26d72c67e0f9e87ed950aec55bc5040",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-hub-realism.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-hub-realism.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-hub-realism.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-hub-realism.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-hub-realism.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-hub-realism.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-hub-realism.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-hub-realism.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-hub-realism.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-hub-realism.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-hub-realism.mjs"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-hub-realism.mjs"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-hub-realism.mjs"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-hub-realism.mjs"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-hub-realism.mjs"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-hub-realism.mjs"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-hub-realism.mjs"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-hub-realism.mjs"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-hub-realism.mjs"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-hub-realism.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "amplifi",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "9c14c78cdf2d492b969cd0f638b63c40136e61c75fc4251d65425ff3e0cf2607",
      evidenceFingerprint: "d641d6dfb4b7cd113682964d951f70d99da456170484342017ec4429b6e4e235",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "update-hub",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "277f7a1308fb9795545efb847b9f86ae5923163c2aea7c2ccd5c7d6852cd90e1",
      evidenceFingerprint: "46f08f56fe0d938f5f77babe69b8c4523d5bacd0ca1bba0e48b0ed22c63c980a",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-recovery-monitoring-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-recovery-monitoring-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-recovery-monitoring-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-recovery-monitoring-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-recovery-monitoring-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-recovery-monitoring-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-recovery-monitoring-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-recovery-monitoring-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-recovery-monitoring-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-recovery-monitoring-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-recovery-monitoring-contract.mjs"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-recovery-monitoring-contract.mjs"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-recovery-monitoring-contract.mjs"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-recovery-monitoring-contract.mjs"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-recovery-monitoring-contract.mjs"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-recovery-monitoring-contract.mjs"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-recovery-monitoring-contract.mjs"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-recovery-monitoring-contract.mjs"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-recovery-monitoring-contract.mjs"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-recovery-monitoring-contract.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "events",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "86137744a0d283546276672a34349e2c7b575fc5926d999698ecc793eca52968",
      evidenceFingerprint: "dc9fe9057bb03c858a4358c67b6d17b90e0475249223cd1fdee3404063089f41",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-event-hub-mandatory-cert.mjs",
            "scripts/test-portal-scheduling-cert.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-event-hub-mandatory-cert.mjs",
            "scripts/test-portal-scheduling-cert.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-event-hub-mandatory-cert.mjs",
            "scripts/test-portal-scheduling-cert.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-event-hub-mandatory-cert.mjs",
            "scripts/test-portal-scheduling-cert.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-event-hub-mandatory-cert.mjs",
            "scripts/test-portal-scheduling-cert.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-event-hub-mandatory-cert.mjs",
            "scripts/test-portal-scheduling-cert.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-event-hub-mandatory-cert.mjs",
            "scripts/test-portal-scheduling-cert.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-event-hub-mandatory-cert.mjs",
            "scripts/test-portal-scheduling-cert.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-event-hub-mandatory-cert.mjs",
            "scripts/test-portal-scheduling-cert.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-event-hub-mandatory-cert.mjs",
            "scripts/test-portal-scheduling-cert.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-event-hub-mandatory-cert.mjs",
          "scripts/test-portal-scheduling-cert.mjs"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-event-hub-mandatory-cert.mjs",
          "scripts/test-portal-scheduling-cert.mjs"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-event-hub-mandatory-cert.mjs",
          "scripts/test-portal-scheduling-cert.mjs"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-event-hub-mandatory-cert.mjs",
          "scripts/test-portal-scheduling-cert.mjs"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-event-hub-mandatory-cert.mjs",
          "scripts/test-portal-scheduling-cert.mjs"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-event-hub-mandatory-cert.mjs",
          "scripts/test-portal-scheduling-cert.mjs"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-event-hub-mandatory-cert.mjs",
          "scripts/test-portal-scheduling-cert.mjs"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-event-hub-mandatory-cert.mjs",
          "scripts/test-portal-scheduling-cert.mjs"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-event-hub-mandatory-cert.mjs",
          "scripts/test-portal-scheduling-cert.mjs"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-event-hub-mandatory-cert.mjs",
          "scripts/test-portal-scheduling-cert.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "billing",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "efbf1a97aee9dd6c5ec3702fd0469ea27cb779a4254a2266a000e1b51703a745",
      evidenceFingerprint: "06099022eac69c886b8caf14d6d8888cf652c08625d3a7f1db9a5fa80df46df3",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-tenant-release-safety.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-tenant-release-safety.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-tenant-release-safety.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-tenant-release-safety.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-tenant-release-safety.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-tenant-release-safety.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-tenant-release-safety.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-tenant-release-safety.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-tenant-release-safety.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-tenant-release-safety.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-tenant-release-safety.mjs"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-tenant-release-safety.mjs"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-tenant-release-safety.mjs"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-tenant-release-safety.mjs"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-tenant-release-safety.mjs"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-tenant-release-safety.mjs"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-tenant-release-safety.mjs"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-tenant-release-safety.mjs"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-tenant-release-safety.mjs"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-tenant-release-safety.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "documents",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "21df3a3322216ef42c4ebd7317c6cb1536467797bd61c3b765e09424799a0529",
      evidenceFingerprint: "9ef018f87b2e7d0c17dd386abf5a4524abc2290133944932574b2154580ecd59",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-portal-documents.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-portal-documents.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-portal-documents.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-portal-documents.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-portal-documents.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-portal-documents.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-portal-documents.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-portal-documents.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-portal-documents.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-portal-documents.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-portal-documents.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-portal-documents.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-portal-documents.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-portal-documents.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-portal-documents.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-portal-documents.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-portal-documents.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-portal-documents.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-portal-documents.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-portal-documents.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "training",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "9fbaabdc42c6f0c4cca3f6b4bc73049478b03d850a30c27eaf57c34ad8f8f1bd",
      evidenceFingerprint: "79a896e59028d0fb0d2c4c937e18213ce5dc5f9b57733f98f47a96690c26177d",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-online-academy-chassis.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-online-academy-chassis.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-online-academy-chassis.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-online-academy-chassis.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-online-academy-chassis.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-online-academy-chassis.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-online-academy-chassis.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-online-academy-chassis.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-online-academy-chassis.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-online-academy-chassis.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-online-academy-chassis.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-online-academy-chassis.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-online-academy-chassis.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-online-academy-chassis.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-online-academy-chassis.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-online-academy-chassis.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-online-academy-chassis.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-online-academy-chassis.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-online-academy-chassis.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-online-academy-chassis.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "messaging",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "165b6a7e1d86d1d5b118995a215057f7337300a87d0689d242c91261e93766d8",
      evidenceFingerprint: "43bfefb184bf2871425b50d7cf6d3a5b1116af30caebf3dc10733cd93dc8b446",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-guide-orchestration.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-guide-orchestration.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-guide-orchestration.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-guide-orchestration.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-guide-orchestration.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-guide-orchestration.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-guide-orchestration.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-guide-orchestration.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-guide-orchestration.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-guide-orchestration.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-guide-orchestration.mjs"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-guide-orchestration.mjs"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-guide-orchestration.mjs"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-guide-orchestration.mjs"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-guide-orchestration.mjs"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-guide-orchestration.mjs"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-guide-orchestration.mjs"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-guide-orchestration.mjs"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-guide-orchestration.mjs"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-guide-orchestration.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "intake",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "5fdcff5d3ede6762f25a222c61d0b55f6b7980a0d98afdea94b9c8636a38cc4f",
      evidenceFingerprint: "f5b62dc669fa144146fce06417420221f1b17b80ac33e4179907fd128b2080da",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-intake-cert.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-intake-cert.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-intake-cert.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-intake-cert.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-intake-cert.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-intake-cert.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-intake-cert.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-intake-cert.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-intake-cert.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-intake-cert.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-intake-cert.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-intake-cert.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-intake-cert.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-intake-cert.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-intake-cert.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-intake-cert.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-intake-cert.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-intake-cert.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-intake-cert.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-intake-cert.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "applications",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "484bc5bae31bd3d8480053c1d6581041d1275b387ebabd4105b3668eb5884583",
      evidenceFingerprint: "e222a54db7de44d886134ca3d7fe51e20497aa38f58807babf385eec58868ff7",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-applications-cert.mjs",
            "scripts/test-modular-assembly-run3.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-applications-cert.mjs",
            "scripts/test-modular-assembly-run3.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-applications-cert.mjs",
            "scripts/test-modular-assembly-run3.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-applications-cert.mjs",
            "scripts/test-modular-assembly-run3.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-applications-cert.mjs",
            "scripts/test-modular-assembly-run3.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-applications-cert.mjs",
            "scripts/test-modular-assembly-run3.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-applications-cert.mjs",
            "scripts/test-modular-assembly-run3.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-applications-cert.mjs",
            "scripts/test-modular-assembly-run3.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-applications-cert.mjs",
            "scripts/test-modular-assembly-run3.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-applications-cert.mjs",
            "scripts/test-modular-assembly-run3.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-applications-cert.mjs",
          "scripts/test-modular-assembly-run3.ts"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-applications-cert.mjs",
          "scripts/test-modular-assembly-run3.ts"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-applications-cert.mjs",
          "scripts/test-modular-assembly-run3.ts"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-applications-cert.mjs",
          "scripts/test-modular-assembly-run3.ts"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-applications-cert.mjs",
          "scripts/test-modular-assembly-run3.ts"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-applications-cert.mjs",
          "scripts/test-modular-assembly-run3.ts"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-applications-cert.mjs",
          "scripts/test-modular-assembly-run3.ts"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-applications-cert.mjs",
          "scripts/test-modular-assembly-run3.ts"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-applications-cert.mjs",
          "scripts/test-modular-assembly-run3.ts"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-applications-cert.mjs",
          "scripts/test-modular-assembly-run3.ts"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "reports",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "b1066595365617bc3e3224d6346d789c6f4a241d84ee4a07e1b32b48eb3a87c1",
      evidenceFingerprint: "55c35e8bd25b14de180e4b24920c0bf8673cec87d08c7b7d86196e6f41bc9436",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-reports-cert.mjs",
            "scripts/test-ctp-portal-bi.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-reports-cert.mjs",
            "scripts/test-ctp-portal-bi.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-reports-cert.mjs",
            "scripts/test-ctp-portal-bi.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-reports-cert.mjs",
            "scripts/test-ctp-portal-bi.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-reports-cert.mjs",
            "scripts/test-ctp-portal-bi.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-reports-cert.mjs",
            "scripts/test-ctp-portal-bi.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-reports-cert.mjs",
            "scripts/test-ctp-portal-bi.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-reports-cert.mjs",
            "scripts/test-ctp-portal-bi.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-reports-cert.mjs",
            "scripts/test-ctp-portal-bi.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-portal-reports-cert.mjs",
            "scripts/test-ctp-portal-bi.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-reports-cert.mjs",
          "scripts/test-ctp-portal-bi.mjs"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-reports-cert.mjs",
          "scripts/test-ctp-portal-bi.mjs"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-reports-cert.mjs",
          "scripts/test-ctp-portal-bi.mjs"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-reports-cert.mjs",
          "scripts/test-ctp-portal-bi.mjs"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-reports-cert.mjs",
          "scripts/test-ctp-portal-bi.mjs"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-reports-cert.mjs",
          "scripts/test-ctp-portal-bi.mjs"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-reports-cert.mjs",
          "scripts/test-ctp-portal-bi.mjs"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-reports-cert.mjs",
          "scripts/test-ctp-portal-bi.mjs"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-reports-cert.mjs",
          "scripts/test-ctp-portal-bi.mjs"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-portal-reports-cert.mjs",
          "scripts/test-ctp-portal-bi.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "pulse",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "85f94d54cfb261888a0d3d6f2b12a4a4d4902152ed35f957be8de6caeca1d451",
      evidenceFingerprint: "f24770602d0cc66f3328a384a48e99c0325e749dbc38f6092cd1aa194121a236",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "simplifi",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "2e67779b2f93ebc6960787c811f6f03d16a6773855a9e1a01aefdd6dc7d32da5",
      evidenceFingerprint: "326b3e2a182f124b7bd954102afe328ee68d1914ab4c8f8aa4a9232de7368ae3",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-foundation.mjs",
            "scripts/test-simplifi-p0-capture-success.mjs",
            "scripts/test-simplifi-orb-outcome-states-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-foundation.mjs",
            "scripts/test-simplifi-p0-capture-success.mjs",
            "scripts/test-simplifi-orb-outcome-states-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-foundation.mjs",
            "scripts/test-simplifi-p0-capture-success.mjs",
            "scripts/test-simplifi-orb-outcome-states-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-foundation.mjs",
            "scripts/test-simplifi-p0-capture-success.mjs",
            "scripts/test-simplifi-orb-outcome-states-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-foundation.mjs",
            "scripts/test-simplifi-p0-capture-success.mjs",
            "scripts/test-simplifi-orb-outcome-states-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-foundation.mjs",
            "scripts/test-simplifi-p0-capture-success.mjs",
            "scripts/test-simplifi-orb-outcome-states-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-foundation.mjs",
            "scripts/test-simplifi-p0-capture-success.mjs",
            "scripts/test-simplifi-orb-outcome-states-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-foundation.mjs",
            "scripts/test-simplifi-p0-capture-success.mjs",
            "scripts/test-simplifi-orb-outcome-states-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-foundation.mjs",
            "scripts/test-simplifi-p0-capture-success.mjs",
            "scripts/test-simplifi-orb-outcome-states-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-foundation.mjs",
            "scripts/test-simplifi-p0-capture-success.mjs",
            "scripts/test-simplifi-orb-outcome-states-contract.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-foundation.mjs",
          "scripts/test-simplifi-p0-capture-success.mjs",
          "scripts/test-simplifi-orb-outcome-states-contract.mjs"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-foundation.mjs",
          "scripts/test-simplifi-p0-capture-success.mjs",
          "scripts/test-simplifi-orb-outcome-states-contract.mjs"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-foundation.mjs",
          "scripts/test-simplifi-p0-capture-success.mjs",
          "scripts/test-simplifi-orb-outcome-states-contract.mjs"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-foundation.mjs",
          "scripts/test-simplifi-p0-capture-success.mjs",
          "scripts/test-simplifi-orb-outcome-states-contract.mjs"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-foundation.mjs",
          "scripts/test-simplifi-p0-capture-success.mjs",
          "scripts/test-simplifi-orb-outcome-states-contract.mjs"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-foundation.mjs",
          "scripts/test-simplifi-p0-capture-success.mjs",
          "scripts/test-simplifi-orb-outcome-states-contract.mjs"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-foundation.mjs",
          "scripts/test-simplifi-p0-capture-success.mjs",
          "scripts/test-simplifi-orb-outcome-states-contract.mjs"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-foundation.mjs",
          "scripts/test-simplifi-p0-capture-success.mjs",
          "scripts/test-simplifi-orb-outcome-states-contract.mjs"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-foundation.mjs",
          "scripts/test-simplifi-p0-capture-success.mjs",
          "scripts/test-simplifi-orb-outcome-states-contract.mjs"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-foundation.mjs",
          "scripts/test-simplifi-p0-capture-success.mjs",
          "scripts/test-simplifi-orb-outcome-states-contract.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "connect",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "dfb63908c76796e3077196f2a7c5ab227eda073e7888f21224c3c40be2147941",
      evidenceFingerprint: "f24770602d0cc66f3328a384a48e99c0325e749dbc38f6092cd1aa194121a236",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "landing",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "aefdc0a94712c5ee717b16582e5f6cbe937ba581fd0b256cb4069e6335157413",
      evidenceFingerprint: "baf372d39015fcdcf3c887beb0d07ecff78fb007910acc8b05cf34667269a027",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-website-publish-gate.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-website-publish-gate.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-website-publish-gate.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-website-publish-gate.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-website-publish-gate.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-website-publish-gate.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-website-publish-gate.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-website-publish-gate.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-website-publish-gate.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-website-publish-gate.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-website-publish-gate.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-website-publish-gate.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-website-publish-gate.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-website-publish-gate.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-website-publish-gate.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-website-publish-gate.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-website-publish-gate.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-website-publish-gate.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-website-publish-gate.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-website-publish-gate.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "resources",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "fa805cdbe0fffb99fc103c1c2bdcf882beba8e2b78ee42ba5750ec0f2b1aa697",
      evidenceFingerprint: "679c304df87aedd025fe4c2d487eacc222518bc9a7544d87ad6c0de31edc8745",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-ctp-portal-asset-gallery.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-ctp-portal-asset-gallery.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-ctp-portal-asset-gallery.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-ctp-portal-asset-gallery.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-ctp-portal-asset-gallery.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-ctp-portal-asset-gallery.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-ctp-portal-asset-gallery.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-ctp-portal-asset-gallery.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-ctp-portal-asset-gallery.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts",
            "scripts/test-ctp-portal-asset-gallery.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-ctp-portal-asset-gallery.mjs"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-ctp-portal-asset-gallery.mjs"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-ctp-portal-asset-gallery.mjs"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-ctp-portal-asset-gallery.mjs"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-ctp-portal-asset-gallery.mjs"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-ctp-portal-asset-gallery.mjs"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-ctp-portal-asset-gallery.mjs"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-ctp-portal-asset-gallery.mjs"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-ctp-portal-asset-gallery.mjs"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts",
          "scripts/test-ctp-portal-asset-gallery.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "ask",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "ee0f1d8e15a8e9fc8449222a6f4cfee9f312191ef7c02b40f3dedade08dada63",
      evidenceFingerprint: "d03bf9dabba495e8546019e4421b4a5173db04c087cff0fc29b95fe6215f4b8b",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-phase1-ask-intel.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-phase1-ask-intel.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-phase1-ask-intel.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-phase1-ask-intel.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-phase1-ask-intel.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-phase1-ask-intel.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-phase1-ask-intel.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-phase1-ask-intel.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-phase1-ask-intel.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-simplifi-os-phase1-ask-intel.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-phase1-ask-intel.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-phase1-ask-intel.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-phase1-ask-intel.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-phase1-ask-intel.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-phase1-ask-intel.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-phase1-ask-intel.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-phase1-ask-intel.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-phase1-ask-intel.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-phase1-ask-intel.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-simplifi-os-phase1-ask-intel.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "ctp",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "1c7c44b4d3dd6fbe65065e81d94ca158db211c686758cd8841f6e637edbc8845",
      evidenceFingerprint: "4d1fd3fcfc771ee330610a48b27cb0ec42b79374319df098cea5f68145ceb37f",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-approve-reveal.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-approve-reveal.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-approve-reveal.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-approve-reveal.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-approve-reveal.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-approve-reveal.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-approve-reveal.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-approve-reveal.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-approve-reveal.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-ctp-approve-reveal.mjs",
            "scripts/test-canonical-ctp-intake.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-approve-reveal.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-approve-reveal.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-approve-reveal.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-approve-reveal.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-approve-reveal.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-approve-reveal.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-approve-reveal.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-approve-reveal.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-approve-reveal.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-ctp-approve-reveal.mjs",
          "scripts/test-canonical-ctp-intake.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "member",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "cc0bb73728c3f6e8d07e91b3681b65dd52502d096ae0330d3955f83d032a1971",
      evidenceFingerprint: "f24770602d0cc66f3328a384a48e99c0325e749dbc38f6092cd1aa194121a236",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "settings",
      moduleVersion: 1,
      status: "certified",
      sourceFingerprint: "90d623daa547926bfed08ea8061d16a73f0ac0a51a1c901683401cf59f949847",
      evidenceFingerprint: "31521848afe81afca551ebfac5c43001212cd2eee9e2edea3ad13cc914c511f9",
      evidence: {
        "route-render": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-organization-workspace-config.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-organization-workspace-config.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-organization-workspace-config.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-organization-workspace-config.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-organization-workspace-config.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-organization-workspace-config.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-organization-workspace-config.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-organization-workspace-config.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-organization-workspace-config.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/test-capability-standard.mjs",
            "scripts/test-tenant-safety.mjs",
            "scripts/test-modular-assembly-run2.ts",
            "scripts/test-factory-build-verification-gates.mjs",
            "scripts/test-recovery-certification-contract.mjs",
            "scripts/test-organization-workspace-config.mjs",
            "scripts/test-modular-assembly-run4.ts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      evidenceClassTests: {
        "route-render": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-organization-workspace-config.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "responsive-ui": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-organization-workspace-config.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "authorization-tenant-isolation": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-organization-workspace-config.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "durable-persistence": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-organization-workspace-config.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "dependency-integration-readiness": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-organization-workspace-config.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "success-empty-failure-states": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-organization-workspace-config.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        observability: [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-organization-workspace-config.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "rollback-disable": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-organization-workspace-config.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "business-lifecycle": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-organization-workspace-config.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ],
        "immutable-version-fingerprint": [
          "scripts/test-capability-standard.mjs",
          "scripts/test-tenant-safety.mjs",
          "scripts/test-modular-assembly-run2.ts",
          "scripts/test-factory-build-verification-gates.mjs",
          "scripts/test-recovery-certification-contract.mjs",
          "scripts/test-organization-workspace-config.mjs",
          "scripts/test-modular-assembly-run4.ts"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "calendar",
      moduleVersion: 2,
      status: "certified",
      sourceFiles: [
        "lib/chassis/PortalShell.tsx",
        "app/portal/[slug]/ea-portal.css",
        "lib/bricks/durable.ts",
        "lib/bricks/access.ts",
        "lib/bricks/module-install.ts",
        "lib/bricks/provision-test.ts",
        "lib/tenant-foundation.ts",
        "app/api/admin/chassis/install/route.ts",
        "app/api/admin/entitlements/route.ts",
        "lib/calendar/storage.ts",
        "lib/calendar/nylas.ts",
        "app/api/portal/calendar/route.ts",
        "app/api/portal/[slug]/calendar/events/route.ts",
        "app/api/calendar/tenant-provision-test/route.ts",
        "app/portal/[slug]/calendar/page.tsx",
        "app/portal/[slug]/calendar/PortalCalendar.tsx"
      ],
      sourceFingerprint: "91fe56d5ad432c0136ec6a79bff9dd9c931078a6cddc6d223080d3a84579a85d",
      evidenceFingerprint: "6771adeb2e9215db996a2fa645649556043a2bcd60e6d5f928b081dfd58db5c7",
      evidence: {
        "route-render": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-blockers-ui.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/certify-blockers.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      certifiedBoundary: {
        scope: "EA-owned implementation with isolated executable lifecycle and rendered UI proof. No production deployment, real email delivery, external OAuth account or live Postgres write is asserted.",
        runtimeReadinessRequired: true
      },
      evidenceClassTests: {
        "route-render": [
          "tests/blockers-certified.test.mts"
        ],
        "responsive-ui": [
          "scripts/test-blockers-ui.mjs"
        ],
        "authorization-tenant-isolation": [
          "tests/blockers-certified.test.mts"
        ],
        "durable-persistence": [
          "tests/blockers-certified.test.mts"
        ],
        "dependency-integration-readiness": [
          "tests/blockers-certified.test.mts"
        ],
        "success-empty-failure-states": [
          "tests/blockers-certified.test.mts"
        ],
        observability: [
          "tests/blockers-certified.test.mts"
        ],
        "rollback-disable": [
          "tests/blockers-certified.test.mts"
        ],
        "business-lifecycle": [
          "tests/blockers-certified.test.mts"
        ],
        "immutable-version-fingerprint": [
          "scripts/certify-blockers.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "people",
      moduleVersion: 2,
      status: "certified",
      sourceFiles: [
        "lib/chassis/PortalShell.tsx",
        "app/portal/[slug]/ea-portal.css",
        "lib/bricks/durable.ts",
        "lib/bricks/access.ts",
        "lib/bricks/module-install.ts",
        "lib/bricks/provision-test.ts",
        "lib/tenant-foundation.ts",
        "app/api/admin/chassis/install/route.ts",
        "app/api/admin/entitlements/route.ts",
        "lib/people/errors.ts",
        "lib/people/adapter.ts",
        "lib/people/flags.ts",
        "lib/people/postgres-client.ts",
        "lib/people/postgres-repository.ts",
        "lib/people/ensure-person.ts",
        "lib/people/guard.ts",
        "lib/people/resolve-tenant.ts",
        "app/api/portal/[slug]/people/route.ts",
        "app/api/people/tenant-provision-test/route.ts",
        "app/portal/[slug]/people/page.tsx",
        "app/portal/[slug]/people/PeopleDirectory.tsx"
      ],
      sourceFingerprint: "f293e0ff6c476502d1d19919c24362ef69a46261aae63e934df3b9ff5541f31e",
      evidenceFingerprint: "6771adeb2e9215db996a2fa645649556043a2bcd60e6d5f928b081dfd58db5c7",
      evidence: {
        "route-render": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-blockers-ui.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/certify-blockers.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      certifiedBoundary: {
        scope: "EA-owned implementation with isolated executable lifecycle and rendered UI proof. No production deployment, real email delivery, external OAuth account or live Postgres write is asserted.",
        runtimeReadinessRequired: true
      },
      evidenceClassTests: {
        "route-render": [
          "tests/blockers-certified.test.mts"
        ],
        "responsive-ui": [
          "scripts/test-blockers-ui.mjs"
        ],
        "authorization-tenant-isolation": [
          "tests/blockers-certified.test.mts"
        ],
        "durable-persistence": [
          "tests/blockers-certified.test.mts"
        ],
        "dependency-integration-readiness": [
          "tests/blockers-certified.test.mts"
        ],
        "success-empty-failure-states": [
          "tests/blockers-certified.test.mts"
        ],
        observability: [
          "tests/blockers-certified.test.mts"
        ],
        "rollback-disable": [
          "tests/blockers-certified.test.mts"
        ],
        "business-lifecycle": [
          "tests/blockers-certified.test.mts"
        ],
        "immutable-version-fingerprint": [
          "scripts/certify-blockers.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    },
    {
      moduleId: "discovery",
      moduleVersion: 2,
      status: "certified",
      sourceFiles: [
        "lib/chassis/PortalShell.tsx",
        "app/portal/[slug]/ea-portal.css",
        "lib/bricks/durable.ts",
        "lib/bricks/access.ts",
        "lib/bricks/module-install.ts",
        "lib/bricks/provision-test.ts",
        "lib/tenant-foundation.ts",
        "app/api/admin/chassis/install/route.ts",
        "app/api/admin/entitlements/route.ts",
        "lib/discovery/storage.ts",
        "lib/analysis-engine.ts",
        "lib/modules/registry.ts",
        "app/assessment/page.tsx",
        "app/api/portal/[slug]/discovery/route.ts",
        "app/api/assessment/tenant-provision-test/route.ts",
        "app/portal/[slug]/discovery/page.tsx",
        "app/portal/[slug]/discovery/DiscoveryForm.tsx"
      ],
      sourceFingerprint: "37118b3dd17306ed82c4b326d3dfef2165933100d6359134134afbbd9c6c62c6",
      evidenceFingerprint: "6771adeb2e9215db996a2fa645649556043a2bcd60e6d5f928b081dfd58db5c7",
      evidence: {
        "route-render": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "responsive-ui": {
          tests: [
            "scripts/test-blockers-ui.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "authorization-tenant-isolation": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "durable-persistence": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "dependency-integration-readiness": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "success-empty-failure-states": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        observability: {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "rollback-disable": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "business-lifecycle": {
          tests: [
            "tests/blockers-certified.test.mts"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        },
        "immutable-version-fingerprint": {
          tests: [
            "scripts/certify-blockers.mjs"
          ],
          scope: "Reusable brick/module contracts and cross-cutting assembly evidence; project-specific acceptance checks remain separate gates."
        }
      },
      certifiedBoundary: {
        scope: "EA-owned implementation with isolated executable lifecycle and rendered UI proof. No production deployment, real email delivery, external OAuth account or live Postgres write is asserted.",
        runtimeReadinessRequired: true
      },
      evidenceClassTests: {
        "route-render": [
          "tests/blockers-certified.test.mts"
        ],
        "responsive-ui": [
          "scripts/test-blockers-ui.mjs"
        ],
        "authorization-tenant-isolation": [
          "tests/blockers-certified.test.mts"
        ],
        "durable-persistence": [
          "tests/blockers-certified.test.mts"
        ],
        "dependency-integration-readiness": [
          "tests/blockers-certified.test.mts"
        ],
        "success-empty-failure-states": [
          "tests/blockers-certified.test.mts"
        ],
        observability: [
          "tests/blockers-certified.test.mts"
        ],
        "rollback-disable": [
          "tests/blockers-certified.test.mts"
        ],
        "business-lifecycle": [
          "tests/blockers-certified.test.mts"
        ],
        "immutable-version-fingerprint": [
          "scripts/certify-blockers.mjs"
        ]
      },
      sourceCommit: "1591b236f810f97216ffcba2178248402c58cd91"
    }
  ],
  scopeNotice: "This ledger certifies reusable brick/module contracts only. Project-specific runtime and acceptance code is outside this PR."
};

// lib/modules/certification-authority.ts
var inventory = new Map(capability_inventory_default.modules.map((x) => [x.id, x]));
var certificates = new Map(module_certification_evidence_default.certificates.map((x) => [x.moduleId, x]));
function certificationAuthority(id2) {
  const legacy = inventory.get(id2), certificate = certificates.get(id2);
  const exact = !!certificate && certificate.moduleVersion === legacy?.version;
  return { legacyStatus: legacy?.assemblyStatus, certificateStatus: certificate?.status, moduleVersion: certificate?.moduleVersion, exactVersion: exact, reusable: certificate?.status === "certified" && exact };
}

// lib/modules/registry.ts
import { resolveModuleEntitlements } from "@ea/payments-contract";

// lib/ea-template-registry.ts
var BASE = {
  navy: "#1B2B4D",
  gold: "#C9A844",
  cream: "#FAF8F3"
};
function theme(id2, accent, heroFrom, heroVia, heroTo, radial) {
  return { id: id2, navy: BASE.navy, gold: BASE.gold, cream: BASE.cream, accent, heroFrom, heroVia, heroTo, radial };
}
var MAGNIFI_TEMPLATES = {
  "executive-transformation": {
    id: "executive-transformation",
    name: "Executive Transformation\u2122",
    example: "Selena",
    audience: "Executives, managers, corporate leaders",
    journey: ["Experience", "Expertise", "Asset", "Platform", "Ownership"],
    magnifiProduct: "Magnifi",
    pairedSimplifiAssessment: "operational-friction",
    theme: theme("executive-transformation", "#C9A844", "#0f1829", "#1B2B4D", "#243a66", "#C9A844"),
    cinematicHook: () => "You have built something real. The next chapter should feel inevitable.",
    twelveMonths: (org) => `Twelve months from now, ${org} could package expertise into a platform stakeholders believe in \u2014 with visible progress every quarter.`,
    missionControlLine: "Mission Control turns executive intent into tracked adoption across teams and clients.",
    ctaLabel: "Start Simplifi Assessment",
    ctaHref: "/assessment",
    detectPatterns: [/executive|corporate|manager|director|vp|leadership|selena/i]
  },
  "entrepreneur-launch": {
    id: "entrepreneur-launch",
    name: "Entrepreneur Launch\u2122",
    audience: "Small business owners, solopreneurs, consultants",
    journey: ["Current Business", "Missed Opportunities", "Systems", "Scale", "Freedom"],
    magnifiProduct: "Magnifi",
    pairedSimplifiAssessment: "business-visibility",
    theme: theme("entrepreneur-launch", "#E8C547", "#121820", "#1a2840", "#2a3f5f", "#E8C547"),
    cinematicHook: () => "Freedom is not fewer hours \u2014 it is systems that protect your best ones.",
    twelveMonths: (org) => `Twelve months from now, ${org} could run on visible systems \u2014 not heroics \u2014 with leads, delivery, and growth in one rhythm.`,
    missionControlLine: "See every opportunity, client touchpoint, and follow-through in one command view.",
    ctaLabel: "Improve Visibility",
    ctaHref: "/simplifi",
    detectPatterns: [/solopreneur|founder|consult|coach|small business|entrepreneur/i]
  },
  "hidden-asset-discovery": {
    id: "hidden-asset-discovery",
    name: "Hidden Asset Discovery\u2122",
    audience: "Professionals, teachers, nurses, veterans, retirees",
    journey: ["Career", "Hidden Assets", "Market Value", "Business Opportunity", "Ownership"],
    magnifiProduct: "Magnifi",
    pairedSimplifiAssessment: "capacity-recovery",
    theme: theme("hidden-asset-discovery", "#6B9AC4", "#141c28", "#1e2d42", "#2d4563", "#6B9AC4"),
    cinematicHook: () => "Your career holds assets the market has never seen packaged \u2014 until now.",
    twelveMonths: (org) => `Twelve months from now, ${org} could own a clear offer, a visible platform, and income beyond the clock.`,
    missionControlLine: "Capture expertise once \u2014 reuse it across proposals, training, and client delivery.",
    ctaLabel: "Discover Your Assets",
    ctaHref: "/assessment",
    detectPatterns: [/teacher|nurse|veteran|retiree|professional|hidden asset|career/i]
  },
  "community-blueprint": {
    id: "community-blueprint",
    name: "Community Blueprint\u2122",
    example: "BAS",
    audience: "Associations, fraternities, sororities, nonprofits",
    journey: ["Legacy", "Engagement", "Connection", "Community", "Impact"],
    magnifiProduct: "Magnifi",
    pairedSimplifiAssessment: "community-health",
    theme: theme("community-blueprint", "#9B7BB8", "#1a1528", "#2a2240", "#3d3258", "#9B7BB8"),
    cinematicHook: () => "Legacy is not history. It is momentum waiting for a system.",
    twelveMonths: (org) => `Twelve months from now, ${org} could measure engagement, not just activity \u2014 with members who feel seen and stay connected.`,
    missionControlLine: "Chapter updates, events, and member stories flow through one visible hub.",
    ctaLabel: "Revitalize Community",
    ctaHref: "/simplifi",
    detectPatterns: [/fraternity|sorority|chapter|association|nonprofit|bas|legacy|community hub/i]
  },
  "university-ecosystem": {
    id: "university-ecosystem",
    name: "University Ecosystem\u2122",
    example: "JCSU",
    audience: "Universities, alumni associations, advancement offices",
    journey: ["Students", "Graduates", "Alumni", "Mentors", "Donors", "Legacy"],
    magnifiProduct: "Magnifi",
    pairedSimplifiAssessment: "membership-growth",
    theme: theme("university-ecosystem", "#B84A4A", "#1a1218", "#2a1a22", "#3d2838", "#B84A4A"),
    cinematicHook: () => "A future your alumni can see \u2014 before they ever write a check.",
    twelveMonths: (org) => `Twelve months from now, ${org} could connect students, alumni, mentors, and donors in one living ecosystem.`,
    missionControlLine: "Advancement sees pipeline, engagement, and story \u2014 not scattered spreadsheets.",
    ctaLabel: "Grow Membership",
    ctaHref: "/assessment",
    detectPatterns: [/university|alumni|college|campus|student|jcsu|advancement/i]
  },
  "legacy-and-scale": {
    id: "legacy-and-scale",
    name: "Legacy & Scale\u2122",
    example: "No Grease",
    audience: "Established owners, franchise operators, multi-location founders",
    journey: ["Founder", "Systems", "Knowledge Capture", "Platform", "Legacy"],
    magnifiProduct: "Magnifi",
    pairedSimplifiAssessment: "training-effectiveness",
    theme: theme("legacy-and-scale", "#C4A574", "#18140f", "#2a2418", "#3d3524", "#C4A574"),
    cinematicHook: () => "What you know should outlive your calendar \u2014 and scale without you in every room.",
    twelveMonths: (org) => `Twelve months from now, ${org} could run on captured knowledge, repeatable systems, and a brand that scales locations.`,
    missionControlLine: "Franchise playbook, training, and performance visible across every location.",
    ctaLabel: "Capture Knowledge",
    ctaHref: "/simplifi",
    detectPatterns: [/franchise|multi-location|no grease|founder|scale|legacy/i]
  },
  "media-empire": {
    id: "media-empire",
    name: "Media Empire\u2122",
    example: "Jesse Mitchell",
    audience: "Podcasters, influencers, content creators",
    journey: ["Audience", "Content", "Community", "Platform", "Network"],
    magnifiProduct: "Amplifi",
    pairedSimplifiAssessment: "social-media-effectiveness",
    theme: theme("media-empire", "#4A90D9", "#0f1419", "#1a2433", "#2a3a52", "#4A90D9"),
    cinematicHook: () => "Your audience is real. Your platform should match the size of your voice.",
    twelveMonths: (org) => `Twelve months from now, ${org} could monetize attention with systems \u2014 not burnout \u2014 and a community that compounds.`,
    missionControlLine: "Content pipeline, sponsors, and community health in one Amplifi command center.",
    ctaLabel: "Amplify Reach",
    ctaHref: "/simplifi",
    detectPatterns: [/podcast|influencer|content creator|media|youtube|jesse/i]
  },
  "financial-transformation": {
    id: "financial-transformation",
    name: "Financial Transformation\u2122",
    audience: "Financial coaches, advisors, educators, ETFM",
    journey: ["Chaos", "Visibility", "Structure", "Control", "Freedom"],
    magnifiProduct: "Fortifi",
    pairedSimplifiAssessment: "customer-experience",
    theme: theme("financial-transformation", "#4CAF7A", "#0f1814", "#1a2a22", "#2a4034", "#4CAF7A"),
    cinematicHook: () => "Clarity is the product. Control is the experience clients pay for.",
    twelveMonths: (org) => `Twelve months from now, ${org} could deliver structured financial clarity clients feel \u2014 not just spreadsheets they fear.`,
    missionControlLine: "Client journeys, touchpoints, and outcomes tracked with Fortifi precision.",
    ctaLabel: "Structure Client Experience",
    ctaHref: "/assessment",
    detectPatterns: [/financial|etfm|advisor|coach|wealth|budget|fortifi/i]
  },
  "athlete-development": {
    id: "athlete-development",
    name: "Athlete Development\u2122",
    example: "CPR",
    audience: "Athletes, coaches, recruiting services",
    journey: ["Potential", "Development", "Exposure", "Opportunity", "Success"],
    magnifiProduct: "Amplifi",
    pairedSimplifiAssessment: "website-clarity",
    theme: theme("athlete-development", "#C9A844", "#0a1628", "#1B2B4D", "#2d4a6e", "#C9A844"),
    cinematicHook: () => "Potential is visible. The path to opportunity should be too.",
    twelveMonths: (org) => `Twelve months from now, ${org} could connect development, exposure, and recruiting in one trusted showcase.`,
    missionControlLine: "CPR-style visibility \u2014 profiles, camps, and follow-up in one recruiting rhythm.",
    ctaLabel: "Showcase Potential",
    ctaHref: "https://cpr-site.vercel.app",
    detectPatterns: [/athlete|recruit|basketball|camp|showcase|cpr|amplifi/i]
  },
  "faith-community-impact": {
    id: "faith-community-impact",
    name: "Faith & Community Impact\u2122",
    audience: "Churches, faith leaders, faith-based nonprofits",
    journey: ["Mission", "Engagement", "Connection", "Growth", "Impact"],
    magnifiProduct: "Magnifi",
    pairedSimplifiAssessment: "communication-effectiveness",
    theme: theme("faith-community-impact", "#D4B86A", "#141820", "#1B2438", "#2a3550", "#D4B86A"),
    cinematicHook: () => "A mission that moves people \u2014 not just meetings that fill calendars.",
    twelveMonths: (org) => `Twelve months from now, ${org} could grow connection between services, small groups, and community impact people can see.`,
    missionControlLine: "Announcements, care, and volunteer rhythm visible to every leader and member.",
    ctaLabel: "Strengthen Communication",
    ctaHref: "/simplifi",
    detectPatterns: [/church|faith|ministry|congregation|pastor|worship/i]
  }
};
var SIMPLIFI_ASSESSMENTS = {
  "website-clarity": {
    id: "website-clarity",
    name: "Website Clarity Assessment\u2122",
    scope: "Landing pages, funnels, websites, lead capture",
    pairedMagnifiTemplate: "athlete-development",
    openingInsight: (org) => `${org}'s site is working harder to explain itself than to attract the right next conversation.`,
    consequences: ["Lost leads", "Lost trust", "Lost conversions", "Lost momentum"],
    futureState: ["Clear hero message", "Obvious next step", "Mobile-ready journey", "Measurable conversions"],
    strengths: ["Existing web presence", "Content to refine", "Quick-win clarity opportunities"],
    progressPath: [
      { stage: "Current State", description: "Visitors arrive \u2014 but too many leave without acting." },
      { stage: "Improved State", description: "One clear path from visit to conversation." },
      { stage: "Optimized State", description: "Site converts consistently and feeds Pulse." }
    ],
    detectPatterns: [/website|landing|funnel|homepage|web design/i]
  },
  "communication-effectiveness": {
    id: "communication-effectiveness",
    name: "Communication Effectiveness Assessment\u2122",
    scope: "Internal, stakeholder, and member communication",
    pairedMagnifiTemplate: "faith-community-impact",
    openingInsight: (org) => `${org} is communicating \u2014 but important messages are not always reaching people at the moment they are ready to act.`,
    consequences: ["Lost participation", "Lost engagement", "Lost alignment", "Lost trust"],
    futureState: ["Rhythm people expect", "Clear channels", "Two-way feedback", "Visible updates"],
    strengths: ["Active audience", "Multiple touchpoints", "Stories worth sharing"],
    progressPath: [
      { stage: "Current State", description: "Messages go out \u2014 impact is unclear." },
      { stage: "Improved State", description: "Update Hub centralizes what matters." },
      { stage: "Optimized State", description: "Engagement measurable in Pulse." }
    ],
    detectPatterns: [/newsletter|announcement|communication|email|update hub/i]
  },
  "membership-growth": {
    id: "membership-growth",
    name: "Membership Growth Assessment\u2122",
    scope: "Associations, churches, alumni, fraternities, sororities",
    pairedMagnifiTemplate: "university-ecosystem",
    openingInsight: (org) => `${org} has members \u2014 but growth may depend on moments you are not consistently capturing.`,
    consequences: ["Lost renewals", "Lost referrals", "Lost participation", "Lost legacy"],
    futureState: ["Onboarding that sticks", "Mentor pathways", "Visible member wins", "Referral rhythm"],
    strengths: ["Existing member base", "Community identity", "Events and rituals to leverage"],
    progressPath: [
      { stage: "Current State", description: "Membership exists \u2014 growth feels episodic." },
      { stage: "Improved State", description: "Journey mapped from join to advocate." },
      { stage: "Optimized State", description: "Growth predictable and visible." }
    ],
    detectPatterns: [/membership|alumni|association|join|renew/i]
  },
  "business-visibility": {
    id: "business-visibility",
    name: "Business Visibility Assessment\u2122",
    scope: "Brand presence, digital presence, search, lead generation",
    pairedMagnifiTemplate: "entrepreneur-launch",
    openingInsight: (org) => `${org} delivers real value \u2014 but the market may not see you when buyers are ready to decide.`,
    consequences: ["Lost leads", "Lost revenue", "Lost credibility", "Lost capacity"],
    futureState: ["Consistent brand", "Search-ready presence", "Clear offer", "Lead capture that works"],
    strengths: ["Proven offer", "Client proof", "Digital assets to amplify"],
    progressPath: [
      { stage: "Current State", description: "Visibility depends on hustle, not system." },
      { stage: "Improved State", description: "One canonical presence and capture flow." },
      { stage: "Optimized State", description: "Pipeline visible in Mission Control." }
    ],
    detectPatterns: [/brand|visibility|seo|search|lead gen|marketing/i]
  },
  "social-media-effectiveness": {
    id: "social-media-effectiveness",
    name: "Social Media Effectiveness Assessment\u2122",
    scope: "Content, engagement, visibility, consistency",
    pairedMagnifiTemplate: "media-empire",
    openingInsight: (org) => `${org} is posting \u2014 but content may not be compounding into community or conversion.`,
    consequences: ["Lost reach", "Lost engagement", "Lost monetization", "Lost time"],
    futureState: ["Content system", "Engagement loops", "Community hub", "Sponsor-ready metrics"],
    strengths: ["Existing audience", "Content history", "Voice and perspective"],
    progressPath: [
      { stage: "Current State", description: "Posts go out \u2014 impact is fuzzy." },
      { stage: "Improved State", description: "Editorial rhythm with Amplifi support." },
      { stage: "Optimized State", description: "Audience becomes platform." }
    ],
    detectPatterns: [/social|instagram|tiktok|linkedin|podcast|content/i]
  },
  "training-effectiveness": {
    id: "training-effectiveness",
    name: "Training Effectiveness Assessment\u2122",
    scope: "Onboarding, knowledge transfer, learning systems",
    pairedMagnifiTemplate: "legacy-and-scale",
    openingInsight: (org) => `${org} trains people \u2014 but knowledge may still live in people, not systems.`,
    consequences: ["Lost consistency", "Lost scale", "Lost quality", "Lost time"],
    futureState: ["Documented playbooks", "Onboarding paths", "Measurable competency", "Captured expertise"],
    strengths: ["Experienced team", "Repeatable processes", "Training culture potential"],
    progressPath: [
      { stage: "Current State", description: "Training is person-dependent." },
      { stage: "Improved State", description: "Core knowledge captured once." },
      { stage: "Optimized State", description: "Scale without quality drop." }
    ],
    detectPatterns: [/training|onboard|learning|course|staff|volunteer/i]
  },
  "operational-friction": {
    id: "operational-friction",
    name: "Operational Friction Assessment\u2122",
    scope: "Processes, workflows, efficiency, capacity",
    pairedMagnifiTemplate: "executive-transformation",
    openingInsight: (org) => `${org}'s team is busy \u2014 but much of that activity may not be creating forward momentum.`,
    consequences: ["Lost time", "Lost capacity", "Lost revenue", "Lost focus"],
    futureState: ["Mapped workflows", "Automated handoffs", "Visible bottlenecks", "Recovered hours"],
    strengths: ["High activity", "Clear pain points", "Leadership ready for change"],
    progressPath: [
      { stage: "Current State", description: "Friction visible \u2014 fixes scattered." },
      { stage: "Improved State", description: "Top three bottlenecks addressed." },
      { stage: "Optimized State", description: "Capacity gains tracked in Pulse." }
    ],
    detectPatterns: [/workflow|process|operational|friction|manual|spreadsheet/i]
  },
  "customer-experience": {
    id: "customer-experience",
    name: "Customer Experience Assessment\u2122",
    scope: "Journey, touchpoints, follow-up, engagement",
    pairedMagnifiTemplate: "financial-transformation",
    openingInsight: (org) => `${org} serves clients \u2014 but the journey between first touch and long-term loyalty may have gaps.`,
    consequences: ["Lost clients", "Lost referrals", "Lost lifetime value", "Lost trust"],
    futureState: ["Mapped journey", "Proactive follow-up", "Portal access", "Pulse-visible success"],
    strengths: ["Client relationships", "Service quality", "Touchpoints to unify"],
    progressPath: [
      { stage: "Current State", description: "Experience varies by who handles it." },
      { stage: "Improved State", description: "Standard journey with Update Hub." },
      { stage: "Optimized State", description: "Success scores rise in Pulse." }
    ],
    detectPatterns: [/customer|client|journey|touchpoint|cx|service/i]
  },
  "community-health": {
    id: "community-health",
    name: "Community Health Assessment\u2122",
    scope: "Participation, engagement, communication, connection",
    pairedMagnifiTemplate: "community-blueprint",
    openingInsight: (org) => `${org} has community \u2014 but not every member feels the same momentum or connection.`,
    consequences: ["Lost participation", "Lost engagement", "Lost connection", "Lost impact"],
    futureState: ["Engagement rhythm", "Member visibility", "Shared wins", "Legacy stories"],
    strengths: ["Strong identity", "Active core", "Events and traditions"],
    progressPath: [
      { stage: "Current State", description: "Activity uneven across members." },
      { stage: "Improved State", description: "Engagement visible and celebrated." },
      { stage: "Optimized State", description: "Community health tracked in Pulse." }
    ],
    detectPatterns: [/community|chapter|member|engagement|participation/i]
  },
  "capacity-recovery": {
    id: "capacity-recovery",
    name: "Capacity Recovery Assessment\u2122",
    scope: "Time leakage, bottlenecks, constraints, hidden opportunity",
    pairedMagnifiTemplate: "hidden-asset-discovery",
    openingInsight: (org) => `${org} is capable \u2014 but hidden time leaks and bottlenecks may be costing more than you see.`,
    consequences: ["Lost hours", "Lost opportunity", "Lost growth", "Lost energy"],
    futureState: ["Recovered hours", "Clear priorities", "Protected focus time", "Visible wins"],
    strengths: ["High capability", "Identifiable constraints", "Quick recovery potential"],
    progressPath: [
      { stage: "Current State", description: "Capacity feels constrained." },
      { stage: "Improved State", description: "Hours recovered weekly." },
      { stage: "Optimized State", description: "Growth friction removed." }
    ],
    detectPatterns: [/capacity|time recovery|bottleneck|constraint|blueprint/i]
  }
};
var NAME_TO_MAGNIFI = Object.fromEntries(
  Object.values(MAGNIFI_TEMPLATES).map((t) => [t.name.replace("\u2122", "").toLowerCase(), t.id])
);
var ALL_MAGNIFI_TEMPLATE_IDS = Object.keys(MAGNIFI_TEMPLATES);
var ALL_SIMPLIFI_ASSESSMENT_IDS = Object.keys(SIMPLIFI_ASSESSMENTS);

// lib/experience-registry.ts
var CAPABILITY_REGISTRY = [
  {
    id: "command-view",
    moduleId: "dashboard",
    customerGoal: "Know where I stand today",
    plainLanguage: "Home",
    eaCapability: "Command View",
    displayLabel: "Dashboard",
    disclosureLevel: "L1",
    navGroup: "core",
    showInSidebar: true,
    showInPillNav: true,
    navTabId: "home",
    dashboardZone: "north-star",
    showOnDashboardHub: true,
    orbPolicy: "introduce",
    routePatterns: ["/portal/login"],
    osLifecycle: "measure"
  },
  {
    id: "organization-health",
    moduleId: "pulse",
    customerGoal: "Know how we're doing",
    plainLanguage: "Progress",
    eaCapability: "Organization Health & Signals",
    displayLabel: "Pulse",
    poweredBy: "Pulse\u2122",
    disclosureLevel: "L1",
    navGroup: "core",
    showInSidebar: true,
    showInPillNav: true,
    navTabId: "pulse",
    dashboardZone: "progress",
    showOnDashboardHub: true,
    hubVariant: "pulse",
    orbPolicy: "summarize",
    routePatterns: ["/pulse"],
    osLifecycle: "measure"
  },
  {
    id: "opportunity-capture",
    moduleId: "simplifi",
    customerGoal: "Never lose an opportunity",
    plainLanguage: "Capture",
    eaCapability: "Opportunity Capture & Decide",
    displayLabel: "Simplifi",
    poweredBy: "Simplifi\u2122",
    disclosureLevel: "L1",
    navGroup: "growth",
    showInSidebar: true,
    showInPillNav: true,
    navTabId: "simplifi",
    dashboardZone: "today",
    showOnDashboardHub: true,
    hubVariant: "simplifi",
    orbPolicy: "introduce",
    routePatterns: ["/simplifi"],
    osLifecycle: "capture"
  },
  {
    id: "amplification",
    moduleId: "amplifi",
    customerGoal: "Grow awareness & reach",
    plainLanguage: "Amplify",
    eaCapability: "Amplification & Distribution",
    displayLabel: "Amplifi",
    poweredBy: "Amplifi\u2122",
    disclosureLevel: "L1",
    navGroup: "growth",
    showInSidebar: true,
    showInPillNav: true,
    navTabId: "amplifi",
    dashboardZone: "today",
    showOnDashboardHub: true,
    hubVariant: "amplifi",
    orbPolicy: "recommend",
    routePatterns: ["/amplifi"],
    osLifecycle: "communicate"
  },
  {
    id: "advisor-activity",
    moduleId: "update-hub",
    customerGoal: "Talk to EA & see replies",
    plainLanguage: "Activity",
    eaCapability: "Advisor Communication & Feed",
    displayLabel: "Updates",
    poweredBy: "Update Hub\u2122",
    disclosureLevel: "L1",
    navGroup: "core",
    showInSidebar: true,
    showInPillNav: true,
    navTabId: "updates",
    dashboardZone: "today",
    showOnDashboardHub: true,
    orbPolicy: "recommend",
    routePatterns: ["/updates"],
    osLifecycle: "communicate"
  },
  {
    id: "messaging",
    moduleId: "messaging",
    customerGoal: "Send a message to EA",
    plainLanguage: "Send a message",
    eaCapability: "Messaging",
    displayLabel: "Messaging",
    disclosureLevel: "L2",
    navGroup: "operations",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "none",
    showOnDashboardHub: true,
    orbPolicy: "route-to-activity",
    routePatterns: ["/messaging", "/messages"],
    osLifecycle: "communicate"
  },
  {
    id: "documents",
    moduleId: "documents",
    customerGoal: "Find shared files & materials",
    plainLanguage: "Documents",
    eaCapability: "Document Access",
    displayLabel: "Document Hub\u2122",
    disclosureLevel: "L2",
    navGroup: "operations",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "none",
    showOnDashboardHub: true,
    orbPolicy: "ignore",
    routePatterns: ["/documents"],
    osLifecycle: "organize"
  },
  {
    id: "learning",
    moduleId: "training",
    customerGoal: "Learn how to use the platform",
    plainLanguage: "Learning",
    eaCapability: "Training & Guides",
    displayLabel: "Training Hub\u2122",
    disclosureLevel: "L2",
    navGroup: "operations",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "today",
    showOnDashboardHub: true,
    orbPolicy: "teach",
    routePatterns: ["/learning", "/academy"],
    osLifecycle: "organize"
  },
  {
    id: "shared-calendar",
    moduleId: "calendar",
    customerGoal: "Coordinate shared dates and availability",
    plainLanguage: "Shared calendar",
    eaCapability: "Connected Calendar",
    displayLabel: "EA Shared Calendar\u2122",
    disclosureLevel: "L2",
    navGroup: "operations",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "today",
    showOnDashboardHub: true,
    orbPolicy: "summarize",
    routePatterns: ["/calendar"],
    osLifecycle: "organize"
  },
  {
    id: "events",
    moduleId: "events",
    customerGoal: "Coordinate appointments and events",
    plainLanguage: "Calendar & events",
    eaCapability: "Shared Scheduling & Events",
    displayLabel: "Calendar & Event Hub\u2122",
    disclosureLevel: "L3",
    navGroup: "operations",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "none",
    showOnDashboardHub: true,
    orbPolicy: "ignore",
    routePatterns: ["/events"],
    osLifecycle: "organize"
  },
  {
    id: "resources",
    moduleId: "resources",
    customerGoal: "Browse tools & templates",
    plainLanguage: "Resources",
    eaCapability: "Resource Library",
    displayLabel: "Resource library",
    disclosureLevel: "L3",
    navGroup: "operations",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "none",
    showOnDashboardHub: true,
    orbPolicy: "ignore",
    routePatterns: ["/resources"],
    osLifecycle: "organize"
  },
  {
    id: "ask-advisor",
    moduleId: "ask",
    customerGoal: "Ask a quick question",
    plainLanguage: "Ask a question",
    eaCapability: "Advisor Q&A",
    displayLabel: "Guide\u2122",
    disclosureLevel: "L2",
    navGroup: "operations",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "none",
    showOnDashboardHub: true,
    orbPolicy: "route-to-activity",
    routePatterns: ["/ask"],
    osLifecycle: "communicate"
  },
  {
    id: "relationship-capture",
    moduleId: "connect",
    customerGoal: "Track in-person connections",
    plainLanguage: "Connect",
    eaCapability: "Relationship Capture",
    displayLabel: "Connect",
    disclosureLevel: "L2",
    navGroup: "growth",
    showInSidebar: true,
    showInPillNav: true,
    navTabId: "connect",
    dashboardZone: "none",
    showOnDashboardHub: true,
    orbPolicy: "teach",
    routePatterns: ["/connect"],
    osLifecycle: "capture"
  },
  {
    id: "guided-discovery",
    moduleId: "discovery",
    customerGoal: "Understand my capacity",
    plainLanguage: "Assessment",
    eaCapability: "Operational MRI\u2122",
    displayLabel: "Discovery",
    disclosureLevel: "L3",
    navGroup: "growth",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "none",
    showOnDashboardHub: true,
    orbPolicy: "contextual",
    routePatterns: ["/assessment", "/discovery"],
    osLifecycle: "measure"
  },
  {
    id: "your-build",
    moduleId: "ctp",
    customerGoal: "See my build progress",
    plainLanguage: "Your Build",
    eaCapability: "Discovery & First Build",
    displayLabel: "Consider the Possibilities",
    disclosureLevel: "L1",
    navGroup: "operations",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "discovery",
    showOnDashboardHub: true,
    orbPolicy: "contextual",
    routePatterns: ["/ctp"],
    osLifecycle: "act"
  },
  {
    id: "member-experience",
    moduleId: "member",
    customerGoal: "Give members a clear home",
    plainLanguage: "Member home",
    eaCapability: "Member Experience",
    displayLabel: "Member",
    disclosureLevel: "L1",
    navGroup: "operations",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "today",
    showOnDashboardHub: true,
    orbPolicy: "introduce",
    routePatterns: ["/member"],
    osLifecycle: "communicate"
  },
  {
    id: "people-directory",
    moduleId: "people",
    customerGoal: "Find people and relationships in this organization",
    plainLanguage: "People",
    eaCapability: "People & Relationships",
    displayLabel: "People",
    disclosureLevel: "L2",
    navGroup: "operations",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "none",
    showOnDashboardHub: false,
    orbPolicy: "ignore",
    routePatterns: ["/people"],
    osLifecycle: "organize"
  },
  {
    id: "landing-pages",
    moduleId: "landing",
    customerGoal: "Publish my website",
    plainLanguage: "Website & pages",
    eaCapability: "Landing / Marketing",
    displayLabel: "Landing Pages",
    disclosureLevel: "L2",
    navGroup: "growth",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "none",
    showOnDashboardHub: true,
    orbPolicy: "ignore",
    routePatterns: ["/landing", "/experience-builder", "/sites/"],
    osLifecycle: "capture"
  },
  {
    id: "billing",
    moduleId: "billing",
    customerGoal: "Manage subscription",
    plainLanguage: "Billing",
    eaCapability: "Subscription & Invoices",
    displayLabel: "Billing",
    disclosureLevel: "L2",
    navGroup: "platform",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "none",
    showOnDashboardHub: true,
    orbPolicy: "ignore",
    routePatterns: ["/billing"],
    osLifecycle: "act"
  },
  {
    id: "settings",
    moduleId: "settings",
    customerGoal: "Configure portal preferences",
    plainLanguage: "Settings",
    eaCapability: "Portal Settings",
    displayLabel: "Settings",
    disclosureLevel: "L2",
    navGroup: "platform",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "none",
    showOnDashboardHub: false,
    orbPolicy: "ignore",
    routePatterns: ["/settings"],
    osLifecycle: "act"
  },
  {
    id: "client-intake",
    moduleId: "intake",
    customerGoal: "Tell us what you need",
    plainLanguage: "Intake",
    eaCapability: "Client Intake",
    displayLabel: "Intake",
    disclosureLevel: "L1",
    navGroup: "operations",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "none",
    showOnDashboardHub: false,
    orbPolicy: "route-to-activity",
    routePatterns: ["/intake"],
    osLifecycle: "capture"
  },
  {
    id: "applications",
    moduleId: "applications",
    customerGoal: "Apply and track status",
    plainLanguage: "Applications",
    eaCapability: "Applications Queue",
    displayLabel: "Applications",
    disclosureLevel: "L1",
    navGroup: "growth",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "none",
    showOnDashboardHub: false,
    orbPolicy: "route-to-activity",
    routePatterns: ["/apply", "/applications"],
    osLifecycle: "convert"
  },
  {
    id: "operations-reports",
    moduleId: "reports",
    customerGoal: "Review curated insights",
    plainLanguage: "Reports",
    eaCapability: "Operations Reports",
    displayLabel: "Reports",
    disclosureLevel: "L2",
    navGroup: "operations",
    showInSidebar: true,
    showInPillNav: false,
    dashboardZone: "progress",
    showOnDashboardHub: true,
    orbPolicy: "summarize",
    routePatterns: ["/reports"],
    osLifecycle: "measure"
  }
];
var CAPABILITY_BY_MODULE = new Map(
  CAPABILITY_REGISTRY.map((c) => [c.moduleId, c])
);
var CAPABILITY_BY_ID = new Map(
  CAPABILITY_REGISTRY.map((c) => [c.id, c])
);
function getCapabilityByModuleId(moduleId) {
  return CAPABILITY_BY_MODULE.get(moduleId);
}
var EXPERIENCE_CATALOG = {
  "client-transformation": {
    id: "client-transformation",
    name: "Client Transformation",
    description: "CTP funnel \u2014 discovery through portal delivery and ongoing operations.",
    status: "active",
    audience: "EA clients purchasing transformation packages",
    convertAction: "Submit discovery assessment",
    integrations: ["Stripe", "Airtable", "Make", "Creative Studio"],
    magnifiTemplateIds: ALL_MAGNIFI_TEMPLATE_IDS,
    phases: {
      discover: { label: "Consider share", route: "/consider/{slug}" },
      engage: { label: "CTP Consider", route: "https://cc.efficiencyarchitects.online/ctp" },
      convert: { label: "Assessment submit", route: "/api/assessment/submit" },
      prepare: { label: "Workspace provision", route: "/api/ctp/submissions/{id}/provision-workspace" },
      experience: { label: "Portal CTP status", route: "/portal/{slug}/ctp", moduleId: "ctp" },
      continue: { label: "Portal operating rhythm", route: "/portal/{slug}", moduleId: "dashboard" }
    }
  },
  "magnifi-consider": {
    id: "magnifi-consider",
    name: "Magnifi Consider",
    description: "Shareable cinematic opportunity experience before commitment.",
    status: "active",
    audience: "Prospects evaluating EA transformation",
    convertAction: "Start assessment or Simplifi capture",
    integrations: ["Airtable captures"],
    magnifiTemplateIds: ALL_MAGNIFI_TEMPLATE_IDS,
    phases: {
      discover: { label: "Share link", route: "/magnifi/{id}" },
      engage: { label: "Cinematic experience", route: "/magnifi/{id}" },
      convert: { label: "CTA to assessment", route: "/assessment" },
      continue: { label: "Simplifi guidance", route: "/simplifi/guidance/{id}" }
    }
  },
  "connect-relationship": {
    id: "connect-relationship",
    name: "Connect Relationship",
    description: "QR/NFC relationship capture and nurture for events and communities.",
    status: "active",
    audience: "Organizations running events, recruiting, or community touchpoints",
    convertAction: "Submit connection",
    integrations: ["Airtable Connect", "Make nurture"],
    phases: {
      discover: { label: "QR or NFC", route: "/connect/{org}" },
      engage: { label: "Guided journey", route: "/connect/{org}/journey" },
      convert: { label: "Relationship capture", route: "/api/connect/relationships" },
      experience: { label: "Portal Connect", route: "/portal/{slug}/connect", moduleId: "connect" },
      continue: { label: "Nurture automations", route: "/api/admin/connect/run-nurture" }
    }
  },
  "portal-operating": {
    id: "portal-operating",
    name: "Portal Operating",
    description: "Entitled client portal modules after package fulfillment.",
    status: "active",
    audience: "Paying EA clients",
    convertAction: "Package purchase (Stripe)",
    integrations: ["Stripe", "Entitlements", "Pulse"],
    phases: {
      convert: { label: "Checkout", route: "/checkout" },
      prepare: { label: "Portal provision", route: "/api/webhooks/stripe" },
      experience: { label: "Portal modules", route: "/portal/{slug}" },
      continue: { label: "Pulse + updates", moduleId: "pulse" }
    }
  }
};
function listExperienceCatalog() {
  return Object.values(EXPERIENCE_CATALOG);
}
var EXPERIENCE_REGISTRY = listExperienceCatalog().map((entry) => ({
  ...entry,
  capabilityId: entry.id
}));

// lib/modules/registry.ts
var MODULE_IDS = [
  "dashboard",
  "pulse",
  "simplifi",
  "amplifi",
  "connect",
  "update-hub",
  "training",
  "landing",
  "discovery",
  "documents",
  "messaging",
  "calendar",
  "events",
  "resources",
  "ask",
  "billing",
  "settings",
  "ctp",
  "member",
  "people",
  "intake",
  "applications",
  "reports"
];
var CHASSIS_STANDARD_MODULE_IDS = ["dashboard", "amplifi", "update-hub"];
var TECHNICAL_MODULE_REGISTRY = [
  {
    id: "dashboard",
    name: "Dashboard",
    tag: "Dashboard",
    title: "Your command view",
    description: "Operational health, account status, and your latest share links.",
    requiredRole: "guest",
    pathSegment: ""
  },
  {
    id: "pulse",
    name: "Pulse\u2122",
    tag: "Pulse\u2122",
    title: "Visibility & intelligence",
    description: "Scores, bottlenecks, capacity, and what needs attention \u2014 one calm view.",
    variant: "pulse",
    requiredRole: "guest",
    pathSegment: "pulse"
  },
  {
    id: "simplifi",
    name: "Simplifi\u2122",
    tag: "Simplifi\u2122",
    title: "Capture & decide",
    description: "Paste any URL, score the opportunity, and launch Magnifi automatically.",
    variant: "simplifi",
    requiredRole: "staff",
    pathSegment: "simplifi"
  },
  {
    id: "amplifi",
    name: "Amplifi\u2122",
    tag: "Amplifi\u2122",
    title: "Amplify & share",
    description: "Draft and review social posts from Magnifi captures or Amplifi Search (topic + date range \u2192 sources \u2192 approval). Nothing auto-publishes.",
    variant: "amplifi",
    requiredRole: "guest",
    pathSegment: "amplifi"
  },
  {
    id: "update-hub",
    name: "Update Hub\u2122",
    tag: "Update Hub\u2122",
    title: "Activity feed",
    description: "Captures, outreach, enhancements, and advisor updates in one timeline.",
    requiredRole: "guest",
    pathSegment: "updates"
  },
  {
    id: "messaging",
    name: "Messaging",
    tag: "Communication",
    title: "Messaging center",
    description: "Direct messages with your EA advisor team.",
    requiredRole: "guest",
    pathSegment: "messaging"
  },
  {
    id: "documents",
    name: "Document Hub\u2122",
    tag: "Document Hub\u2122",
    title: "Document vault",
    description: "Assessments, agreements, scorecards, and onboarding materials.",
    requiredRole: "guest",
    pathSegment: "documents"
  },
  {
    id: "training",
    name: "Training Hub\u2122",
    tag: "Training Hub\u2122",
    title: "Training & learning",
    description: "Guides, modules, and resources for your transformation journey.",
    requiredRole: "guest",
    pathSegment: "learning"
  },
  {
    id: "calendar",
    name: "EA Shared Calendar\u2122",
    tag: "Calendar",
    title: "Shared calendar",
    description: "A shared tenant calendar with optional Google, Microsoft, iCloud, and Exchange calendars connected through Nylas.",
    requiredRole: "guest",
    pathSegment: "calendar"
  },
  {
    id: "events",
    name: "Calendar & Event Hub\u2122",
    tag: "Calendar & Events",
    title: "Calendar & shared scheduling",
    description: "Shared scheduling, advisor bookings, events, ticketing, and registrations in one hub.",
    requiredRole: "guest",
    pathSegment: "events"
  },
  {
    id: "resources",
    name: "Resource library",
    tag: "Resource library",
    title: "Tools & templates",
    description: "Magnifi templates, workspace links, and curated resources.",
    requiredRole: "guest",
    pathSegment: "resources"
  },
  {
    id: "ask",
    name: "Guide\u2122",
    tag: "Guide\u2122",
    title: "Ask your advisor",
    description: "Submit questions directly to your Efficiency Architects team.",
    requiredRole: "guest",
    pathSegment: "ask"
  },
  {
    id: "connect",
    name: "EA Connect\u2122",
    tag: "Connect\u2122",
    title: "Relationship capture",
    description: "QR, NFC, and guided journeys that turn conversations into relationships.",
    requiredRole: "staff",
    pathSegment: "connect"
  },
  {
    id: "discovery",
    name: "Discovery",
    tag: "Operational MRI\u2122",
    title: "Guided discovery",
    description: "Capacity assessment and transformation scoping for your organization.",
    requiredRole: "guest",
    pathSegment: "discovery"
  },
  {
    id: "ctp",
    name: "Consider the Possibilities",
    tag: "CTP\u2122",
    title: "Your discovery journey",
    description: "Track workspace, design studio, and review progress from your Consider submission.",
    requiredRole: "guest",
    pathSegment: "ctp"
  },
  {
    id: "member",
    name: "Member Experience",
    tag: "Member",
    title: "Member home",
    description: "Persona-shaped home with the tiles and next steps your members actually need.",
    requiredRole: "guest",
    pathSegment: "member"
  },
  {
    id: "people",
    name: "People",
    tag: "People",
    title: "People & relationships",
    description: "Directory of people, households, and relationships for this organization.",
    requiredRole: "staff",
    pathSegment: "people"
  },
  {
    id: "landing",
    name: "Landing Pages",
    tag: "Landing Pages",
    title: "Landing page experiences",
    description: "Your public site and Experience Builder publish workspace.",
    requiredRole: "owner",
    pathSegment: "landing"
  },
  {
    id: "billing",
    name: "Billing",
    tag: "Billing",
    title: "Subscription & invoices",
    description: "Manage your plan, payment method, and billing history.",
    requiredRole: "owner",
    pathSegment: "billing"
  },
  {
    id: "settings",
    name: "Settings",
    tag: "Settings",
    title: "Portal preferences",
    description: "Branding and notification preferences for your workspace.",
    requiredRole: "guest",
    pathSegment: "settings"
  },
  {
    id: "intake",
    name: "Intake",
    tag: "Intake",
    title: "Client intake",
    description: "Share goals and contact details so your team can respond quickly.",
    requiredRole: "guest",
    pathSegment: "intake"
  },
  {
    id: "applications",
    name: "Applications",
    tag: "Applications",
    title: "Apply & track",
    description: "Submit applications and track review status in one place.",
    requiredRole: "guest",
    pathSegment: "applications"
  },
  {
    id: "reports",
    name: "Reports",
    tag: "Reports",
    title: "Reports & insights",
    description: "Curated Pulse, CTP BI, and document reports for your organization.",
    requiredRole: "guest",
    pathSegment: "reports"
  }
];
function mergeModuleWithCapability(technical) {
  const capability = getCapabilityByModuleId(technical.id);
  if (!capability) {
    throw new Error(`Missing capability map entry for module: ${technical.id}`);
  }
  return {
    ...technical,
    navGroup: capability.navGroup,
    showInNav: capability.showInPillNav,
    navLabel: capability.displayLabel,
    navTabId: capability.navTabId,
    variant: capability.hubVariant ?? technical.variant
  };
}
var MODULE_REGISTRY = TECHNICAL_MODULE_REGISTRY.map(mergeModuleWithCapability);
for (const moduleId of MODULE_IDS) {
  if (!getCapabilityByModuleId(moduleId)) {
    throw new Error(`EA Capability Map missing entry for module: ${moduleId}`);
  }
}
var REGISTRY_BY_ID = new Map(MODULE_REGISTRY.map((m) => [m.id, m]));
var TENANT_MODULE_PRESETS = {
  "ea-client": [
    "dashboard",
    "pulse",
    "simplifi",
    "amplifi",
    "update-hub",
    "messaging",
    "documents",
    "training",
    "events",
    "resources",
    "ask",
    "billing",
    "settings",
    // People is explicitly selected and requires a ready Postgres runtime.
    "intake",
    "applications",
    "reports"
  ],
  "family-hub": [
    "dashboard",
    "update-hub",
    "training",
    "documents",
    "messaging",
    "events",
    "resources"
  ]
};
var PACKAGE_MODULE_GRANTS = {
  Simplifi: ["simplifi", "amplifi"],
  "Implementation Package": ["simplifi", "amplifi", "connect", "member", "events", "billing", "settings"],
  "Website + Portal Starter": ["member", "events", "billing", "settings", "intake", "applications", "reports"],
  "Capacity Assessment": ["dashboard", "pulse", "update-hub", "documents", "ask", "discovery", "ctp"],
  "Capacity Blueprint": ["dashboard", "pulse", "update-hub", "documents", "ask", "discovery", "ctp"],
  "Launch Verification": ["dashboard", "pulse", "update-hub", "ask"]
};
var DEMO_MODULE_IDS = [
  "discovery",
  "connect",
  "landing"
];
function withChassisStandardModules(moduleIds) {
  return [.../* @__PURE__ */ new Set([...CHASSIS_STANDARD_MODULE_IDS, ...moduleIds])];
}
function defaultModulesForPackage(packagePurchased, options) {
  const fromContract = resolveModuleEntitlements(packagePurchased, {
    isDemo: options?.isDemo
  });
  if (fromContract.length > 0) {
    if (options?.tenantPreset && options.tenantPreset !== "ea-client") {
      const preset2 = TENANT_MODULE_PRESETS[options.tenantPreset] ?? TENANT_MODULE_PRESETS["ea-client"];
      return withChassisStandardModules([...preset2, ...fromContract]);
    }
    return withChassisStandardModules(fromContract);
  }
  const preset = TENANT_MODULE_PRESETS[options?.tenantPreset ?? "ea-client"] ?? TENANT_MODULE_PRESETS["ea-client"];
  const grants = PACKAGE_MODULE_GRANTS[packagePurchased] ?? [];
  const ids = /* @__PURE__ */ new Set([...preset, ...grants]);
  if (options?.isDemo) {
    DEMO_MODULE_IDS.forEach((id2) => ids.add(id2));
  }
  if (packagePurchased === "Launch Verification") {
    return withChassisStandardModules(
      PACKAGE_MODULE_GRANTS["Launch Verification"] ?? ["dashboard", "pulse", "update-hub", "ask"]
    );
  }
  return withChassisStandardModules([...ids]);
}

// lib/modules/assembly.ts
var INVENTORY_BY_ID = new Map(
  capability_inventory_default.modules.map((capability) => [capability.id, capability])
);
var KNOWN_MODULE_IDS = new Set(MODULE_IDS);
function effectiveAssemblyState(id2) {
  const capability = INVENTORY_BY_ID.get(id2);
  return {
    status: capability?.assemblyStatus,
    costLicenseDecision: capability?.costLicense?.decision
  };
}
function createAssemblyPlan(requestedIds) {
  const requested = [...new Set(requestedIds)];
  const admitted = /* @__PURE__ */ new Set();
  const rejected = [];
  for (const id2 of [.../* @__PURE__ */ new Set([...CHASSIS_STANDARD_MODULE_IDS, ...requested])]) {
    if (!KNOWN_MODULE_IDS.has(id2)) {
      rejected.push({ id: id2, reason: "unknown-module" });
      continue;
    }
    const moduleId = id2;
    const state = effectiveAssemblyState(moduleId);
    if (state.status !== "certified") {
      rejected.push({ id: id2, reason: "not-certified", status: state.status });
      continue;
    }
    const authority = certificationAuthority(moduleId);
    if (!authority.reusable) {
      rejected.push({ id: id2, reason: "missing-10-class-certificate", status: state.status });
      continue;
    }
    if (state.costLicenseDecision !== "approved") {
      rejected.push({ id: id2, reason: "cost-license-not-approved", status: state.status });
      continue;
    }
    admitted.add(moduleId);
  }
  return {
    requested,
    admitted: [...admitted],
    rejected,
    blocked: rejected.length > 0
  };
}
function requireAssemblyPlan(requestedIds) {
  const plan = createAssemblyPlan(requestedIds);
  if (plan.blocked) {
    const detail = plan.rejected.map((item) => `${item.id}:${item.reason}`).join(", ");
    throw new Error(`EA assembly blocked: ${detail}`);
  }
  return plan;
}

// lib/modules/tenant-install.ts
var id = (org) => "chassis-install-" + createHash4("sha256").update(org).digest("hex");
async function loadTenantInstall(organizationId) {
  const row = await loadStudioRecordFromAirtable("experience", id(organizationId));
  if (!row) return null;
  if (row.organizationId !== organizationId || row.version !== 1) throw new Error("Invalid tenant installation");
  const plan = requireAssemblyPlan(row.admitted);
  if (plan.admitted.length !== new Set(row.admitted).size) throw new Error("Incomplete tenant installation");
  return row;
}
async function persistTenantInstall(row) {
  assertBrickTenant(row);
  const plan = requireAssemblyPlan(row.admitted);
  if (plan.admitted.length !== new Set(row.admitted).size) throw new Error("Incomplete tenant installation");
  const saved = await saveStudioRecord({
    recordType: "experience",
    id: id(row.organizationId),
    organizationId: row.organizationId,
    title: "Certified chassis installation",
    payload: row
  });
  if (!saved.ok || !saved.persistedToAirtable) throw new Error("Tenant installation was not durably saved");
  const actual = await loadTenantInstall(row.organizationId);
  if (!actual || JSON.stringify(actual) !== JSON.stringify(row)) throw new Error("Tenant installation read-back mismatch");
  return actual;
}

// ports:@/lib/entitlements
var db2 = () => globalThis.__chassisTest;
async function listEntitlementsForOrg(org) {
  return db2().entitlements.filter((e) => e.organizationId === org);
}
function activeModuleIdsFromEntitlements(rows) {
  return new Set(rows.filter((e) => e.status === "active" || e.status === "trial").map((e) => e.moduleId));
}
async function setModuleEnabled(org, moduleId, enabled, source) {
  const e = { organizationId: org, moduleId, status: enabled ? "active" : "suspended", source };
  globalThis.__chassisTest.entitlements = globalThis.__chassisTest.entitlements.filter((x) => x.organizationId !== org || x.moduleId !== moduleId);
  globalThis.__chassisTest.entitlements.push(e);
  globalThis.__chassisTest.writes.push("entitlement");
  return e;
}
async function setModulesEnabledBulk(org, ids, enabled, source) {
  for (const id2 of ids) await setModuleEnabled(org, id2, enabled, source);
  return { ok: ids, failed: [] };
}
async function syncPackageEntitlements(org, ids) {
  db2().writes.push("entitlements");
  if (db2().dropped) return;
  db2().entitlements = db2().entitlements.filter((e) => e.organizationId !== org || e.source !== "package");
  for (const id2 of ids) db2().entitlements.push({ organizationId: org, moduleId: id2, status: "active", source: "package" });
}

// lib/bricks/commerce-family.ts
var CommerceConfig = z4.object({
  offers: z4.array(z4.object({
    id: z4.string().regex(/^[a-z0-9-]{1,80}$/),
    title: z4.string().min(1),
    amount: z4.number().int().min(0),
    currency: z4.string().regex(/^[a-z]{3}$/)
  }).strict()).min(1),
  confirmationSubject: z4.string().min(1),
  confirmationHtml: z4.string().min(1)
}).strict();
var idFor = (tenant, kind, identity) => brickHash([tenant.organizationId, kind, identity]);
var configId = (tenant, kind) => "commerce-config-" + idFor(tenant, kind, "install");
async function requireAdmitted(tenant, kind, allowInstalling = false) {
  const journal = await loadTenantInstall(tenant.organizationId);
  if (!journal || journal.state !== "installed" && !(allowInstalling && journal.state === "installing") || journal.portalSlug !== tenant.portalSlug || !journal.admitted.includes(kind))
    throw new Error("Certified tenant entitlement required: " + kind);
}
async function installCommerce(tenant, kind, input) {
  await requireAdmitted(tenant, kind, true);
  const config = CommerceConfig.parse(input);
  const old = await readBrickRecord(tenant, configId(tenant, kind));
  if (old && JSON.stringify(old.config) !== JSON.stringify(config)) throw new Error("Commerce config conflict");
  if (!old) await writeBrickRecord(tenant, configId(tenant, kind), { ...tenant, kind, config });
  return config;
}
async function changeMemberGrant(tenant, input, confirm) {
  await requireAdmitted(tenant, "member");
  const data = z4.object({
    email: z4.string().email().transform((x) => x.trim().toLowerCase()),
    memberId: z4.string().min(1),
    enabled: z4.boolean(),
    requestId: z4.string().min(6)
  }).strict().parse(input);
  const recordId2 = "member-grant-" + idFor(tenant, "member", data.memberId);
  const row = await readBrickRecord(tenant, recordId2);
  if (row && row.requestId === data.requestId) {
    if (row.enabled !== data.enabled || row.email !== data.email) throw new Error("Conflicting member replay");
    if (row.confirmationSent) return row;
  }
  const next = { ...tenant, ...data, confirmationSent: false };
  if (data.enabled) {
    const actual = await setModuleEnabled(tenant.organizationId, "member", true, "manual");
    if (!actual || actual.organizationId !== tenant.organizationId || actual.moduleId !== "member" || actual.status !== "active")
      throw new Error("Member platform entitlement write failed");
    const stored = (await listEntitlementsForOrg(tenant.organizationId)).find((x) => x.moduleId === "member");
    if (!stored || stored.status !== "active") throw new Error("Member platform entitlement read-back failed");
  }
  if (!row || row.requestId !== data.requestId) await writeBrickRecord(tenant, recordId2, next);
  await confirm({
    to: data.email,
    subject: data.enabled ? "Membership granted" : "Membership revoked",
    html: data.enabled ? "Your membership is active." : "Your membership has ended."
  });
  await writeBrickRecord(tenant, recordId2, { ...next, confirmationSent: true });
  await writeBrickRecord(
    tenant,
    "member-track-" + idFor(tenant, "member", data.requestId),
    { ...tenant, memberId: data.memberId, event: data.enabled ? "member_granted" : "member_revoked" }
  );
  return readBrickRecord(tenant, recordId2);
}

// lib/bricks/module-install.ts
var ModuleConfigsSchema = z5.object({
  calendar: CalendarConfig.optional(),
  people: z5.object({ provider: z5.literal("postgres") }).strict().optional(),
  discovery: DiscoveryConfig.optional(),
  billing: CommerceConfig.optional(),
  events: CommerceConfig.optional()
}).strict();
async function requireModuleProviders(ids, input = {}) {
  const config = ModuleConfigsSchema.parse(input);
  for (const key of Object.keys(config)) if (!ids.includes(key)) throw new Error("Configuration supplied for unselected module");
  if (config.calendar?.provider === "nylas") await listPortalNylasEvents({ ...config.calendar, start: /* @__PURE__ */ new Date(), end: new Date(Date.now() + 864e5) });
  if (ids.includes("people")) {
    if (!isPeopleRuntimeAllowed() || !isUniversalPeoplePersistEnabled()) throw new Error("People requires enabled durable Postgres runtime");
    const repo = getPeopleRepository();
    if (repo.kind !== "postgres") throw new Error("People requires Postgres, never memory");
    await repo.listPersonsByOrg("recCERTREADINESS");
  }
  return config;
}
async function installAdmittedModules(tenant, ids, input = {}) {
  const config = await requireModuleProviders(ids, input);
  const dedicated = /* @__PURE__ */ new Set(["calendar", "people", "discovery"]);
  for (const id2 of ids) {
    if (dedicated.has(id2)) continue;
    const receiptId = "module-install-" + id2 + "-" + brickHash(tenant.organizationId);
    const existing = await readBrickRecord(tenant, receiptId);
    if (existing) {
      if (existing.moduleId !== id2 || existing.version !== 1) throw new Error("Module install receipt mismatch: " + id2);
      continue;
    }
    await writeBrickRecord(tenant, receiptId, { ...tenant, moduleId: id2, version: 1 });
  }
  for (const kind of ["billing", "events"]) {
    if (ids.includes(kind) && config[kind]) await installCommerce(tenant, kind, config[kind]);
  }
  if (ids.includes("calendar")) {
    const prior = await readBrickRecord(tenant, "calendar-install-" + brickHash(tenant.organizationId));
    await installCalendar(tenant, config.calendar ?? prior?.config);
  }
  if (ids.includes("discovery")) {
    const prior = await readBrickRecord(tenant, "discovery-install-" + brickHash(tenant.organizationId));
    await installDiscovery(tenant, config.discovery ?? prior?.config);
  }
  if (ids.includes("people")) {
    const repo = getPeopleRepository();
    const rows = await repo.listPersonsByOrg(tenant.organizationId);
    if (rows.some((x) => x.organizationId !== tenant.organizationId)) throw new Error("People provider tenant mismatch");
    await writeBrickRecord(
      tenant,
      "people-install-" + brickHash(tenant.organizationId),
      { ...tenant, version: 2, provider: "postgres" }
    );
  }
}

// ports:@/lib/organizations
async function ensureOrganizationForPortal() {
  globalThis.__chassisTest.writes.push("org");
  return { orgId: "recTENANT1" };
}
async function findOrganizationByPortalSlug(slug) {
  return { id: "recTENANT1", portalSlug: slug, status: "Active" };
}
async function updateOrganizationWorkspaceConfig(org, config) {
  globalThis.__chassisTest.records.set("brand:org-workspace-" + org, structuredClone(config));
  return config;
}

// lib/modules/entitlement-package-key.ts
function resolveEntitlementPackageKey(input) {
  const offerId = input.commerceOfferId?.trim();
  if (offerId) return offerId;
  const pkg = input.packagePurchased?.trim();
  if (pkg) return pkg;
  return "Capacity Assessment";
}

// lib/modules/ensure-package-entitlements.ts
var DEMO_SLUGS = /* @__PURE__ */ new Set(["demo-client", "demo-website"]);
function isDemoPortalSlug(slug) {
  return DEMO_SLUGS.has(slug);
}
async function ensurePackageEntitlements(input) {
  if (input.orgId.startsWith("org_")) {
    if (input.admittedModuleIds) throw new Error("Certified installation requires a persisted organization");
    return;
  }
  const packageKey = resolveEntitlementPackageKey(input);
  const installed = await loadTenantInstall(input.orgId);
  if (installed && installed.portalSlug !== input.slug) throw new Error("Installation tenant mismatch");
  const selected = input.admittedModuleIds ?? installed?.admitted;
  const moduleIds = selected ? [...new Set(selected)] : defaultModulesForPackage(packageKey, {
    isDemo: isDemoPortalSlug(input.slug)
  });
  if (selected) {
    const checked = requireAssemblyPlan(moduleIds);
    if (checked.admitted.length !== new Set(moduleIds).size) throw new Error("Selection omits required chassis modules");
  }
  const desired = new Set(moduleIds);
  const existing = await listEntitlementsForOrg(input.orgId);
  const activePackage = new Set(
    existing.filter((e) => e.source === "package" && (e.status === "active" || e.status === "trial")).map((e) => e.moduleId)
  );
  const alreadyMatched = desired.size === activePackage.size && [...desired].every((id2) => activePackage.has(id2));
  if (alreadyMatched) return;
  await syncPackageEntitlements(input.orgId, moduleIds);
  if (selected) {
    const actual = new Set((await listEntitlementsForOrg(input.orgId)).filter((e) => e.source === "package" && (e.status === "active" || e.status === "trial")).map((e) => e.moduleId));
    if (actual.size !== desired.size || [...desired].some((id2) => !actual.has(id2)))
      throw new Error("Admitted entitlement read-back mismatch");
  }
}

// config/portable-brick-evidence.json
var portable_brick_evidence_default = {
  moduleId: "amanda",
  moduleVersion: 1,
  status: "branch-verified",
  certificationScope: "Composite enrollment API; isolated executable integration proof. No production or new visual certification asserted. Existing UI is delegated to certified dependencies.",
  dependencies: [
    "member",
    "training",
    "billing",
    "intake",
    "applications",
    "reports",
    "messaging",
    "settings"
  ],
  sourceFiles: [
    "lib/portal-universal/bricks/amanda/index.ts",
    "lib/portal-universal/bricks/amanda/stripe.ts",
    "lib/portal-universal/bricks/registry.ts",
    "lib/modules/client-factory-assembly.ts",
    "lib/modules/ensure-package-entitlements.ts",
    "lib/modules/tenant-install.ts",
    "lib/tenant-foundation.ts",
    "app/api/admin/chassis/install/route.ts",
    "app/api/portal/[slug]/bricks/amanda/route.ts",
    "app/api/admin/entitlements/route.ts",
    "app/api/webhooks/stripe/route.ts",
    "tests/chassis-autowire.test.mts"
  ],
  sourceFingerprint: "78680a35e8b1307fbd0ca184c7a6e0f606067e5cde9e621673dce82e1b575a7c",
  evidence: {
    "route-render": {
      tests: [
        "tests/chassis-autowire.test.mts"
      ],
      scope: "Portable service integration contract"
    },
    "responsive-ui": {
      tests: [
        "tests/chassis-autowire.test.mts"
      ],
      scope: "Inherited certified module UI; adapter introduces no UI"
    },
    "authorization-tenant-isolation": {
      tests: [
        "tests/chassis-autowire.test.mts"
      ],
      scope: "Portable service integration contract"
    },
    "durable-persistence": {
      tests: [
        "tests/chassis-autowire.test.mts"
      ],
      scope: "Portable service integration contract"
    },
    "dependency-integration-readiness": {
      tests: [
        "tests/chassis-autowire.test.mts"
      ],
      scope: "Portable service integration contract"
    },
    "success-empty-failure-states": {
      tests: [
        "tests/chassis-autowire.test.mts"
      ],
      scope: "Portable service integration contract"
    },
    observability: {
      tests: [
        "tests/chassis-autowire.test.mts"
      ],
      scope: "Portable service integration contract"
    },
    "rollback-disable": {
      tests: [
        "tests/chassis-autowire.test.mts"
      ],
      scope: "Portable service integration contract"
    },
    "business-lifecycle": {
      tests: [
        "tests/chassis-autowire.test.mts"
      ],
      scope: "Portable service integration contract"
    },
    "immutable-version-fingerprint": {
      tests: [
        "tests/chassis-autowire.test.mts"
      ],
      scope: "Portable service integration contract"
    }
  },
  certifiedBoundary: {
    excludedReviewRequired: [
      "Generic academy LMS/certificate automation",
      "Calendar and People",
      "Production payment delivery and simultaneous callback races"
    ]
  }
};

// config/module-certification-contract.json
var module_certification_contract_default = {
  version: 1,
  policy: "A Lego module is certified only when every required functional evidence class is present for the exact module version.",
  requiredEvidenceClasses: [
    "route-render",
    "responsive-ui",
    "authorization-tenant-isolation",
    "durable-persistence",
    "dependency-integration-readiness",
    "success-empty-failure-states",
    "observability",
    "rollback-disable",
    "business-lifecycle",
    "immutable-version-fingerprint"
  ],
  rule: "Missing evidence fails closed. Client assembly may only consume modules satisfying this contract."
};

// lib/portal-universal/bricks/registry.ts
var PORTABLE_BRICK_REGISTRY = {
  amanda: {
    id: "amanda",
    version: 1,
    title: "Enrollment, payment and confirmation",
    moduleIds: AMANDA_BRICK_MODULES,
    validate: (config) => AmandaInstallSchema.parse(config),
    install: installAmandaBrick,
    evidence: portable_brick_evidence_default
  }
};
function requireBrickSelections(selections = []) {
  if (new Set(selections.map((x) => x.id)).size !== selections.length) throw new Error("Duplicate brick selection");
  return selections.map((selection) => {
    const entry = PORTABLE_BRICK_REGISTRY[selection.id];
    if (!entry) throw new Error("Unknown portable brick");
    if (entry.evidence.moduleVersion !== entry.version || entry.evidence.status !== "branch-verified" || module_certification_contract_default.requiredEvidenceClasses.some((cls) => !entry.evidence.evidence[cls]?.tests.length))
      throw new Error("Portable brick evidence is incomplete");
    return { entry, config: entry.validate(selection.config) };
  });
}
async function installSelectedBricks(tenant, selections = []) {
  for (const { entry, config } of requireBrickSelections(selections)) await entry.install(tenant, config);
}

// lib/modules/business-options.ts
var BUSINESS_OPTION_CATALOG = [
  {
    id: "calendar-shared-scheduling",
    name: "Calendar & shared scheduling",
    description: "Shared appointments, advisor booking, events, and registrations in one hub.",
    moduleIds: ["calendar"]
  },
  {
    id: "forms-intake-applications",
    name: "Forms, intake & applications",
    description: "Collect client information, receive applications, and track submissions.",
    moduleIds: ["intake", "applications"]
  },
  {
    id: "approval-workflows",
    name: "Approval workflows",
    description: "Move submissions and recommendations through review, approval, and follow-up.",
    moduleIds: ["applications", "ctp", "update-hub"]
  },
  {
    id: "reports-dashboards",
    name: "Reports & dashboards",
    description: "Give clients curated reports, progress views, and operational insights.",
    moduleIds: ["reports", "pulse"]
  },
  {
    id: "people-directory",
    name: "People & contact directory",
    description: "Organize people, households, contacts, and relationships.",
    moduleIds: ["people"]
  },
  {
    id: "training-learning",
    name: "Training & learning center",
    description: "Deliver guides, lessons, and client learning materials.",
    moduleIds: ["training"]
  },
  {
    id: "online-academy-student-portal",
    name: "Online Academy + Student Portal",
    description: "Sell courses, create student access after payment, protect course files, schedule lessons, collect assignments, track practical requirements, issue certificates, and manage students, practitioners, communication, and revenue.",
    moduleIds: ["landing", "training", "calendar", "documents", "resources", "billing", "people", "intake", "applications", "reports", "messaging", "settings"]
  },
  {
    id: "resource-library",
    name: "Resource library",
    description: "Share tools, templates, links, and curated resources.",
    moduleIds: ["resources"]
  },
  {
    id: "event-registration-ticketing",
    name: "Event registration & ticketing",
    description: "Publish events, manage registrations, and connect ticketing through Event Hub.",
    moduleIds: ["events"]
  },
  {
    id: "updates-change-requests",
    name: "Updates & change requests",
    description: "Collect content requests, enhancement requests, and advisor updates.",
    moduleIds: ["update-hub"]
  },
  {
    id: "website-page-editor",
    name: "Website & page editor",
    description: "Manage public pages through the entitlement-protected Experience Builder.",
    moduleIds: ["landing"]
  },
  {
    id: "member-directory",
    name: "Member home & directory",
    description: "Provide a personalized member home with an organization directory.",
    moduleIds: ["member", "people"]
  },
  {
    id: "opportunities-recommendations",
    name: "Opportunities & recommendations",
    description: "Present matched opportunities, recommendations, and review decisions.",
    moduleIds: ["ctp", "pulse"]
  },
  {
    id: "roles-permissions",
    name: "Roles & permissions",
    description: "Apply owner, admin, manager, staff, viewer, and guest access controls.",
    moduleIds: ["settings"]
  }
];
var OPTION_BY_ID = new Map(BUSINESS_OPTION_CATALOG.map((option) => [option.id, option]));
function getBusinessOption(id2) {
  return OPTION_BY_ID.get(id2);
}

// lib/rbac.ts
var PLATFORM_ROLES = [
  "owner",
  "admin",
  "manager",
  "staff",
  "viewer",
  "guest"
];

// lib/ctp-guide-stage-engine.ts
var GUIDE_LIFECYCLE_STAGES = [
  "Welcome",
  "Discovery",
  "Strategy",
  "Proposal",
  "Agreement",
  "Design",
  "Build",
  "Review",
  "Launch",
  "Care"
];
var GUIDE_STAGE_DEFINITIONS = {
  Welcome: {
    stage: "Welcome",
    next: "Discovery",
    entryConditions: ["Client portal session exists for this project"],
    exitConditions: ["Project home is open (always true once portal-bound)"],
    completionEvents: ["portal.provisioned", "ctp.workspace.active"],
    documentsUnlocked: ["Your Project home"],
    celebration: {
      title: "Welcome Complete",
      message: "Your project home is open. We\u2019re ready to learn your business."
    },
    notification: {
      title: "Your project home is ready",
      detail: "Open Progress anytime to see where things stand and what comes next."
    }
  },
  Discovery: {
    stage: "Discovery",
    next: "Strategy",
    entryConditions: ["Welcome complete"],
    exitConditions: [
      "Assessment captured",
      "Intake / evaluation available",
      "Digital presence review complete or not required"
    ],
    completionEvents: ["ctp.submitted", "ctp.intake.analyzed", "ctp.digital.audit"],
    documentsUnlocked: ["Discovery summary"],
    celebration: {
      title: "Discovery Complete",
      message: "We understand enough about your business to recommend a clear path."
    },
    notification: {
      title: "Discovery is complete",
      detail: "We\u2019re turning what we learned into priorities for your strategy."
    }
  },
  Strategy: {
    stage: "Strategy",
    next: "Proposal",
    entryConditions: ["Discovery complete"],
    exitConditions: [
      "Strategy snapshot available",
      "Or strategy conversation scheduled",
      "Or executive priorities prepared"
    ],
    completionEvents: ["ctp.bi.ready", "ctp.review.scheduled"],
    documentsUnlocked: ["Strategy priorities"],
    celebration: {
      title: "Strategy Complete",
      message: "Your priorities are clear \u2014 the plan can take shape."
    },
    notification: {
      title: "Your strategy is taking shape",
      detail: "We\u2019re preparing the plan and investment for your review."
    }
  },
  Proposal: {
    stage: "Proposal",
    next: "Agreement",
    entryConditions: ["Strategy complete"],
    exitConditions: ["Proposal identifier is available for review"],
    completionEvents: ["proposal.pending", "proposal.completed"],
    documentsUnlocked: ["Your proposal"],
    celebration: {
      title: "Proposal Ready",
      message: "Your plan and investment are ready to review when you are."
    },
    notification: {
      title: "Your proposal is ready",
      detail: "Review the plan calmly \u2014 confirmation comes when you\u2019re ready."
    }
  },
  Agreement: {
    stage: "Agreement",
    next: "Design",
    entryConditions: ["Proposal delivered"],
    exitConditions: [
      "Design underway or complete",
      "Or studio active",
      "Or site already in progress / live"
    ],
    completionEvents: ["proposal.approved", "ctp.studio.started"],
    documentsUnlocked: ["Agreement confirmation"],
    celebration: {
      title: "Proposal Approved",
      message: "You\u2019re confirmed. We can begin Design with confidence."
    },
    notification: {
      title: "Your approval has been received",
      detail: "We\u2019ve started designing your website. We\u2019ll ask only for what unlocks first concepts."
    }
  },
  Design: {
    stage: "Design",
    next: "Build",
    entryConditions: ["Agreement complete"],
    exitConditions: ["Client design input marked complete on the project timeline"],
    completionEvents: ["ctp.studio.input", "ctp.studio.complete"],
    documentsUnlocked: ["Brand direction notes"],
    celebration: {
      title: "Design Complete",
      message: "Brand direction is clear enough for us to craft your presence."
    },
    notification: {
      title: "Your project has moved into development",
      detail: "Your brand details are in \u2014 we\u2019re assembling your website and portal."
    }
  },
  Build: {
    stage: "Build",
    next: "Review",
    entryConditions: ["Design complete"],
    exitConditions: ["Build step complete on timeline, or live site URL available"],
    completionEvents: ["ctp.production.ready", "ctp.website.live", "ctp.studio.ready"],
    documentsUnlocked: ["Preview when ready"],
    celebration: {
      title: "Website Ready for Review",
      message: "A reviewable version of your presence is ready for your eye."
    },
    notification: {
      title: "Your website is ready for review",
      detail: "Please look closely and share clear feedback so we can refine with confidence."
    }
  },
  Review: {
    stage: "Review",
    next: "Launch",
    entryConditions: ["Build complete"],
    exitConditions: ["Executive review complete, or project marked Completed"],
    completionEvents: ["ctp.ready_for_review", "ctp.revealed"],
    documentsUnlocked: ["Review checklist"],
    celebration: {
      title: "Review Complete",
      message: "Your feedback is in \u2014 refinements and launch checks come next."
    },
    notification: {
      title: "Thanks \u2014 your review is in",
      detail: "We\u2019re refining with your notes and preparing for launch."
    }
  },
  Launch: {
    stage: "Launch",
    next: "Care",
    entryConditions: ["Review complete"],
    exitConditions: ["Reveal complete, or Completed with a live site URL"],
    completionEvents: ["ctp.revealed", "ctp.website.live"],
    documentsUnlocked: ["Live website"],
    celebration: {
      title: "Project Launched",
      message: "Your presence is live. Take a moment \u2014 then we\u2019ll stay with you in Care."
    },
    notification: {
      title: "Your project is live",
      detail: "Open your website, share it, and tell us if anything needs a quick fix."
    }
  },
  Care: {
    stage: "Care",
    next: null,
    entryConditions: ["Launch complete with a live site"],
    exitConditions: ["Ongoing \u2014 Care remains available"],
    completionEvents: ["ctp.revealed"],
    documentsUnlocked: ["Support & Messages"],
    celebration: {
      title: "Care Underway",
      message: "Launch is a beginning. We\u2019re still with you for questions and next steps."
    },
    notification: {
      title: "You\u2019re in ongoing care",
      detail: "Use Support or Messages anytime \u2014 a real person on your team will respond."
    }
  }
};

// lib/project-state-engine.ts
var PROJECT_TRANSITION_RULES = [
  {
    from: "Welcome",
    to: "Discovery",
    required: ["portal.bound"],
    celebration: GUIDE_STAGE_DEFINITIONS.Welcome.celebration
  },
  {
    from: "Discovery",
    to: "Strategy",
    required: ["discovery.complete"],
    celebration: GUIDE_STAGE_DEFINITIONS.Discovery.celebration
  },
  {
    from: "Strategy",
    to: "Proposal",
    /** Authoritative proposal only — never WPS synthetic IDs (filtered at emit). */
    required: ["proposal.ready"],
    optional: ["strategy.ready"],
    celebration: GUIDE_STAGE_DEFINITIONS.Strategy.celebration
  },
  {
    from: "Proposal",
    to: "Agreement",
    /** Client has a real proposal and is in the confirmation window. */
    required: ["proposal.ready"],
    celebration: GUIDE_STAGE_DEFINITIONS.Proposal.celebration
  },
  {
    from: "Agreement",
    to: "Design",
    /** Payment is the ONLY path out of Agreement. */
    required: ["payment.completed"],
    celebration: GUIDE_STAGE_DEFINITIONS.Agreement.celebration
  },
  {
    from: "Proposal",
    to: "Design",
    /** Payment may clear Proposal+Agreement in one reconciliation. */
    required: ["payment.completed", "proposal.ready"],
    celebration: GUIDE_STAGE_DEFINITIONS.Agreement.celebration
  },
  {
    from: "Design",
    to: "Build",
    required: ["design.complete"],
    optional: ["design.started"],
    celebration: GUIDE_STAGE_DEFINITIONS.Design.celebration
  },
  {
    from: "Build",
    to: "Review",
    required: ["build.ready_for_review"],
    celebration: GUIDE_STAGE_DEFINITIONS.Build.celebration
  },
  {
    from: "Review",
    to: "Launch",
    required: ["review.approved"],
    celebration: GUIDE_STAGE_DEFINITIONS.Review.celebration
  },
  {
    from: "Launch",
    to: "Care",
    required: ["project.launched"],
    celebration: GUIDE_STAGE_DEFINITIONS.Launch.celebration
  }
];

// lib/portal-universal/capability-ids.ts
var UNIVERSAL_CAPABILITY_IDS = [
  "home",
  "people",
  "messages",
  "tasks",
  "calendar",
  "documents",
  "programs",
  "progress",
  "payments",
  "resources"
];
function isUniversalCapabilityId(value) {
  return UNIVERSAL_CAPABILITY_IDS.includes(value);
}

// lib/portal-universal/validate-pack.ts
var PACK_ID_RE = /^[a-z][a-z0-9-]*$/;
var SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;
function isModuleId(value) {
  return MODULE_IDS.includes(value);
}
function isPlatformRole(value) {
  return PLATFORM_ROLES.includes(value);
}
function isGuideStage(value) {
  return GUIDE_LIFECYCLE_STAGES.includes(value);
}
function isPresentation(value) {
  return value === "workspace" || value === "experience" || value === "client";
}
function validateVisibility(raw, path, errors) {
  if (raw == null) return void 0;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    errors.push(`${path} must be an object`);
    return void 0;
  }
  const kind = raw.kind;
  if (kind !== "always" && kind !== "never" && kind !== "when_entitled") {
    errors.push(`${path}.kind must be always|never|when_entitled`);
    return void 0;
  }
  return { kind };
}
function validateNavItem(raw, index, errors) {
  if (!raw || typeof raw !== "object") {
    errors.push(`nav[${index}] must be an object`);
    return null;
  }
  const row = raw;
  const id2 = typeof row.id === "string" ? row.id.trim() : "";
  if (!id2) errors.push(`nav[${index}].id is required`);
  const universalCapabilityId = typeof row.universalCapabilityId === "string" ? row.universalCapabilityId.trim() : "";
  if (!isUniversalCapabilityId(universalCapabilityId)) {
    errors.push(`nav[${index}].universalCapabilityId is invalid`);
  }
  const label = typeof row.label === "string" ? row.label.trim() : "";
  if (!label) errors.push(`nav[${index}].label is required`);
  const order = typeof row.order === "number" && Number.isFinite(row.order) ? row.order : NaN;
  if (Number.isNaN(order)) errors.push(`nav[${index}].order must be a number`);
  const visibility = validateVisibility(row.visibility, `nav[${index}].visibility`, errors);
  let minRole;
  if (row.minRole != null) {
    if (typeof row.minRole !== "string" || !isPlatformRole(row.minRole)) {
      errors.push(`nav[${index}].minRole is invalid`);
    } else {
      minRole = row.minRole;
    }
  }
  const stagesInclude = [];
  if (row.stagesInclude != null) {
    if (!Array.isArray(row.stagesInclude)) {
      errors.push(`nav[${index}].stagesInclude must be an array`);
    } else {
      for (const stage of row.stagesInclude) {
        if (typeof stage !== "string" || !isGuideStage(stage)) {
          errors.push(`nav[${index}].stagesInclude contains invalid stage`);
        } else {
          stagesInclude.push(stage);
        }
      }
    }
  }
  const stagesExclude = [];
  if (row.stagesExclude != null) {
    if (!Array.isArray(row.stagesExclude)) {
      errors.push(`nav[${index}].stagesExclude must be an array`);
    } else {
      for (const stage of row.stagesExclude) {
        if (typeof stage !== "string" || !isGuideStage(stage)) {
          errors.push(`nav[${index}].stagesExclude contains invalid stage`);
        } else {
          stagesExclude.push(stage);
        }
      }
    }
  }
  let preferredModuleId;
  if (row.preferredModuleId != null) {
    if (typeof row.preferredModuleId !== "string" || !isModuleId(row.preferredModuleId)) {
      errors.push(`nav[${index}].preferredModuleId is invalid`);
    } else {
      preferredModuleId = row.preferredModuleId;
    }
  }
  if (errors.some((e) => e.startsWith(`nav[${index}]`))) {
    return null;
  }
  return {
    id: id2,
    universalCapabilityId,
    label,
    shortLabel: typeof row.shortLabel === "string" ? row.shortLabel.trim() : void 0,
    order,
    visibility,
    minRole,
    stagesInclude: stagesInclude.length ? stagesInclude : void 0,
    stagesExclude: stagesExclude.length ? stagesExclude : void 0,
    hrefOverride: typeof row.hrefOverride === "string" ? row.hrefOverride.trim() : void 0,
    preferredModuleId,
    iconKey: typeof row.iconKey === "string" ? row.iconKey.trim() : void 0
  };
}
function validateExtensions(raw, errors, phase1Strict) {
  if (raw == null) return void 0;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    errors.push("extensions must be an object");
    return void 0;
  }
  const ext = raw;
  const out = {};
  for (const key of ["people", "tasks"]) {
    const block = ext[key];
    if (block == null) continue;
    if (typeof block !== "object" || Array.isArray(block)) {
      errors.push(`extensions.${key} must be an object`);
      continue;
    }
    const enabled = block.enabled;
    if (enabled === true) {
      if (phase1Strict) {
        errors.push(`extensions.${key}.enabled must be false in Phase 1 shipped packs`);
      }
      const schemaVersion = String(block.schemaVersion || "").trim();
      if (!schemaVersion) errors.push(`extensions.${key}.schemaVersion required when enabled`);
      out[key] = { enabled: true, schemaVersion, notes: block.notes };
    } else {
      out[key] = { enabled: false };
    }
  }
  if (ext.notifications != null) {
    const n = ext.notifications;
    if (n.enabled === true && phase1Strict) {
      errors.push("extensions.notifications.enabled must be false in Phase 1 shipped packs");
    }
    out.notifications = n.enabled === true ? {
      enabled: true,
      providerHint: ext.notifications.providerHint,
      topicKeys: ext.notifications.topicKeys
    } : { enabled: false };
  }
  if (ext.formSchemaRefs != null) {
    if (!Array.isArray(ext.formSchemaRefs)) {
      errors.push("extensions.formSchemaRefs must be an array");
    } else {
      out.formSchemaRefs = [];
      ext.formSchemaRefs.forEach((ref, i) => {
        if (!ref || typeof ref !== "object") {
          errors.push(`extensions.formSchemaRefs[${i}] must be an object`);
          return;
        }
        const r = ref;
        const id2 = typeof r.id === "string" ? r.id.trim() : "";
        const title = typeof r.title === "string" ? r.title.trim() : "";
        const schemaRef = typeof r.schemaRef === "string" ? r.schemaRef.trim() : "";
        const uc = typeof r.universalCapabilityId === "string" ? r.universalCapabilityId.trim() : "";
        if (!id2) errors.push(`extensions.formSchemaRefs[${i}].id is required`);
        if (!title) errors.push(`extensions.formSchemaRefs[${i}].title is required`);
        if (!schemaRef) errors.push(`extensions.formSchemaRefs[${i}].schemaRef is required`);
        if (!isUniversalCapabilityId(uc)) {
          errors.push(`extensions.formSchemaRefs[${i}].universalCapabilityId is invalid`);
        }
        if (id2 && title && schemaRef && isUniversalCapabilityId(uc)) {
          out.formSchemaRefs.push({
            id: id2,
            title,
            schemaRef,
            universalCapabilityId: uc
          });
        }
      });
    }
  }
  if (ext.workflowRefs != null) {
    if (!Array.isArray(ext.workflowRefs)) {
      errors.push("extensions.workflowRefs must be an array");
    } else {
      out.workflowRefs = [];
      ext.workflowRefs.forEach((ref, i) => {
        if (!ref || typeof ref !== "object") {
          errors.push(`extensions.workflowRefs[${i}] must be an object`);
          return;
        }
        const r = ref;
        const id2 = typeof r.id === "string" ? r.id.trim() : "";
        const purpose = typeof r.purpose === "string" ? r.purpose.trim() : "";
        if (!id2) errors.push(`extensions.workflowRefs[${i}].id is required`);
        if (!purpose) errors.push(`extensions.workflowRefs[${i}].purpose is required`);
        if (id2 && purpose) {
          out.workflowRefs.push({
            id: id2,
            purpose,
            providerHint: r.providerHint === "make" || r.providerHint === "trigger" || r.providerHint === "cron" || r.providerHint === "pulse" ? r.providerHint : void 0,
            envKeyOrSlug: typeof r.envKeyOrSlug === "string" ? r.envKeyOrSlug : void 0
          });
        }
      });
    }
  }
  if (ext.nba != null) {
    if (typeof ext.nba !== "object" || Array.isArray(ext.nba)) {
      errors.push("extensions.nba must be an object");
    } else {
      const providerId = String(ext.nba.providerId || "").trim();
      if (!providerId) errors.push("extensions.nba.providerId is required");
      else {
        out.nba = {
          providerId,
          staticHeadline: ext.nba.staticHeadline
        };
      }
    }
  }
  return out;
}
function validateIndustryPack(raw, opts) {
  const phase1Strict = opts?.phase1Strict !== false;
  const errors = [];
  const warnings = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: ["pack must be an object"], warnings };
  }
  const input = raw;
  const id2 = typeof input.id === "string" ? input.id.trim() : "";
  if (!id2 || !PACK_ID_RE.test(id2)) {
    errors.push("id must be kebab-case starting with a letter");
  }
  const versionRaw = typeof input.version === "string" ? input.version.trim() : "";
  if (!SEMVER_RE.test(versionRaw)) {
    errors.push("version must be semver X.Y.Z");
  }
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) errors.push("title is required");
  const presentation = typeof input.presentation === "string" ? input.presentation.trim() : "";
  if (!isPresentation(presentation)) {
    errors.push("presentation must be workspace|experience|client");
  }
  const suggestedModuleIds = [];
  if (!Array.isArray(input.suggestedModuleIds)) {
    errors.push("suggestedModuleIds must be an array");
  } else {
    for (const mid of input.suggestedModuleIds) {
      if (typeof mid !== "string" || !isModuleId(mid)) {
        errors.push(`suggestedModuleIds contains invalid module: ${String(mid)}`);
      } else {
        suggestedModuleIds.push(mid);
      }
    }
  }
  const hideModuleIds = [];
  if (input.hideModuleIds != null) {
    if (!Array.isArray(input.hideModuleIds)) {
      errors.push("hideModuleIds must be an array");
    } else {
      for (const mid of input.hideModuleIds) {
        if (typeof mid !== "string" || !isModuleId(mid)) {
          errors.push(`hideModuleIds contains invalid module: ${String(mid)}`);
        } else {
          hideModuleIds.push(mid);
        }
      }
    }
  }
  if (!Array.isArray(input.nav) || input.nav.length === 0) {
    errors.push("nav must be a non-empty array");
  }
  const nav = [];
  const seenIds = /* @__PURE__ */ new Set();
  const orderCounts = /* @__PURE__ */ new Map();
  if (Array.isArray(input.nav)) {
    input.nav.forEach((item, index) => {
      const before = errors.length;
      const parsed = validateNavItem(item, index, errors);
      if (!parsed || errors.length > before) return;
      if (seenIds.has(parsed.id)) {
        errors.push(`duplicate nav id: ${parsed.id}`);
        return;
      }
      seenIds.add(parsed.id);
      orderCounts.set(parsed.order, (orderCounts.get(parsed.order) || 0) + 1);
      nav.push(parsed);
    });
  }
  for (const [order, count] of orderCounts) {
    if (count > 1) warnings.push(`duplicate nav order ${order} (stable-sorted by id)`);
  }
  const useClientExperienceChrome = Boolean(input.useClientExperienceChrome);
  if (presentation === "client" && !useClientExperienceChrome) {
    warnings.push("presentation is client but useClientExperienceChrome is not true");
  }
  const extensions = validateExtensions(input.extensions, errors, phase1Strict);
  let branding;
  if (input.branding != null) {
    if (typeof input.branding !== "object" || Array.isArray(input.branding)) {
      errors.push("branding must be an object");
    } else {
      branding = input.branding;
    }
  }
  if (errors.length) {
    return { ok: false, errors, warnings };
  }
  const pack = {
    id: id2,
    version: versionRaw,
    title,
    description: typeof input.description === "string" ? input.description : void 0,
    presentation,
    suggestedModuleIds,
    hideModuleIds: hideModuleIds.length ? hideModuleIds : void 0,
    nav,
    branding,
    extensions,
    useClientExperienceChrome: useClientExperienceChrome || void 0,
    legacyPlatformClientId: typeof input.legacyPlatformClientId === "string" ? input.legacyPlatformClientId.trim() : void 0
  };
  return { ok: true, pack, warnings };
}
function assertValidIndustryPack(raw, opts) {
  const result = validateIndustryPack(raw, opts);
  if (!result.ok) {
    throw new Error(`Invalid IndustryPack: ${result.errors.join("; ")}`);
  }
  return result.pack;
}

// lib/portal-universal/packs/ea-executive.ts
var EA_EXECUTIVE_PACK = {
  id: "ea-executive",
  version: "1.0.0",
  title: "EA Executive Workspace",
  description: "Default entitlement-driven executive portal navigation.",
  presentation: "workspace",
  legacyPlatformClientId: "ea",
  suggestedModuleIds: [
    "dashboard",
    "pulse",
    "simplifi",
    "amplifi",
    "connect",
    "update-hub",
    "documents",
    "messaging",
    "events",
    "resources",
    "training",
    "ask",
    "billing",
    "ctp",
    "member"
  ],
  useClientExperienceChrome: false,
  nav: [
    {
      id: "home",
      universalCapabilityId: "home",
      label: "Dashboard",
      order: 10,
      preferredModuleId: "dashboard"
    },
    {
      id: "progress",
      universalCapabilityId: "progress",
      label: "Pulse",
      order: 20,
      preferredModuleId: "pulse"
    },
    {
      id: "programs-simplifi",
      universalCapabilityId: "programs",
      label: "Simplifi",
      order: 30,
      preferredModuleId: "simplifi"
    },
    {
      id: "programs-amplifi",
      universalCapabilityId: "programs",
      label: "Amplifi",
      order: 40,
      preferredModuleId: "amplifi"
    },
    {
      id: "programs-connect",
      universalCapabilityId: "programs",
      label: "Connect",
      order: 50,
      preferredModuleId: "connect"
    },
    {
      id: "messages-updates",
      universalCapabilityId: "messages",
      label: "Project Updates",
      order: 60,
      preferredModuleId: "update-hub"
    },
    {
      id: "documents",
      universalCapabilityId: "documents",
      label: "Document Hub\u2122",
      order: 70,
      preferredModuleId: "documents"
    },
    {
      id: "messages-contact",
      universalCapabilityId: "messages",
      label: "Contact",
      order: 80,
      preferredModuleId: "messaging"
    },
    {
      id: "calendar",
      universalCapabilityId: "calendar",
      label: "Event Hub\u2122",
      order: 90,
      preferredModuleId: "events"
    },
    {
      id: "resources-lib",
      universalCapabilityId: "resources",
      label: "Resource library",
      order: 100,
      preferredModuleId: "resources"
    },
    {
      id: "resources-training",
      universalCapabilityId: "resources",
      label: "Training Hub\u2122",
      order: 110,
      preferredModuleId: "training"
    },
    {
      id: "resources-ask",
      universalCapabilityId: "resources",
      label: "Guide\u2122",
      order: 120,
      preferredModuleId: "ask"
    },
    {
      id: "programs-ctp",
      universalCapabilityId: "programs",
      label: "Consider the Possibilities",
      order: 130,
      preferredModuleId: "ctp"
    },
    {
      id: "programs-member",
      universalCapabilityId: "programs",
      label: "Member",
      order: 140,
      preferredModuleId: "member"
    },
    {
      id: "payments",
      universalCapabilityId: "payments",
      label: "Billing",
      order: 150,
      preferredModuleId: "billing",
      minRole: "owner"
    },
    {
      id: "people",
      universalCapabilityId: "people",
      label: "People",
      order: 900,
      visibility: { kind: "never" }
    },
    {
      id: "tasks",
      universalCapabilityId: "tasks",
      label: "Tasks",
      order: 910,
      visibility: { kind: "never" }
    }
  ],
  branding: {
    terminology: {
      members: "Clients",
      home: "Dashboard"
    }
  },
  extensions: {
    people: { enabled: false },
    tasks: { enabled: false },
    notifications: { enabled: false },
    nba: { providerId: "none" }
  }
};

// lib/portal-universal/packs/ctp-client.ts
var CTP_CLIENT_PACK = {
  id: "ctp-client",
  version: "1.0.0",
  title: "CTP Client Experience",
  description: "Website + Portal / CTP client chrome (Progress, Documents, Contact, Help, Journey).",
  presentation: "client",
  useClientExperienceChrome: true,
  suggestedModuleIds: ["ctp", "documents", "messaging", "ask", "resources", "dashboard"],
  // Structural CX destinations — do not surface executive product modules in chrome.
  hideModuleIds: ["pulse", "simplifi", "amplifi", "connect"],
  nav: [
    {
      id: "progress",
      universalCapabilityId: "home",
      label: "Your Project",
      order: 10,
      preferredModuleId: "ctp",
      hrefOverride: "/portal/{slug}/ctp/progress"
    },
    {
      id: "documents",
      universalCapabilityId: "documents",
      label: "Documents",
      order: 20,
      preferredModuleId: "ctp",
      hrefOverride: "/portal/{slug}/ctp/documents"
    },
    {
      id: "messages",
      universalCapabilityId: "messages",
      label: "Contact",
      order: 30,
      preferredModuleId: "ctp",
      hrefOverride: "/portal/{slug}/ctp/messages"
    },
    {
      id: "support",
      universalCapabilityId: "resources",
      label: "Help",
      order: 40,
      preferredModuleId: "ctp",
      hrefOverride: "/portal/{slug}/ctp/support"
    },
    {
      id: "journey",
      universalCapabilityId: "programs",
      label: "Journey",
      order: 50,
      preferredModuleId: "ctp",
      hrefOverride: "/portal/{slug}/ctp"
    },
    {
      id: "people",
      universalCapabilityId: "people",
      label: "People",
      order: 900,
      visibility: { kind: "never" }
    },
    {
      id: "tasks",
      universalCapabilityId: "tasks",
      label: "Tasks",
      order: 910,
      visibility: { kind: "never" }
    }
  ],
  branding: {
    terminology: {
      home: "Your Project",
      members: "Client"
    }
  },
  extensions: {
    people: { enabled: false },
    tasks: { enabled: false },
    notifications: { enabled: false },
    nba: {
      providerId: "ctp-guide",
      staticHeadline: "Guided by your Next Best Action"
    }
  }
};

// lib/portal-universal/packs/real-estate.ts
var REAL_ESTATE_PACK = {
  id: "real-estate",
  version: "1.0.0",
  title: "Real Estate Client Experience",
  description: "Website + Portal realtor chrome (Pipeline, Listings, Documents, Contact, Help).",
  presentation: "client",
  useClientExperienceChrome: true,
  suggestedModuleIds: ["ctp", "documents", "messaging", "ask", "resources", "dashboard", "events"],
  hideModuleIds: ["pulse", "simplifi", "amplifi", "connect"],
  nav: [
    {
      id: "pipeline",
      universalCapabilityId: "home",
      label: "Your Pipeline",
      order: 10,
      preferredModuleId: "ctp",
      hrefOverride: "/portal/{slug}/ctp/progress"
    },
    {
      id: "listings",
      universalCapabilityId: "programs",
      label: "Your Listings",
      order: 20,
      preferredModuleId: "ctp",
      hrefOverride: "/portal/{slug}/ctp"
    },
    {
      id: "intake",
      universalCapabilityId: "programs",
      label: "Intake",
      order: 25,
      preferredModuleId: "intake",
      hrefOverride: "/portal/{slug}/intake"
    },
    {
      id: "documents",
      universalCapabilityId: "documents",
      label: "Documents",
      order: 30,
      preferredModuleId: "ctp",
      hrefOverride: "/portal/{slug}/ctp/documents"
    },
    {
      id: "messages",
      universalCapabilityId: "messages",
      label: "Contact",
      order: 40,
      preferredModuleId: "ctp",
      hrefOverride: "/portal/{slug}/ctp/messages"
    },
    {
      id: "support",
      universalCapabilityId: "resources",
      label: "Help",
      order: 50,
      preferredModuleId: "ctp",
      hrefOverride: "/portal/{slug}/ctp/support"
    },
    {
      id: "people",
      universalCapabilityId: "people",
      label: "People",
      order: 900,
      visibility: { kind: "never" }
    },
    {
      id: "tasks",
      universalCapabilityId: "tasks",
      label: "Tasks",
      order: 910,
      visibility: { kind: "never" }
    }
  ],
  branding: {
    terminology: {
      home: "Your Pipeline",
      members: "Buyer",
      startPrompt: "What property are we working on next?",
      focus: "Active listings",
      attention: "Needs your review",
      start: "View pipeline"
    }
  },
  extensions: {
    people: { enabled: false },
    tasks: { enabled: false },
    notifications: { enabled: false },
    nba: {
      providerId: "real-estate-guide",
      staticHeadline: "Your next step in the buying or selling journey"
    }
  }
};

// lib/portal-universal/packs/website-portal.ts
var WEBSITE_PORTAL_PACK = {
  ...CTP_CLIENT_PACK,
  id: "website-portal",
  version: "1.0.0",
  title: "Website + Portal Client Experience",
  description: "Website + Portal starter chrome (Progress, Documents, Contact, Help, Journey, Intake).",
  suggestedModuleIds: [
    ...CTP_CLIENT_PACK.suggestedModuleIds,
    "intake",
    "applications",
    "reports",
    "events"
  ],
  nav: [
    ...CTP_CLIENT_PACK.nav.filter((item) => item.id !== "people" && item.id !== "tasks"),
    {
      id: "intake",
      universalCapabilityId: "programs",
      label: "Intake",
      order: 25,
      preferredModuleId: "intake",
      hrefOverride: "/portal/{slug}/intake"
    }
  ]
};

// lib/portal-universal/packs/sample-placeholder.ts
var SAMPLE_PLACEHOLDER_PACK = {
  id: "sample-placeholder",
  version: "1.0.0",
  title: "Sample Placeholder Industry Pack",
  description: "Schema demo with placeholder labels. Not for production tenants.",
  presentation: "workspace",
  suggestedModuleIds: ["dashboard", "events", "documents", "messaging", "resources", "ask"],
  hideModuleIds: ["simplifi", "amplifi"],
  useClientExperienceChrome: false,
  nav: [
    {
      id: "home",
      universalCapabilityId: "home",
      label: "Chapter Home",
      order: 10,
      preferredModuleId: "dashboard"
    },
    {
      id: "calendar",
      universalCapabilityId: "calendar",
      label: "Calendar & Events",
      order: 20,
      preferredModuleId: "events"
    },
    {
      id: "messages",
      universalCapabilityId: "messages",
      label: "Messages",
      order: 30,
      preferredModuleId: "messaging",
      minRole: "guest"
    },
    {
      id: "documents",
      universalCapabilityId: "documents",
      label: "Documents & Forms",
      order: 40,
      preferredModuleId: "documents"
    },
    {
      id: "resources",
      universalCapabilityId: "resources",
      label: "Training & Support",
      order: 50,
      preferredModuleId: "resources"
    },
    {
      id: "people",
      universalCapabilityId: "people",
      label: "Members",
      order: 60,
      visibility: { kind: "never" }
    },
    {
      id: "tasks",
      universalCapabilityId: "tasks",
      label: "Chapter Business",
      order: 70,
      visibility: { kind: "never" }
    }
  ],
  branding: {
    workspaceName: "Sample Chapter Portal",
    terminology: {
      members: "Members",
      home: "Chapter Home",
      startPrompt: "What should the chapter advance this week?"
    }
  },
  extensions: {
    people: { enabled: false },
    tasks: { enabled: false },
    notifications: { enabled: false },
    formSchemaRefs: [
      {
        id: "placeholder-application",
        universalCapabilityId: "documents",
        title: "Placeholder application form",
        schemaRef: "schema:placeholder/application@1"
      }
    ],
    workflowRefs: [
      {
        id: "placeholder-dues-reminder",
        purpose: "Future dues reminder",
        providerHint: "cron"
      }
    ],
    nba: {
      providerId: "none",
      staticHeadline: "Placeholder next action \u2014 not wired"
    }
  }
};

// src/chassis/priceContract.ts
function assertPriceContract(value) {
  if (!value) throw new Error("Invalid price contract: missing");
  if (value.currency === "CAD" && value.amount === 0 && value.note === "included with portal") {
    return value;
  }
  if (Number.isFinite(value.amountCad) && value.amountCad >= 0 && typeof value.contractId === "string" && value.contractId.trim()) {
    return value;
  }
  throw new Error("Invalid price contract: " + JSON.stringify(value));
}

// src/clients/amanda/offers.ts
var AMANDA_OFFERS = Object.freeze({
  "strategy-call": 249,
  "strategy-90-day": 2500,
  "lifeline-artist-business-launch": 997,
  "aesthetikine-reset-training": 997,
  "body-sculpt-practitioner-certification": 2497,
  "non-surgical-bbl-training": 1497,
  "wood-therapy-certification": 997,
  "clinical-fat-loss-injectables": 1497
});
var AMANDA_PRICE_CONTRACT_ID = "amanda-cad-v1";
var amandaPrices = { clientId: "amanda-catherine", price(offerId) {
  const amountCad = AMANDA_OFFERS[offerId];
  if (amountCad === void 0) throw Error("Amanda offer not configured: " + offerId);
  return assertPriceContract({ amountCad, contractId: AMANDA_PRICE_CONTRACT_ID });
} };

// lib/amanda-catherine/lms-policy.ts
var AMANDA_SUPPORT_WORDING = "Includes 90 days of clinical integration support and business mentorship.";
function amandaCourseReady(courseId) {
  if (courseId.startsWith("test-")) return true;
  return true;
}

// lib/amanda-catherine/config.ts
var AMANDA_PORTAL_PACK_ID = "amanda-catherine";
var AMANDA_OFFERS2 = [
  {
    id: "lifeline-artist-business-launch",
    name: "LIFELINE Artist Business Launch Package",
    priceCad: 997,
    audience: "lifeline-guest",
    includes: [
      "30-minute featured interview with professional videography",
      "Multi-platform distribution",
      "8-12 professionally edited videos",
      "3-5 professional brand photos",
      "5-10 branded quote graphics",
      "Business and launch strategy session",
      "Preferred network referrals where appropriate"
    ]
  },
  {
    id: "strategy-call",
    name: "Strategy Call",
    priceCad: amandaPrices.price("strategy-call").amountCad,
    audience: "strategy-client",
    durationMinutes: 60
  },
  {
    id: "strategy-90-day",
    name: "90-Day Strategy Package",
    priceCad: 2500,
    audience: "strategy-client",
    durationDays: 90
  },
  {
    id: "aesthetikine-reset-training",
    name: "Nervous System Reset",
    priceCad: 997,
    audience: "practitioner-trainee",
    courseId: "aesthetikine-reset-training",
    delivery: ["in-person", "virtual"]
  },
  {
    id: "body-sculpt-practitioner-certification",
    name: "Body Sculpt",
    priceCad: 2497,
    compareAtPriceCad: 4997,
    saleLabel: "Limited-time sale",
    audience: "practitioner-trainee",
    courseId: "body-sculpt-practitioner-certification",
    delivery: ["in-person", "virtual"]
  },
  {
    id: "non-surgical-bbl-training",
    name: "Non-Surgical BBL: Glute Build & Sculpt Certification",
    priceCad: 1497,
    audience: "practitioner-trainee",
    courseId: "non-surgical-bbl-training",
    delivery: ["in-person", "virtual"]
  },
  {
    id: "wood-therapy-certification",
    name: "Wood Therapy",
    priceCad: 997,
    audience: "practitioner-trainee",
    courseId: "wood-therapy-certification",
    delivery: ["in-person"]
  },
  {
    id: "clinical-fat-loss-injectables",
    name: "Clinical Fat Loss",
    priceCad: 1497,
    audience: "practitioner-trainee",
    courseId: "clinical-fat-loss-injectables",
    delivery: ["in-person", "virtual"]
  },
  ,
  {
    id: "test-firm-foundation",
    name: "[TEST $1] Firm Foundation",
    priceCad: 1,
    audience: "member-community-participant",
    courseId: "firm-foundation",
    delivery: ["virtual"]
  },
  {
    id: "test-entrepreneurial-artist",
    name: "[TEST $1] Entrepreneurial Artist",
    priceCad: 1,
    audience: "student-trainee",
    courseId: "entrepreneurial-artist",
    delivery: ["virtual"]
  },
  {
    id: "test-reset",
    name: "[TEST $1] Nervous System Reset",
    priceCad: 1,
    audience: "student-trainee",
    courseId: "aesthetikine-reset-training",
    delivery: ["virtual"]
  },
  {
    id: "test-body-sculpt",
    name: "[TEST $1] Body Sculpt",
    priceCad: 1,
    audience: "student-trainee",
    courseId: "body-sculpt-practitioner-certification",
    delivery: ["virtual"]
  },
  {
    id: "test-bbl",
    name: "[TEST $1] Non-Surgical BBL",
    priceCad: 1,
    audience: "student-trainee",
    courseId: "non-surgical-bbl-training",
    delivery: ["virtual"]
  },
  {
    id: "test-wood",
    name: "[TEST $1] Wood Therapy",
    priceCad: 1,
    audience: "student-trainee",
    courseId: "wood-therapy-certification",
    delivery: ["virtual"]
  },
  {
    id: "test-fat-loss",
    name: "[TEST $1] Clinical Fat Loss",
    priceCad: 1,
    audience: "student-trainee",
    courseId: "clinical-fat-loss-injectables",
    delivery: ["virtual"]
  }
];
var AMANDA_SELF_ENROLLMENT_COURSES = AMANDA_OFFERS2.filter(
  (offer) => "courseId" in offer && amandaCourseReady(offer.courseId)
).map((offer) => ({
  offerId: offer.id,
  courseId: offer.courseId,
  title: offer.name,
  priceCad: offer.priceCad,
  supportWording: AMANDA_SUPPORT_WORDING,
  compareAtPriceCad: "compareAtPriceCad" in offer ? offer.compareAtPriceCad : void 0,
  saleLabel: "saleLabel" in offer ? offer.saleLabel : void 0,
  delivery: "delivery" in offer ? offer.delivery : []
}));

// lib/portal-universal/packs/amanda-catherine.ts
var AMANDA_CATHERINE_PACK = {
  id: AMANDA_PORTAL_PACK_ID,
  version: "1.0.0",
  title: "Amanda Catherine Member Experience",
  description: "Role-aware home for clients, students, practitioners, members, media guests, volunteers, partners, staff, and administrators.",
  presentation: "workspace",
  suggestedModuleIds: [
    "dashboard",
    "member",
    "training",
    "calendar",
    "events",
    "documents",
    "messaging",
    "resources",
    "connect",
    "intake",
    "applications",
    "people",
    "reports",
    "billing",
    "settings"
  ],
  useClientExperienceChrome: false,
  nav: [
    {
      id: "home",
      universalCapabilityId: "home",
      label: "Home",
      order: 10,
      preferredModuleId: "member"
    },
    {
      id: "my-path",
      universalCapabilityId: "programs",
      label: "My Path",
      order: 20,
      preferredModuleId: "member"
    },
    {
      id: "learning",
      universalCapabilityId: "resources",
      label: "Courses & Training",
      order: 30,
      preferredModuleId: "training"
    },
    {
      id: "calendar",
      universalCapabilityId: "calendar",
      label: "Appointments & Calendar",
      order: 40,
      preferredModuleId: "calendar"
    },
    {
      id: "events",
      universalCapabilityId: "calendar",
      label: "Events & Registration",
      order: 45,
      preferredModuleId: "events"
    },
    {
      id: "documents",
      universalCapabilityId: "documents",
      label: "Files & Media",
      order: 50,
      preferredModuleId: "documents"
    },
    {
      id: "messages",
      universalCapabilityId: "messages",
      label: "Messages",
      order: 60,
      preferredModuleId: "messaging"
    },
    {
      id: "resources",
      universalCapabilityId: "resources",
      label: "Resources",
      order: 70,
      preferredModuleId: "resources"
    },
    {
      id: "connections",
      universalCapabilityId: "programs",
      label: "Connections & Opportunities",
      order: 80,
      preferredModuleId: "member"
    },
    {
      id: "directory",
      universalCapabilityId: "people",
      label: "People & Directory",
      order: 85,
      preferredModuleId: "people",
      minRole: "staff"
    },
    {
      id: "intake",
      universalCapabilityId: "programs",
      label: "Forms",
      order: 90,
      preferredModuleId: "intake"
    },
    {
      id: "applications",
      universalCapabilityId: "programs",
      label: "Applications & Enrollments",
      order: 100,
      preferredModuleId: "applications",
      minRole: "staff"
    },
    {
      id: "settings",
      universalCapabilityId: "messages",
      label: "Preferences & Notifications",
      order: 105,
      preferredModuleId: "settings"
    },
    {
      id: "reports",
      universalCapabilityId: "resources",
      label: "Reports",
      order: 110,
      preferredModuleId: "reports",
      minRole: "staff"
    },
    {
      id: "billing",
      universalCapabilityId: "payments",
      label: "Payments",
      order: 120,
      preferredModuleId: "billing"
    }
  ],
  branding: {
    themeId: "amanda-editorial",
    workspaceName: "Studio Lab \xB7 By Amanda Catherine",
    brandName: "AesthetiKine",
    logoSrc: "/amanda-catherine/aesthetikine-mark.svg",
    terminology: {
      members: "Members",
      home: "Home",
      startPrompt: "Continue your path",
      focus: "Your next step",
      attention: "Needs your attention",
      start: "Continue"
    }
  },
  extensions: {
    people: { enabled: false },
    tasks: { enabled: false },
    notifications: { enabled: false },
    formSchemaRefs: [
      {
        id: "lifeline-guest-information",
        universalCapabilityId: "programs",
        title: "LIFELINE Featured Guest Information",
        schemaRef: "amanda://forms/lifeline-guest-information/v1"
      },
      {
        id: "lifeline-media-consent",
        universalCapabilityId: "documents",
        title: "LIFELINE Photography and Media Consent",
        schemaRef: "amanda://forms/lifeline-media-consent/v1"
      },
      {
        id: "injection-qualification",
        universalCapabilityId: "programs",
        title: "Injection Training Qualification Confirmation",
        schemaRef: "amanda://forms/injection-qualification/v1"
      }
    ],
    workflowRefs: [
      {
        id: "lifeline-guest-delivery",
        purpose: "Move a LIFELINE guest from intake through interview and media delivery.",
        providerHint: "pulse",
        envKeyOrSlug: "amanda-lifeline-guest-delivery"
      },
      {
        id: "entrepreneurial-artist-fixed-release",
        purpose: "Release six Entrepreneurial Artist lessons per week on fixed days.",
        providerHint: "cron",
        envKeyOrSlug: "amanda-entrepreneurial-artist-release"
      },
      {
        id: "portal-welcome-email",
        purpose: "Send the welcome email matching the member audience after enrollment.",
        providerHint: "pulse",
        envKeyOrSlug: "amanda-portal-welcome"
      },
      {
        id: "role-aware-application-onboarding",
        purpose: "Start the correct onboarding sequence after an Amanda application or intake is submitted.",
        providerHint: "pulse",
        envKeyOrSlug: "amanda-role-aware-onboarding"
      },
      {
        id: "incomplete-application-follow-up",
        purpose: "Remind applicants when required answers or documents are incomplete.",
        providerHint: "cron",
        envKeyOrSlug: "amanda-incomplete-application-follow-up"
      },
      {
        id: "appointment-confirmation-and-reminders",
        purpose: "Send booking confirmation plus 24-hour and 2-hour appointment reminders.",
        providerHint: "pulse",
        envKeyOrSlug: "amanda-appointment-reminders"
      },
      {
        id: "appointment-preparation-and-aftercare",
        purpose: "Send service-specific preparation before an appointment and aftercare afterward.",
        providerHint: "pulse",
        envKeyOrSlug: "amanda-appointment-care"
      },
      {
        id: "event-registration-communication",
        purpose: "Confirm event registration and send event reminders and updates.",
        providerHint: "pulse",
        envKeyOrSlug: "amanda-event-registration-communication"
      }
    ],
    nba: {
      providerId: "amanda-path",
      staticHeadline: "Continue the next step in your Amanda Catherine experience."
    }
  }
};

// lib/portal-universal/packs/online-academy.ts
var ONLINE_ACADEMY_PACK = {
  id: "online-academy-student-portal",
  version: "1.1.0",
  title: "Online Academy + Student Portal",
  description: "Public course enrollment connected to a branded, role-aware learning portal and teacher operations dashboard.",
  presentation: "workspace",
  suggestedModuleIds: [
    "dashboard",
    "member",
    "landing",
    "training",
    "calendar",
    "documents",
    "resources",
    "billing",
    "people",
    "applications",
    "reports",
    "messaging",
    "intake",
    "settings"
  ],
  useClientExperienceChrome: false,
  nav: [
    {
      id: "home",
      universalCapabilityId: "home",
      label: "Student Home",
      order: 10,
      preferredModuleId: "member"
    },
    {
      id: "courses",
      universalCapabilityId: "resources",
      label: "Courses & Learning",
      order: 20,
      preferredModuleId: "training"
    },
    {
      id: "resources",
      universalCapabilityId: "resources",
      label: "Resources",
      order: 30,
      preferredModuleId: "resources"
    },
    {
      id: "training-calendar",
      universalCapabilityId: "calendar",
      label: "Training Calendar",
      order: 35,
      preferredModuleId: "calendar"
    },
    {
      id: "assignments",
      universalCapabilityId: "documents",
      label: "Assignments & Uploads",
      order: 37,
      preferredModuleId: "documents"
    },
    {
      id: "certificates",
      universalCapabilityId: "resources",
      label: "Progress & Certificates",
      order: 39,
      preferredModuleId: "reports"
    },
    {
      id: "messages",
      universalCapabilityId: "messages",
      label: "Messages",
      order: 40,
      preferredModuleId: "messaging"
    },
    {
      id: "payments",
      universalCapabilityId: "payments",
      label: "Payments",
      order: 50,
      preferredModuleId: "billing"
    },
    {
      id: "students",
      universalCapabilityId: "people",
      label: "Students",
      order: 60,
      preferredModuleId: "people",
      minRole: "staff"
    },
    {
      id: "enrollments",
      universalCapabilityId: "programs",
      label: "Enrollments",
      order: 70,
      preferredModuleId: "applications",
      minRole: "staff"
    },
    {
      id: "reports",
      universalCapabilityId: "resources",
      label: "Progress & Revenue",
      order: 80,
      preferredModuleId: "reports",
      minRole: "staff"
    },
    {
      id: "academy-settings",
      universalCapabilityId: "messages",
      label: "Academy Settings",
      order: 90,
      preferredModuleId: "settings",
      minRole: "admin"
    }
  ],
  branding: {
    personalityId: "training-learning",
    workspaceName: "Online Academy",
    brandName: "Academy",
    terminology: {
      members: "Students",
      home: "Student Home",
      startPrompt: "Continue learning",
      focus: "Your next lesson",
      attention: "Needs your attention",
      start: "Continue course"
    }
  },
  extensions: {
    people: { enabled: false },
    tasks: { enabled: false },
    notifications: { enabled: false },
    formSchemaRefs: [
      {
        id: "academy-course-enrollment",
        universalCapabilityId: "programs",
        title: "Course Enrollment",
        schemaRef: "ea://academy/forms/course-enrollment/v1"
      },
      {
        id: "academy-assignment-submission",
        universalCapabilityId: "documents",
        title: "Assignment and Practical Submission",
        schemaRef: "ea://academy/forms/assignment-submission/v1"
      },
      {
        id: "academy-practical-assessment",
        universalCapabilityId: "programs",
        title: "Practical Completion Assessment",
        schemaRef: "ea://academy/forms/practical-assessment/v1"
      },
      {
        id: "academy-practitioner-directory",
        universalCapabilityId: "people",
        title: "Certified Practitioner Directory Application",
        schemaRef: "ea://academy/forms/practitioner-directory/v1"
      }
    ],
    workflowRefs: [
      {
        id: "academy-public-course-cta",
        purpose: "Connect the public Courses & Learning CTA to the branded course catalog.",
        providerHint: "pulse",
        envKeyOrSlug: "academy-public-course-cta"
      },
      {
        id: "academy-payment-and-access",
        purpose: "Confirm payment, create student access automatically, and assign purchased courses.",
        providerHint: "pulse",
        envKeyOrSlug: "academy-payment-and-access"
      },
      {
        id: "academy-welcome-and-sign-in",
        purpose: "Send the branded welcome message and secure student sign-in instructions.",
        providerHint: "pulse",
        envKeyOrSlug: "academy-welcome-and-sign-in"
      },
      {
        id: "academy-progress-and-certificate",
        purpose: "Track lesson completion and release the branded certificate when requirements are met.",
        providerHint: "pulse",
        envKeyOrSlug: "academy-progress-and-certificate"
      },
      {
        id: "academy-protected-course-materials",
        purpose: "Keep textbooks, protocols, forms, and course files private and available only to assigned students and administrators.",
        providerHint: "pulse",
        envKeyOrSlug: "academy-protected-course-materials"
      },
      {
        id: "academy-scheduled-lesson-release",
        purpose: "Release lessons and resources on the instructor-defined schedule while preserving administrator access.",
        providerHint: "cron",
        envKeyOrSlug: "academy-scheduled-lesson-release"
      },
      {
        id: "academy-assignment-and-practical-completion",
        purpose: "Collect assignments, document practical requirements, and include both in completion eligibility.",
        providerHint: "pulse",
        envKeyOrSlug: "academy-assignment-and-practical-completion"
      },
      {
        id: "academy-student-progress-alerts",
        purpose: "Notify instructors when students stall and remind learners about incomplete lessons or requirements.",
        providerHint: "pulse",
        envKeyOrSlug: "academy-student-progress-alerts"
      },
      {
        id: "academy-instructor-messaging",
        purpose: "Keep course questions, instructor responses, announcements, and learner support inside the academy.",
        providerHint: "pulse",
        envKeyOrSlug: "academy-instructor-messaging"
      },
      {
        id: "academy-practitioner-pathway",
        purpose: "Move eligible graduates into certificate access, practitioner verification, directory review, referrals, and advanced training.",
        providerHint: "pulse",
        envKeyOrSlug: "academy-practitioner-pathway"
      }
    ],
    nba: {
      providerId: "online-academy",
      staticHeadline: "Continue with your next lesson."
    }
  }
};

// lib/portal-universal/packs/index.ts
var RAW_PACKS = [
  EA_EXECUTIVE_PACK,
  CTP_CLIENT_PACK,
  WEBSITE_PORTAL_PACK,
  REAL_ESTATE_PACK,
  SAMPLE_PLACEHOLDER_PACK,
  AMANDA_CATHERINE_PACK,
  ONLINE_ACADEMY_PACK
];
var INDUSTRY_PACK_REGISTRY = Object.fromEntries(
  RAW_PACKS.map((pack) => {
    const valid = assertValidIndustryPack(pack, { phase1Strict: true });
    return [valid.id, valid];
  })
);
function getIndustryPack(id2) {
  return INDUSTRY_PACK_REGISTRY[id2];
}

// lib/modules/client-factory-assembly.ts
function requestedModules(input) {
  const modules = defaultModulesForPackage(resolveEntitlementPackageKey(input), {
    tenantPreset: input.tenantPreset,
    isDemo: input.isDemo
  });
  const options = (input.businessOptionIds ?? []).flatMap((id2) => {
    const option = getBusinessOption(id2);
    if (!option) throw new Error(`Unknown business option: ${id2}`);
    return [...option.moduleIds];
  });
  const pack = input.industryPackId ? getIndustryPack(input.industryPackId) : void 0;
  if (input.industryPackId && (!pack || pack.id === "sample-placeholder")) throw new Error("Invalid production industry pack");
  const bricks = requireBrickSelections(input.bricks);
  return [
    ...modules,
    ...input.requestedModuleIds ?? [],
    ...options,
    ...pack?.suggestedModuleIds ?? [],
    ...bricks.flatMap((x) => [...x.entry.moduleIds])
  ];
}
function planClientFactoryAssembly(input) {
  return createAssemblyPlan(requestedModules(input));
}
function requireClientFactoryAssembly(input) {
  return requireAssemblyPlan(requestedModules(input));
}

// lib/modules/assembly-evidence.ts
import { createHash as createHash5 } from "node:crypto";
var ORG_ID = "ea-assembly-evidence";
function recordId(portalSlug) {
  return `assembly-evidence-${portalSlug.toLowerCase().replace(/[^a-z0-9-]+/g, "-")}`;
}
function fingerprint(input) {
  return createHash5("sha256").update(JSON.stringify(input)).digest("hex");
}
function buildAssemblyEvidenceReceipt(input) {
  if (input.plan.blocked) throw new Error("Cannot record blocked EA assembly evidence.");
  const base = {
    version: 1,
    portalSlug: input.portalSlug,
    organizationId: input.organizationId,
    packagePurchased: input.packagePurchased,
    mode: "certified",
    requested: [...input.plan.requested],
    admitted: [...input.plan.admitted],
    certificationRun: input.certificationRun
  };
  return {
    ...base,
    fingerprint: fingerprint(base),
    recordedAt: input.recordedAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function persistAssemblyEvidenceReceipt(receipt) {
  const result = await saveStudioRecord({
    recordType: "media",
    id: recordId(receipt.portalSlug),
    organizationId: ORG_ID,
    payload: receipt,
    title: `Assembly Evidence \u2014 ${receipt.portalSlug}`
  });
  if (!result.ok || !result.persistedToAirtable) throw new Error(result.error || "Could not persist EA assembly evidence.");
  return receipt;
}

// config/capability-certifications.json
var capability_certifications_default = {
  version: 1,
  run: 6,
  certifications: [
    { id: "intake", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "Existing EA portal route and application services only; no new paid vendor dependency", evidence: ["module-registry-contract", "run3-business-wave-contract", "portal-build-smoke"] },
    { id: "applications", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "Existing EA portal route and application services only; no new paid vendor dependency", evidence: ["module-registry-contract", "run3-business-wave-contract", "portal-build-smoke"] },
    { id: "reports", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "Existing EA portal route and application services only; no new paid vendor dependency", evidence: ["module-registry-contract", "run3-business-wave-contract", "portal-build-smoke"] },
    { id: "member", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA-owned Member Experience route and existing tenant/member data only; no new vendor account or per-client license required", evidence: ["module-registry-contract", "run4-starter-package-contract", "portal-build-smoke"] },
    { id: "settings", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA-owned portal preferences and business-presence surfaces only; no new vendor account or per-client license required", evidence: ["module-registry-contract", "run4-starter-package-contract", "portal-build-smoke"] },
    { id: "events", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA Calendar & Event Hub route, shared scheduling, and EA registration ledger are certified. Pretix is an optional extension only and remains isolated from the assembly requirement; no Pretix account is required to provision the module.", evidence: ["module-registry-contract", "run4-starter-package-contract", "events-optional-provider-contract", "portal-build-smoke"] },
    { id: "billing", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA billing workspace, authorization boundary, and existing platform-managed Stripe adapter are certified. No client Stripe account or per-client software license is required for provisioning; payment-processing charges apply only when commerce is used.", evidence: ["module-registry-contract", "run4-starter-package-contract", "billing-platform-adapter-contract", "portal-build-smoke"] },
    { id: "landing", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA-owned live-site and Experience Builder workspace surfaces using existing EA publish services; no new vendor account or per-client license required", evidence: ["module-registry-contract", "run4-canonical-entitlement-contract", "portal-build-smoke"] },
    { id: "pulse", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA-owned Pulse operational-health and tenant activity surfaces using existing EA data services; no new vendor account or per-client license required", evidence: ["module-registry-contract", "run4-canonical-entitlement-contract", "portal-build-smoke"] },
    { id: "ctp", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA-owned Consider the Possibilities workspace and existing CTP project-state services; no new vendor account or per-client license required", evidence: ["module-registry-contract", "run4-canonical-entitlement-contract", "portal-build-smoke"] },
    { id: "messaging", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA-owned messaging surface backed by Update Hub and existing portal communication services. Novu is not required for this certified boundary and remains an optional future provider extension.", evidence: ["module-registry-contract", "run4-canonical-entitlement-contract", "messaging-native-boundary", "portal-build-smoke"] },
    { id: "documents", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA-owned Document Hub using existing tenant uploads, CTP deliverables, and Update Hub files. Documenso is not required for this certified boundary and remains isolated as an optional signing provider.", evidence: ["module-registry-contract", "run4-canonical-entitlement-contract", "documents-native-boundary", "portal-build-smoke"] },
    { id: "training", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA-owned Training Hub and existing published-training/course services; no new vendor account or per-client license required", evidence: ["module-registry-contract", "run4-canonical-entitlement-contract", "portal-build-smoke"] },
    { id: "resources", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA-owned Resource Library using existing tenant resources and workspace links; no new vendor account or per-client license required", evidence: ["module-registry-contract", "run4-canonical-entitlement-contract", "portal-build-smoke"] },
    { id: "ask", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA-owned Guide request surface using existing portal and Update Hub services; no new vendor account or per-client license required", evidence: ["module-registry-contract", "run4-canonical-entitlement-contract", "portal-build-smoke"] },
    { id: "connect", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA-owned Connect relationship-capture workspace and existing EA routing services; no new vendor account or per-client software license required for provisioning", evidence: ["module-registry-contract", "run4-canonical-entitlement-contract", "portal-build-smoke"] },
    { id: "simplifi", assemblyStatus: "certified", costLicenseDecision: "approved", boundary: "EA-owned Simplifi portal workspace, capture records, content-request visibility, and Magnifi linking using existing EA services. No new vendor account or per-client software license is required for provisioning.", evidence: ["module-registry-contract", "run6-simplifi-native-boundary", "portal-build-smoke"] }
  ]
};

// ports:@/lib/os-capability-taxonomy
function listOsCapabilitiesByLifecycle() {
  return [];
}

// lib/tenant-foundation.ts
function touchOsFoundationTaxonomy() {
  const tags = ["organize", "communicate"];
  for (const tag of tags) {
    void listOsCapabilitiesByLifecycle(tag);
  }
}
function effectiveAssemblyMode(input) {
  const explicitSelection = !!(input.requestedModuleIds || input.businessOptionIds || input.industryPackId || input.bricks || input.moduleConfigs);
  if (explicitSelection && input.assemblyMode === "legacy") throw new Error("Explicit selection requires certified installation");
  if (explicitSelection) return "certified";
  if (input.assemblyMode) return input.assemblyMode;
  return input.packagePurchased === "Website + Portal Starter" ? "certified" : "legacy";
}
async function ensureTenantFoundation(input) {
  touchOsFoundationTaxonomy();
  const assemblyMode = effectiveAssemblyMode(input);
  const assemblyPlan = assemblyMode === "certified" ? requireClientFactoryAssembly({
    packagePurchased: input.packagePurchased,
    commerceOfferId: input.commerceOfferId,
    requestedModuleIds: input.requestedModuleIds,
    businessOptionIds: input.businessOptionIds,
    industryPackId: input.industryPackId,
    bricks: input.bricks
  }) : null;
  if (assemblyPlan) await requireModuleProviders(assemblyPlan.admitted, input.moduleConfigs);
  const { orgId } = await ensureOrganizationForPortal({
    portalSlug: input.portalSlug,
    name: input.clientName,
    clientRecordId: input.clientRecordId,
    organizationName: input.organizationName ?? input.clientName
  });
  const installation = assemblyPlan ? {
    version: 1,
    organizationId: orgId,
    portalSlug: input.portalSlug,
    requested: assemblyPlan.requested,
    admitted: assemblyPlan.admitted,
    industryPackId: input.industryPackId,
    brickIds: (input.bricks ?? []).map((b) => b.id),
    state: "installing"
  } : void 0;
  if (installation) await persistTenantInstall(installation);
  try {
    await ensurePackageEntitlements({
      orgId,
      packagePurchased: input.packagePurchased,
      commerceOfferId: input.commerceOfferId,
      slug: input.portalSlug,
      admittedModuleIds: assemblyPlan?.admitted
    });
  } catch (err) {
    console.error("[tenant-foundation] ensurePackageEntitlements failed:", err);
    if (assemblyMode === "certified") throw err;
  }
  if (!assemblyPlan) return { orgId };
  await installAdmittedModules({ organizationId: orgId, portalSlug: input.portalSlug }, assemblyPlan.admitted, input.moduleConfigs);
  await installSelectedBricks({ organizationId: orgId, portalSlug: input.portalSlug }, input.bricks);
  if (input.industryPackId) {
    const updated = await updateOrganizationWorkspaceConfig(orgId, { industryPackId: input.industryPackId });
    const durable2 = await loadStudioRecordFromAirtable("brand", `org-workspace-${orgId}`);
    if (!updated || durable2?.industryPackId !== input.industryPackId) throw new Error("Industry pack write failed");
  }
  const assemblyEvidence = buildAssemblyEvidenceReceipt({
    portalSlug: input.portalSlug,
    organizationId: orgId,
    packagePurchased: input.packagePurchased,
    plan: assemblyPlan,
    certificationRun: capability_certifications_default.run
  });
  await persistAssemblyEvidenceReceipt(assemblyEvidence);
  await persistTenantInstall({ ...installation, state: "installed" });
  return { orgId, assemblyEvidence };
}

// app/api/portal/[slug]/bricks/amanda/route.ts
import { NextResponse } from "next/server";
import { z as z6 } from "zod";

// ports:@/lib/api/portal-route
async function guardPortalApi(req, { slug }) {
  const session = globalThis.__chassisTest.session;
  return session && session.slug === slug ? { ok: true, session } : { ok: false, status: 401, error: "Authentication required" };
}
function portalApiUnauthorized(f) {
  return Response.json({ error: f.error }, { status: f.status });
}

// ports:@/lib/memberships
async function findMembership() {
  return globalThis.__chassisTest.member ? { status: "active", role: "viewer" } : null;
}

// ports:@/lib/stripe
function getStripe() {
  return { paymentIntents: { retrieve: async () => globalThis.__chassisTest.payment }, checkout: { sessions: { create: async () => ({ id: "cs_test", url: "https://checkout.stripe.com/test" }) } } };
}

// lib/portal-universal/bricks/amanda/stripe.ts
async function fulfillPortableAmandaPayment(tenant, registrationId, reference) {
  const install = await loadTenantInstall(tenant.organizationId);
  const enabled = activeModuleIdsFromEntitlements(await listEntitlementsForOrg(tenant.organizationId));
  if (install?.state !== "installed" || install.portalSlug !== tenant.portalSlug || !install.brickIds.includes("amanda") || AMANDA_BRICK_MODULES.some((id2) => !enabled.has(id2))) throw new Error("Enrollment installation unavailable");
  return payAmandaBrick(tenant, registrationId, reference, {
    verify: async (id2) => {
      const payment = await getStripe().paymentIntents.retrieve(id2);
      return {
        reference: payment.id,
        organizationId: payment.metadata.organizationId,
        registrationId: payment.metadata.registrationId,
        offerId: payment.metadata.offerId,
        amount: payment.amount_received,
        currency: payment.currency,
        paid: payment.status === "succeeded"
      };
    },
    confirm: async (message) => {
      const sent = await sendAuthEmail({
        to: message.to,
        subject: message.subject,
        title: "Registration confirmation",
        bodyHtml: message.html,
        text: "Your registration payment is confirmed."
      });
      if (!sent.ok) throw new Error("Confirmation delivery failed");
    }
  });
}
async function fulfillPortableAmandaSession(session) {
  if (session.metadata?.portableBrick !== "amanda") return false;
  if (session.payment_status !== "paid") throw new Error("Stripe has not confirmed payment");
  const reference = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!reference) throw new Error("Stripe payment reference missing");
  await fulfillPortableAmandaPayment(
    { organizationId: session.metadata.organizationId, portalSlug: session.metadata.portalSlug },
    session.metadata.registrationId,
    reference
  );
  return true;
}

// app/api/portal/[slug]/bricks/amanda/route.ts
var Input = z6.discriminatedUnion("action", [
  z6.object({ action: z6.literal("signup"), offerId: z6.string(), name: z6.string() }).strict(),
  z6.object({ action: z6.literal("checkout"), registrationId: z6.string() }).strict(),
  z6.object({ action: z6.literal("payment"), registrationId: z6.string(), reference: z6.string().regex(/^pi_[a-zA-Z0-9]+$/) }).strict()
]);
async function POST(req, context) {
  const { slug } = await context.params;
  const auth = await guardPortalApi(req, { slug });
  if (!auth.ok) return portalApiUnauthorized(auth);
  if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ error: "Origin denied" }, { status: 403 });
  try {
    const org = await findOrganizationByPortalSlug(slug);
    const email = auth.session.email?.trim().toLowerCase();
    if (!org || org.status !== "Active" || !email || auth.session.orgId !== org.id)
      return NextResponse.json({ error: "Tenant access denied" }, { status: 403 });
    const member = await findMembership(email, org.id);
    if (!member || member.status !== "active" || !PLATFORM_ROLES.includes(String(member.role)) || !PLATFORM_ROLES.includes(String(auth.session.role))) return NextResponse.json({ error: "Active membership required" }, { status: 403 });
    const install = await loadTenantInstall(org.id);
    const enabled = activeModuleIdsFromEntitlements(await listEntitlementsForOrg(org.id));
    if (install?.state !== "installed" || !install.brickIds.includes("amanda") || AMANDA_BRICK_MODULES.some((id2) => !enabled.has(id2)))
      return NextResponse.json({ error: "Enrollment service unavailable" }, { status: 404 });
    const tenant = { organizationId: org.id, portalSlug: slug };
    const input = Input.parse(await req.json());
    if (input.action === "signup") return NextResponse.json({
      ok: true,
      registration: await signupAmandaBrick(tenant, { email, name: input.name, offerId: input.offerId })
    });
    const row = await readAmandaRegistration(tenant, input.registrationId);
    if (row.email !== email) return NextResponse.json({ error: "Registration access denied" }, { status: 403 });
    if (input.action === "checkout") {
      if (row.payment_status === "paid") return NextResponse.json({ error: "Registration already paid" }, { status: 409 });
      const config = await loadAmandaInstall(tenant);
      const offer = config.offers.find((x) => x.id === row.offerId);
      const session = await getStripe().checkout.sessions.create({
        mode: "payment",
        customer_email: email,
        line_items: [{ price_data: { currency: offer.currency, unit_amount: offer.amount, product_data: { name: offer.title } }, quantity: 1 }],
        metadata: { portableBrick: "amanda", organizationId: org.id, portalSlug: slug, registrationId: row.registration_id },
        payment_intent_data: { metadata: { organizationId: org.id, registrationId: row.registration_id, offerId: row.offerId } },
        success_url: `${req.nextUrl.origin}/portal/${slug}/member`,
        cancel_url: `${req.nextUrl.origin}/portal/${slug}/member`
      }, { idempotencyKey: "enrollment-checkout-" + row.registration_id });
      return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
    }
    const registration = await fulfillPortableAmandaPayment(tenant, input.registrationId, input.reference);
    return NextResponse.json({ ok: true, registration });
  } catch (error) {
    console.error("[portable-enrollment]", error instanceof Error ? error.message : "Request failed");
    return NextResponse.json({ error: "Enrollment request could not be completed" }, { status: error instanceof z6.ZodError ? 400 : 409 });
  }
}

// app/api/admin/entitlements/route.ts
import { NextResponse as NextResponse2 } from "next/server";

// ports:@/lib/admin-session-guard
async function requireAdminActionFromRequest() {
  return { ok: true };
}
function adminAuthJsonError() {
  return Response.json({ error: "Denied" }, { status: 403 });
}

// ports:@/lib/platform-store
function platformStoreConfigured() {
  return true;
}

// ports:@/lib/tenant-context
function isSyntheticOrganizationId(org) {
  return org.startsWith("org_");
}

// app/api/admin/entitlements/route.ts
import { getMapRowByModuleId } from "@ea/capability-registry";
async function prepareEnabledModules(organizationId, ids) {
  const affected = ids.filter((id2) => ["calendar", "people", "discovery"].includes(id2));
  if (!affected.length) return;
  await requireModuleProviders(affected);
  const install = await loadTenantInstall(organizationId);
  if (!install || install.state !== "installed") throw new Error("Install a certified chassis manifest before adding these modules");
  await installAdmittedModules(install, affected);
}
async function retainInstalledSelection(organizationId, changed, enabled) {
  const install = await loadTenantInstall(organizationId);
  if (!install) return;
  const next = new Set(install.admitted);
  for (const id2 of changed) {
    if (enabled) next.add(id2);
    else next.delete(id2);
  }
  const plan = createAssemblyPlan([...next]);
  if (plan.blocked) throw new Error("Updated installation is not certified");
  const active = activeModuleIdsFromEntitlements(await listEntitlementsForOrg(organizationId));
  if (plan.admitted.some((id2) => !active.has(id2))) throw new Error("Selection write was not confirmed");
  await persistTenantInstall({ ...install, admitted: plan.admitted, requested: [...next] });
}
async function handlePOST(req) {
  const auth = await requireAdminActionFromRequest(req, "admin:manage");
  if (!auth.ok) return adminAuthJsonError(auth);
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse2.json({ error: "Invalid request body." }, { status: 400 });
  }
  const organizationId = body.organizationId?.trim();
  if (!organizationId) {
    return NextResponse2.json({ error: "organizationId is required." }, { status: 400 });
  }
  if (isSyntheticOrganizationId(organizationId) || !platformStoreConfigured()) {
    return NextResponse2.json(
      { error: "Entitlements are read-only for synthetic orgs or when Airtable is not configured." },
      { status: 403 }
    );
  }
  const source = body.source ?? "manual";
  const action = body.action ?? "set";
  if (action === "set") {
    const moduleId = body.moduleId?.trim();
    if (!moduleId) {
      return NextResponse2.json({ error: "moduleId is required for set." }, { status: 400 });
    }
    if (!MODULE_IDS.includes(moduleId)) {
      return NextResponse2.json({ error: "Unknown moduleId." }, { status: 400 });
    }
    if (body.enabled === false && CHASSIS_STANDARD_MODULE_IDS.includes(moduleId))
      return NextResponse2.json({ error: "Standard chassis modules cannot be disabled" }, { status: 409 });
    if (body.enabled !== false) {
      const plan2 = createAssemblyPlan([moduleId]);
      if (plan2.blocked) return NextResponse2.json({ error: "Selection is not certified", rejected: plan2.rejected }, { status: 409 });
    }
    if (body.enabled !== false) {
      const admitted = createAssemblyPlan([moduleId]).admitted;
      await prepareEnabledModules(organizationId, admitted);
      const result2 = await setModulesEnabledBulk(organizationId, admitted, true, source);
      if (result2.failed.length) return NextResponse2.json({ ok: false, updated: result2.ok, failed: result2.failed }, { status: 503 });
      const actual = await listEntitlementsForOrg(organizationId);
      if (admitted.some((id2) => !activeModuleIdsFromEntitlements(actual).has(id2)))
        return NextResponse2.json({ error: "Selection read-back failed" }, { status: 503 });
      await retainInstalledSelection(organizationId, admitted, true);
      return NextResponse2.json({ ok: true, entitlement: actual.find((e) => e.moduleId === moduleId), admitted });
    }
    const entitlement = await setModuleEnabled(organizationId, moduleId, false, source);
    if (!entitlement) {
      return NextResponse2.json(
        { error: "Could not update entitlement. Check Airtable Entitlements table." },
        { status: 503 }
      );
    }
    await retainInstalledSelection(organizationId, [moduleId], false);
    return NextResponse2.json({ ok: true, entitlement });
  }
  if (action === "set-business-option") {
    const option = getBusinessOption(body.businessOptionId?.trim() ?? "");
    if (!option) {
      return NextResponse2.json({ error: "Unknown businessOptionId." }, { status: 400 });
    }
    const enabled2 = body.enabled !== false;
    const plan2 = createAssemblyPlan([...option.moduleIds]);
    if (enabled2 && plan2.blocked) return NextResponse2.json({ error: "Selection is not certified", rejected: plan2.rejected }, { status: 409 });
    if (enabled2) await prepareEnabledModules(organizationId, plan2.admitted);
    const result2 = await setModulesEnabledBulk(
      organizationId,
      enabled2 ? plan2.admitted : [...option.moduleIds],
      enabled2,
      source
    );
    if (!result2.failed.length) await retainInstalledSelection(organizationId, enabled2 ? plan2.admitted : option.moduleIds, enabled2);
    return NextResponse2.json({
      ok: result2.failed.length === 0,
      action,
      businessOptionId: option.id,
      enabled: enabled2,
      updated: result2.ok,
      failed: result2.failed,
      updatedCount: result2.ok.length,
      failedCount: result2.failed.length
    });
  }
  let targetIds = [];
  if (action === "enable-all" || action === "disable-all") {
    targetIds = [...MODULE_IDS];
  } else if (action === "enable-mapped") {
    targetIds = MODULE_REGISTRY.map((m) => m.id).filter((id2) => Boolean(getMapRowByModuleId(id2)));
  } else if (action === "bulk-enable" || action === "bulk-disable") {
    if ((body.moduleIds ?? []).some((id2) => !MODULE_IDS.includes(id2.trim())))
      return NextResponse2.json({ error: "Unknown moduleId in selection." }, { status: 400 });
    const requested = (body.moduleIds ?? []).map((id2) => id2.trim()).filter((id2) => MODULE_IDS.includes(id2));
    if (!requested.length) {
      return NextResponse2.json({ error: "moduleIds required for bulk actions." }, { status: 400 });
    }
    targetIds = requested;
  } else {
    return NextResponse2.json({ error: "Unknown action." }, { status: 400 });
  }
  const enabled = action === "bulk-enable" || action === "enable-all" || action === "enable-mapped";
  if (!enabled && targetIds.some((id2) => CHASSIS_STANDARD_MODULE_IDS.includes(id2)))
    return NextResponse2.json({ error: "Standard chassis modules cannot be disabled" }, { status: 409 });
  const plan = createAssemblyPlan(targetIds);
  if (enabled && plan.blocked) return NextResponse2.json({ error: "Selection is not certified", rejected: plan.rejected }, { status: 409 });
  if (enabled) await prepareEnabledModules(organizationId, plan.admitted);
  const result = await setModulesEnabledBulk(organizationId, enabled ? plan.admitted : targetIds, enabled, source);
  if (!result.failed.length) await retainInstalledSelection(organizationId, enabled ? plan.admitted : targetIds, enabled);
  return NextResponse2.json({
    ok: result.failed.length === 0,
    action,
    enabled,
    updated: result.ok,
    failed: result.failed,
    updatedCount: result.ok.length,
    failedCount: result.failed.length
  });
}
async function POST2(req) {
  try {
    return await handlePOST(req);
  } catch (error) {
    return NextResponse2.json({ ok: false, error: error instanceof Error ? error.message : "Selection installation failed" }, { status: 503 });
  }
}
export {
  AMANDA_BRICK_MODULES,
  AmandaInstallSchema,
  assertBrickTenant,
  POST as brickPOST,
  changeMemberGrant,
  ensurePackageEntitlements,
  ensureTenantFoundation,
  POST2 as entitlementsPOST,
  fulfillPortableAmandaPayment,
  fulfillPortableAmandaSession,
  installAmandaBrick,
  isDemoPortalSlug,
  loadAmandaInstall,
  payAmandaBrick,
  planClientFactoryAssembly,
  readAmandaRegistration,
  requireClientFactoryAssembly,
  signupAmandaBrick
};
