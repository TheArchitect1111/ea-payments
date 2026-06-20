import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unsubscribe · Efficiency Architects',
  description: 'Manage email preferences for Efficiency Architects updates.',
};

const supportEmail = process.env.SUPPORT_EMAIL ?? 'freedom@efficiencyarchitects.online';

export default function UnsubscribePage() {
  const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent('Unsubscribe request')}&body=${encodeURIComponent(
    'Please remove me from Efficiency Architects marketing emails.\n\nEmail address:',
  )}`;

  return (
    <main className="min-h-screen bg-[#F8F6F2] text-[#111827]">
      <header className="border-b border-[#1B2B4D]/10 bg-[#1B2B4D] px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A844]">
            Efficiency Architects
          </Link>
          <Link href="/assessment" className="text-xs font-bold uppercase tracking-[0.14em] text-white/80 hover:text-white">
            Assessment →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#C9A844]">Email preferences</p>
        <h1 className="mt-4 text-4xl font-black text-[#1B2B4D]">Unsubscribe</h1>
        <p className="mt-5 text-base leading-8 text-slate-600">
          We respect your inbox. To stop receiving marketing and nurture emails from Efficiency Architects, send us a
          quick note and we will remove you within two business days.
        </p>
        <p className="mt-4 text-base leading-8 text-slate-600">
          Transactional messages about an active assessment, proposal, or client portal account may still be sent while
          those services are in progress.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href={mailto}
            className="inline-flex rounded-sm bg-[#C9A844] px-6 py-4 text-center text-xs font-black uppercase tracking-[0.18em] text-[#1B2B4D]"
          >
            Email unsubscribe request
          </a>
          <Link
            href="/"
            className="inline-flex rounded-sm border border-[#1B2B4D]/20 px-6 py-4 text-center text-xs font-black uppercase tracking-[0.18em] text-[#1B2B4D]"
          >
            Back to home
          </Link>
        </div>
        <p className="mt-8 text-sm text-slate-500">
          Or write directly to{' '}
          <a href={`mailto:${supportEmail}`} className="font-semibold text-[#1B2B4D] underline">
            {supportEmail}
          </a>
          .
        </p>
      </div>
    </main>
  );
}
