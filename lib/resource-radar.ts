import type { ScrapedPage } from './firecrawl';
import type { CaptureType } from './capture-records';

export type ResourceCategory =
  | 'GitHub Repository'
  | 'SaaS Platform'
  | 'AI Tool'
  | 'Community'
  | 'University'
  | 'Nonprofit'
  | 'Business'
  | 'Media / Content'
  | 'Person / Profile'
  | 'Website'
  | 'Unknown';

export interface ResourceClassification {
  captureType: CaptureType;
  category: ResourceCategory;
  industry: string;
  primaryFunction: string;
  useCases: string[];
  productAlignment: string[];
  buildVsBuy: 'Build' | 'Buy' | 'Partner' | 'Evaluate';
  implementationComplexity: 'Low' | 'Medium' | 'High';
  innovationScore: number;
  implementationScore: number;
  strategicValueScore: number;
}

const EA_PRODUCTS = [
  'Magnifi',
  'Simplifi',
  'Pulse',
  'Amplifi',
  'Update Hub',
  'Training Transformation',
  'Community Hub',
  'Mission Control',
  'CPR',
  'BrotherHub',
  'SisterHub',
] as const;

const KEYWORD_ALIGNMENT: Record<string, string[]> = {
  Magnifi: ['transformation', 'future', 'vision', 'experience', 'showcase'],
  Simplifi: ['assessment', 'priority', 'audit', 'diagnostic', 'mri', 'visibility'],
  Pulse: ['engagement', 'health', 'metrics', 'dashboard', 'analytics'],
  Amplifi: ['athlete', 'recruiting', 'prospect', 'sports', 'development'],
  'Update Hub': ['newsletter', 'communication', 'announcement', 'email'],
  'Training Transformation': ['training', 'learning', 'course', 'workshop', 'academy'],
  'Community Hub': ['community', 'membership', 'chapter', 'association', 'nonprofit'],
  'Mission Control': ['operations', 'workflow', 'portal', 'admin', 'crm'],
  CPR: ['basketball', 'recruit', 'athlete', 'camp', 'showcase'],
  BrotherHub: ['fraternity', 'brotherhood', 'chapter'],
  SisterHub: ['sorority', 'sisterhood', 'chapter'],
};

function detectCategory(url: string, page: ScrapedPage): ResourceCategory {
  const host = new URL(url).hostname.toLowerCase();
  const blob = `${url} ${page.title} ${page.description ?? ''} ${page.markdown}`.toLowerCase();

  if (host.includes('github.com')) return 'GitHub Repository';
  if (host.includes('linkedin.com')) return 'Person / Profile';
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'Media / Content';
  if (host.includes('.edu')) return 'University';
  if (/nonprofit|foundation|charity|\.org/.test(host) || blob.includes('nonprofit'))
    return 'Nonprofit';
  if (blob.includes('community') || blob.includes('membership')) return 'Community';
  if (
    blob.includes('saas') ||
    blob.includes('platform') ||
    blob.includes('software') ||
    host.includes('app.')
  )
    return 'SaaS Platform';
  if (blob.includes(' ai ') || blob.includes('artificial intelligence') || blob.includes('llm'))
    return 'AI Tool';
  if (blob.includes('company') || blob.includes('business') || blob.includes('consulting'))
    return 'Business';
  return 'Website';
}

function scoreKeyword(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((n, kw) => (lower.includes(kw) ? n + 1 : n), 0);
}

export function classifyResource(url: string, page: ScrapedPage): ResourceClassification {
  const category = detectCategory(url, page);
  const blob = `${page.title} ${page.description ?? ''} ${page.markdown}`.slice(0, 6000);

  const productAlignment = EA_PRODUCTS.filter(
    (product) => scoreKeyword(blob, KEYWORD_ALIGNMENT[product] ?? []) > 0
  ).slice(0, 5);

  if (productAlignment.length === 0) {
    if (category === 'University') productAlignment.push('Magnifi', 'Community Hub');
    else if (category === 'Nonprofit' || category === 'Community')
      productAlignment.push('Community Hub', 'Update Hub');
    else if (category === 'GitHub Repository') productAlignment.push('Mission Control', 'Simplifi');
    else productAlignment.push('Simplifi', 'Magnifi');
  }

  const captureType: CaptureType =
    category === 'Person / Profile'
      ? 'Person'
      : category === 'GitHub Repository' || category === 'SaaS Platform' || category === 'AI Tool'
        ? 'Resource'
        : category === 'Business' || category === 'University' || category === 'Nonprofit'
          ? 'Organization'
          : 'Signal';

  const innovationScore = Math.min(
    100,
    30 + scoreKeyword(blob, ['ai', 'automation', 'platform', 'innovation', 'api']) * 8
  );
  const implementationScore = Math.min(
    100,
    40 + (category === 'GitHub Repository' ? 25 : category === 'SaaS Platform' ? 15 : 5)
  );
  const strategicValueScore = Math.min(100, 35 + productAlignment.length * 12);

  return {
    captureType,
    category,
    industry: inferIndustry(blob, category),
    primaryFunction: inferFunction(category, blob),
    useCases: inferUseCases(category, productAlignment),
    productAlignment: [...productAlignment],
    buildVsBuy:
      category === 'GitHub Repository' ? 'Evaluate' : category === 'SaaS Platform' ? 'Buy' : 'Partner',
    implementationComplexity:
      category === 'GitHub Repository' ? 'High' : category === 'SaaS Platform' ? 'Low' : 'Medium',
    innovationScore,
    implementationScore,
    strategicValueScore,
  };
}

function inferIndustry(blob: string, category: ResourceCategory): string {
  if (category === 'University') return 'Education';
  if (category === 'Nonprofit') return 'Nonprofit';
  if (/healthcare|medical|clinic/.test(blob)) return 'Healthcare';
  if (/real estate|property/.test(blob)) return 'Real Estate';
  if (/coach|athlete|sport/.test(blob)) return 'Athletics';
  if (/church|faith|ministry/.test(blob)) return 'Faith & Community';
  if (/consult|agency|professional service/.test(blob)) return 'Professional Services';
  return 'General Business';
}

function inferFunction(category: ResourceCategory, blob: string): string {
  if (category === 'GitHub Repository') return 'Developer tool or framework';
  if (category === 'SaaS Platform') return 'Software platform';
  if (category === 'AI Tool') return 'AI capability';
  if (/portal|dashboard/.test(blob)) return 'Portal or dashboard';
  if (/training|course/.test(blob)) return 'Training or education';
  return 'Web presence or organization';
}

function inferUseCases(category: ResourceCategory, products: string[]): string[] {
  const cases: string[] = [];
  if (products.includes('Simplifi')) cases.push('Operational assessment candidate');
  if (products.includes('Magnifi')) cases.push('Future-state experience candidate');
  if (products.includes('Community Hub')) cases.push('Community engagement opportunity');
  if (category === 'GitHub Repository') cases.push('Technical resource for EA stack');
  if (cases.length === 0) cases.push('General opportunity discovery');
  return cases.slice(0, 4);
}

export function computeEaFitScore(classification: ResourceClassification, page: ScrapedPage): number {
  const blob = `${page.title} ${page.markdown}`.toLowerCase();
  let score =
    classification.strategicValueScore * 0.35 +
    classification.innovationScore * 0.2 +
    classification.implementationScore * 0.15 +
    classification.productAlignment.length * 8;

  if (/automation|workflow|portal|community|training|assessment/.test(blob)) score += 12;
  if (classification.category === 'Unknown') score -= 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}
