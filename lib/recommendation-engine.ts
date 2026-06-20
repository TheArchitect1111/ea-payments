import type { ScrapedPage } from './firecrawl';
import type { ResourceClassification } from './resource-radar';
import type { OpportunityScores } from './opportunity-engine';

export type MagnifiTemplateId =
  | 'executive-transformation'
  | 'community-blueprint'
  | 'university-ecosystem'
  | 'entrepreneur-launch'
  | 'athlete-development';

export interface MagnifiTemplate {
  id: MagnifiTemplateId;
  name: string;
  example?: string;
  audience: string;
  journey: string[];
  magnifiProduct: string;
  simplifiAssessment?: string;
}

export interface PriorityRecommendation {
  rank: 1 | 2 | 3;
  title: string;
  rationale: string;
  impact: 'High' | 'Medium' | 'Low';
  ease: 'High' | 'Medium' | 'Low';
  urgency: 'High' | 'Medium' | 'Low';
  eaProduct: string;
}

export interface RecommendationResult {
  template: MagnifiTemplate;
  templateMatchReason: string;
  journeyStages: { stage: string; opportunity: string }[];
  priorities: PriorityRecommendation[];
  firstStep: { action: string; cta: string; href?: string };
  recommendedProducts: string[];
}

const TEMPLATES: Record<MagnifiTemplateId, MagnifiTemplate> = {
  'executive-transformation': {
    id: 'executive-transformation',
    name: 'Executive Transformation™',
    example: 'Selena',
    audience: 'Executives, managers, corporate leaders',
    journey: ['Experience', 'Expertise', 'Asset', 'Platform', 'Ownership'],
    magnifiProduct: 'Magnifi',
    simplifiAssessment: 'Operational Friction Assessment™',
  },
  'community-blueprint': {
    id: 'community-blueprint',
    name: 'Community Blueprint™',
    example: 'BAS',
    audience: 'Associations, fraternities, sororities, nonprofits',
    journey: ['Legacy', 'Engagement', 'Connection', 'Community', 'Impact'],
    magnifiProduct: 'Magnifi',
    simplifiAssessment: 'Community Health Assessment™',
  },
  'university-ecosystem': {
    id: 'university-ecosystem',
    name: 'University Ecosystem™',
    example: 'JCSU',
    audience: 'Universities, alumni associations, advancement offices',
    journey: ['Students', 'Graduates', 'Alumni', 'Mentors', 'Donors', 'Legacy'],
    magnifiProduct: 'Magnifi',
    simplifiAssessment: 'Membership Growth Assessment™',
  },
  'entrepreneur-launch': {
    id: 'entrepreneur-launch',
    name: 'Entrepreneur Launch™',
    audience: 'Small business owners, solopreneurs, consultants',
    journey: ['Current Business', 'Missed Opportunities', 'Systems', 'Scale', 'Freedom'],
    magnifiProduct: 'Magnifi',
    simplifiAssessment: 'Business Visibility Assessment™',
  },
  'athlete-development': {
    id: 'athlete-development',
    name: 'Athlete Development™',
    example: 'CPR',
    audience: 'Athletes, coaches, recruiting services',
    journey: ['Potential', 'Development', 'Exposure', 'Opportunity', 'Success'],
    magnifiProduct: 'Amplifi',
    simplifiAssessment: 'Website Clarity Assessment™',
  },
};

