import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import NewContentRequestForm from './NewContentRequestForm';

export const dynamic = 'force-dynamic';

export default async function NewContentRequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? verifySession(token) : null;
  if (!session) redirect('/portal/login');
  if (session.slug !== slug) redirect(`/portal/${session.slug}/updates/new`);

  return (
    <main className="min-h-screen bg-[#F8F6F2]">
      <header className="px-6 py-5 bg-[#1B2B4D]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <img src="/images/ea-logo.png" alt="Efficiency Architects" className="h-10 w-auto" />
          <a href={`/portal/${slug}/updates`} className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100 hover:text-white">Back To Dashboard</a>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-3xl font-black uppercase tracking-wide text-[#1B2B4D]">Submit Update Request</h1>
        <div className="mt-6">
          <NewContentRequestForm slug={slug} />
        </div>
      </div>
    </main>
  );
}
