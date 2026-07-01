'use strict';

// lib/brief-engine.ts
var EVENT_IMPORTANCE = {
  "parent connected": 20,
  "guide downloaded": 40,
  "guide opened": 40,
  "portal opened": 45,
  "opportunity captured": 55,
  "application started": 75,
  "course completed": 80,
  "newsletter sent": 80,
  "volunteer overdue": 90,
  "application approved": 95,
  "application completed": 95,
  "missed follow-up": 100
};
function buildBriefResponse(events, request, quickActions = []) {
  const now = request.time ? new Date(request.time) : /* @__PURE__ */ new Date();
  const cards = selectBriefCards(events, request, 5);
  const todaysActivity = events.filter((event) => isSameDay(new Date(event.createdAt), now)).map((event) => toBriefCard(event, request, now)).slice(0, 5);
  const recentEvents = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((event) => toBriefCard(event, request, now));
  return {
    greeting: buildGreeting(request.userName, now),
    topPriority: cards[0],
    todaysActivity,
    recommendedActions: cards.filter((card) => card.actionLabel).slice(0, 3),
    recentEvents,
    quickActions,
    cards
  };
}
function selectBriefCards(events, request, limit = 5) {
  const now = request.time ? new Date(request.time) : /* @__PURE__ */ new Date();
  return events.filter((event) => event.organizationId === request.organizationId).filter((event) => !request.module || event.module === request.module).map((event) => toBriefCard(event, request, now)).sort((a, b) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}
function scoreActivityEvent(event, request = { organizationId: event.organizationId }) {
  const now = request.time ? new Date(request.time) : /* @__PURE__ */ new Date();
  const eventAgeHours = Math.max(0, (now.getTime() - new Date(event.createdAt).getTime()) / 36e5);
  const recency = Math.max(0, 25 - eventAgeHours);
  const eventImportance = EVENT_IMPORTANCE[event.eventType.toLowerCase()] ?? 0;
  const dueDateBoost = getDueDateBoost(event.metadata, now);
  const riskBoost = readScore(event.metadata.risk);
  const engagementBoost = readScore(event.metadata.engagement);
  const aiImportance = readScore(event.metadata.aiImportance);
  return clampScore(event.priority * 0.35 + eventImportance * 0.25 + recency + dueDateBoost + riskBoost * 0.1 + engagementBoost * 0.1 + aiImportance * 0.2);
}
function toBriefCard(event, request, now = /* @__PURE__ */ new Date()) {
  const fallbackMetric = event.priority > 0 ? `Priority ${event.priority}` : event.eventType;
  return {
    id: event.id,
    title: event.title,
    summary: event.summary,
    metric: event.metric ?? fallbackMetric,
    actionLabel: event.actionLabel ?? "Review",
    actionUrl: event.actionUrl,
    module: event.module,
    eventType: event.eventType,
    priority: event.priority,
    score: scoreActivityEvent(event, { ...request, time: now }),
    personId: event.personId,
    createdAt: event.createdAt,
    metadata: event.metadata
  };
}
function buildGreeting(userName, now) {
  const hour = now.getHours();
  const dayPart = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  return userName ? `${dayPart}, ${userName}` : dayPart;
}
function getDueDateBoost(metadata, now) {
  const dueDate = typeof metadata.dueDate === "string" ? new Date(metadata.dueDate) : void 0;
  if (!dueDate || Number.isNaN(dueDate.getTime())) return 0;
  const daysUntilDue = (dueDate.getTime() - now.getTime()) / 864e5;
  if (daysUntilDue < 0) return 25;
  if (daysUntilDue <= 1) return 20;
  if (daysUntilDue <= 3) return 12;
  return 0;
}
function readScore(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}
function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// lib/platform-events.ts
function fromActivityEvent(event) {
  const source = event.module === "agent" || event.metadata.agentKind ? "agent" : event.metadata.source === "pulse" ? "pulse" : "activity";
  return enrichPlatformEvent(event, source, inferCategory(event));
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
function readStr2(value) {
  return typeof value === "string" ? value : "";
}
function readNum(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

// lib/mission-control.ts
var DEFAULT_ACTION_CARDS = [
  { id: "new-client", label: "New Client", href: "/admin/clients/new", intent: "start new client", module: "clients" },
  { id: "proposal", label: "Create Proposal", href: "/admin/proposals/new", intent: "create proposal", module: "simplifi" },
  { id: "blueprint", label: "Generate Blueprint", href: "/admin/blueprints/new", intent: "generate blueprint", module: "simplifi" },
  { id: "portal", label: "Build Portal", href: "/admin/build/portal", intent: "build portal", module: "build" },
  { id: "landing", label: "Build Landing Page", href: "/admin/build/landing", intent: "build landing page", module: "build" },
  { id: "training", label: "Create Training", href: "/admin/training/new", intent: "create training", module: "training" },
  { id: "content", label: "Publish Content", href: "/amplifi", intent: "publish content", module: "amplifi" },
  { id: "launch", label: "Launch Project", href: "/launch", intent: "launch project", module: "pulse" }
];
var DEFAULT_INTENT_EXAMPLES = [
  "Create proposal for Bob",
  "Build volunteer portal",
  "Continue yesterday's work",
  "Review opportunities",
  "Generate Blueprint",
  "Launch client project"
];
function buildMissionControlResponse(events, request, options = {}) {
  const brief = buildBriefResponse(events, request, options.quickActions);
  const actionCards = filterActionCardsByRole(
    options.actionCards ?? DEFAULT_ACTION_CARDS,
    request.role
  );
  const agentRuns = options.agentRuns ?? extractAgentRuns(events);
  const activeAgents = agentRuns.filter(isActiveAgent);
  const continueWorking = extractContinueWorking(events, request);
  const momentum = computeMomentum(events, request);
  const todaysFocus = brief.cards.map(enrichCardWithWhy);
  return {
    ...brief,
    intentExamples: options.intentExamples ?? DEFAULT_INTENT_EXAMPLES,
    todaysFocus,
    topPriority: todaysFocus[0] ?? brief.topPriority,
    recommendedActions: todaysFocus.filter((c) => c.actionLabel).slice(0, 3),
    continueWorking,
    actionCards,
    agentRuns,
    activeAgents,
    momentum
  };
}
function buildMissionControlFromStreams(activity, pulse, request, options = {}) {
  return buildMissionControlResponse(mergeEventStreams(activity, pulse), request, options);
}
function extractContinueWorking(events, request) {
  return events.filter((e) => e.organizationId === request.organizationId).filter(
    (e) => e.category === "continue" || Boolean(e.metadata.continueUrl) || e.eventType.toLowerCase().includes("paused") || e.eventType.toLowerCase().includes("in_progress")
  ).map((e) => ({
    id: e.id,
    title: readStr3(e.metadata.continueTitle) || e.title,
    summary: e.summary,
    href: readStr3(e.metadata.continueUrl) || e.actionUrl || "#",
    module: e.module,
    lastActiveAt: e.createdAt
  })).sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()).slice(0, 6);
}
function extractAgentRuns(events) {
  return events.filter((e) => e.module === "agent" || e.metadata.agentKind).map((e) => toAgentRun(e)).slice(0, 10);
}
function computeMomentum(events, request) {
  const now = request.time ? new Date(request.time) : /* @__PURE__ */ new Date();
  const today = events.filter(
    (e) => e.organizationId === request.organizationId && isSameDay2(new Date(e.createdAt), now)
  );
  const advanced = today.filter(
    (e) => e.eventType.includes("completed") || e.eventType.includes("advanced") || e.metadata.momentum === "advanced"
  ).length;
  const proposals = today.filter((e) => e.eventType.includes("proposal")).length;
  const opportunities = today.filter((e) => e.eventType.includes("opportunity") || e.eventType.includes("capture")).length;
  const onboarded = today.filter((e) => e.eventType.includes("onboard")).length;
  const stats = [];
  if (advanced > 0) stats.push({ label: "Projects advanced", value: advanced });
  if (proposals > 0) stats.push({ label: "Proposals completed", value: proposals });
  if (opportunities > 0) stats.push({ label: "Opportunities discovered", value: opportunities });
  if (onboarded > 0) stats.push({ label: "Clients onboarded", value: onboarded });
  return stats;
}
function enrichCardWithWhy(card) {
  const why = readStr3(card.metadata.whyRecommended) || readStr3(card.metadata.recommendationReason);
  if (!why) return card;
  return {
    ...card,
    summary: card.summary.includes(why) ? card.summary : `${card.summary} ${why}`.trim()
  };
}
function filterActionCardsByRole(cards, role) {
  if (role === "builder") return cards;
  const builderOnly = /* @__PURE__ */ new Set(["portal", "landing"]);
  return cards.filter((c) => !builderOnly.has(c.id));
}
function isSameDay2(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function readStr3(value) {
  return typeof value === "string" ? value : "";
}

exports.DEFAULT_ACTION_CARDS = DEFAULT_ACTION_CARDS;
exports.DEFAULT_INTENT_EXAMPLES = DEFAULT_INTENT_EXAMPLES;
exports.buildMissionControlFromStreams = buildMissionControlFromStreams;
exports.buildMissionControlResponse = buildMissionControlResponse;
//# sourceMappingURL=mission-control.cjs.map
//# sourceMappingURL=mission-control.cjs.map