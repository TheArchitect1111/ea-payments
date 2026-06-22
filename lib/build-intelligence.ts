import type { ScrapedPage } from './firecrawl';
import type { ResourceClassification } from './resource-radar';
import type { OpportunityScores } from './opportunity-engine';
import type { RecommendationResult } from './recommendation-engine';
import type { DecisionIntelligenceReport } from './decision-intelligence';
import { matchRepositories, type RepositoryCandidate } from './repository-library';

export interface ComponentRecommendation {
  area: string;
  library: string;
  action: 'use' | 'modify' | 'replace' | 'custom';
  rationale: string;
}

export interface OverlayConfidenceScore {
  themeMatchPercent: number;
  functionMatchPercent: number;
  repoCompatibilityPercent: number;
  developmentSavingsPercent: number;
  overall: 'high' | 'medium' | 'low';
}

export interface RepoMatchScore {
  repo: RepositoryCandidate;
  matchPercent: number;
  strategy: RepositoryCandidate['strategy'];
  savingsNote: string;
}

export interface ImplementationBlueprint {
  executiveSummary: string;
  whatExists: string[];
  whatWorks: string[];
  whatIsMissing: string[];
  recommendedStack: string[];
  recommendedComponents: ComponentRecommendation[];
  repoMatches: RepoMatchScore[];
  overlayStrategy: string;
  buildPath: string;
  estimatedEffort: string;
  overlayConfidence: OverlayConfidenceScore;
  cursorPrompt: string;
}

const DEFAULT_STACK = [
  'Next.js',
  'TypeScript',
  'Tailwind CSS',
  'shadcn/ui',
  'Framer Motion',
  'Supabase',
];

const COMPONENT_SEEDS: ComponentRecommendation[] = [
  {
    area: 'Hero / reveal',
    library: 'Magic UI + Aceternity UI',
    action: 'use',
    rationale: 'Cinematic hero without custom animation code.',
  },
  {
    area: 'Data tables / admin',
    library: 'TanStack Table + Tremor',
    action: 'use',
    rationale: 'Proven patterns for Pulse-style dashboards.',
  },
  {
    area: 'Forms / capture',
    library: 'React Hook Form + shadcn/ui',
    action: 'use',
    rationale: 'Accessible forms with minimal custom UI.',
  },
  {
    area: 'Scroll storytelling',
    library: 'Framer Motion + Lenis',
    action: 'modify',
    rationale: 'Premium motion with restraint — match brand theme.',
  },
];

