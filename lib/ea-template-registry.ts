/**
 * EA Template Registry — Phase 2
 * 10 Magnifi cinematic templates + 10 paired Simplifi guidance assessments.
 */

export type MagnifiTemplateId =
  | 'executive-transformation'
  | 'entrepreneur-launch'
  | 'hidden-asset-discovery'
  | 'community-blueprint'
  | 'university-ecosystem'
  | 'legacy-and-scale'
  | 'media-empire'
  | 'financial-transformation'
  | 'athlete-development'
  | 'faith-community-impact';

export type SimplifiAssessmentId =
  | 'website-clarity'
  | 'communication-effectiveness'
  | 'membership-growth'
  | 'business-visibility'
  | 'social-media-effectiveness'
  | 'training-effectiveness'
  | 'operational-friction'
  | 'customer-experience'
  | 'community-health'
  | 'capacity-recovery';

export interface ExperienceTheme {
  id: MagnifiTemplateId;
  navy: string;
  gold: string;
  cream: string;
  accent: string;
  heroFrom: string;
  heroVia: string;
  heroTo: string;
  radial: string;
}

export interface MagnifiTemplateDef {
  id: MagnifiTemplateId;
  name: string;
  example?: string;
  audience: string;
  journey: string[];
  magnifiProduct: string;
  pairedSimplifiAssessment: SimplifiAssessmentId;
  theme: ExperienceTheme;
  cinematicHook: (orgName: string) => string;
  twelveMonths: (orgName: string) => string;
  missionControlLine: string;
  ctaLabel: string;
  ctaHref: string;
  detectPatterns: RegExp[];
}

export interface SimplifiAssessmentDef {
  id: SimplifiAssessmentId;
  name: string;
  scope: string;
  pairedMagnifiTemplate: MagnifiTemplateId;
  openingInsight: (orgName: string) => string;
  consequences: string[];
  futureState: string[];
  strengths: string[];
  progressPath: { stage: string; description: string }[];
  detectPatterns: RegExp[];
}

const BASE = {
  navy: '#1B2B4D',
  gold: '#C9A844',
  cream: '#FAF8F3',
};

function theme(
  id: MagnifiTemplateId,
  accent: string,
  heroFrom: string,
  heroVia: string,
  heroTo: string,
  radial: string,
): ExperienceTheme {
  return { id, navy: BASE.navy, gold: BASE.gold, cream: BASE.cream, accent, heroFrom, heroVia, heroTo, radial };
}

