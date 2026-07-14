import { PRODUCT_OPERATIONS_CATALOG } from '@/lib/product-operations';
import { EXPERIENCE_REGISTRY } from '@/lib/experience-registry';

export type CapabilityCategory =
  | 'Executive Platform'
  | 'Business Development'
  | 'Operations'
  | 'Creative'
  | 'Personal Productivity'
  | 'Business Intelligence'
  | 'Platform';

export type CapabilityMaturity =
  | 'Production Ready'
  | 'Growing'
  | 'Foundation'
  | 'Future Capability';

export type CapabilityHealth = 'Strong' | 'Watch' | 'Unknown' | 'Future';

export type CapabilityDataSource = {
  label: string;
  location: string;
  confidence: 'High' | 'Medium' | 'Low';
};

export type CapabilityDocLink = {
  title: string;
  href: string;
  note: string;
};

export type ExecutiveCapability = {
  slug: string;
  name: string;
  category: CapabilityCategory;
  tagline: string;
  executiveSummary: string;
  businessProblem: string;
  users: string[];
  organizationsUsing: string[];
  maturity: CapabilityMaturity;
  maturityReason: string;
  systems: string[];
  outputs: string[];
  dependsOn: string[];
  dependedOnBy: string[];
  health: CapabilityHealth;
  healthReason: string;
  knownRisks: string[];
  roadmap: string[];
  recommendation: string;
  businessOutcomes: string[];
  documentation: CapabilityDocLink[];
  dataSources: CapabilityDataSource[];
  futureState: boolean;
};

export type CapabilityRelationship = {
  title: string;
  purpose: string;
  nodes: string[];
};

const productBySlug = new Map(PRODUCT_OPERATIONS_CATALOG.map((product) => [product.slug, product]));
const experienceIds: Set<string> = new Set(EXPERIENCE_REGISTRY.map((entry) => entry.capabilityId));

function productSource(slug: string): CapabilityDataSource {
  const product = productBySlug.get(slug);
  return {
    label: product ? `${product.trademark} Product Operations catalog` : 'Product Operations catalog',
    location: 'lib/product-operations.ts',
    confidence: product ? 'High' : 'Medium',
  };
}

function registrySource(capabilityId: string): CapabilityDataSource {
  return {
    label: experienceIds.has(capabilityId)
      ? `${capabilityId} Experience Registry entry`
      : `${capabilityId} not represented as a dedicated registry entry`,
    location: 'lib/experience-registry.ts',
    confidence: experienceIds.has(capabilityId) ? 'High' : 'Low',
  };
}

export const CAPABILITY_RELATIONSHIPS: CapabilityRelationship[] = [
  {
    title: 'Business Development Path',
    purpose: 'Shows how EA turns a relationship signal into a diagnosed need, approved blueprint, and operating client experience.',
    nodes: ['Connect™', 'Operational MRI™', 'Operational Blueprint™', 'Portal', 'Operations'],
  },
  {
    title: 'Personal Productivity Path',
    purpose: 'Shows how captured work becomes clear personal priority and action.',
    nodes: ['Simplifi™', 'Personal Productivity'],
  },
  {
    title: 'Creative Path',
    purpose: 'Shows how approved stories move from distribution into future creative production.',
    nodes: ['Amplifi™', 'EA Creative Studio™'],
  },
  {
    title: 'Client Experience Path',
    purpose: 'Shows how learning content supports client adoption inside the operating experience.',
    nodes: ['Learning', 'Client Experience'],
  },
  {
    title: 'Executive Operating Path',
    purpose: 'Shows Pulse as the attention spine for the Executive Operating System.',
    nodes: ['Pulse™', 'Executive Operating System'],
  },
];