export function buildBuildIntelligence(input: {
  page: ScrapedPage;
  classification: ResourceClassification;
  scores: OpportunityScores;
  recommendations: RecommendationResult;
  decision: DecisionIntelligenceReport;
  businessName: string;
  sourceUrl: string;
}): ImplementationBlueprint {
  const { page, classification, scores, recommendations, decision, businessName, sourceUrl } =
    input;

  const blob = `${classification.industry} ${classification.category} ${classification.useCases.join(' ')} ${page.title}`;
  const repoCandidates = matchRepositories(blob, recommendations.template.name);
  const repoMatches: RepoMatchScore[] = (repoCandidates.length ? repoCandidates : matchRepositories('platform', 'capture'))
    .map((repo, i) => ({
      repo,
      matchPercent: Math.max(55, 88 - i * 8),
      strategy: repo.strategy,
      savingsNote:
        repo.strategy === 'overlay'
          ? 'Theme overlay — preserve logic, replace visual layer.'
          : repo.strategy === 'reuse'
            ? 'Fork template — fastest path.'
            : 'Extend platform modules.',
    }))
    .slice(0, 3);

  const themeMatch = Math.min(96, 70 + Math.round(scores.implementationReadinessScore / 5));
  const functionMatch = Math.min(92, 60 + Math.round(scores.automationOpportunityScore / 4));
  const repoCompat = repoMatches[0]?.matchPercent ?? 65;
  const devSavings =
    decision.recommendedPath === 'overlay'
      ? 72
      : decision.recommendedPath === 'extend'
        ? 58
        : 35;

  const overlayConfidence: OverlayConfidenceScore = {
    themeMatchPercent: themeMatch,
    functionMatchPercent: functionMatch,
    repoCompatibilityPercent: repoCompat,
    developmentSavingsPercent: devSavings,
    overall: devSavings >= 65 ? 'high' : devSavings >= 45 ? 'medium' : 'low',
  };

  const whatIsMissing = [
    ...classification.useCases.filter((u) => !page.markdown.toLowerCase().includes(u.slice(0, 8).toLowerCase())),
    'Unified capture → story → share pipeline',
    'Architect-grade decision trail',
  ].slice(0, 5);

  const buildPath =
    decision.recommendedPath === 'overlay'
      ? `Magnifi analysis → Theme Overlay on ${repoMatches[0]?.repo.name ?? 'ea-payments'} → ship premium UI`
      : decision.recommendedPath === 'extend'
        ? 'Extend Simplifi workspace modules → wire capture + Pulse'
        : decision.recommendedPath === 'build'
          ? 'Greenfield only if reuse score < 50 — otherwise overlay first'
          : `${decision.recommendedPath} path per Decision Intelligence`;

  const cursorPrompt = buildCursorPrompt({
    businessName,
    sourceUrl,
    classification,
    recommendations,
    decision,
    repoMatches,
    overlayConfidence,
    buildPath,
  });

  return {
    executiveSummary: `${businessName}: ${decision.pathRationale} Confidence ${decision.confidenceScore}/100.`,
    whatExists: [
      page.title || 'Captured experience',
      `Industry: ${classification.industry}`,
      `Template match: ${recommendations.template.name}`,
    ],
    whatWorks: [
      `EA fit ${scores.eaFitScore}/100 · Opportunity ${scores.opportunityScore}/100`,
      recommendations.templateMatchReason,
    ],
    whatIsMissing,
    recommendedStack: DEFAULT_STACK,
    recommendedComponents: COMPONENT_SEEDS,
    repoMatches,
    overlayStrategy:
      'Preserve APIs, auth, and data. Replace visual layer, motion, and branding via Theme Overlay Engine.',
    buildPath,
    estimatedEffort:
      overlayConfidence.overall === 'high'
        ? '2–4 weeks with overlay-first approach'
        : overlayConfidence.overall === 'medium'
          ? '4–8 weeks with targeted custom work'
          : '8+ weeks — validate scope before committing',
    overlayConfidence,
    cursorPrompt,
  };
}

function buildCursorPrompt(input: {
  businessName: string;
  sourceUrl: string;
  classification: ResourceClassification;
  recommendations: RecommendationResult;
  decision: DecisionIntelligenceReport;
  repoMatches: RepoMatchScore[];
  overlayConfidence: OverlayConfidenceScore;
  buildPath: string;
}): string {
  const topRepo = input.repoMatches[0]?.repo.name ?? 'ea-payments';
  const priorities = input.recommendations.priorities
    .map((p) => `${p.rank}. ${p.title} (${p.eaProduct})`)
    .join('\n');

  return `# Build Intelligence™ — ${input.businessName}

Source: ${input.sourceUrl}
Recommended path: ${input.decision.recommendedPath.toUpperCase()}
Build path: ${input.buildPath}

## Discover the possibilities
${input.decision.possibilityHighlights.join('\n')}

## Top priorities
${priorities}

## Repo strategy
Primary: ${topRepo}
Overlay confidence: ${input.overlayConfidence.overall} (savings ~${input.overlayConfidence.developmentSavingsPercent}%)

## Instructions for Cursor
1. Do NOT greenfield unless reuse score is low.
2. Start from ${topRepo} — theme overlay, preserve business logic.
3. Use shadcn/ui + Magic UI for premium components.
4. End every deliverable with "What becomes possible?" — not feature lists.
5. Industry: ${input.classification.industry} · Template: ${input.recommendations.template.name}
`;
}
