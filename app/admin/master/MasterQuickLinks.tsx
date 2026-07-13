import { NAVY, GOLD } from '@/lib/design-system';

const LINKS = [
  { title: 'Pipeline Dashboard', href: '/admin/dashboard', eyebrow: 'Revenue' },
  { title: 'Proposals', href: '/admin/proposals', eyebrow: 'Sales' },
  { title: 'CTP Submissions', href: '/admin/ctp', eyebrow: 'Discovery' },
  { title: 'Creative Studio', href: '/admin/creative-studio', eyebrow: 'Communications' },
  { title: 'Content Requests', href: '/admin/content-requests', eyebrow: 'Delivery' },
  { title: 'Launch Command', href: '/launch', eyebrow: 'Readiness' },
  { title: 'Capability Marketplace', href: '/admin/capability-marketplace', eyebrow: 'Platform' },
  { title: 'Workspace Preview', href: '/admin/workspace-preview', eyebrow: 'Platform' },
  { title: 'Client Portal Login', href: '/portal/login', eyebrow: 'Clients' },
  { title: 'Demo Client Portal', href: '/portal/demo-client', eyebrow: 'Preview' },
];

export function MasterQuickLinks() {
  return (
    <section className="mt-10 border-t border-neutral-200 pt-8">
      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: GOLD }}>
        Operations shortcuts
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="bg-white border border-neutral-200 p-4 hover:border-neutral-400 transition"
          >
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              {link.eyebrow}
            </span>
            <span
              className="mt-1 block text-sm font-extrabold uppercase tracking-wide"
              style={{ color: NAVY }}
            >
              {link.title}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