export const EXECUTIVE_CAPABILITIES: ExecutiveCapability[] = [
  {
    slug: 'pulse',
    name: 'Pulse™',
    category: 'Executive Platform',
    tagline: 'The attention spine for the Executive Operating System.',
    executiveSummary:
      'Pulse converts platform activity into executive attention so leadership can see what changed, what is healthy, and what requires action.',
    businessProblem: 'Leaders need one trusted signal layer instead of checking every product, portal, and workflow separately.',
    users: ['Executive leadership', 'Operations owners', 'Client success owners'],
    organizationsUsing: ['EA internal operating system', 'Portal organizations with Pulse module access'],
    maturity: 'Production Ready',
    maturityReason: 'Product Operations marks Pulse as Core and the Experience Registry lists Pulse as an active portal capability.',
    systems: ['Mission Control', 'Pulse event store', 'ActivityEvents', 'Experience Registry', 'Portal Chassis'],
    outputs: ['Executive attention signals', 'Mission Control events', 'Portal Pulse view', 'Daily Brief inputs'],
    dependsOn: ['ActivityEvents', 'Experience Registry', 'Portal Chassis'],
    dependedOnBy: ['Executive Briefing', 'Organization 360', 'Operations Visibility', 'Product Operations'],
    health: 'Strong',
    healthReason: 'Core product metadata, registry coverage, and event infrastructure are present.',
    knownRisks: ['Organization-scoped Pulse joins still need deeper coverage across all client views.'],
    roadmap: ['Improve organization-level Pulse joins.', 'Increase trustworthy ingestion from every product and workflow.'],
    recommendation: 'Keep Pulse as the canonical event spine for every future Executive Operating System surface.',
    businessOutcomes: ['Faster executive triage', 'Clearer client health visibility', 'Reduced manual status chasing'],
    documentation: [
      { title: 'Pulse ingestion contract', href: '/admin/foundation-library', note: 'Event contract and product signal references.' },
      { title: 'Product Operations - Pulse', href: '/admin/products/pulse', note: 'Product-level ownership, health, and roadmap.' },
    ],
    dataSources: [productSource('pulse'), registrySource('pulse'), { label: 'Pulse event store', location: 'lib/pulse-event-store.ts', confidence: 'High' }],
    futureState: false,
  },
  {
    slug: 'connect',
    name: 'Connect™',
    category: 'Business Development',
    tagline: 'Relationship capture and follow-up operations.',
    executiveSummary:
      'Connect manages relationship journeys, tenant setup, nurture operations, and the next step after real-world connection.',
    businessProblem: 'Growth opportunities are lost when follow-up ownership, timing, and context are scattered.',
    users: ['Business development', 'Operations owners', 'Client-facing teams'],
    organizationsUsing: ['EA internal operating system', 'Organizations with Connect tenant or portal access'],
    maturity: 'Production Ready',
    maturityReason: 'Product Operations marks Connect as Live and registry coverage exists for the active portal experience.',
    systems: ['Connect tenant administration', 'Nurture runner', 'Connect tasks', 'Portal Connect', 'Pulse'],
    outputs: ['Relationship tenant', 'Connect task board', 'Nurture sequence', 'Follow-up actions', 'QR and event links'],
    dependsOn: ['Entitlements', 'Experience Registry', 'Portal Chassis', 'Pulse'],
    dependedOnBy: ['Operational MRI™', 'Operational Blueprint™', 'Client onboarding'],
    health: 'Strong',
    healthReason: 'Live admin, portal, API, and readiness surfaces are present.',
    knownRisks: ['Executive usage rollups by organization are still limited.'],
    roadmap: ['Deepen organization-level usage summary.', 'Clarify nurture outcomes in executive reporting.'],
    recommendation: 'Keep Connect as the entry point for relationship-driven business development.',
    businessOutcomes: ['More reliable follow-up', 'Clearer relationship ownership', 'Better conversion from events and referrals'],
    documentation: [
      { title: 'Connect readiness', href: '/admin/connect', note: 'Operating view for Connect tenants and readiness.' },
      { title: 'Product Operations - Connect', href: '/admin/products/connect', note: 'Product-level maturity and dependencies.' },
    ],
    dataSources: [productSource('connect'), registrySource('connect'), { label: 'Connect tenant and task systems', location: 'lib/connect-store.ts', confidence: 'High' }],
    futureState: false,
  },
  {
    slug: 'operational-mri',
    name: 'Operational MRI™',
    category: 'Business Development',
    tagline: 'Diagnostic assessment for visibility, capacity, and process constraints.',
    executiveSummary:
      'Operational MRI identifies the constraints that prevent a business from growing calmly and turns them into an improvement path.',
    businessProblem: 'Leaders often know work feels heavy but cannot see which constraint is actually limiting growth.',
    users: ['Prospects', 'Client executives', 'EA strategists'],
    organizationsUsing: ['Public assessment users', 'Client records when assessment submissions are linked'],
    maturity: 'Growing',
    maturityReason: 'The assessment funnel and documentation exist, but capability usage is not yet mapped into a dedicated Capability 360 source.',
    systems: ['Assessment funnel', 'Airtable client records', 'Analysis engine', 'Simplifi guidance'],
    outputs: ['Operational diagnosis', 'Constraint summary', 'Priority recommendations', 'Blueprint inputs'],
    dependsOn: ['Assessment submissions', 'Analysis engine', 'Client Records'],
    dependedOnBy: ['Capacity Discovery Assessment™', 'Operational Blueprint™', 'Proposal'],
    health: 'Watch',
    healthReason: 'Routes and guidance exist; executive telemetry needs consolidation.',
    knownRisks: ['Assessment results are not yet surfaced as a full capability adoption model.'],
    roadmap: ['Tie assessment submissions to organizations.', 'Surface diagnosis quality and conversion in Capability Center.'],
    recommendation: 'Keep as the diagnostic start of the business development path; improve telemetry before expanding automation.',
    businessOutcomes: ['Clearer diagnosis', 'Better prioritization', 'Higher-quality blueprint conversations'],
    documentation: [
      { title: 'Operational MRI public funnel', href: '/assessment', note: 'Current public diagnostic entry point.' },
      { title: 'Product glossary', href: '/admin/foundation-library', note: 'Canonical plain-language definition.' },
    ],
    dataSources: [
      { label: 'Assessment route', location: 'app/assessment/page.tsx', confidence: 'High' },
      { label: 'Product glossary', location: 'docs/EA-PRODUCT-GLOSSARY.md', confidence: 'High' },
      registrySource('discovery'),
    ],
    futureState: false,
  },
  {
    slug: 'capacity-discovery-assessment',
    name: 'Capacity Discovery Assessment™',
    category: 'Business Development',
    tagline: 'Entry assessment for discovering where capacity is leaking.',
    executiveSummary:
      'Capacity Discovery is the practical entry point inside the Operational MRI family, focused on where time, attention, and delivery capacity leak.',
    businessProblem: 'Organizations need a first diagnostic step before committing to a full blueprint or implementation package.',
    users: ['Prospects', 'Client executives', 'EA sales and strategy'],
    organizationsUsing: ['Public intake users', 'Organizations when discovery intake is linked'],
    maturity: 'Growing',
    maturityReason: 'The certified Create Catalog references the assessment and the glossary defines its role, but dedicated telemetry is not complete.',
    systems: ['Assessment funnel', 'Client intake', 'Airtable client records'],
    outputs: ['Capacity signal', 'Discovery record', 'Recommended next step'],
    dependsOn: ['Operational MRI™', 'Client intake', 'Airtable'],
    dependedOnBy: ['Operational Blueprint™', 'Proposal', 'Connect™ follow-up'],
    health: 'Watch',
    healthReason: 'Visible in executive create flow but not yet fully instrumented as a separate capability.',
    knownRisks: ['May blur with Operational MRI unless its entry-assessment role remains clear.'],
    roadmap: ['Define a distinct scoring contract.', 'Map intake submissions to organization records.'],
    recommendation: 'Keep as an entry assessment under Operational MRI and avoid treating it as a separate product.',
    businessOutcomes: ['Lower-friction diagnosis', 'Faster sales qualification', 'Clearer next action'],
    documentation: [
      { title: 'Product glossary', href: '/admin/foundation-library', note: 'Defines Capacity Discovery as Operational MRI entry assessment.' },
      { title: 'Executive Create Catalog', href: '/admin/master', note: 'Certified Phase 1 entry point.' },
    ],
    dataSources: [
      { label: 'Product glossary', location: 'docs/EA-PRODUCT-GLOSSARY.md', confidence: 'High' },
      { label: 'Executive Factory', location: 'app/admin/factory/page.tsx', confidence: 'High' },
    ],
    futureState: false,
  },
  {
    slug: 'operational-blueprint',
    name: 'Operational Blueprint™',
    category: 'Business Development',
    tagline: 'Converts diagnosis into an approved operating plan.',
    executiveSummary:
      'Operational Blueprint translates assessment findings into a structured plan for what EA should build, launch, or improve.',
    businessProblem: 'Clients need a clear plan that connects diagnosis, value, scope, and delivery sequencing.',
    users: ['Client executives', 'EA strategists', 'Delivery owners'],
    organizationsUsing: ['Organizations with blueprint records or proposals when linked'],
    maturity: 'Growing',
    maturityReason: 'Blueprint admin, generator, and summary helpers exist; executive adoption telemetry is still shallow.',
    systems: ['Blueprint library', 'Blueprint generator', 'Proposal records', 'Client Records'],
    outputs: ['Operational blueprint', 'Scope recommendations', 'Delivery plan', 'Proposal input'],
    dependsOn: ['Operational MRI™', 'Client Records', 'Blueprint generator'],
    dependedOnBy: ['Proposal', 'Portal build', 'Operations Visibility'],
    health: 'Watch',
    healthReason: 'Implementation helpers exist; executive lifecycle status still needs stronger source-of-truth coverage.',
    knownRisks: ['Blueprint approval and versioning are not yet fully governed in this view.'],
    roadmap: ['Connect blueprint approval to Decision Center.', 'Show blueprint status by organization.'],
    recommendation: 'Use Operational Blueprint as the canonical bridge from diagnosis to delivery.',
    businessOutcomes: ['Clearer scope', 'Reduced implementation ambiguity', 'Better approval decisions'],
    documentation: [
      { title: 'Blueprint Library', href: '/admin/blueprints', note: 'Current operating surface for blueprints.' },
    ],
    dataSources: [
      { label: 'Blueprint generator', location: 'lib/blueprint-generator.ts', confidence: 'High' },
      { label: 'Blueprint admin', location: 'app/admin/blueprints/page.tsx', confidence: 'High' },
    ],
    futureState: false,
  },
  {
    slug: 'selena-protocol',
    name: 'Selena Protocol™',
    category: 'Business Development',
    tagline: 'Executive transformation demo pattern for opportunity storytelling.',
    executiveSummary:
      'Selena Protocol is the named demonstration pattern that proves how an opportunity can move from capture into story and decision.',
    businessProblem: 'Prospects need to see the value of the EA system before abstract architecture becomes meaningful.',
    users: ['Prospects', 'EA sales', 'Executive sponsors'],
    organizationsUsing: ['Selena Executive Coaching demo', 'EA internal sales demonstration'],
    maturity: 'Foundation',
    maturityReason: 'The demo payload, resolver, and launch report exist, but this is not a broad production capability yet.',
    systems: ['Demo consideration resolver', 'Opportunity experience payload', 'Magnifi story path'],
    outputs: ['Demo opportunity experience', 'Transformation story', 'Assessment-first CTA'],
    dependsOn: ['Simplifi™', 'Magnifi™', 'Operational MRI™'],
    dependedOnBy: ['Sales demonstration', 'Proposal conversations'],
    health: 'Watch',
    healthReason: 'Launch checks reference the Selena demo, but usage remains demo-scoped.',
    knownRisks: ['Could be mistaken for a general product if not labeled as a protocol/demo pattern.'],
    roadmap: ['Decide whether Selena remains a named protocol or becomes a template in the library.'],
    recommendation: 'Keep as a business development protocol and label it clearly as a demonstrated pattern.',
    businessOutcomes: ['Faster buyer understanding', 'Clearer transformation narrative', 'Better assessment conversion'],
    documentation: [
      { title: 'Demo library', href: '/admin/foundation-library', note: 'Lists Selena as an active demo.' },
      { title: 'Final launch report', href: '/admin/foundation-library', note: 'References Magnifi Selena demo pass status.' },
    ],
    dataSources: [
      { label: 'Selena demo payload', location: 'lib/demo-consider-selena.ts', confidence: 'High' },
      { label: 'Demo library', location: 'docs/DEMO-LIBRARY.md', confidence: 'High' },
    ],
    futureState: false,
  },
  {
    slug: 'update-hub',
    name: 'Update Hub',
    category: 'Operations',
    tagline: 'Keeps client experiences alive through updates, requests, and announcements.',
    executiveSummary:
      'Update Hub gives owners a governed way to publish updates and request changes without turning every content change into a development task.',
    businessProblem: 'Client portals decay when updates, announcements, and requests live in scattered email threads.',
    users: ['Client owners', 'EA communications owners', 'Portal users'],
    organizationsUsing: ['Portal organizations with Update Hub access'],
    maturity: 'Production Ready',
    maturityReason: 'Experience Registry lists Update Hub as active and portal/admin routes exist.',
    systems: ['Portal Update Hub', 'Content Requests dashboard', 'Update Hub feed', 'Email notifications'],
    outputs: ['Announcement', 'Update request', 'Published feed item', 'Enhancement request'],
    dependsOn: ['Portal Chassis', 'Airtable client records', 'Email notifications'],
    dependedOnBy: ['Communications', 'Amplifi™', 'Client Experience'],
    health: 'Strong',
    healthReason: 'Portal, admin, feed, and email references are present.',
    knownRisks: ['Request-to-resolution reporting still needs executive rollup.'],
    roadmap: ['Connect Update Hub request status into Organization 360 and Decision Center more deeply.'],
    recommendation: 'Keep Update Hub as the canonical owner operations layer for portal change and communication requests.',
    businessOutcomes: ['Cleaner client communication', 'Less ad hoc change management', 'More current client experiences'],
    documentation: [
      { title: 'Update Hub portal', href: '/portal', note: 'Client-facing update experience.' },
      { title: 'Content Requests', href: '/admin/content-requests', note: 'Admin operating surface.' },
    ],
    dataSources: [
      registrySource('update-hub'),
      { label: 'Update Hub feed', location: 'lib/update-hub-feed.ts', confidence: 'High' },
      { label: 'Product glossary', location: 'docs/EA-PRODUCT-GLOSSARY.md', confidence: 'High' },
    ],
    futureState: false,
  },
  {
    slug: 'learning',
    name: 'Learning',
    category: 'Operations',
    tagline: 'Client training, guidance, and adoption support.',
    executiveSummary:
      'Learning organizes client training paths, assigned modules, and adoption guidance inside the portal experience.',
    businessProblem: 'Clients need training to adopt the operating system without relying on one-off meetings.',
    users: ['Client teams', 'Training owners', 'Support owners'],
    organizationsUsing: ['Portal organizations with Learning access'],
    maturity: 'Production Ready',
    maturityReason: 'Learning portal and admin academy routes exist with module data.',
    systems: ['Portal Learning', 'Academy admin', 'Academy modules'],
    outputs: ['Learning portal', 'Course/module', 'Knowledge guidance', 'Training assignment'],
    dependsOn: ['Portal Chassis', 'Academy modules', 'Client onboarding'],
    dependedOnBy: ['Client Experience', 'Support', 'Operations'],
    health: 'Strong',
    healthReason: 'Routes and module data are present.',
    knownRisks: ['Progress tracking depth is still limited compared with a full LMS.'],
    roadmap: ['Add stronger progress and certification visibility when learning telemetry is ready.'],
    recommendation: 'Keep Learning as the adoption layer for client experiences.',
    businessOutcomes: ['Better adoption', 'Reduced support load', 'More consistent onboarding'],
    documentation: [
      { title: 'Academy admin', href: '/admin/academy', note: 'Admin operating surface for learning.' },
    ],
    dataSources: [
      registrySource('training'),
      { label: 'Academy modules', location: 'lib/academy-modules.ts', confidence: 'High' },
      { label: 'Portal Learning route', location: 'app/portal/[slug]/learning/page.tsx', confidence: 'High' },
    ],
    futureState: false,
  },
  {
    slug: 'communications',
    name: 'Communications',
    category: 'Operations',
    tagline: 'Governed client messages, requests, and announcements.',
    executiveSummary:
      'Communications groups the email, messaging, announcement, and request signals that keep clients aligned.',
    businessProblem: 'Important communication becomes risky when it is split across inboxes, portals, and informal channels.',
    users: ['Communications owners', 'Client owners', 'Support owners'],
    organizationsUsing: ['Organizations using Update Hub, messaging, or notification flows'],
    maturity: 'Growing',
    maturityReason: 'Update Hub, messaging, and email helpers exist, but a single communications operating layer is still consolidating.',
    systems: ['Update Hub', 'Messaging route', 'Email helpers', 'Notification dispatcher'],
    outputs: ['Email', 'Announcement', 'Client update', 'Support question', 'Request notification'],
    dependsOn: ['Update Hub', 'Email service', 'Portal Chassis'],
    dependedOnBy: ['Client Experience', 'Support', 'Amplifi™'],
    health: 'Watch',
    healthReason: 'Multiple communication primitives exist; executive rollup is not fully unified.',
    knownRisks: ['No single communications timeline owns every channel yet.'],
    roadmap: ['Unify communications events into Pulse and Organization 360 timelines.'],
    recommendation: 'Treat Communications as a cross-capability operating layer powered first by Update Hub.',
    businessOutcomes: ['Clearer client alignment', 'Fewer missed requests', 'Better communication accountability'],
    documentation: [
      { title: 'Content Requests', href: '/admin/content-requests', note: 'Current communications/request operating surface.' },
    ],
    dataSources: [
      { label: 'Email helpers', location: 'lib/email.ts', confidence: 'Medium' },
      { label: 'Notification dispatcher', location: 'lib/notify-dispatch.ts', confidence: 'Medium' },
      registrySource('messaging'),
    ],
    futureState: false,
  },
  {
    slug: 'automation',
    name: 'Automation',
    category: 'Operations',
    tagline: 'Governed workflows and integration actions that reduce manual operating load.',
    executiveSummary:
      'Automation covers launch actions, nurture runs, webhooks, and workflow-style tasks that move work without manual handoffs.',
    businessProblem: 'Manual handoffs slow delivery and create invisible failure points.',
    users: ['Operations owners', 'Platform owners', 'Client success owners'],
    organizationsUsing: ['EA internal operations', 'Client workflows where automation is configured'],
    maturity: 'Growing',
    maturityReason: 'Multiple automation surfaces exist, but the platform architecture still reserves a broader Automation Engine.',
    systems: ['Connect sequence runner', 'EACP launch actions', 'Webhook routes', 'Launch readiness'],
    outputs: ['Workflow action', 'Launch action', 'Nurture run', 'Integration handoff'],
    dependsOn: ['Integrations', 'Credentials', 'Pulse events'],
    dependedOnBy: ['Connect™', 'Operations Visibility', 'Launch Readiness'],
    health: 'Watch',
    healthReason: 'Useful automation exists; a single governed automation engine is still future platform work.',
    knownRisks: ['Automation failures may not yet roll up with consistent severity and ownership.'],
    roadmap: ['Define automation ownership and incident telemetry.', 'Connect failed automation signals to Decision Center.'],
    recommendation: 'Keep automation visible as an operations capability; do not overstate it as a complete engine yet.',
    businessOutcomes: ['Faster delivery', 'Less manual status chasing', 'More consistent launch execution'],
    documentation: [
      { title: 'Operations Visibility', href: '/admin/operations', note: 'Current executive view of launch readiness and integration status.' },
    ],
    dataSources: [
      { label: 'Platform architecture Automation Engine reservation', location: 'docs/EA-PLATFORM-ARCHITECTURE.md', confidence: 'High' },
      { label: 'Connect sequence runner', location: 'lib/connect-sequence-runner.ts', confidence: 'Medium' },
      { label: 'Launch command center', location: 'lib/launch-command-center.ts', confidence: 'High' },
    ],
    futureState: false,
  },
  {
    slug: 'executive-reporting',
    name: 'Executive Reporting',
    category: 'Operations',
    tagline: 'Business answers for leadership, not raw charts.',
    executiveSummary:
      'Executive Reporting summarizes health, readiness, client state, and operational signals in language leadership can act on.',
    businessProblem: 'Leadership needs answers and recommended next moves, not disconnected metrics.',
    users: ['Executive leadership', 'Operations owners', 'Client success owners'],
    organizationsUsing: ['EA internal operating system'],
    maturity: 'Growing',
    maturityReason: 'Executive Shell, Organization 360, Operations Visibility, and Product Operations exist; Intelligence is not built yet.',
    systems: ['Executive Briefing', 'Organization 360', 'Operations Visibility', 'Product Operations'],
    outputs: ['Executive briefing', 'Health summary', 'Operational status', 'Recommended next action'],
    dependsOn: ['Pulse™', 'Client Records', 'Launch readiness', 'Product Operations'],
    dependedOnBy: ['Executive Operating System', 'Decision Center', 'Executive Intelligence'],
    health: 'Strong',
    healthReason: 'Certified executive surfaces exist; deeper Executive Intelligence remains a later phase.',
    knownRisks: ['Revenue and forecasting answers require future intelligence/data integration.'],
    roadmap: ['Prepare for Executive Intelligence after Capability Center certification.'],
    recommendation: 'Keep reporting answer-first and avoid generic dashboard charts.',
    businessOutcomes: ['Faster leadership decisions', 'Better operating rhythm', 'Clearer accountability'],
    documentation: [
      { title: 'Executive Briefing', href: '/admin/master', note: 'Certified Phase 1 executive surface.' },
      { title: 'Operations Visibility', href: '/admin/operations', note: 'Certified Phase 2 operating view.' },
    ],
    dataSources: [
      { label: 'Executive Shell', location: 'app/admin/master/ExecutiveShellPhaseOne.tsx', confidence: 'High' },
      { label: 'Executive Operations aggregator', location: 'lib/executive-operations.ts', confidence: 'High' },
    ],
    futureState: false,
  },
  {
    slug: 'amplifi',
    name: 'Amplifi™',
    category: 'Creative',
    tagline: 'Distribution for approved stories, posts, and updates.',
    executiveSummary:
      'Amplifi takes approved opportunities and turns them into shareable content and portal/social distribution workflows.',
    businessProblem: 'Good work loses value when it is not packaged and distributed clearly.',
    users: ['Communications owners', 'Growth owners', 'Client owners'],
    organizationsUsing: ['EA internal operations', 'Portal organizations with Amplifi or Update Hub access'],
    maturity: 'Production Ready',
    maturityReason: 'Product Operations marks Amplifi as Core with portal, public, and admin distribution surfaces.',
    systems: ['Amplifi app', 'Portal Amplifi', 'Update Hub approvals', 'Social share helpers'],
    outputs: ['Social post', 'Share hub', 'Portal Amplifi item', 'Update Hub approval request'],
    dependsOn: ['Simplifi™', 'Magnifi™', 'Update Hub', 'Pulse'],
    dependedOnBy: ['Communications', 'EA Creative Studio™'],
    health: 'Strong',
    healthReason: 'Core product metadata and implementation routes exist.',
    knownRisks: ['Publishing outcome visibility needs stronger executive rollup.'],
    roadmap: ['Improve publish outcome reporting.', 'Keep Creative Studio parked until its contract is approved.'],
    recommendation: 'Keep Amplifi as the current creative/distribution capability.',
    businessOutcomes: ['More visible client wins', 'Faster content distribution', 'Clearer approval path'],
    documentation: [
      { title: 'Amplifi workspace', href: '/amplifi', note: 'Current public creation surface.' },
      { title: 'Product Operations - Amplifi', href: '/admin/products/amplifi', note: 'Product-level view.' },
    ],
    dataSources: [productSource('amplifi'), registrySource('amplifi'), { label: 'Amplifi portal experience', location: 'lib/amplifi-portal.ts', confidence: 'High' }],
    futureState: false,
  },
  {
    slug: 'ea-creative-studio',
    name: 'EA Creative Studio™',
    category: 'Creative',
    tagline: 'Future creative production environment.',
    executiveSummary:
      'EA Creative Studio is parked as a future capability. No current production implementation is claimed by the Capability Center.',
    businessProblem: 'EA may eventually need a governed creative production workspace beyond Amplifi distribution.',
    users: ['Future creative operators', 'Growth owners'],
    organizationsUsing: ['None - future capability'],
    maturity: 'Future Capability',
    maturityReason: 'The Phase 3 charter explicitly parks EA Creative Studio as future-state only.',
    systems: ['Not implemented as a production capability'],
    outputs: ['Future creative assets', 'Future campaign materials'],
    dependsOn: ['Amplifi™', 'Creative governance'],
    dependedOnBy: [],
    health: 'Future',
    healthReason: 'Future-state capability; no production health should be inferred.',
    knownRisks: ['Building this before governance would create duplicate creative tooling.'],
    roadmap: ['Keep parked until a formal implementation charter approves the creative production scope.'],
    recommendation: 'Archive as future-state in Capability Center and do not build during Executive Intelligence.',
    businessOutcomes: ['Potential future creative scale', 'Potential production consistency'],
    documentation: [
      { title: 'Phase 3 charter', href: '/admin/capabilities', note: 'Labels EA Creative Studio as parked future capability.' },
    ],
    dataSources: [
      { label: 'Phase 3 implementation charter', location: 'User-approved architecture request', confidence: 'High' },
    ],
    futureState: true,
  },
  {
    slug: 'simplifi',
    name: 'Simplifi™',
    category: 'Personal Productivity',
    tagline: 'Capture and clarify what is worth acting on.',
    executiveSummary:
      'Simplifi captures opportunities, organizes work, and helps users decide what should happen next.',
    businessProblem: 'Important opportunities disappear when they are not captured, scored, and turned into action.',
    users: ['Individual operators', 'Growth owners', 'Client teams'],
    organizationsUsing: ['EA internal operations', 'Organizations with Simplifi access'],
    maturity: 'Production Ready',
    maturityReason: 'Product Operations marks Simplifi as Core with active routes, APIs, and portal module coverage.',
    systems: ['Simplifi capture', 'Simplifi workspace', 'Guidance engine', 'Simplifi store', 'Pulse'],
    outputs: ['Captured item', 'Opportunity score', 'Guidance report', 'Action center item'],
    dependsOn: ['Capture records', 'Guidance engine', 'Pulse'],
    dependedOnBy: ['Magnifi™', 'Amplifi™', 'Selena Protocol™'],
    health: 'Strong',
    healthReason: 'Core product metadata and implementation routes exist.',
    knownRisks: ['Capture adoption by organization needs stronger executive visibility.'],
    roadmap: ['Improve executive adoption reporting.', 'Keep capture-to-story path clear.'],
    recommendation: 'Keep Simplifi as the canonical personal productivity and opportunity capture capability.',
    businessOutcomes: ['Less lost opportunity', 'Clearer personal priorities', 'Better action follow-through'],
    documentation: [
      { title: 'Simplifi workspace', href: '/simplifi/workspace', note: 'Current user workspace.' },
      { title: 'Product Operations - Simplifi', href: '/admin/products/simplifi', note: 'Product-level view.' },
    ],
    dataSources: [productSource('simplifi'), registrySource('simplifi'), { label: 'Simplifi store', location: 'lib/simplifi-store.ts', confidence: 'High' }],
    futureState: false,
  },
  {
    slug: 'magnifi',
    name: 'Magnifi™',
    category: 'Business Intelligence',
    tagline: 'Turns captured opportunity into story, report, and buy-in.',
    executiveSummary:
      'Magnifi converts Simplifi captures into compelling reports and future-state stories that help leaders understand what is possible.',
    businessProblem: 'Good opportunities fail when stakeholders cannot quickly see the value or future state.',
    users: ['Executive sponsors', 'Growth owners', 'Client decision makers'],
    organizationsUsing: ['EA internal demonstrations', 'Organizations with Simplifi/Magnifi story access'],
    maturity: 'Production Ready',
    maturityReason: 'Product Operations marks Magnifi as Live with story routes and capture-to-story infrastructure.',
    systems: ['Magnifi experience engine', 'Consider resolver', 'Capture records', 'Pulse'],
    outputs: ['Future-state story', 'Classic report', 'Consider experience', 'Executive narrative'],
    dependsOn: ['Simplifi™', 'Capture records', 'Pulse'],
    dependedOnBy: ['Amplifi™', 'Selena Protocol™', 'Operational Blueprint™'],
    health: 'Strong',
    healthReason: 'Story routes and engine exist; standalone entitlement is still deferred.',
    knownRisks: ['Standalone Magnifi entitlement is not yet separate from Simplifi packaging.'],
    roadmap: ['Clarify organization linkage for Magnifi stories.', 'Decide whether standalone entitlement is needed.'],
    recommendation: 'Keep Magnifi as the business intelligence/story layer that creates buy-in from captured opportunity.',
    businessOutcomes: ['Clearer buy-in', 'Better executive storytelling', 'Higher conversion from diagnosis to action'],
    documentation: [
      { title: 'Product Operations - Magnifi', href: '/admin/products/magnifi', note: 'Product-level view.' },
    ],
    dataSources: [productSource('magnifi'), { label: 'Magnifi experience engine', location: 'lib/magnifi-experience-engine.ts', confidence: 'High' }],
    futureState: false,
  },
  {
    slug: 'fortifi',
    name: 'Fortifi™',
    category: 'Platform',
    tagline: 'Future journey/outcome strengthening capability.',
    executiveSummary:
      'Fortifi is named in platform/product architecture as a future client journey and outcome capability. It is not yet a separate production module.',
    businessProblem: 'EA will need stronger outcome tracking across client journeys as the platform matures.',
    users: ['Future client success owners', 'Platform owners'],
    organizationsUsing: ['None - future capability'],
    maturity: 'Future Capability',
    maturityReason: 'Product Operations marks Fortifi as Planned with no dedicated Experience Registry capability id.',
    systems: ['Future platform capability', 'Template references'],
    outputs: ['Future journey health', 'Future outcome tracking'],
    dependsOn: ['Portal Chassis', 'Experience Registry', 'Pulse'],
    dependedOnBy: ['Future Organization 360 depth'],
    health: 'Future',
    healthReason: 'Future-state capability; no current implementation health should be inferred.',
    knownRisks: ['Could duplicate Organization 360 health unless scoped carefully.'],
    roadmap: ['Define operating contract before implementation.', 'Avoid production claims until registry and telemetry exist.'],
    recommendation: 'Keep Fortifi in the catalog as future-state only.',
    businessOutcomes: ['Potential stronger client journey outcomes', 'Potential client success forecasting'],
    documentation: [
      { title: 'Product Operations - Fortifi', href: '/admin/products/fortifi', note: 'Planned product metadata.' },
    ],
    dataSources: [productSource('fortifi'), registrySource('fortifi')],
    futureState: true,
  },
  {
    slug: 'unifi',
    name: 'Unifi™',
    category: 'Platform',
    tagline: 'Future unified identity and experience presence.',
    executiveSummary:
      'Unifi is the future platform capability for coherent identity and experience presence. It is not yet a standalone production module.',
    businessProblem: 'As EA adds products and client experiences, identity and access must feel unified instead of fragmented.',
    users: ['Future platform owners', 'Client admins', 'Executive users'],
    organizationsUsing: ['None - future capability'],
    maturity: 'Future Capability',
    maturityReason: 'Product Operations marks Unifi as Planned with no dedicated Experience Registry capability id.',
    systems: ['Future identity strategy', 'Current auth/RBAC helpers'],
    outputs: ['Future unified sign-in', 'Future organization membership model', 'Future access governance'],
    dependsOn: ['Authentication strategy', 'RBAC', 'Organization model'],
    dependedOnBy: ['Future platform-wide identity', 'Future executive access governance'],
    health: 'Future',
    healthReason: 'Future-state capability; current auth should not be relabeled as Unifi production.',
    knownRisks: ['Premature Unifi work could destabilize existing authentication.'],
    roadmap: ['Clarify Unifi product contract versus platform identity work.', 'Use Architecture Change Proposal before replacing auth.'],
    recommendation: 'Keep Unifi future-state and do not touch authentication during Capability Center work.',
    businessOutcomes: ['Potential simpler access management', 'Potential unified executive identity', 'Potential lower support burden'],
    documentation: [
      { title: 'Product Operations - Unifi', href: '/admin/products/unifi', note: 'Planned product metadata.' },
      { title: 'Technology Radar', href: '/admin/foundation-library', note: 'Identity strategy references.' },
    ],
    dataSources: [
      productSource('unifi'),
      { label: 'Auth/RBAC foundations', location: 'lib/auth and lib/rbac.ts', confidence: 'Medium' },
      registrySource('unifi'),
    ],
    futureState: true,
  },
];