export const MAGNIFI_TEMPLATES: Record<MagnifiTemplateId, MagnifiTemplateDef> = {
  'executive-transformation': {
    id: 'executive-transformation',
    name: 'Executive Transformation™',
    example: 'Selena',
    audience: 'Executives, managers, corporate leaders',
    journey: ['Experience', 'Expertise', 'Asset', 'Platform', 'Ownership'],
    magnifiProduct: 'Magnifi',
    pairedSimplifiAssessment: 'operational-friction',
    theme: theme('executive-transformation', '#C9A844', '#0f1829', '#1B2B4D', '#243a66', '#C9A844'),
    cinematicHook: () => 'You have built something real. The next chapter should feel inevitable.',
    twelveMonths: (org) =>
      `Twelve months from now, ${org} could package expertise into a platform stakeholders believe in — with visible progress every quarter.`,
    missionControlLine: 'Mission Control turns executive intent into tracked adoption across teams and clients.',
    ctaLabel: 'Start Simplifi Assessment',
    ctaHref: '/assessment',
    detectPatterns: [/executive|corporate|manager|director|vp|leadership|selena/i],
  },
  'entrepreneur-launch': {
    id: 'entrepreneur-launch',
    name: 'Entrepreneur Launch™',
    audience: 'Small business owners, solopreneurs, consultants',
    journey: ['Current Business', 'Missed Opportunities', 'Systems', 'Scale', 'Freedom'],
    magnifiProduct: 'Magnifi',
    pairedSimplifiAssessment: 'business-visibility',
    theme: theme('entrepreneur-launch', '#E8C547', '#121820', '#1a2840', '#2a3f5f', '#E8C547'),
    cinematicHook: () => 'Freedom is not fewer hours — it is systems that protect your best ones.',
    twelveMonths: (org) =>
      `Twelve months from now, ${org} could run on visible systems — not heroics — with leads, delivery, and growth in one rhythm.`,
    missionControlLine: 'See every opportunity, client touchpoint, and follow-through in one command view.',
    ctaLabel: 'Improve Visibility',
    ctaHref: '/simplifi',
    detectPatterns: [/solopreneur|founder|consult|coach|small business|entrepreneur/i],
  },
  'hidden-asset-discovery': {
    id: 'hidden-asset-discovery',
    name: 'Hidden Asset Discovery™',
    audience: 'Professionals, teachers, nurses, veterans, retirees',
    journey: ['Career', 'Hidden Assets', 'Market Value', 'Business Opportunity', 'Ownership'],
    magnifiProduct: 'Magnifi',
    pairedSimplifiAssessment: 'capacity-recovery',
    theme: theme('hidden-asset-discovery', '#6B9AC4', '#141c28', '#1e2d42', '#2d4563', '#6B9AC4'),
    cinematicHook: () => 'Your career holds assets the market has never seen packaged — until now.',
    twelveMonths: (org) =>
      `Twelve months from now, ${org} could own a clear offer, a visible platform, and income beyond the clock.`,
    missionControlLine: 'Capture expertise once — reuse it across proposals, training, and client delivery.',
    ctaLabel: 'Discover Your Assets',
    ctaHref: '/assessment',
    detectPatterns: [/teacher|nurse|veteran|retiree|professional|hidden asset|career/i],
  },
  'community-blueprint': {
    id: 'community-blueprint',
    name: 'Community Blueprint™',
    example: 'BAS',
    audience: 'Associations, fraternities, sororities, nonprofits',
    journey: ['Legacy', 'Engagement', 'Connection', 'Community', 'Impact'],
    magnifiProduct: 'Magnifi',
    pairedSimplifiAssessment: 'community-health',
    theme: theme('community-blueprint', '#9B7BB8', '#1a1528', '#2a2240', '#3d3258', '#9B7BB8'),
    cinematicHook: () => 'Legacy is not history. It is momentum waiting for a system.',
    twelveMonths: (org) =>
      `Twelve months from now, ${org} could measure engagement, not just activity — with members who feel seen and stay connected.`,
    missionControlLine: 'Chapter updates, events, and member stories flow through one visible hub.',
    ctaLabel: 'Revitalize Community',
    ctaHref: '/simplifi',
    detectPatterns: [/fraternity|sorority|chapter|association|nonprofit|bas|legacy|community hub/i],
  },
  'university-ecosystem': {
    id: 'university-ecosystem',
    name: 'University Ecosystem™',
    example: 'JCSU',
    audience: 'Universities, alumni associations, advancement offices',
    journey: ['Students', 'Graduates', 'Alumni', 'Mentors', 'Donors', 'Legacy'],
    magnifiProduct: 'Magnifi',
    pairedSimplifiAssessment: 'membership-growth',
    theme: theme('university-ecosystem', '#B84A4A', '#1a1218', '#2a1a22', '#3d2838', '#B84A4A'),
    cinematicHook: () => 'A future your alumni can see — before they ever write a check.',
    twelveMonths: (org) =>
      `Twelve months from now, ${org} could connect students, alumni, mentors, and donors in one living ecosystem.`,
    missionControlLine: 'Advancement sees pipeline, engagement, and story — not scattered spreadsheets.',
    ctaLabel: 'Grow Membership',
    ctaHref: '/assessment',
    detectPatterns: [/university|alumni|college|campus|student|jcsu|advancement/i],
  },
  'legacy-and-scale': {
    id: 'legacy-and-scale',
    name: 'Legacy & Scale™',
    example: 'No Grease',
    audience: 'Established owners, franchise operators, multi-location founders',
    journey: ['Founder', 'Systems', 'Knowledge Capture', 'Platform', 'Legacy'],
    magnifiProduct: 'Magnifi',
    pairedSimplifiAssessment: 'training-effectiveness',
    theme: theme('legacy-and-scale', '#C4A574', '#18140f', '#2a2418', '#3d3524', '#C4A574'),
    cinematicHook: () => 'What you know should outlive your calendar — and scale without you in every room.',
    twelveMonths: (org) =>
      `Twelve months from now, ${org} could run on captured knowledge, repeatable systems, and a brand that scales locations.`,
    missionControlLine: 'Franchise playbook, training, and performance visible across every location.',
    ctaLabel: 'Capture Knowledge',
    ctaHref: '/simplifi',
    detectPatterns: [/franchise|multi-location|no grease|founder|scale|legacy/i],
  },
  'media-empire': {
    id: 'media-empire',
    name: 'Media Empire™',
    example: 'Jesse Mitchell',
    audience: 'Podcasters, influencers, content creators',
    journey: ['Audience', 'Content', 'Community', 'Platform', 'Network'],
    magnifiProduct: 'Amplifi',
    pairedSimplifiAssessment: 'social-media-effectiveness',
    theme: theme('media-empire', '#4A90D9', '#0f1419', '#1a2433', '#2a3a52', '#4A90D9'),
    cinematicHook: () => 'Your audience is real. Your platform should match the size of your voice.',
    twelveMonths: (org) =>
      `Twelve months from now, ${org} could monetize attention with systems — not burnout — and a community that compounds.`,
    missionControlLine: 'Content pipeline, sponsors, and community health in one Amplifi command center.',
    ctaLabel: 'Amplify Reach',
    ctaHref: '/simplifi',
    detectPatterns: [/podcast|influencer|content creator|media|youtube|jesse/i],
  },
  'financial-transformation': {
    id: 'financial-transformation',
    name: 'Financial Transformation™',
    audience: 'Financial coaches, advisors, educators, ETFM',
    journey: ['Chaos', 'Visibility', 'Structure', 'Control', 'Freedom'],
    magnifiProduct: 'Fortifi',
    pairedSimplifiAssessment: 'customer-experience',
    theme: theme('financial-transformation', '#4CAF7A', '#0f1814', '#1a2a22', '#2a4034', '#4CAF7A'),
    cinematicHook: () => 'Clarity is the product. Control is the experience clients pay for.',
    twelveMonths: (org) =>
      `Twelve months from now, ${org} could deliver structured financial clarity clients feel — not just spreadsheets they fear.`,
    missionControlLine: 'Client journeys, touchpoints, and outcomes tracked with Fortifi precision.',
    ctaLabel: 'Structure Client Experience',
    ctaHref: '/assessment',
    detectPatterns: [/financial|etfm|advisor|coach|wealth|budget|fortifi/i],
  },
  'athlete-development': {
    id: 'athlete-development',
    name: 'Athlete Development™',
    example: 'CPR',
    audience: 'Athletes, coaches, recruiting services',
    journey: ['Potential', 'Development', 'Exposure', 'Opportunity', 'Success'],
    magnifiProduct: 'Amplifi',
    pairedSimplifiAssessment: 'website-clarity',
    theme: theme('athlete-development', '#C9A844', '#0a1628', '#1B2B4D', '#2d4a6e', '#C9A844'),
    cinematicHook: () => 'Potential is visible. The path to opportunity should be too.',
    twelveMonths: (org) =>
      `Twelve months from now, ${org} could connect development, exposure, and recruiting in one trusted showcase.`,
    missionControlLine: 'CPR-style visibility — profiles, camps, and follow-up in one recruiting rhythm.',
    ctaLabel: 'Showcase Potential',
    ctaHref: 'https://cpr-site.vercel.app',
    detectPatterns: [/athlete|recruit|basketball|camp|showcase|cpr|amplifi/i],
  },
  'faith-community-impact': {
    id: 'faith-community-impact',
    name: 'Faith & Community Impact™',
    audience: 'Churches, faith leaders, faith-based nonprofits',
    journey: ['Mission', 'Engagement', 'Connection', 'Growth', 'Impact'],
    magnifiProduct: 'Magnifi',
    pairedSimplifiAssessment: 'communication-effectiveness',
    theme: theme('faith-community-impact', '#D4B86A', '#141820', '#1B2438', '#2a3550', '#D4B86A'),
    cinematicHook: () => 'A mission that moves people — not just meetings that fill calendars.',
    twelveMonths: (org) =>
      `Twelve months from now, ${org} could grow connection between services, small groups, and community impact people can see.`,
    missionControlLine: 'Announcements, care, and volunteer rhythm visible to every leader and member.',
    ctaLabel: 'Strengthen Communication',
    ctaHref: '/simplifi',
    detectPatterns: [/church|faith|ministry|congregation|pastor|worship/i],
  },
};

