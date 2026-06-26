import { jsxs, Fragment, jsx } from 'react/jsx-runtime';

function UniversalBriefCard({ card, emphasis = "default" }) {
  const body = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "ea-card-kicker", children: card.module }),
      /* @__PURE__ */ jsx("h3", { children: card.title }),
      /* @__PURE__ */ jsx("p", { className: "ea-card-summary", children: card.summary })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "ea-card-footer", children: [
      /* @__PURE__ */ jsx("span", { children: card.metric }),
      /* @__PURE__ */ jsx("strong", { children: card.actionLabel })
    ] })
  ] });
  if (card.actionUrl) {
    return /* @__PURE__ */ jsx("a", { className: `ea-brief-card ea-brief-card-${emphasis}`, href: card.actionUrl, children: body });
  }
  return /* @__PURE__ */ jsx("article", { className: `ea-brief-card ea-brief-card-${emphasis}`, children: body });
}
function ActivityTimeline({ cards }) {
  return /* @__PURE__ */ jsx("ol", { className: "ea-timeline", children: cards.map((card) => /* @__PURE__ */ jsxs("li", { children: [
    /* @__PURE__ */ jsx("span", { "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("strong", { children: card.title }),
      /* @__PURE__ */ jsx("p", { children: card.summary })
    ] })
  ] }, card.id)) });
}
function MissionControlExperience({
  mission,
  onIntentSubmit,
  mode = "executive"
}) {
  return /* @__PURE__ */ jsxs("section", { className: "ea-mission", "aria-label": "Mission Control", children: [
    /* @__PURE__ */ jsx("style", { children: missionStyles }),
    /* @__PURE__ */ jsxs("header", { className: "ea-mission-header", children: [
      /* @__PURE__ */ jsx("p", { children: mission.greeting }),
      /* @__PURE__ */ jsx("h1", { children: "Mission Control" }),
      /* @__PURE__ */ jsx("p", { className: "ea-mission-sub", children: "What would you like to accomplish?" })
    ] }),
    /* @__PURE__ */ jsx(
      IntentCommandBar,
      {
        examples: mission.intentExamples,
        onSubmit: onIntentSubmit
      }
    ),
    mission.momentum.length > 0 ? /* @__PURE__ */ jsx(MomentumStrip, { stats: mission.momentum }) : null,
    mission.topPriority ? /* @__PURE__ */ jsxs("section", { className: "ea-mission-zone", "aria-label": "Today's focus", children: [
      /* @__PURE__ */ jsx("h2", { children: "Today's Focus" }),
      /* @__PURE__ */ jsx(UniversalBriefCard, { card: mission.topPriority, emphasis: "primary" }),
      mission.recommendedActions.length > 1 ? /* @__PURE__ */ jsx("div", { className: "ea-mission-stack", children: mission.recommendedActions.slice(1).map((card) => /* @__PURE__ */ jsx(UniversalBriefCard, { card }, card.id)) }) : null
    ] }) : null,
    mission.continueWorking.length > 0 ? /* @__PURE__ */ jsx(ContinueWorkingSection, { items: mission.continueWorking }) : null,
    mission.activeAgents.length > 0 ? /* @__PURE__ */ jsx(AgentPanel, { agents: mission.activeAgents }) : null,
    /* @__PURE__ */ jsx(ActionCardsSection, { cards: mission.actionCards, mode }),
    mission.todaysActivity.length > 0 || mission.recentEvents.length > 0 ? /* @__PURE__ */ jsxs("section", { className: "ea-mission-zone", "aria-label": "Recent activity", children: [
      /* @__PURE__ */ jsx("h2", { children: "What is already happening" }),
      /* @__PURE__ */ jsx(
        ActivityTimeline,
        {
          cards: mission.todaysActivity.length > 0 ? mission.todaysActivity : mission.recentEvents
        }
      )
    ] }) : null
  ] });
}
function IntentCommandBar({
  examples,
  onSubmit
}) {
  return /* @__PURE__ */ jsxs(
    "form",
    {
      className: "ea-intent-bar",
      onSubmit: (e) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem("intent")?.value?.trim();
        if (input && onSubmit) onSubmit(input);
      },
      children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            name: "intent",
            type: "text",
            placeholder: examples[0] ?? "What would you like to accomplish?",
            "aria-label": "What would you like to accomplish?",
            autoComplete: "off"
          }
        ),
        /* @__PURE__ */ jsx("button", { type: "submit", children: "Go" }),
        /* @__PURE__ */ jsx("div", { className: "ea-intent-examples", "aria-hidden": "true", children: examples.slice(0, 4).map((ex) => /* @__PURE__ */ jsx("span", { children: ex }, ex)) })
      ]
    }
  );
}
function MomentumStrip({ stats }) {
  return /* @__PURE__ */ jsx("div", { className: "ea-momentum", "aria-label": "Today's momentum", children: stats.map((s) => /* @__PURE__ */ jsxs("div", { className: "ea-momentum-item", children: [
    /* @__PURE__ */ jsx("strong", { children: s.value }),
    /* @__PURE__ */ jsx("span", { children: s.label })
  ] }, s.label)) });
}
function ContinueWorkingSection({
  items
}) {
  return /* @__PURE__ */ jsxs("section", { className: "ea-mission-zone", "aria-label": "Continue working", children: [
    /* @__PURE__ */ jsx("h2", { children: "Continue Working" }),
    /* @__PURE__ */ jsx("div", { className: "ea-continue-grid", children: items.map((item) => /* @__PURE__ */ jsxs("a", { className: "ea-continue-card", href: item.href, children: [
      /* @__PURE__ */ jsx("span", { className: "ea-continue-module", children: item.module }),
      /* @__PURE__ */ jsx("strong", { children: item.title }),
      /* @__PURE__ */ jsx("p", { children: item.summary })
    ] }, item.id)) })
  ] });
}
function AgentPanel({ agents }) {
  return /* @__PURE__ */ jsxs("section", { className: "ea-mission-zone", "aria-label": "My agents", children: [
    /* @__PURE__ */ jsx("h2", { children: "My Agents" }),
    /* @__PURE__ */ jsx("div", { className: "ea-agent-grid", children: agents.map((agent) => /* @__PURE__ */ jsx(AgentRunCard, { agent }, agent.id)) })
  ] });
}
function AgentRunCard({ agent }) {
  const body = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "ea-agent-head", children: [
      /* @__PURE__ */ jsx("span", { children: agent.agentKind }),
      /* @__PURE__ */ jsx(StatusPill, { status: agent.status })
    ] }),
    /* @__PURE__ */ jsx("strong", { children: agent.task }),
    /* @__PURE__ */ jsx("p", { children: agent.summary }),
    /* @__PURE__ */ jsx("div", { className: "ea-agent-progress", "aria-hidden": "true", children: /* @__PURE__ */ jsx("span", { style: { width: `${agent.progress}%` } }) }),
    /* @__PURE__ */ jsxs("div", { className: "ea-agent-meta", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        agent.progress,
        "%"
      ] }),
      agent.reviewRequired ? /* @__PURE__ */ jsx("em", { children: "Review required" }) : null,
      agent.estimatedCompletion ? /* @__PURE__ */ jsxs("span", { children: [
        "ETA ",
        new Date(agent.estimatedCompletion).toLocaleTimeString()
      ] }) : null
    ] })
  ] });
  if (agent.actionUrl) {
    return /* @__PURE__ */ jsx("a", { className: "ea-agent-card", href: agent.actionUrl, children: body });
  }
  return /* @__PURE__ */ jsx("article", { className: "ea-agent-card", children: body });
}
function StatusPill({ status }) {
  return /* @__PURE__ */ jsx("span", { className: `ea-status ea-status-${status}`, children: status.replace("_", " ") });
}
function ActionCardsSection({
  cards,
  mode
}) {
  if (cards.length === 0) return null;
  return /* @__PURE__ */ jsxs("section", { className: "ea-mission-zone", "aria-label": "Quick actions", children: [
    /* @__PURE__ */ jsx("h2", { children: mode === "builder" ? "Build" : "Quick Actions" }),
    /* @__PURE__ */ jsx("div", { className: "ea-action-grid", children: cards.map((card) => /* @__PURE__ */ jsx("a", { className: "ea-action-card", href: card.href, title: card.intent, children: card.label }, card.id)) })
  ] });
}
var missionStyles = `
  .ea-mission {
    width: min(100%, 920px);
    margin: 0 auto;
    display: grid;
    gap: 28px;
    color: var(--color-text, #141414);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }
  .ea-mission-header {
    display: grid;
    gap: 4px;
  }
  .ea-mission-header p {
    margin: 0;
    color: var(--color-text-muted, #667085);
    font-size: 15px;
  }
  .ea-mission-header h1 {
    margin: 0;
    font-size: clamp(32px, 5vw, 44px);
    line-height: 1.05;
    letter-spacing: -0.02em;
  }
  .ea-mission-sub {
    margin-top: 4px !important;
    font-size: 17px !important;
    color: var(--color-text, #141414) !important;
  }
  .ea-mission-zone {
    display: grid;
    gap: 12px;
  }
  .ea-mission-zone h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted, #667085);
  }
  .ea-mission-stack {
    display: grid;
    gap: 10px;
  }
  .ea-intent-bar {
    display: grid;
    gap: 10px;
    padding: 16px;
    border: 1px solid var(--color-border, rgba(20, 20, 20, 0.12));
    border-radius: var(--radius-md, 10px);
    background: var(--color-surface, #fff);
  }
  .ea-intent-bar input {
    width: 100%;
    min-height: 48px;
    padding: 0 16px;
    border: 1px solid var(--color-border, rgba(20, 20, 20, 0.12));
    border-radius: var(--radius-md, 8px);
    font-size: 16px;
    background: var(--color-bg, #fafafa);
    color: inherit;
  }
  .ea-intent-bar input:focus {
    outline: 2px solid var(--color-accent, #1f6feb);
    outline-offset: 1px;
  }
  .ea-intent-bar button {
    justify-self: start;
    min-height: 40px;
    padding: 0 20px;
    border: 0;
    border-radius: var(--radius-md, 8px);
    background: var(--color-accent, #1f6feb);
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
  }
  .ea-intent-examples {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ea-intent-examples span {
    font-size: 12px;
    color: var(--color-text-muted, #667085);
    padding: 4px 8px;
    border-radius: 999px;
    background: var(--color-bg, #f4f4f5);
  }
  .ea-momentum {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 14px 16px;
    border-radius: var(--radius-md, 8px);
    background: var(--color-bg, #f8f9fb);
  }
  .ea-momentum-item {
    display: grid;
    gap: 2px;
  }
  .ea-momentum-item strong {
    font-size: 22px;
    line-height: 1;
    color: var(--color-accent, #1f6feb);
  }
  .ea-momentum-item span {
    font-size: 12px;
    color: var(--color-text-muted, #667085);
  }
  .ea-continue-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
  }
  .ea-continue-card {
    display: grid;
    gap: 6px;
    padding: 14px;
    border: 1px solid var(--color-border, rgba(20, 20, 20, 0.12));
    border-radius: var(--radius-md, 8px);
    background: var(--color-surface, #fff);
    color: inherit;
    text-decoration: none;
    transition: border-color 160ms ease;
  }
  .ea-continue-card:hover {
    border-color: var(--color-accent, #1f6feb);
  }
  .ea-continue-module {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--color-accent, #1f6feb);
  }
  .ea-continue-card strong {
    font-size: 15px;
  }
  .ea-continue-card p {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-muted, #667085);
    line-height: 1.4;
  }
  .ea-agent-grid {
    display: grid;
    gap: 10px;
  }
  .ea-agent-card {
    display: grid;
    gap: 8px;
    padding: 14px;
    border: 1px solid var(--color-border, rgba(20, 20, 20, 0.12));
    border-radius: var(--radius-md, 8px);
    background: var(--color-surface, #fff);
    color: inherit;
    text-decoration: none;
  }
  .ea-agent-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .ea-agent-head span:first-child {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--color-text-muted, #667085);
  }
  .ea-agent-card strong {
    font-size: 15px;
  }
  .ea-agent-card p {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-muted, #667085);
  }
  .ea-agent-progress {
    height: 4px;
    border-radius: 999px;
    background: var(--color-bg, #eceff3);
    overflow: hidden;
  }
  .ea-agent-progress span {
    display: block;
    height: 100%;
    background: var(--color-accent, #1f6feb);
    border-radius: 999px;
  }
  .ea-agent-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 12px;
    color: var(--color-text-muted, #667085);
  }
  .ea-agent-meta em {
    font-style: normal;
    font-weight: 700;
    color: var(--color-accent, #1f6feb);
  }
  .ea-status {
    font-size: 11px;
    font-weight: 700;
    text-transform: capitalize;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--color-bg, #f4f4f5);
  }
  .ea-status-review_required,
  .ea-status-running {
    background: rgba(31, 111, 235, 0.12);
    color: var(--color-accent, #1f6feb);
  }
  .ea-action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }
  .ea-action-card {
    min-height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    border: 1px solid var(--color-border, rgba(20, 20, 20, 0.12));
    border-radius: var(--radius-md, 8px);
    background: var(--color-surface, #fff);
    color: inherit;
    text-decoration: none;
    font-weight: 700;
    font-size: 13px;
    text-align: center;
    transition: border-color 160ms ease, background 160ms ease;
  }
  .ea-action-card:hover {
    border-color: var(--color-accent, #1f6feb);
    background: rgba(31, 111, 235, 0.04);
  }
`;

export { MissionControlExperience, UniversalBriefCard };
//# sourceMappingURL=mission-control-experience.js.map
//# sourceMappingURL=mission-control-experience.js.map