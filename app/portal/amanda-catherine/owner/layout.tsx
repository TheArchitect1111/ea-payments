import {amandaCtaKey} from '@/lib/amanda-catherine/tracking';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { getAmandaHqTools } from '@/lib/amanda-catherine/hq-tools';
import { resolveAmandaAudience } from '@/lib/amanda-catherine/audience';
import './owner.css';
import './owner-queue.css';

const AMANDA_CLIENT_TEST_COOKIE = 'amanda_v2_client_test';
const AMANDA_CLIENT_TEST_TOKEN = 'acv2-9f3c7a61-2d84-4fe8-b615-71eacb396204';

const nav = [
 ['Dashboard','/portal/amanda-catherine/owner'],['Sales','/portal/amanda-catherine/owner/sales'],['Click Activity','/portal/amanda-catherine/hub'],['Payments','/portal/amanda-catherine/billing'],['$1 Test Enrollments','/portal/amanda-catherine/test-enrollments'],['Update Hub','/portal/amanda-catherine/owner/updates'],['Appointments / Jane','/portal/amanda-catherine/owner/appointments'],['Clients','/portal/amanda-catherine/owner/clients'],['AesthetiKine Academy','/portal/amanda-catherine/owner/academy'],['Practitioner Starter Kit','/portal/amanda-catherine/owner/practitioner-kit'],['LIFELINE','/portal/amanda-catherine/owner/lifeline'],['Empower Art Collective','/portal/amanda-catherine/owner/empower-art'],['Founder Advisory','/portal/amanda-catherine/owner/advisory'],['Founder Clarity','/portal/amanda-catherine/owner/clarity'],['Speaking & Media','/portal/amanda-catherine/owner/speaking'],['The Entrepreneurial Artist','/portal/amanda-catherine/owner/book'],['RIMAN Canada','/portal/amanda-catherine/owner/riman'],['Reviews & Testimonials','/portal/amanda-catherine/owner/reviews'],['Documents & Certifications','/portal/amanda-catherine/owner/documents'],['Marketing','/portal/amanda-catherine/owner/marketing'],['Business Insights','/portal/amanda-catherine/owner/insights'],['Eva (AI Assistant)','/portal/amanda-catherine/owner/eva'],['Settings','/portal/amanda-catherine/owner/settings']
] as const;
export default async function AmandaOwnerLayout({children}:{children:ReactNode}){const cookieStore=await cookies();const isClientTest=process.env.VERCEL_ENV==='preview'&&process.env.VERCEL_GIT_COMMIT_REF==='client-test/amanda-v2-20260919'&&cookieStore.get(AMANDA_CLIENT_TEST_COOKIE)?.value===AMANDA_CLIENT_TEST_TOKEN;const token=cookieStore.get(EA_PORTAL_COOKIE)?.value;const session=token?await verifySession(token):null;if(!isClientTest&&(!session||session.slug!=='amanda-catherine'))redirect('/portal/login?next=%2Fportal%2Famanda-catherine%2Fowner');const ownerAudience=session?await resolveAmandaAudience({portalSlug:'amanda-catherine',email:session.email||'',role:session.role}):'client';if(!isClientTest&&!roleAtLeast(normalizeRole(session?.role),'staff')&&ownerAudience!=='admin')redirect('/portal/amanda-catherine');const hqTools=await getAmandaHqTools();const canTest=Boolean(hqTools.testPayment && session && (roleAtLeast(normalizeRole(session.role),'admin')||ownerAudience==='admin'));return <div className="ac-owner-shell"><aside className="ac-sidebar"><div className="ac-brand"><span>AK</span><div><strong>AesthetiKine</strong><small>Studio Lab</small></div></div><nav>{nav.filter(([label])=>label!=='$1 Test Enrollments'||canTest).map(([label,href])=><Link data-cta-name={label} data-cta-key={amandaCtaKey(label)} key={href} href={href}>{label}</Link>)}</nav><div className="ac-owner-card"><div className="ac-avatar">AC</div><div><strong>Amanda Catherine</strong><small>Owner · Studio Director</small></div></div></aside><main className="ac-main">{children}</main></div>}
