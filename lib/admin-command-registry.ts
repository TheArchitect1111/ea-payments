export type CommandItem = {
  id: string;
  label: string;
  group: 'Navigate' | 'Create' | 'Search' | 'Capture';
  href?: string;
  action?: 'capture:quick' | 'capture:analyze' | 'navigator:open' | 'tour:start' | 'voice:open';
  keywords?: string[];
};

export const ADMIN_COMMANDS: CommandItem[] = [
  { id: 'nav-master', label: 'Master Control', group: 'Navigate', href: '/admin/master', keywords: ['home', 'dashboard'] },
  { id: 'nav-delivery', label: 'Client Delivery Board', group: 'Navigate', href: '/admin/delivery', keywords: ['clients', 'onboarding', 'delivery', 'scale', 'sop'] },
  { id: 'nav-pipeline', label: 'Pipeline Dashboard', group: 'Navigate', href: '/admin/dashboard', keywords: ['assessments'] },
  { id: 'nav-proposals', label: 'Proposals', group: 'Navigate', href: '/admin/proposals' },
  { id: 'nav-commissions', label: 'Commissions', group: 'Navigate', href: '/admin/commissions', keywords: ['partners'] },
  { id: 'nav-content', label: 'Content Requests', group: 'Navigate', href: '/admin/content-requests' },
  { id: 'nav-enhance', label: 'Enhancements', group: 'Navigate', href: '/admin/enhancements' },
  { id: 'nav-assessment', label: 'Operational MRI (public)', group: 'Navigate', href: '/assessment', keywords: ['mri', 'funnel'] },
  { id: 'nav-simplifi-workspace', label: 'Simplifi Workspace', group: 'Navigate', href: '/admin/simplifi', keywords: ['capture', 'opportunity', 'save'] },
  { id: 'nav-radar', label: 'Resource Radar', group: 'Navigate', href: '/admin/resource-radar', keywords: ['resources', 'tools'] },
  { id: 'nav-simplifi', label: 'Simplifi Website Audit', group: 'Navigate', href: '/admin/simplifi-audit', keywords: ['playwright', 'website', 'clarity'] },
  { id: 'nav-blueprints', label: 'Blueprint Library', group: 'Navigate', href: '/admin/blueprints', keywords: ['magnifi', 'auto blueprint'] },
  { id: 'nav-protocol-center', label: 'Protocol Center', group: 'Navigate', href: '/admin/protocol-center', keywords: ['protocols', 'versions', 'approval', 'ea factory'] },
  { id: 'nav-ea-factory', label: 'EA Factory', group: 'Navigate', href: '/admin/ea-factory', keywords: ['factory', 'protocols', 'projects', 'skins'] },
  { id: 'nav-repo-library', label: 'Repo Library', group: 'Navigate', href: '/admin/ea-factory/repo-library', keywords: ['repositories', 'ui libraries', 'components', 'scores'] },
  { id: 'nav-project-generator', label: 'Project Generator', group: 'Create', href: '/admin/ea-factory/project-generator', keywords: ['brief', 'codex prompt', 'new project'] },
  { id: 'nav-skin-factory', label: 'Skin Factory', group: 'Create', href: '/admin/ea-factory/skin-factory', keywords: ['skin brief', 'creative direction', 'visual requirements', 'skin factory'] },
  { id: 'nav-skin-briefs', label: 'Saved Skin Briefs', group: 'Create', href: '/admin/ea-factory/skin-factory/briefs', keywords: ['skin briefs', 'approved skins'] },
  { id: 'nav-foundation-library', label: 'Foundation Library', group: 'Navigate', href: '/admin/foundation-library', keywords: ['templates', 'prompts', 'automations'] },
  { id: 'nav-academy', label: 'Learn EA Academy', group: 'Navigate', href: '/admin/academy', keywords: ['learn', 'onboarding', 'tour'] },
  { id: 'nav-graph', label: 'Knowledge Graph', group: 'Navigate', href: '/admin/knowledge-graph', keywords: ['memory', 'graph', 'search'] },
  { id: 'nav-twin', label: 'Digital Twin', group: 'Navigate', href: '/admin/digital-twin', keywords: ['mirror', 'health', 'platform'] },
  { id: 'nav-marketplace', label: 'Partner Marketplace', group: 'Navigate', href: '/admin/partner-marketplace', keywords: ['partner', 'referral', 'cpr'] },
  { id: 'nav-voice', label: 'EA Voice Assistant', group: 'Search', action: 'voice:open', keywords: ['voice', 'ask', 'speak'] },
  { id: 'nav-tour', label: 'Start Mission Control Tour', group: 'Search', action: 'tour:start', keywords: ['guided', 'help'] },
  { id: 'nav-portal', label: 'Client Portal Login', group: 'Navigate', href: '/portal/login' },
  { id: 'create-capture', label: 'Quick Capture', group: 'Capture', action: 'capture:quick', keywords: ['save', 'signal'] },
  { id: 'analyze-url', label: 'Analyze URL (Firecrawl + Radar)', group: 'Capture', action: 'capture:analyze', keywords: ['scrape', 'website'] },
  { id: 'open-navigator', label: 'EA Navigator — What are you trying to do?', group: 'Search', action: 'navigator:open', keywords: ['help', 'guide'] },
];
