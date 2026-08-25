import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import QuickQuoteForm from './QuickQuoteForm';

export const dynamic = 'force-dynamic';

export default async function QuickQuotePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    redirectToAdminLogin('/admin/quick-quote');
  }

  return (
    <main className="min-h-screen bg-[#F6F4EF] px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-xl">
        <header className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A37B13]">Efficiency Architects</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#17233B]">Quick Quote</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Build a client-ready quote from your phone. The client link flows into agreement acceptance and secure payment.
          </p>
        </header>
        <QuickQuoteForm />
      </div>
    </main>
  );
}
