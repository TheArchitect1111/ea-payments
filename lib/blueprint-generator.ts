import type { ScrapedPage } from './firecrawl';
import type { ResourceClassification } from './resource-radar';
import type { RecommendationResult } from './recommendation-engine';
import type { OpportunityScores } from './opportunity-engine';

export interface BlueprintSection {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  status: 'stub' | 'ready';
}

export interface BlueprintStub {
  blueprintId: string;
  templateName: string;
  title: string;
  subtitle: string;
  sections: BlueprintSection[];
  roadmap: { phase: string; focus: string }[];
  generatedAt: string;
}

export function generateBlueprintStub(
  url: string,
  page: ScrapedPage,
  classification: ResourceClassification,
  scores: OpportunityScores,
  recommendations: RecommendationResult
): BlueprintStub {
  const blueprintId = `BP-${Date.now().toString(36).toUpperCase()}`;
  const template = recommendations.template;
  const orgName = page.title?.split(/[|\-–—]/)[0]?.trim() || 'This Organization';

  const sections: BlueprintSection[] = [
    {
      id: 'opening-reveal',
      title: 'Opening Reveal™',
      subtitle: 'Cinematic introduction',
      content: `${orgName} has untapped potential in ${classification.industry.toLowerCase()}. ${page.description ?? classification.primaryFunction}. EA Fit ${scores.eaFitScore}/100.`,
      status: 'stub',
    },
    {
      id: 'hidden-opportunity',
      title: 'Hidden Opportunity™',
      subtitle: 'What exists today; what is overlooked',
      content: [
        `Category: ${classification.category} · ${classification.industry}`,
        `Use cases: ${classification.useCases.join('; ')}`,
        `Build vs buy: ${classification.buildVsBuy} · Complexity: ${classification.implementationComplexity}`,
        recommendations.templateMatchReason,
      ].join('\n'),
      status: 'stub',
    },
    {
      id: 'future-state',
      title: 'Future-State Reveal™',
      subtitle: template.journey.join(' → '),
      content: recommendations.journeyStages
        .map((s) => `${s.stage}: ${s.opportunity}`)
        .join('\n'),
      status: 'stub',
    },
    {
      id: 'priorities',
      title: 'Your Top Three Priorities™',
      subtitle: 'Simplifi-ranked — never twenty recommendations',
      content: recommendations.priorities
        .map((p) => `#${p.rank} ${p.title} (${p.eaProduct})\n${p.rationale}`)
        .join('\n\n'),
      status: 'stub',
    },
    {
      id: 'first-step',
      title: 'Your First Step™',
      subtitle: recommendations.firstStep.cta,
      content: recommendations.firstStep.action,
      status: 'stub',
    },
    {
      id: 'possibility',
      title: 'Possibility Engine™',
      subtitle: 'Interactive pathways (stub)',
      content: `Recommended EA products: ${recommendations.recommendedProducts.join(', ')}. Opportunity score ${scores.opportunityScore}/100. Source: ${url}`,
      status: 'stub',
    },
  ];

  const roadmap = [
    {
      phase: '30 Days',
      focus: recommendations.priorities[0]
        ? `${recommendations.priorities[0].title} — quick win via ${recommendations.priorities[0].eaProduct}`
        : 'Discovery and Simplifi assessment',
    },
    {
      phase: '60 Days',
      focus: recommendations.priorities[1]
        ? `${recommendations.priorities[1].title} — ${recommendations.priorities[1].eaProduct} implementation`
        : 'Magnifi future-state experience draft',
    },
    {
      phase: '90 Days',
      focus: recommendations.priorities[2]
        ? `${recommendations.priorities[2].title} — measure and optimize`
        : 'Mission Control launch and adoption tracking',
    },
  ];

  return {
    blueprintId,
    templateName: template.name,
    title: `${orgName} — ${template.name}`,
    subtitle: `Auto Blueprint stub · EA Fit ${scores.eaFitScore} · Opportunity ${scores.opportunityScore}`,
    sections,
    roadmap,
    generatedAt: new Date().toISOString(),
  };
}

export function formatBlueprintSummary(stub: BlueprintStub): string {
  const sectionTitles = stub.sections.map((s) => s.title).join(', ');
  const roadmapLines = stub.roadmap.map((r) => `${r.phase}: ${r.focus}`).join('\n');

  return [
    `${stub.blueprintId} · ${stub.templateName}`,
    stub.title,
    stub.subtitle,
    `Sections: ${sectionTitles}`,
    '',
    'Roadmap:',
    roadmapLines,
    '',
    '---',
    stub.sections.map((s) => `## ${s.title}\n${s.content}`).join('\n\n'),
  ].join('\n');
}
