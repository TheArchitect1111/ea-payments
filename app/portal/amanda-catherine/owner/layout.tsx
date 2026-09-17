import Link from 'next/link';
import type { ReactNode } from 'react';
import './owner.css';

const nav = [
  ['Home', '/portal/amanda-catherine/owner'],
  ['Appointments', '/portal/amanda-catherine/owner/appointments'],
  ['Clients', '/portal/amanda-catherine/owner/clients'],
  ['Academy', '/portal/amanda-catherine/owner/academy'],
  ['LIFELINE', '/portal/amanda-catherine/owner/lifeline'],
  ['Documents', '/portal/amanda-catherine/owner/documents'],
  ['Marketing', '/portal/amanda-catherine/owner/marketing'],
  ['Insights', '/portal/amanda-catherine/owner/insights'],
  ['Messages', '/portal/amanda-catherine/owner/messages'],
  ['Update Hub', '/portal/amanda-catherine/owner/updates'],
  ['Eva', '/portal/amanda-catherine/owner/eva'],
  ['Settings', '/portal/amanda-catherine/owner/settings'],
] as const;

export default function AmandaOwnerLayout({ children }: { children: ReactNode }) {
  return <div className="ac-owner-shell">
    <aside className="ac-sidebar">
      <div className="ac-brand"><span>AK</span><div><strong>AesthetiKine</strong><small>Studio Lab</small></div></div>
      <div className="ac-nav-label">OWNER PORTAL</div>
      <nav>{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      <div className="ac-sidebar-note"><span>ONE PORTAL</span><p>Studio, Academy, LIFELINE and business operations live here together.</p></div>
      <div className="ac-owner-card"><div className="ac-avatar">AC</div><div><strong>Amanda Catherine</strong><small>Owner · Studio Director</small></div></div>
    </aside>
    <main className="ac-main">{children}</main>
  </div>;
}