export const SIMPLIFI_ASSESSMENTS: Record<SimplifiAssessmentId, SimplifiAssessmentDef> = {
  'website-clarity': {
    id: 'website-clarity',
    name: 'Website Clarity Assessment™',
    scope: 'Landing pages, funnels, websites, lead capture',
    pairedMagnifiTemplate: 'athlete-development',
    openingInsight: (org) =>
      `${org}'s site is working harder to explain itself than to attract the right next conversation.`,
    consequences: ['Lost leads', 'Lost trust', 'Lost conversions', 'Lost momentum'],
    futureState: ['Clear hero message', 'Obvious next step', 'Mobile-ready journey', 'Measurable conversions'],
    strengths: ['Existing web presence', 'Content to refine', 'Quick-win clarity opportunities'],
    progressPath: [
      { stage: 'Current State', description: 'Visitors arrive — but too many leave without acting.' },
      { stage: 'Improved State', description: 'One clear path from visit to conversation.' },
      { stage: 'Optimized State', description: 'Site converts consistently and feeds Pulse.' },
    ],
    detectPatterns: [/website|landing|funnel|homepage|web design/i],
  },
  'communication-effectiveness': {
    id: 'communication-effectiveness',
    name: 'Communication Effectiveness Assessment™',
    scope: 'Internal, stakeholder, and member communication',
    pairedMagnifiTemplate: 'faith-community-impact',
    openingInsight: (org) =>
      `${org} is communicating — but important messages are not always reaching people at the moment they are ready to act.`,
    consequences: ['Lost participation', 'Lost engagement', 'Lost alignment', 'Lost trust'],
    futureState: ['Rhythm people expect', 'Clear channels', 'Two-way feedback', 'Visible updates'],
    strengths: ['Active audience', 'Multiple touchpoints', 'Stories worth sharing'],
    progressPath: [
      { stage: 'Current State', description: 'Messages go out — impact is unclear.' },
      { stage: 'Improved State', description: 'Update Hub centralizes what matters.' },
      { stage: 'Optimized State', description: 'Engagement measurable in Pulse.' },
    ],
    detectPatterns: [/newsletter|announcement|communication|email|update hub/i],
  },
  'membership-growth': {
    id: 'membership-growth',
    name: 'Membership Growth Assessment™',
    scope: 'Associations, churches, alumni, fraternities, sororities',
    pairedMagnifiTemplate: 'university-ecosystem',
    openingInsight: (org) =>
      `${org} has members — but growth may depend on moments you are not consistently capturing.`,
    consequences: ['Lost renewals', 'Lost referrals', 'Lost participation', 'Lost legacy'],
    futureState: ['Onboarding that sticks', 'Mentor pathways', 'Visible member wins', 'Referral rhythm'],
    strengths: ['Existing member base', 'Community identity', 'Events and rituals to leverage'],
    progressPath: [
      { stage: 'Current State', description: 'Membership exists — growth feels episodic.' },
      { stage: 'Improved State', description: 'Journey mapped from join to advocate.' },
      { stage: 'Optimized State', description: 'Growth predictable and visible.' },
    ],
    detectPatterns: [/membership|alumni|association|join|renew/i],
  },
  'business-visibility': {
    id: 'business-visibility',
    name: 'Business Visibility Assessment™',
    scope: 'Brand presence, digital presence, search, lead generation',
    pairedMagnifiTemplate: 'entrepreneur-launch',
    openingInsight: (org) =>
      `${org} delivers real value — but the market may not see you when buyers are ready to decide.`,
    consequences: ['Lost leads', 'Lost revenue', 'Lost credibility', 'Lost capacity'],
    futureState: ['Consistent brand', 'Search-ready presence', 'Clear offer', 'Lead capture that works'],
    strengths: ['Proven offer', 'Client proof', 'Digital assets to amplify'],
    progressPath: [
      { stage: 'Current State', description: 'Visibility depends on hustle, not system.' },
      { stage: 'Improved State', description: 'One canonical presence and capture flow.' },
      { stage: 'Optimized State', description: 'Pipeline visible in Mission Control.' },
    ],
    detectPatterns: [/brand|visibility|seo|search|lead gen|marketing/i],
  },
  'social-media-effectiveness': {
    id: 'social-media-effectiveness',
    name: 'Social Media Effectiveness Assessment™',
    scope: 'Content, engagement, visibility, consistency',
    pairedMagnifiTemplate: 'media-empire',
    openingInsight: (org) =>
      `${org} is posting — but content may not be compounding into community or conversion.`,
    consequences: ['Lost reach', 'Lost engagement', 'Lost monetization', 'Lost time'],
    futureState: ['Content system', 'Engagement loops', 'Community hub', 'Sponsor-ready metrics'],
    strengths: ['Existing audience', 'Content history', 'Voice and perspective'],
    progressPath: [
      { stage: 'Current State', description: 'Posts go out — impact is fuzzy.' },
      { stage: 'Improved State', description: 'Editorial rhythm with Amplifi support.' },
      { stage: 'Optimized State', description: 'Audience becomes platform.' },
    ],
    detectPatterns: [/social|instagram|tiktok|linkedin|podcast|content/i],
  },
  'training-effectiveness': {
    id: 'training-effectiveness',
    name: 'Training Effectiveness Assessment™',
    scope: 'Onboarding, knowledge transfer, learning systems',
    pairedMagnifiTemplate: 'legacy-and-scale',
    openingInsight: (org) =>
      `${org} trains people — but knowledge may still live in people, not systems.`,
    consequences: ['Lost consistency', 'Lost scale', 'Lost quality', 'Lost time'],
    futureState: ['Documented playbooks', 'Onboarding paths', 'Measurable competency', 'Captured expertise'],
    strengths: ['Experienced team', 'Repeatable processes', 'Training culture potential'],
    progressPath: [
      { stage: 'Current State', description: 'Training is person-dependent.' },
      { stage: 'Improved State', description: 'Core knowledge captured once.' },
      { stage: 'Optimized State', description: 'Scale without quality drop.' },
    ],
    detectPatterns: [/training|onboard|learning|course|staff|volunteer/i],
  },
  'operational-friction': {
    id: 'operational-friction',
    name: 'Operational Friction Assessment™',
    scope: 'Processes, workflows, efficiency, capacity',
    pairedMagnifiTemplate: 'executive-transformation',
    openingInsight: (org) =>
      `${org}'s team is busy — but much of that activity may not be creating forward momentum.`,
    consequences: ['Lost time', 'Lost capacity', 'Lost revenue', 'Lost focus'],
    futureState: ['Mapped workflows', 'Automated handoffs', 'Visible bottlenecks', 'Recovered hours'],
    strengths: ['High activity', 'Clear pain points', 'Leadership ready for change'],
    progressPath: [
      { stage: 'Current State', description: 'Friction visible — fixes scattered.' },
      { stage: 'Improved State', description: 'Top three bottlenecks addressed.' },
      { stage: 'Optimized State', description: 'Capacity gains tracked in Pulse.' },
    ],
    detectPatterns: [/workflow|process|operational|friction|manual|spreadsheet/i],
  },
  'customer-experience': {
    id: 'customer-experience',
    name: 'Customer Experience Assessment™',
    scope: 'Journey, touchpoints, follow-up, engagement',
    pairedMagnifiTemplate: 'financial-transformation',
    openingInsight: (org) =>
      `${org} serves clients — but the journey between first touch and long-term loyalty may have gaps.`,
    consequences: ['Lost clients', 'Lost referrals', 'Lost lifetime value', 'Lost trust'],
    futureState: ['Mapped journey', 'Proactive follow-up', 'Portal access', 'Pulse-visible success'],
    strengths: ['Client relationships', 'Service quality', 'Touchpoints to unify'],
    progressPath: [
      { stage: 'Current State', description: 'Experience varies by who handles it.' },
      { stage: 'Improved State', description: 'Standard journey with Update Hub.' },
      { stage: 'Optimized State', description: 'Success scores rise in Pulse.' },
    ],
    detectPatterns: [/customer|client|journey|touchpoint|cx|service/i],
  },
  'community-health': {
    id: 'community-health',
    name: 'Community Health Assessment™',
    scope: 'Participation, engagement, communication, connection',
    pairedMagnifiTemplate: 'community-blueprint',
    openingInsight: (org) =>
      `${org} has community — but not every member feels the same momentum or connection.`,
    consequences: ['Lost participation', 'Lost engagement', 'Lost connection', 'Lost impact'],
    futureState: ['Engagement rhythm', 'Member visibility', 'Shared wins', 'Legacy stories'],
    strengths: ['Strong identity', 'Active core', 'Events and traditions'],
    progressPath: [
      { stage: 'Current State', description: 'Activity uneven across members.' },
      { stage: 'Improved State', description: 'Engagement visible and celebrated.' },
      { stage: 'Optimized State', description: 'Community health tracked in Pulse.' },
    ],
    detectPatterns: [/community|chapter|member|engagement|participation/i],
  },
  'capacity-recovery': {
    id: 'capacity-recovery',
    name: 'Capacity Recovery Assessment™',
    scope: 'Time leakage, bottlenecks, constraints, hidden opportunity',
    pairedMagnifiTemplate: 'hidden-asset-discovery',
    openingInsight: (org) =>
      `${org} is capable — but hidden time leaks and bottlenecks may be costing more than you see.`,
    consequences: ['Lost hours', 'Lost opportunity', 'Lost growth', 'Lost energy'],
    futureState: ['Recovered hours', 'Clear priorities', 'Protected focus time', 'Visible wins'],
    strengths: ['High capability', 'Identifiable constraints', 'Quick recovery potential'],
    progressPath: [
      { stage: 'Current State', description: 'Capacity feels constrained.' },
      { stage: 'Improved State', description: 'Hours recovered weekly.' },
      { stage: 'Optimized State', description: 'Growth friction removed.' },
    ],
    detectPatterns: [/capacity|time recovery|bottleneck|constraint|blueprint/i],
  },
};

