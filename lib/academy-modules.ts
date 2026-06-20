export interface AcademyModule {
  id: string;
  title: string;
  duration: string;
  summary: string;
  lessons: { title: string; content: string }[];
  cta?: { label: string; href: string };
}

export const ACADEMY_MODULES: AcademyModule[] = [
  {
    id: 'ea-platform',
    title: 'What is EA?',
    duration: '5 min',
    summary: 'EA is an Opportunity Intelligence Platform™ — not a CRM or feature pile.',
    lessons: [
      {
        title: 'The mission loop',
        content:
          'Discover → Clarify → Visualize → Implement → Measure → Learn. Every EA product serves one step in this loop.',
      },
      {
        title: 'Four questions every interaction answers',
        content:
          'What is this? What opportunity exists? What should I do next? What could this become?',
      },
      {
        title: 'Trust first',
        content:
          'Every AI recommendation shows why, how, source, and confidence. No black-box outputs.',
      },
    ],
    cta: { label: 'Open Master Control', href: '/admin/master' },
  },
  {
    id: 'magnifi-simplifi',
    title: 'Magnifi™ vs Simplifi™',
    duration: '6 min',
    summary: 'Magnifi creates vision. Simplifi creates clarity.',
    lessons: [
      {
        title: 'Magnifi — what is possible?',
        content:
          'Cinematic future-state experiences: Executive Transformation (Selena), Community Blueprint (BAS), University Ecosystem (JCSU).',
      },
      {
        title: 'Simplifi — what should I do next?',
        content:
          'Guided decision engine: Opening Insight → What We Found → Top 3 Priorities → First Step. Never twenty recommendations.',
      },
      {
        title: 'When to use which',
        content:
          'Magnifi for vision and buy-in. Simplifi for prioritization and action. Pair them on every engagement.',
      },
    ],
    cta: { label: 'Run Website Audit', href: '/admin/simplifi-audit' },
  },
  {
    id: 'capture-engine',
    title: 'EA Capture Engine™',
    duration: '7 min',
    summary: 'Turn any URL into structured intelligence.',
    lessons: [
      {
        title: 'Capture methods',
        content:
          'Browser extension, ⌘K command bar, Resource Radar, and right-click context menus.',
      },
      {
        title: 'The pipeline',
        content:
          'Firecrawl/scrape → Resource Radar classify → Opportunity score → Recommendation Engine → Auto Blueprint → Trust Layer.',
      },
      {
        title: 'Mission Control memory',
        content:
          'Every capture lands in Airtable Capture Records with scores, templates, and blueprint stubs.',
      },
    ],
    cta: { label: 'Resource Radar', href: '/admin/resource-radar' },
  },
  {
    id: 'adoption-proof',
    title: 'Adoption Engine + Proof Library',
    duration: '5 min',
    summary: 'Adoption is a feature — not an afterthought.',
    lessons: [
      {
        title: 'Adoption Health Score',
        content:
          'Computed from capacity, engagement, complexity, and ROI clarity on every proposal.',
      },
      {
        title: 'Proof Library',
        content:
          'Transformation stories matched to proposal context — CPR, BAS, consulting leads, and more.',
      },
      {
        title: 'Guided onboarding',
        content:
          'Use tours, academy modules, and Simplifi check-ins at 30/60/90 days for at-risk engagements.',
      },
    ],
    cta: { label: 'View Proposals', href: '/admin/proposals' },
  },
  {
    id: 'resource-radar',
    title: 'Resource Radar & Blueprints',
    duration: '6 min',
    summary: 'Classify tools, orgs, and signals — then auto-generate blueprint stubs.',
    lessons: [
      {
        title: 'EA Fit Score',
        content: 'Strategic alignment with Magnifi, Simplifi, Pulse, Community Hub, and satellite products.',
      },
      {
        title: 'Recommendation Engine',
        content: 'Picks BAS, Selena, or JCSU Magnifi patterns based on page signals.',
      },
      {
        title: 'Blueprint Library',
        content: 'Opening Reveal, Hidden Opportunity, Future-State, Top 3 Priorities, First Step, 30/60/90 roadmap.',
      },
    ],
    cta: { label: 'Blueprint Library', href: '/admin/blueprints' },
  },
  {
    id: 'wave5-intelligence',
    title: 'Wave 5 — Intelligence Layer',
    duration: '8 min',
    summary: 'Knowledge Graph, Digital Twin, EA Voice, and Partner Marketplace complete the OS.',
    lessons: [
      {
        title: 'Knowledge Graph',
        content:
          'Organizational memory — captures, products, partners, proposals, and proof stories as connected nodes.',
      },
      {
        title: 'Digital Twin',
        content:
          'Operational mirror with health dimensions — intelligence capture, pipeline, visibility, adoption, partners.',
      },
      {
        title: 'EA Voice',
        content:
          'Natural-language navigation — press Voice or ⌘⇧V. Optional Claude enhancement when ANTHROPIC_API_KEY is set.',
      },
      {
        title: 'Partner Marketplace',
        content:
          'Referral programs, satellite hubs, implementation packages, and live partner listings.',
      },
    ],
    cta: { label: 'Knowledge Graph', href: '/admin/knowledge-graph' },
  },
];
