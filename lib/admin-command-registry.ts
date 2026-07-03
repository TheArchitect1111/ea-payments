export type CommandItem = {
  id: string;
  label: string;
  group: 'Navigate' | 'Create' | 'Search' | 'Capture';
  href?: string;
  action?: 'capture:quick' | 'capture:analyze' | 'navigator:open' | 'tour:start' | 'voice:open';
  keywords?: string[];
};

export const ADMIN_COMMANDS: CommandItem[] = [
  { id: 'nav-master', label: 'See What Needs Attention', group: 'Navigate', href: '/admin/master', keywords: ['mission control', 'home', 'dashboard'] },
  { id: 'nav-delivery', label: 'Continue Client Work', group: 'Navigate', href: '/admin/delivery', keywords: ['clients', 'onboarding', 'delivery', 'scale', 'sop'] },
  { id: 'nav-pipeline', label: 'Review Sales Pipeline', group: 'Navigate', href: '/admin/dashboard', keywords: ['assessments'] },
  { id: 'nav-proposals', label: 'Review Proposals', group: 'Navigate', href: '/admin/proposals' },
  { id: 'nav-commissions', label: 'Manage Partner Payments', group: 'Navigate', href: '/admin/commissions', keywords: ['partners'] },
  { id: 'nav-content', label: 'Review Client Updates', group: 'Navigate', href: '/admin/content-requests' },
  { id: 'nav-enhance', label: 'Review Enhancement Requests', group: 'Navigate', href: '/admin/enhancements' },
  { id: 'nav-assessment', label: 'Start Public Discovery', group: 'Navigate', href: '/assessment', keywords: ['mri', 'funnel'] },
  { id: 'nav-simplifi-workspace', label: 'Organize Opportunities', group: 'Navigate', href: '/admin/simplifi', keywords: ['capture', 'opportunity', 'save'] },
  { id: 'nav-radar', label: 'Research An Opportunity', group: 'Navigate', href: '/admin/resource-radar', keywords: ['resources', 'tools'] },
  { id: 'nav-simplifi', label: 'Audit A Website', group: 'Navigate', href: '/admin/simplifi-audit', keywords: ['playwright', 'website', 'clarity'] },
  { id: 'nav-blueprints', label: 'Open Blueprint Library', group: 'Navigate', href: '/admin/blueprints', keywords: ['magnifi', 'auto blueprint'] },
  { id: 'nav-protocol-center', label: 'Review Build Standards', group: 'Navigate', href: '/admin/protocol-center', keywords: ['protocols', 'versions', 'approval', 'ea factory'] },
  { id: 'nav-ea-factory', label: 'Build A Client Experience', group: 'Navigate', href: '/admin/ea-factory', keywords: ['factory', 'protocols', 'projects', 'skins'] },
  { id: 'nav-eacp-launches', label: 'Launch A Project', group: 'Create', href: '/admin/ea-factory/launches', keywords: ['launch', 'orchestration', 'command protocol', 'approval package'] },
  { id: 'nav-repo-library', label: 'Find Reusable Foundations', group: 'Navigate', href: '/admin/ea-factory/repo-library', keywords: ['repositories', 'ui libraries', 'components', 'scores'] },
  { id: 'nav-project-generator', label: 'Generate A Project Brief', group: 'Create', href: '/admin/ea-factory/project-generator', keywords: ['brief', 'codex prompt', 'new project'] },
  { id: 'nav-skin-factory', label: 'Design A Custom Page Skin', group: 'Create', href: '/admin/ea-factory/skin-factory', keywords: ['skin brief', 'creative direction', 'visual requirements', 'skin factory'] },
  { id: 'nav-skin-briefs', label: 'Review Saved Page Skins', group: 'Create', href: '/admin/ea-factory/skin-factory/briefs', keywords: ['skin briefs', 'approved skins'] },
  { id: 'nav-foundation-library', label: 'Open Reusable Assets', group: 'Navigate', href: '/admin/foundation-library', keywords: ['templates', 'prompts', 'automations'] },
  { id: 'nav-academy', label: 'Learn The Platform', group: 'Navigate', href: '/admin/academy', keywords: ['learn', 'onboarding', 'tour'] },
  { id: 'nav-graph', label: 'Explore Platform Memory', group: 'Navigate', href: '/admin/knowledge-graph', keywords: ['memory', 'graph', 'search'] },
  { id: 'nav-opportunity-graph', label: 'Explore Opportunity Graph', group: 'Navigate', href: '/admin/opportunity-graph', keywords: ['intent', 'opportunity', 'topology', 'action'] },
  { id: 'nav-twin', label: 'Check Platform Health', group: 'Navigate', href: '/admin/digital-twin', keywords: ['mirror', 'health', 'platform'] },
  { id: 'nav-marketplace', label: 'Find Partner Opportunities', group: 'Navigate', href: '/admin/partner-marketplace', keywords: ['partner', 'referral', 'cpr'] },
  { id: 'nav-voice', label: 'Ask EA Guide', group: 'Search', action: 'voice:open', keywords: ['voice', 'ask', 'speak'] },
  { id: 'nav-tour', label: 'Start Mission Control Tour', group: 'Search', action: 'tour:start', keywords: ['guided', 'help'] },
  { id: 'nav-portal', label: 'Open Client Portal Login', group: 'Navigate', href: '/portal/login' },
  { id: 'create-capture', label: 'Quick Capture', group: 'Capture', action: 'capture:quick', keywords: ['save', 'signal'] },
  { id: 'analyze-url', label: 'Capture And Analyze A URL', group: 'Capture', action: 'capture:analyze', keywords: ['scrape', 'website'] },
  { id: 'open-navigator', label: 'Choose What You Want To Do', group: 'Search', action: 'navigator:open', keywords: ['help', 'guide'] },
];