export function listExecutiveCapabilities(): ExecutiveCapability[] {
  return EXECUTIVE_CAPABILITIES;
}

export function getExecutiveCapability(slug: string): ExecutiveCapability | undefined {
  return EXECUTIVE_CAPABILITIES.find((capability) => capability.slug === slug);
}

export function listCapabilitiesByCategory(): { category: CapabilityCategory; capabilities: ExecutiveCapability[] }[] {
  const order: CapabilityCategory[] = [
    'Executive Platform',
    'Business Development',
    'Operations',
    'Creative',
    'Personal Productivity',
    'Business Intelligence',
    'Platform',
  ];

  return order.map((category) => ({
    category,
    capabilities: EXECUTIVE_CAPABILITIES.filter((capability) => capability.category === category),
  }));
}

export function getCapabilityMaturitySummary() {
  return {
    total: EXECUTIVE_CAPABILITIES.length,
    productionReady: EXECUTIVE_CAPABILITIES.filter((capability) => capability.maturity === 'Production Ready').length,
    growing: EXECUTIVE_CAPABILITIES.filter((capability) => capability.maturity === 'Growing').length,
    foundation: EXECUTIVE_CAPABILITIES.filter((capability) => capability.maturity === 'Foundation').length,
    future: EXECUTIVE_CAPABILITIES.filter((capability) => capability.futureState).length,
  };
}
