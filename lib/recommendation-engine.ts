import type { ScrapedPage } from './firecrawl';
import type { ResourceClassification } from './resource-radar';
import type { OpportunityScores } from './opportunity-engine';
import {
  type MagnifiTemplateId,
  magnifiTemplateForEngine,
  resolveMagnifiTemplateId,
} from './ea-template-registry';

export type { MagnifiTemplateId };

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

export function selectTemplate(
  classification: ResourceClassification,
  page: ScrapedPage,
): { template: MagnifiTemplate; reason: string } {
  const blob = `${page.title} ${page.description ?? ''} ${page.markdown} ${classification.category} ${classification.industry} ${classification.productAlignment.join(' ')}`.toLowerCase();
  const id = resolveMagnifiTemplateId(blob);
  const def = magnifiTemplateForEngine(id);

  let reason = `${def.name} pattern selected from capture signals.`;
  if (id === 'university-ecosystem') reason = 'University or alumni signals detected — JCSU-style ecosystem journey.';
  if (id === 'community-blueprint') reason = 'Community or membership signals detected — BAS-style blueprint journey.';
  if (id === 'athlete-development') reason = 'Athletics or recruiting signals detected — CPR-style development journey.';
  if (id === 'executive-transformation' && /executive|corporate|leadership/.test(blob)) {
    reason = 'Executive or corporate leadership signals — Selena-style transformation journey.';
  }
  if (id === 'faith-community-impact') reason = 'Faith or ministry signals detected — mission-driven engagement journey.';
  if (id === 'media-empire') reason = 'Media or creator signals detected — audience-to-platform journey.';
  if (id === 'financial-transformation') reason = 'Financial services signals detected — clarity and control journey.';
  if (id === 'legacy-and-scale') reason = 'Multi-location or franchise signals — knowledge capture journey.';
  if (id === 'hidden-asset-discovery') reason = 'Professional career signals — hidden asset discovery journey.';

  return { template: def, reason };
}

export function generateRecommendations(
  classification: ResourceClassification,
  page: ScrapedPage,
  scores: OpportunityScores,
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
  index: number,
): string {
  const useCase = classification.useCases[index % classification.useCases.length] ?? 'EA platform opportunity';
  if (/legacy|experience|potential|current|career|chaos|audience|mission/i.test(stage)) {
    return `Surface hidden value in ${classification.primaryFunction.toLowerCase()}.`;
  }
  if (/engagement|connection|development|expertise|visibility|content/i.test(stage)) {
    return `Improve ${useCase.toLowerCase()} with structured touchpoints.`;
  }
  if (/community|platform|exposure|scale|structure|systems/i.test(stage)) {
    return `Deploy ${classification.productAlignment[0] ?? 'Mission Control'} for visibility and coordination.`;
  }
  if (/impact|ownership|success|freedom|donors|control|network/i.test(stage)) {
    return `Measure outcomes — opportunity score ${scores.opportunityScore}/100.`;
  }
  return useCase;
}

function buildPriorities(
  template: MagnifiTemplate,
  classification: ResourceClassification,
  scores: OpportunityScores,
  blob: string,
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

  const templatePriority: Partial<Record<MagnifiTemplateId, Omit<PriorityRecommendation, 'rank'>>> = {
    'university-ecosystem': {
      title: 'Build alumni-to-donor journey',
      rationale: 'University ecosystem pattern — connect graduates, mentors, and advancement.',
      impact: 'High',
      ease: 'Medium',
      urgency: 'Medium',
      eaProduct: 'Community Hub',
    },
    'community-blueprint': {
      title: 'Revitalize chapter engagement',
      rationale: 'Community blueprint pattern — legacy → connection → measurable impact.',
      impact: 'High',
      ease: 'Medium',
      urgency: 'High',
      eaProduct: 'Community Hub',
    },
    'executive-transformation': {
      title: 'Package expertise into a platform',
      rationale: 'Executive transformation pattern — experience → asset → ownership.',
      impact: 'High',
      ease: 'Medium',
      urgency: 'Medium',
      eaProduct: 'Magnifi',
    },
    'media-empire': {
      title: 'Turn audience into a platform',
      rationale: 'Media empire pattern — content → community → network.',
      impact: 'High',
      ease: 'Medium',
      urgency: 'High',
      eaProduct: 'Amplifi',
    },
    'athlete-development': {
      title: 'Showcase development and exposure',
      rationale: 'Athlete development pattern — CPR-style recruiting visibility.',
      impact: 'High',
      ease: 'Medium',
      urgency: 'High',
      eaProduct: 'Amplifi',
    },
    'faith-community-impact': {
      title: 'Strengthen mission-driven engagement',
      rationale: 'Faith pattern — mission → connection → measurable growth.',
      impact: 'High',
      ease: 'High',
      urgency: 'Medium',
      eaProduct: 'Update Hub',
    },
    'financial-transformation': {
      title: 'Structure client clarity journey',
      rationale: 'Financial transformation pattern — chaos → visibility → control.',
      impact: 'High',
      ease: 'Medium',
      urgency: 'High',
      eaProduct: 'Fortifi',
    },
    'legacy-and-scale': {
      title: 'Capture founder knowledge in systems',
      rationale: 'Legacy & scale pattern — playbook → platform → multi-location consistency.',
      impact: 'High',
      ease: 'Medium',
      urgency: 'Medium',
      eaProduct: 'Training Transformation',
    },
    'hidden-asset-discovery': {
      title: 'Package hidden career assets',
      rationale: 'Hidden asset pattern — career expertise → marketable offer.',
      impact: 'High',
      ease: 'High',
      urgency: 'Medium',
      eaProduct: 'Magnifi',
    },
    'entrepreneur-launch': {
      title: 'Build visibility and lead capture',
      rationale: 'Entrepreneur launch pattern — missed opportunities → systems → freedom.',
      impact: 'High',
      ease: 'High',
      urgency: 'High',
      eaProduct: 'Simplifi',
    },
  };

  const specific = templatePriority[template.id];
  if (specific) candidates.push(specific);

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
    title: `Run ${template.simplifiAssessment ?? 'Operational Friction Assessment™'}`,
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
  scores: OpportunityScores,
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
        `#${p.rank} ${p.title} (${p.eaProduct}) — Impact ${p.impact}, Ease ${p.ease}, Urgency ${p.urgency}. ${p.rationale}`,
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
