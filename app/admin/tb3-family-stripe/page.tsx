import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { EA_ADMIN_COOKIE, parseAdminSession } from '@/lib/ea-admin-auth';
import FamilyStripeForm from './client';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'TB3 Family Stripe | EA Admin', robots: 'noindex, nofollow' };
export default async function Page() {
 if (process.env.VERCEL_ENV !== 'preview') notFound();
 const session = parseAdminSession((await cookies()).get(EA_ADMIN_COOKIE)?.value);
 if (!session || !['owner','admin'].includes(session.role.toLowerCase()) || session.email === 'admin') notFound();
 return <main className="min-h-screen bg-white px-5 py-12 text-black"><FamilyStripeForm /></main>;
}