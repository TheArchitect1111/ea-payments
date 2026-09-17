import Link from 'next/link';
import type { ReactNode } from 'react';
import './owner.css';

const nav = [
  ['Dashboard', '/portal/amanda-catherine/owner'],
  ['Update Hub', '/portal/amanda-catherine/owner/updates'],
  ['Appointments / Jane', '/portal/amanda-catherine/owner/appointments'],
  ['Clients', '/portal/amanda-catherine/owner/clients'],
  ['AesthetiKine Academy', '/portal/amanda-catherine/owner/academy'],
  ['LIFELINE', '/portal/amanda-catherine/owner/lifeline'],
  ['Documents & Certifications', '/portal/amanda-catherine/owner/documents'],
  ['Marketing', '/portal/amanda-catherine/owner/marketing'],
  ['Business Insights', '/portal/amanda-catherine/owner/insights'],
  ['Eva (AI Assistant)', '/portal/amanda-catherine/owner/eva'],
  ['Settings', '/portal/amanda-catherine/owner/settings'],
] as const;

export default function AmandaOwnerLayout({ children }: { children: ReactNode }) {
  return <div className="ac-owner-shell">
    <aside className="ac-sidebar">
      <div className="ac-brand"><span>AK</span><div><strong>AesthetiKine</strong><small>Studio Lab</small></div></div>
      <nav>{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      <div className="ac-owner-card"><div className="ac-avatar">AC</div><div><strong>Amanda Catherine</strong><small>Owner · Studio Director</small></div></div>
    </aside>
    <main className="ac-main">{children}</main>
  </div>;
}