const NAME_TO_MAGNIFI: Record<string, MagnifiTemplateId> = Object.fromEntries(
  Object.values(MAGNIFI_TEMPLATES).map((t) => [t.name.replace('™', '').toLowerCase(), t.id]),
) as Record<string, MagnifiTemplateId>;

export function getMagnifiTemplate(id: MagnifiTemplateId): MagnifiTemplateDef {
  return MAGNIFI_TEMPLATES[id];
}

export function getSimplifiAssessment(id: SimplifiAssessmentId): SimplifiAssessmentDef {
  return SIMPLIFI_ASSESSMENTS[id];
}

export function resolveMagnifiTemplateId(blob: string, templateNameHint?: string): MagnifiTemplateId {
  const hint = (templateNameHint ?? '').toLowerCase();
  for (const [name, id] of Object.entries(NAME_TO_MAGNIFI)) {
    if (hint.includes(name)) return id;
  }
  for (const template of Object.values(MAGNIFI_TEMPLATES)) {
    if (template.detectPatterns.some((p) => p.test(blob))) return template.id;
  }
  for (const assessment of Object.values(SIMPLIFI_ASSESSMENTS)) {
    if (assessment.detectPatterns.some((p) => p.test(blob))) {
      return assessment.pairedMagnifiTemplate;
    }
  }
  return 'executive-transformation';
}

