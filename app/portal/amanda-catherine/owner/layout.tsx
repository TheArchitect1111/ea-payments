import {amandaCtaKey} from '@/lib/amanda-catherine/tracking';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { getAmandaHqTools } from '@/lib/amanda-catherine/hq-tools';
import ownerNav from '@/knowledge/eva-menu-sources/amanda-owner.json';
import './owner.css';
import './owner-queue.css';

const AMANDA_CLIENT_TEST_COOKIE = 'amanda_v2_client_test';
const AMANDA_CLIENT_TEST_TOKEN = 'acv2-9f3c7a61-2d84-4fe8-b615-71eacb396204';

const nav = ownerNav.items.map(({ label, href }) => [label, href] as const);
export default async function AmandaOwnerLayout({children}:{children:ReactNode}){const cookieStore=await cookies();const isClientTest=process.env.VERCEL_ENV==='preview'&&process.env.VERCEL_GIT_COMMIT_REF==='client-test/amanda-v2-20260919'&&cookieStore.get(AMANDA_CLIENT_TEST_COOKIE)?.value===AMANDA_CLIENT_TEST_TOKEN;const token=cookieStore.get(EA_PORTAL_COOKIE)?.value;const session=token?await verifySession(token):null;if(!isClientTest&&(!session||session.slug!=='amanda-catherine'))redirect('/portal/login?next=%2Fportal%2Famanda-catherine%2Fowner');if(!isClientTest&&!roleAtLeast(normalizeRole(session?.role),'staff'))redirect('/portal/amanda-catherine');const hqTools=await getAmandaHqTools();const canTest=Boolean(hqTools.testPayment && session && roleAtLeast(normalizeRole(session.role),'admin'));return <div className="ac-owner-shell"><aside className="ac-sidebar"><div className="ac-brand"><span>AK</span><div><strong>AesthetiKine</strong><small>Studio Lab</small></div></div><nav>{nav.filter(([label])=>label!=='$1 Test Enrollments'||canTest).map(([label,href])=><Link data-cta-name={label} data-cta-key={amandaCtaKey(label)} key={href} href={href}>{label}</Link>)}</nav><div className="ac-owner-card"><div className="ac-avatar">AC</div><div><strong>Amanda Catherine</strong><small>Owner · Studio Director</small></div></div></aside><main className="ac-main">{children}</main></div>}
