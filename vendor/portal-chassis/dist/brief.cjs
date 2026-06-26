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

exports.buildBriefResponse = buildBriefResponse;
exports.scoreActivityEvent = scoreActivityEvent;
exports.selectBriefCards = selectBriefCards;
exports.toBriefCard = toBriefCard;
//# sourceMappingURL=brief.cjs.map
//# sourceMappingURL=brief.cjs.map