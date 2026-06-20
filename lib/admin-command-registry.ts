export type CommandItem = {
  id: string;
  label: string;
  group: 'Navigate' | 'Create' | 'Search' | 'Capture';
  href?: string;
  action?: 'capture:quick' | 'navigator:open';
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
  { id: 'nav-portal', label: 'Client Portal Login', group: 'Navigate', href: '/portal/login' },
  { id: 'create-capture', label: 'Quick Capture', group: 'Capture', action: 'capture:quick', keywords: ['save', 'signal'] },
  { id: 'open-navigator', label: 'EA Navigator — What are you trying to do?', group: 'Search', action: 'navigator:open', keywords: ['help', 'guide'] },
];