export function resolveSimplifiAssessmentId(
  magnifiId: MagnifiTemplateId,
  blob: string,
): SimplifiAssessmentId {
  const paired = MAGNIFI_TEMPLATES[magnifiId].pairedSimplifiAssessment;
  for (const assessment of Object.values(SIMPLIFI_ASSESSMENTS)) {
    if (assessment.id !== paired && assessment.detectPatterns.some((p) => p.test(blob))) {
      return assessment.id;
    }
  }
  return paired;
}

/** Legacy shape for recommendation-engine compatibility */
export function magnifiTemplateForEngine(id: MagnifiTemplateId) {
  const t = MAGNIFI_TEMPLATES[id];
  const s = SIMPLIFI_ASSESSMENTS[t.pairedSimplifiAssessment];
  return {
    id: t.id,
    name: t.name,
    example: t.example,
    audience: t.audience,
    journey: t.journey,
    magnifiProduct: t.magnifiProduct,
    simplifiAssessment: s.name,
  };
}

export const ALL_MAGNIFI_TEMPLATE_IDS = Object.keys(MAGNIFI_TEMPLATES) as MagnifiTemplateId[];
export const ALL_SIMPLIFI_ASSESSMENT_IDS = Object.keys(SIMPLIFI_ASSESSMENTS) as SimplifiAssessmentId[];
