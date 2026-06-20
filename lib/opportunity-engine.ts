import type { ResourceClassification } from './resource-radar';
import type { ScrapedPage } from './firecrawl';

export interface OpportunityScores {
  eaFitScore: number;
  opportunityScore: number;
  revenuePotentialScore: number;
  automationOpportunityScore: number;
  communicationOpportunityScore: number;
  trainingOpportunityScore: number;
  portalOpportunityScore: number;
  implementationReadinessScore: number;
  priority: 'Low' | 'Normal' | 'High';
}

export function scoreOpportunity(
  classification: ResourceClassification,
  page: ScrapedPage,
  eaFitScore: number
): OpportunityScores {
  const blob = `${page.title} ${page.description ?? ''} ${page.markdown}`.toLowerCase();

  const revenuePotentialScore = clamp(
    scoreKeywords(blob, ['revenue', 'sales', 'growth', 'members', 'customers', 'donors']) * 12 +
      (classification.category === 'Business' ? 25 : 10)
  );

  const automationOpportunityScore = clamp(
    scoreKeywords(blob, [
      'manual',
      'spreadsheet',
      'email',
      'duplicate',
      'workflow',
      'automation',
      'integrate',
    ]) * 10 + 15
  );

  const communicationOpportunityScore = clamp(
    scoreKeywords(blob, [
      'newsletter',
      'announcement',
      'update',
      'engagement',
      'community',
      'members',
    ]) * 12 + 10
  );

  const trainingOpportunityScore = clamp(
    scoreKeywords(blob, ['training', 'learning', 'course', 'onboard', 'staff', 'volunteer']) *
      12 +
      8
  );

  const portalOpportunityScore = clamp(
    scoreKeywords(blob, ['portal', 'dashboard', 'login', 'member', 'client']) * 12 + 10
  );

  const implementationReadinessScore = clamp(
    classification.implementationScore +
      (classification.implementationComplexity === 'Low'
        ? 20
        : classification.implementationComplexity === 'Medium'
          ? 10
          : 0)
  );

  const opportunityScore = Math.round(
    eaFitScore * 0.3 +
      revenuePotentialScore * 0.2 +
      automationOpportunityScore * 0.15 +
      communicationOpportunityScore * 0.1 +
      trainingOpportunityScore * 0.1 +
      portalOpportunityScore * 0.1 +
      implementationReadinessScore * 0.05
  );

  const priority: OpportunityScores['priority'] =
    opportunityScore >= 75 ? 'High' : opportunityScore >= 50 ? 'Normal' : 'Low';

  return {
    eaFitScore,
    opportunityScore,
    revenuePotentialScore,
    automationOpportunityScore,
    communicationOpportunityScore,
    trainingOpportunityScore,
    portalOpportunityScore,
    implementationReadinessScore,
    priority,
  };
}

function scoreKeywords(text: string, keywords: string[]): number {
  return keywords.reduce((n, kw) => (text.includes(kw) ? n + 1 : n), 0);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function buildAnalysisSummary(
  page: ScrapedPage,
  classification: ResourceClassification,
  scores: OpportunityScores
): string {
  return [
    `${classification.category} · ${classification.industry} · ${classification.primaryFunction}`,
    `EA Fit ${scores.eaFitScore}/100 · Opportunity ${scores.opportunityScore}/100`,
    `Alignment: ${classification.productAlignment.join(', ')}`,
    `Use cases: ${classification.useCases.join('; ')}`,
    `Build vs buy: ${classification.buildVsBuy} · Complexity: ${classification.implementationComplexity}`,
    page.description ? `Summary: ${page.description.slice(0, 280)}` : '',
    `(Scraped via ${page.source})`,
  ]
    .filter(Boolean)
    .join('\n');
}
