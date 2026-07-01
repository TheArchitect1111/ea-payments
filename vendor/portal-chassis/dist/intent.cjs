'use strict';

// lib/intent-router.ts
var DEFAULT_ORCHESTRATOR = [
  {
    pattern: /create proposal|draft proposal|proposal for|write proposal/i,
    intent: "create-proposal",
    why: "Proposal workflows use the research agent to gather context before you edit in Proposals."
  },
  {
    pattern: /research|find opportunit|discover opportunit|speaking opportunit/i,
    intent: "research",
    why: "Research intents route to the EA agent orchestrator for structured findings."
  },
  {
    pattern: /generate blueprint|new blueprint|build blueprint/i,
    intent: "generate-blueprint",
    why: "Blueprint generation starts in the Blueprint Library with captured context."
  }
];
var DEFAULT_DIRECT_NAV = [
  {
    pattern: /build portal|volunteer portal|client portal|launch portal/i,
    href: "/admin/ea-factory/new-experience",
    label: "New Experience",
    why: "Portal builds start in the New Experience wizard."
  },
  {
    pattern: /build landing|landing page|skin factory/i,
    href: "/admin/ea-factory/skin-factory",
    label: "Skin Factory",
    why: "Landing page skins are authored as briefs in Skin Factory."
  },
  {
    pattern: /continue|resume|pick up where/i,
    href: "/admin/master",
    label: "Mission Control",
    why: "Continue Working lives on your Mission Control home."
  },
  {
    pattern: /launch project|launch client|go live/i,
    href: "/launch",
    label: "Launch Command",
    why: "Launch verification runs through the Launch Command Center."
  },
  {
    pattern: /new client|start client|onboard client/i,
    href: "/admin/delivery",
    label: "Client Delivery",
    why: "New clients are tracked on the delivery board."
  },
  {
    pattern: /simplifi workspace|daily brief/i,
    href: "/simplifi/workspace",
    label: "Simplifi Workspace",
    why: "Opportunity decisions and daily brief live in Simplifi."
  },
  {
    pattern: /master control|mission control|dashboard|revenue/i,
    href: "/admin/master",
    label: "Mission Control",
    why: "Your ranked attention feed and continue-working queue."
  },
  {
    pattern: /resource radar|analyze url|radar/i,
    href: "/admin/resource-radar",
    label: "Resource Radar",
    why: "URL and resource analysis for opportunity discovery."
  },
  {
    pattern: /blueprint/i,
    href: "/admin/blueprints",
    label: "Blueprint Library",
    why: "Implementation blueprints and build intelligence."
  },
  {
    pattern: /knowledge graph|organizational memory|platform memory/i,
    href: "/admin/knowledge-graph",
    label: "Knowledge Graph",
    why: "Organizational memory \u2014 org, product, capture topology."
  },
  {
    pattern: /digital twin|twin/i,
    href: "/admin/digital-twin",
    label: "Digital Twin",
    why: "Platform and org visibility profiles."
  },
  {
    pattern: /proposal/i,
    href: "/admin/proposals",
    label: "Proposals",
    why: "Proposal drafts and delivery pipeline."
  }
];
function routeIntent(input, config = {}) {
  const query = input.trim();
  const lower = query.toLowerCase();
  const directNav = config.directNav ?? DEFAULT_DIRECT_NAV;
  const orchestrator = config.orchestrator ?? DEFAULT_ORCHESTRATOR;
  if (!query) {
    return {
      type: "explain",
      message: 'Tell me what you want to accomplish \u2014 for example, "Create proposal for Bob" or "Build landing page".',
      confidence: 0
    };
  }
  if (/^help|what can you/i.test(lower)) {
    return {
      type: "explain",
      message: 'I can navigate Mission Control, run audits, search organizational memory, start tours, and launch workflows. Try "Create proposal for Bob" or "Show knowledge graph".',
      confidence: 95
    };
  }
  for (const nav of directNav) {
    if (nav.pattern.test(lower)) {
      return {
        type: "navigate",
        href: nav.href,
        message: `Opening ${nav.label}.`,
        whyRecommended: nav.why,
        confidence: 90
      };
    }
  }
  for (const orch of orchestrator) {
    if (orch.pattern.test(lower)) {
      return {
        type: "orchestrate",
        orchestratorIntent: orch.intent,
        query,
        message: `Running ${orch.intent.replace(/-/g, " ")} workflow.`,
        whyRecommended: orch.why,
        confidence: 88
      };
    }
  }
  const voice = matchVoicePatterns(query, lower);
  if (voice) {
    return voice;
  }
  return {
    type: "orchestrate",
    orchestratorIntent: "general",
    query,
    message: `Searching agents and organizational memory for "${query}".`,
    whyRecommended: "No exact navigation match \u2014 delegating to the EA orchestrator.",
    confidence: 55
  };
}
function matchVoicePatterns(query, lower) {
  if (/tour|guide me|onboarding/i.test(lower)) {
    return {
      type: "tour",
      message: "Starting Mission Control guided tour.",
      confidence: 90
    };
  }
  const urlMatch = query.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    if (/audit|simplifi|clarity|website/i.test(lower)) {
      return {
        type: "audit",
        href: `/admin/simplifi-audit?url=${encodeURIComponent(urlMatch[0])}`,
        query: urlMatch[0],
        message: `Running Simplifi audit on ${urlMatch[0]}`,
        confidence: 92
      };
    }
    return {
      type: "analyze",
      href: "/admin/resource-radar",
      query: urlMatch[0],
      message: `Analyzing ${urlMatch[0]} in Resource Radar.`,
      confidence: 88
    };
  }
  if (/capture|opportunity|save signal/i.test(lower)) {
    return {
      type: "capture",
      message: "Opening Quick Capture.",
      confidence: 85
    };
  }
  if (/search graph|find in graph|who uses|aligned with/i.test(lower)) {
    const term = lower.replace(/search graph|find in graph|who uses|aligned with/gi, "").trim();
    const href = term ? `/admin/knowledge-graph?q=${encodeURIComponent(term)}` : "/admin/knowledge-graph";
    return {
      type: "navigate",
      href,
      query: term || query,
      message: term ? `Searching Knowledge Graph for "${term}".` : "Opening Knowledge Graph.",
      whyRecommended: "Organizational memory search.",
      confidence: 82
    };
  }
  if (/simplifi audit|website audit|playwright/i.test(lower)) {
    return {
      type: "audit",
      href: "/admin/simplifi-audit",
      message: "Opening Simplifi Audit.",
      confidence: 86
    };
  }
  return null;
}

exports.routeIntent = routeIntent;
//# sourceMappingURL=intent.cjs.map
//# sourceMappingURL=intent.cjs.map