export function selectTemplate(
  classification: ResourceClassification,
  page: ScrapedPage
): { template: MagnifiTemplate; reason: string } {
  const blob = `${page.title} ${page.description ?? ''} ${page.markdown}`.toLowerCase();
  const { category, industry, productAlignment } = classification;

  if (
    category === 'University' ||
    industry === 'Education' ||
    /alumni|university|college|campus|student/.test(blob)
  ) {
    return {
      template: TEMPLATES['university-ecosystem'],
      reason: 'University or alumni signals detected — JCSU-style ecosystem journey.',
    };
  }

  if (
    category === 'Community' ||
    category === 'Nonprofit' ||
    productAlignment.includes('BrotherHub') ||
    productAlignment.includes('SisterHub') ||
    productAlignment.includes('Community Hub') ||
    /fraternity|sorority|chapter|association|nonprofit|legacy/.test(blob)
  ) {
    return {
      template: TEMPLATES['community-blueprint'],
      reason: 'Community or membership signals detected — BAS-style blueprint journey.',
    };
  }

  if (
    productAlignment.includes('CPR') ||
    productAlignment.includes('Amplifi') ||
    industry === 'Athletics' ||
    /athlete|recruit|basketball|camp|showcase/.test(blob)
  ) {
    return {
      template: TEMPLATES['athlete-development'],
      reason: 'Athletics or recruiting signals detected — CPR-style development journey.',
    };
  }

  if (
    category === 'Business' ||
    /consult|coach|solopreneur|founder|executive|leader/.test(blob)
  ) {
    if (/executive|corporate|manager|director|vp|leadership/.test(blob)) {
      return {
        template: TEMPLATES['executive-transformation'],
        reason: 'Executive or corporate leadership signals — Selena-style transformation journey.',
      };
    }
    return {
      template: TEMPLATES['entrepreneur-launch'],
      reason: 'Business owner signals detected — entrepreneur launch journey.',
    };
  }

  if (category === 'Person / Profile' && /executive|founder|ceo|president/.test(blob)) {
    return {
      template: TEMPLATES['executive-transformation'],
      reason: 'Professional profile with leadership signals — executive transformation journey.',
    };
  }

  return {
    template: TEMPLATES['executive-transformation'],
    reason: 'Default Magnifi executive transformation pattern applied.',
  };
}

