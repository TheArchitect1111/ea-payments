import Link from 'next/link';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import './owner.css';
import './owner-queue.css';

const nav = [
 ['Dashboard','/portal/amanda-catherine/owner'],['Update Hub','/portal/amanda-catherine/owner/updates'],['Appointments / Jane','/portal/amanda-catherine/owner/appointments'],['Clients','/portal/amanda-catherine/owner/clients'],['AesthetiKine Academy','/portal/amanda-catherine/owner/academy'],['Practitioner Starter Kit','/portal/amanda-catherine/owner/practitioner-kit'],['LIFELINE','/portal/amanda-catherine/owner/lifeline'],['Empower Art Collective','/portal/amanda-catherine/owner/empower-art'],['Founder Advisory','/portal/amanda-catherine/owner/advisory'],['Founder Clarity','/portal/amanda-catherine/owner/clarity'],['Speaking & Media','/portal/amanda-catherine/owner/speaking'],['The Entrepreneurial Artist','/portal/amanda-catherine/owner/book'],['RIMAN Canada','/portal/amanda-catherine/owner/riman'],['Reviews & Testimonials','/portal/amanda-catherine/owner/reviews'],['Documents & Certifications','/portal/amanda-catherine/owner/documents'],['Marketing','/portal/amanda-catherine/owner/marketing'],['Business Insights','/portal/amanda-catherine/owner/insights'],['Eva (AI Assistant)','/portal/amanda-catherine/owner/eva'],['Settings','/portal/amanda-catherine/owner/settings']
] as const;
export default async function AmandaOwnerLayout({children}:{children:ReactNode}){const token=(await cookies()).get(EA_PORTAL_COOKIE)?.value;const session=token?await verifySession(token):null;if(!session||session.slug!=='amanda-catherine')redirect('/portal/login?next=%2Fportal%2Famanda-catherine%2Fowner');if(!roleAtLeast(normalizeRole(session.role),'staff'))redirect('/portal/amanda-catherine');return <div className="ac-owner-shell"><aside className="ac-sidebar"><div className="ac-brand"><span>AK</span><div><strong>AesthetiKine</strong><small>Studio Lab</small></div></div><nav>{nav.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</nav><div className="ac-owner-card"><div className="ac-avatar">AC</div><div><strong>Amanda Catherine</strong><small>Owner · Studio Director</small></div></div></aside><main className="ac-main">{children}</main></div>}
