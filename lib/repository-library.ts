/**
 * EA Repository Library — proprietary reuse intelligence (v0 static seed).
 * Future: persist evaluations to Airtable / Supabase Experience Memory.
 */

export interface RepositoryCandidate {
  id: string;
  name: string;
  href: string;
  category: string;
  industries: string[];
  useCases: string[];
  strengths: string[];
  strategy: 'reuse' | 'extend' | 'overlay' | 'replace' | 'build';
}

export const EA_REPOSITORY_LIBRARY: RepositoryCandidate[] = [
  {
    id: 'ea-payments',
    name: 'Simplifi Platform (ea-payments)',
    href: 'https://github.com/TheArchitect1111/ea-payments',
    category: 'platform',
    industries: ['consulting', 'saas', 'professional services', 'nonprofit', 'church'],
    useCases: ['capture', 'magnifi', 'amplifi', 'pulse', 'portal', 'payments', 'partner marketplace', 'opportunities resources'],
    strengths: ['Full intelligence OS', 'Capture pipeline', 'Consider experiences', 'Stripe', 'Partner Marketplace'],
    strategy: 'extend',
  },
  {
    id: 'cpr-site',
    name: 'CPR Site',
    href: 'https://cpr-site.vercel.app',
    category: 'vertical',
    industries: ['athletics', 'recruiting', 'sports'],
    useCases: ['recruiting portal', 'athlete pipeline', 'parent communication', 'resource library', 'events'],
    strengths: ['Sports recruitment UX', 'Portal chassis', 'Magnifi athlete template', 'Resource and event patterns'],
    strategy: 'overlay',
  },
  {
    id: 'brother-hub',
    name: 'BrotherHub',
    href: 'https://brother-hub.vercel.app',
    category: 'community',
    industries: ['faith', 'men', 'community'],
    useCases: ['membership', 'events', 'community hub', 'opportunities'],
    strengths: ['Community patterns', 'Chassis reuse', 'Opportunities page'],
    strategy: 'overlay',
  },
  {
    id: 'sister-hub',
    name: 'SisterHub',
    href: 'https://sister-hub.vercel.app',
    category: 'community',
    industries: ['faith', 'women', 'community'],
    useCases: ['membership', 'events', 'community hub', 'member benefits'],
    strengths: ['Community patterns', 'Chassis reuse', 'Member portal and events'],
    strategy: 'overlay',
  },
  {
    id: 'template-sports',
    name: 'Sports Recruitment Template',
    href: 'https://template-sports-recruitment.vercel.app',
    category: 'template',
    industries: ['athletics', 'recruiting'],
    useCases: ['landing', 'recruitment funnel'],
    strengths: ['Fast vertical start', 'Proven layout'],
    strategy: 'reuse',
  },
];

export function matchRepositories(industryBlob: string, useCaseBlob: string): RepositoryCandidate[] {
  const blob = `${industryBlob} ${useCaseBlob}`.toLowerCase();
  return EA_REPOSITORY_LIBRARY.filter((repo) => {
    const industryHit = repo.industries.some((i) => blob.includes(i));
    const useHit = repo.useCases.some((u) => blob.includes(u.replace(/\s+/g, '')) || blob.includes(u));
    return industryHit || useHit;
  }).slice(0, 4);
}
