'use strict';

var jsxRuntime = require('react/jsx-runtime');

// layout/BriefExperience.tsx
function BriefExperience({ brief, moduleName }) {
  return /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-brief", "aria-label": moduleName ? `${moduleName} brief` : "Brief", children: [
    /* @__PURE__ */ jsxRuntime.jsx("style", { children: briefStyles }),
    /* @__PURE__ */ jsxRuntime.jsxs("header", { className: "ea-brief-header", children: [
      /* @__PURE__ */ jsxRuntime.jsx("p", { children: brief.greeting }),
      /* @__PURE__ */ jsxRuntime.jsx("h1", { children: "What needs attention right now" })
    ] }),
    brief.topPriority ? /* @__PURE__ */ jsxRuntime.jsx(UniversalBriefCard, { card: brief.topPriority, emphasis: "primary" }) : null,
    /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-brief-section", "aria-label": "Recommended actions", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h2", { children: "Recommended Actions" }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ea-brief-stack", children: brief.recommendedActions.map((card) => /* @__PURE__ */ jsxRuntime.jsx(UniversalBriefCard, { card }, card.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-brief-section", "aria-label": "Today activity", children: [
      /* @__PURE__ */ jsxRuntime.jsx("h2", { children: "Today's Activity" }),
      /* @__PURE__ */ jsxRuntime.jsx(ActivityTimeline, { cards: brief.todaysActivity.length > 0 ? brief.todaysActivity : brief.recentEvents })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(QuickActions, { actions: brief.quickActions })
  ] });
}
function UniversalBriefCard({ card, emphasis = "default" }) {
  const body = /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "ea-card-kicker", children: card.module }),
      /* @__PURE__ */ jsxRuntime.jsx("h3", { children: card.title }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { className: "ea-card-summary", children: card.summary })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "ea-card-footer", children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { children: card.metric }),
      /* @__PURE__ */ jsxRuntime.jsx("strong", { children: card.actionLabel })
    ] })
  ] });
  if (card.actionUrl) {
    return /* @__PURE__ */ jsxRuntime.jsx("a", { className: `ea-brief-card ea-brief-card-${emphasis}`, href: card.actionUrl, children: body });
  }
  return /* @__PURE__ */ jsxRuntime.jsx("article", { className: `ea-brief-card ea-brief-card-${emphasis}`, children: body });
}
function ActivityTimeline({ cards }) {
  return /* @__PURE__ */ jsxRuntime.jsx("ol", { className: "ea-timeline", children: cards.map((card) => /* @__PURE__ */ jsxRuntime.jsxs("li", { children: [
    /* @__PURE__ */ jsxRuntime.jsx("span", { "aria-hidden": "true" }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntime.jsx("strong", { children: card.title }),
      /* @__PURE__ */ jsxRuntime.jsx("p", { children: card.summary })
    ] })
  ] }, card.id)) });
}
function QuickActions({ actions }) {
  if (actions.length === 0) return null;
  return /* @__PURE__ */ jsxRuntime.jsxs("section", { className: "ea-brief-section", "aria-label": "Quick actions", children: [
    /* @__PURE__ */ jsxRuntime.jsx("h2", { children: "Quick Actions" }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { className: "ea-quick-actions", children: actions.map((action) => /* @__PURE__ */ jsxRuntime.jsx("a", { href: action.href, children: action.label }, `${action.label}-${action.href}`)) })
  ] });
}
var briefStyles = `
  .ea-brief {
    width: min(100%, 760px);
    margin: 0 auto;
    display: grid;
    gap: 20px;
    color: var(--color-text, #141414);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }
  .ea-brief-header {
    display: grid;
    gap: 4px;
  }
  .ea-brief-header p {
    margin: 0;
    color: var(--color-text-muted, #667085);
    font-size: 15px;
  }
  .ea-brief-header h1 {
    margin: 0;
    font-size: clamp(28px, 5vw, 40px);
    line-height: 1.05;
    letter-spacing: 0;
  }
  .ea-brief-section {
    display: grid;
    gap: 10px;
  }
  .ea-brief-section h2 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text-muted, #667085);
  }
  .ea-brief-stack {
    display: grid;
    gap: 10px;
  }
  .ea-brief-card {
    display: grid;
    gap: 18px;
    padding: 18px;
    border: 1px solid var(--color-border, rgba(20, 20, 20, 0.12));
    border-radius: var(--radius-md, 8px);
    background: var(--color-surface, #fff);
    color: inherit;
    text-decoration: none;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
  }
  .ea-brief-card:hover {
    transform: translateY(-2px);
    border-color: var(--color-accent, #1f6feb);
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.09);
  }
  .ea-brief-card-primary {
    border-color: var(--color-accent, #1f6feb);
  }
  .ea-card-kicker {
    margin: 0 0 6px;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--color-accent, #1f6feb);
  }
  .ea-brief-card h3 {
    margin: 0;
    font-size: 19px;
    line-height: 1.2;
    letter-spacing: 0;
  }
  .ea-card-summary {
    margin: 8px 0 0;
    color: var(--color-text-muted, #667085);
    line-height: 1.5;
  }
  .ea-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
  }
  .ea-card-footer span {
    color: var(--color-text-muted, #667085);
  }
  .ea-card-footer strong {
    color: var(--color-accent, #1f6feb);
  }
  .ea-timeline {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ea-timeline li {
    display: grid;
    grid-template-columns: 12px 1fr;
    gap: 10px;
  }
  .ea-timeline li > span {
    width: 8px;
    height: 8px;
    margin-top: 7px;
    border-radius: 50%;
    background: var(--color-accent, #1f6feb);
  }
  .ea-timeline strong {
    font-size: 14px;
  }
  .ea-timeline p {
    margin: 2px 0 0;
    color: var(--color-text-muted, #667085);
    font-size: 14px;
    line-height: 1.45;
  }
  .ea-quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ea-quick-actions a {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    padding: 0 14px;
    border-radius: var(--radius-md, 8px);
    background: var(--color-accent, #1f6feb);
    color: #fff;
    text-decoration: none;
    font-weight: 700;
    font-size: 14px;
  }
`;

exports.ActivityTimeline = ActivityTimeline;
exports.BriefExperience = BriefExperience;
exports.QuickActions = QuickActions;
exports.UniversalBriefCard = UniversalBriefCard;
//# sourceMappingURL=brief-experience.cjs.map
//# sourceMappingURL=brief-experience.cjs.map