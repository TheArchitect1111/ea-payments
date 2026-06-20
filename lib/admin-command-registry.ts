export type CommandItem = {
  id: string;
  label: string;
  group: 'Navigate' | 'Create' | 'Search' | 'Capture';
  href?: string;
  action?: 'capture:quick' | 'capture:analyze' | 'navigator:open' | 'tour:start';
  keywords?: string[];
};

export const ADMIN_COMMANDS: CommandItem[] = [
  { id: 'nav-master', label: 'Master Control', group: 'Navigate', href: '/admin/master', keywords: ['home', 'dashboard'] },
  { id: 'nav-pipeline', label: 'Pipeline Dashboard', group: 'Navigate', href: '/admin/dashboard', keywords: ['assessments'] },
  { id: 'nav-proposals', label: 'Proposals', group: 'Navigate', href: '/admin/proposals' },
  { id: 'nav-commissions', label: 'Commissions', group: 'Navigate', href: '/admin/commissions', keywords: ['partners'] },
  { id: 'nav-content', label: 'Content Requests', group: 'Navigate', href: '/admin/content-requests' },
  { id: 'nav-enhance', label: 'Enhancements', group: 'Navigate', href: '/admin/enhancements' },
  { id: 'nav-assessment', label: 'Operational MRI (public)', group: 'Navigate', href: '/assessment', keywords: ['mri', 'funnel'] },
  { id: 'nav-radar', label: 'Resource Radar', group: 'Navigate', href: '/admin/resource-radar', keywords: ['resources', 'tools'] },
  { id: 'nav-simplifi', label: 'Simplifi Website Audit', group: 'Navigate', href: '/admin/simplifi-audit', keywords: ['playwright', 'website', 'clarity'] },
  { id: 'nav-blueprints', label: 'Blueprint Library', group: 'Navigate', href: '/admin/blueprints', keywords: ['magnifi', 'auto blueprint'] },
  { id: 'nav-academy', label: 'Learn EA Academy', group: 'Navigate', href: '/admin/academy', keywords: ['learn', 'onboarding', 'tour'] },
  { id: 'nav-tour', label: 'Start Mission Control Tour', group: 'Search', action: 'tour:start', keywords: ['guided', 'help'] },
  { id: 'nav-portal', label: 'Client Portal Login', group: 'Navigate', href: '/portal/login' },
  { id: 'create-capture', label: 'Quick Capture', group: 'Capture', action: 'capture:quick', keywords: ['save', 'signal'] },
  { id: 'analyze-url', label: 'Analyze URL (Firecrawl + Radar)', group: 'Capture', action: 'capture:analyze', keywords: ['scrape', 'website'] },
  { id: 'open-navigator', label: 'EA Navigator — What are you trying to do?', group: 'Search', action: 'navigator:open', keywords: ['help', 'guide'] },
];
