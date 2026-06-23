/**
 * EA Repository Library — proprietary reuse intelligence (v0 static seed).
 * Future: persist evaluations to Airtable / Supabase Experience Memory.
 */

export interface RepositoryCandidate {
  id: string;
  name: string;
  description: string;
  href: string;
  category: string;
  industries: string[];
  useCases: string[];
  strengths: string[];
  suggestedProtocols: string[];
  scores: {
    storytelling: number;
    animation: number;
    mobile: number;
    complexity: number;
    performance: number;
  };
  favorite?: boolean;
  recommended?: boolean;
  strategy: 'reuse' | 'extend' | 'overlay' | 'replace' | 'build';
}

export const EA_REPOSITORY_LIBRARY: RepositoryCandidate[] = [
  {
    id: 'ea-payments',
    name: 'Simplifi Platform (ea-payments)',
    description: 'The current Pulse-connected EA operating platform with portal, assessment, payment, and client delivery patterns.',
    href: 'https://github.com/TheArchitect1111/ea-payments',
    category: 'Business',
    industries: ['consulting', 'saas', 'professional services', 'nonprofit', 'church'],
    useCases: ['capture', 'magnifi', 'amplifi', 'pulse', 'portal', 'payments', 'partner marketplace', 'opportunities resources'],
    strengths: ['Full intelligence OS', 'Capture pipeline', 'Consider experiences', 'Stripe', 'Partner Marketplace'],
    suggestedProtocols: ['EA Master Protocol', 'EA Chassis Protocol', 'EA Portal Protocol', 'EA Assessment Protocol'],
    scores: { storytelling: 8, animation: 5, mobile: 8, complexity: 8, performance: 7 },
    favorite: true,
    recommended: true,
    strategy: 'extend',
  },
  {
    id: 'cpr-site',
    name: 'CPR Site',
    description: 'A sports recruiting and athlete pipeline reference for high-trust vertical experiences.',
    href: 'https://cpr-site.vercel.app',
    category: 'Recruiting',
    industries: ['athletics', 'recruiting', 'sports'],
    useCases: ['recruiting portal', 'athlete pipeline', 'parent communication', 'resource library', 'events'],
    strengths: ['Sports recruitment UX', 'Portal chassis', 'Magnifi athlete template', 'Resource and event patterns'],
    suggestedProtocols: ['EA Website Protocol', 'EA Portal Protocol', 'EA Image Protocol'],
    scores: { storytelling: 8, animation: 5, mobile: 8, complexity: 6, performance: 7 },
    recommended: true,
    strategy: 'overlay',
  },
  {
    id: 'brother-hub',
    name: 'BrotherHub',
    description: 'A community and membership reference for faith-centered relationship, event, and opportunity hubs.',
    href: 'https://brother-hub.vercel.app',
    category: 'Community',
    industries: ['faith', 'men', 'community'],
    useCases: ['membership', 'events', 'community hub', 'opportunities'],
    strengths: ['Community patterns', 'Chassis reuse', 'Opportunities page'],
    suggestedProtocols: ['EA Portal Protocol', 'EA Website Protocol', 'EA Training Protocol'],
    scores: { storytelling: 7, animation: 4, mobile: 8, complexity: 5, performance: 8 },
    strategy: 'overlay',
  },
  {
    id: 'sister-hub',
    name: 'SisterHub',
    description: 'A membership and events reference for warm community portals with benefits and resource flows.',
    href: 'https://sister-hub.vercel.app',
    category: 'Membership',
    industries: ['faith', 'women', 'community'],
    useCases: ['membership', 'events', 'community hub', 'member benefits'],
    strengths: ['Community patterns', 'Chassis reuse', 'Member portal and events'],
    suggestedProtocols: ['EA Portal Protocol', 'EA Website Protocol', 'EA Training Protocol'],
    scores: { storytelling: 7, animation: 4, mobile: 8, complexity: 5, performance: 8 },
    strategy: 'overlay',
  },
  {
    id: 'template-sports',
    name: 'Sports Recruitment Template',
    description: 'A fast-start recruiting landing template for athlete visibility and conversion paths.',
    href: 'https://template-sports-recruitment.vercel.app',
    category: 'Recruiting',
    industries: ['athletics', 'recruiting'],
    useCases: ['landing', 'recruitment funnel'],
    strengths: ['Fast vertical start', 'Proven layout'],
    suggestedProtocols: ['EA Website Protocol', 'EA Image Protocol', 'EA Sales Protocol'],
    scores: { storytelling: 7, animation: 4, mobile: 8, complexity: 4, performance: 8 },
    strategy: 'reuse',
  },
  {
    id: 'aceternity',
    name: 'Aceternity UI',
    description: 'Premium React sections and interactions useful for cinematic, story-first landing experiences.',
    href: 'https://ui.aceternity.com',
    category: 'Cinematic',
    industries: ['consulting', 'saas', 'education', 'community', 'membership'],
    useCases: ['cinematic', 'storytelling', 'landing', 'premium sections', 'motion'],
    strengths: ['Premium visual sections', 'Cinematic motion', 'Storytelling-friendly layouts'],
    suggestedProtocols: ['EA Skin Protocol', 'EA Website Protocol', 'EA Image Protocol'],
    scores: { storytelling: 10, animation: 9, mobile: 7, complexity: 7, performance: 6 },
    favorite: true,
    recommended: true,
    strategy: 'reuse',
  },
  {
    id: 'magic-ui',
    name: 'Magic UI',
    description: 'Polished animated UI components for modern landing pages, proof sections, and memorable interactions.',
    href: 'https://magicui.design',
    category: 'Premium',
    industries: ['saas', 'education', 'membership', 'nonprofit'],
    useCases: ['modern landing', 'animated sections', 'premium interactions', 'dashboard accents'],
    strengths: ['Polished components', 'Good motion patterns', 'Fast prototype value'],
    suggestedProtocols: ['EA Skin Protocol', 'EA Website Protocol'],
    scores: { storytelling: 8, animation: 8, mobile: 7, complexity: 6, performance: 7 },
    recommended: true,
    strategy: 'reuse',
  },
  {
    id: 'motion',
    name: 'Motion',
    description: 'Production animation primitives for controlled page motion, microinteractions, and scroll storytelling.',
    href: 'https://motion.dev',
    category: 'Storytelling',
    industries: ['consulting', 'saas', 'community', 'recruiting', 'education'],
    useCases: ['animation', 'microinteractions', 'cinematic transitions', 'scroll storytelling'],
    strengths: ['Production animation engine', 'React compatibility', 'Controlled interaction design'],
    suggestedProtocols: ['EA Skin Protocol', 'EA Website Protocol'],
    scores: { storytelling: 8, animation: 10, mobile: 8, complexity: 6, performance: 8 },
    favorite: true,
    strategy: 'extend',
  },
  {
    id: 'lenis',
    name: 'Lenis',
    description: 'Smooth scrolling infrastructure for editorial, cinematic, long-form web experiences.',
    href: 'https://lenis.darkroom.engineering',
    category: 'Cinematic',
    industries: ['consulting', 'creative', 'nonprofit', 'recruiting', 'education'],
    useCases: ['smooth scroll', 'cinematic', 'storytelling', 'long-form landing'],
    strengths: ['Smooth scroll foundation', 'Editorial-feeling experiences', 'Premium page motion'],
    suggestedProtocols: ['EA Skin Protocol', 'EA Website Protocol'],
    scores: { storytelling: 8, animation: 8, mobile: 7, complexity: 5, performance: 8 },
    strategy: 'overlay',
  },
  {
    id: 'react-bits',
    name: 'React Bits',
    description: 'A component inspiration library for interactive React effects and modern premium sections.',
    href: 'https://reactbits.dev',
    category: 'Premium',
    industries: ['saas', 'education', 'community', 'membership'],
    useCases: ['interactive components', 'modern sections', 'animation', 'premium'],
    strengths: ['Reusable React effects', 'Modern component ideas', 'Strong prototype library'],
    suggestedProtocols: ['EA Skin Protocol', 'EA Website Protocol'],
    scores: { storytelling: 7, animation: 8, mobile: 7, complexity: 6, performance: 7 },
    strategy: 'reuse',
  },
  {
    id: 'shadcn',
    name: 'shadcn/ui',
    description: 'Accessible app primitives for forms, dashboards, portals, settings, and operational admin surfaces.',
    href: 'https://ui.shadcn.com',
    category: 'Dashboard',
    industries: ['saas', 'consulting', 'nonprofit', 'education', 'membership'],
    useCases: ['dashboard', 'admin', 'forms', 'portal', 'settings', 'tables'],
    strengths: ['Accessible primitives', 'Strong admin UI foundation', 'Composable portal components'],
    suggestedProtocols: ['EA Chassis Protocol', 'EA Portal Protocol', 'EA Website Protocol'],
    scores: { storytelling: 5, animation: 4, mobile: 9, complexity: 6, performance: 9 },
    favorite: true,
    recommended: true,
    strategy: 'extend',
  },
  {
    id: 'origin-ui',
    name: 'Origin UI',
    description: 'Practical app and admin components for clean operational interfaces and form-heavy workflows.',
    href: 'https://originui.com',
    category: 'Business',
    industries: ['saas', 'consulting', 'education', 'community'],
    useCases: ['forms', 'dashboard', 'admin', 'modern components', 'premium'],
    strengths: ['Practical app components', 'Useful admin patterns', 'Clean implementation examples'],
    suggestedProtocols: ['EA Chassis Protocol', 'EA Portal Protocol'],
    scores: { storytelling: 5, animation: 4, mobile: 8, complexity: 5, performance: 8 },
    strategy: 'reuse',
  },
  {
    id: 'twenty-first-dev',
    name: '21st.dev',
    description: 'A component discovery marketplace for modern interface references and reusable visual ideas.',
    href: 'https://21st.dev',
    category: 'Creator',
    industries: ['saas', 'creative', 'education', 'community', 'membership'],
    useCases: ['component discovery', 'modern UI', 'premium', 'dashboard', 'landing'],
    strengths: ['Broad component discovery', 'Modern interface references', 'Useful inspiration library'],
    suggestedProtocols: ['EA Skin Protocol', 'EA Website Protocol', 'EA Chassis Protocol'],
    scores: { storytelling: 7, animation: 7, mobile: 7, complexity: 5, performance: 7 },
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