export function generateRecommendations(
  classification: ResourceClassification,
  page: ScrapedPage,
  scores: OpportunityScores
): RecommendationResult {
  const { template, reason } = selectTemplate(classification, page);
  const blob = `${page.title} ${page.markdown}`.toLowerCase();

  const journeyStages = template.journey.map((stage, i) => ({
    stage,
    opportunity: inferStageOpportunity(stage, classification, scores, i),
  }));

  const priorities = buildPriorities(template, classification, scores, blob);
  const firstStep = buildFirstStep(template, classification, scores);

  const recommendedProducts = [
    template.magnifiProduct,
    ...(template.simplifiAssessment ? ['Simplifi'] : []),
    ...classification.productAlignment.filter((p) => p !== template.magnifiProduct).slice(0, 2),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return {
    template,
    templateMatchReason: reason,
    journeyStages,
    priorities,
    firstStep,
    recommendedProducts,
  };
}

function inferStageOpportunity(
  stage: string,
  classification: ResourceClassification,
  scores: OpportunityScores,
  index: number
): string {
  const useCase = classification.useCases[index % classification.useCases.length] ?? 'EA platform opportunity';
  if (/legacy|experience|potential|current/i.test(stage)) {
    return `Surface hidden value in ${classification.primaryFunction.toLowerCase()}.`;
  }
  if (/engagement|connection|development|expertise/i.test(stage)) {
    return `Improve ${useCase.toLowerCase()} with structured touchpoints.`;
  }
  if (/community|platform|exposure|scale/i.test(stage)) {
    return `Deploy ${classification.productAlignment[0] ?? 'Mission Control'} for visibility and coordination.`;
  }
  if (/impact|ownership|success|freedom|donors/i.test(stage)) {
    return `Measure outcomes — opportunity score ${scores.opportunityScore}/100.`;
  }
  return useCase;
}

function buildPriorities(
  template: MagnifiTemplate,
  classification: ResourceClassification,
  scores: OpportunityScores,
  blob: string
): PriorityRecommendation[] {
  const candidates: Omit<PriorityRecommendation, 'rank'>[] = [];

  if (scores.automationOpportunityScore >= 50 || /manual|spreadsheet|workflow/.test(blob)) {
    candidates.push({
      title: 'Automate operational friction',
      rationale: 'Manual workflows detected — Mission Control + Simplifi can map and reduce friction.',
      impact: scores.automationOpportunityScore >= 70 ? 'High' : 'Medium',
      ease: classification.implementationComplexity === 'Low' ? 'High' : 'Medium',
      urgency: scores.priority === 'High' ? 'High' : 'Medium',
      eaProduct: 'Simplifi',
    });
  }

  if (scores.communicationOpportunityScore >= 45) {
    candidates.push({
      title: 'Unify communication touchpoints',
      rationale: 'Engagement gaps — Update Hub can centralize announcements and member updates.',
      impact: 'High',
      ease: 'Medium',
      urgency: 'Medium',
      eaProduct: 'Update Hub',
    });
  }

  if (scores.portalOpportunityScore >= 45) {
    candidates.push({
      title: 'Launch a member or client portal',
      rationale: 'Portal signals present — Magnifi future-state + Mission Control delivery.',
      impact: 'High',
      ease: classification.implementationComplexity === 'High' ? 'Low' : 'Medium',
      urgency: scores.priority === 'High' ? 'High' : 'Medium',
      eaProduct: template.magnifiProduct,
    });
  }

  if (template.id === 'university-ecosystem') {
    candidates.push({
      title: 'Build alumni-to-donor journey',
      rationale: 'University ecosystem pattern — connect graduates, mentors, and advancement.',
      impact: 'High',
      ease: 'Medium',
      urgency: 'Medium',
      eaProduct: 'Community Hub',
    });
  }

  if (template.id === 'community-blueprint') {
    candidates.push({
      title: 'Revitalize chapter engagement',
      rationale: 'Community blueprint pattern — legacy → connection → measurable impact.',
      impact: 'High',
      ease: 'Medium',
      urgency: 'High',
      eaProduct: 'Community Hub',
    });
  }

  if (template.id === 'executive-transformation') {
    candidates.push({
      title: 'Package expertise into a platform',
      rationale: 'Executive transformation pattern — experience → asset → ownership.',
      impact: 'High',
      ease: 'Medium',
      urgency: 'Medium',
      eaProduct: 'Magnifi',
    });
  }

  if (scores.trainingOpportunityScore >= 45) {
    candidates.push({
      title: 'Standardize training and onboarding',
      rationale: 'Learning signals — Training Transformation can capture institutional knowledge.',
      impact: 'Medium',
      ease: 'High',
      urgency: 'Medium',
      eaProduct: 'Training Transformation',
    });
  }

  candidates.push({
    title: `Run ${template.simplifiAssessment ?? 'Operational MRI'}`,
    rationale: 'Simplifi guidance engine — top three priorities, not twenty recommendations.',
    impact: 'High',
    ease: 'High',
    urgency: 'High',
    eaProduct: 'Simplifi',
  });

  const ranked = candidates
    .sort((a, b) => scorePriority(b) - scorePriority(a))
    .slice(0, 3)
    .map((c, i) => ({ ...c, rank: (i + 1) as 1 | 2 | 3 }));

  return ranked;
}

function scorePriority(p: Omit<PriorityRecommendation, 'rank'>): number {
  const map = { High: 3, Medium: 2, Low: 1 };
  return map[p.impact] * 3 + map[p.urgency] * 2 + map[p.ease];
}

function buildFirstStep(
  template: MagnifiTemplate,
  classification: ResourceClassification,
  scores: OpportunityScores
): RecommendationResult['firstStep'] {
  if (scores.opportunityScore >= 70) {
    return {
      action: `Schedule a Magnifi discovery session using the ${template.name} journey.`,
      cta: 'Generate Auto Blueprint',
      href: '/admin/blueprints',
    };
  }
  if (template.simplifiAssessment) {
    return {
      action: `Run ${template.simplifiAssessment} to clarify top priorities before building.`,
      cta: 'Start Simplifi Assessment',
      href: '/assessment',
    };
  }
  return {
    action: `Capture and triage this ${classification.category.toLowerCase()} in Mission Control.`,
    cta: 'View in Resource Radar',
    href: '/admin/resource-radar',
  };
}

export function formatRecommendationSummary(rec: RecommendationResult): string {
  const priorityLines = rec.priorities
    .map(
      (p) =>
        `#${p.rank} ${p.title} (${p.eaProduct}) — Impact ${p.impact}, Ease ${p.ease}, Urgency ${p.urgency}. ${p.rationale}`
    )
    .join('\n');

  return [
    `Template: ${rec.template.name}${rec.template.example ? ` (${rec.template.example})` : ''}`,
    `Match: ${rec.templateMatchReason}`,
    `Journey: ${rec.template.journey.join(' → ')}`,
    `Recommended products: ${rec.recommendedProducts.join(', ')}`,
    `First step: ${rec.firstStep.action}`,
    '',
    'Top 3 priorities:',
    priorityLines,
  ].join('\n');
}
