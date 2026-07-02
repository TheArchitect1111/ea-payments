'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DemoPasswordLogin from '@/components/auth/DemoPasswordLogin';
import '../portal/login/portal-login.css';

type TestLink = {
  label: string;
  href: string;
  note: string;
};

function buildTestLinks(slug: string): TestLink[] {
  const portal = `/portal/${slug}`;
  return [
    { label: 'Simplifi Capture', href: '/simplifi/capture', note: 'Paste a URL or upload a photo' },
    { label: 'Simplifi Workspace', href: '/simplifi/workspace', note: 'Standalone workspace view' },
    { label: 'Portal Simplifi', href: `${portal}/simplifi`, note: 'Same tools inside the client portal' },
    { label: 'Pulse', href: `${portal}/pulse`, note: 'Health scores and operating signals' },
    { label: 'Amplifi Hub', href: `${portal}/amplifi`, note: 'Growth narrative and social links' },
    { label: 'Connect Kit', href: `${portal}/connect`, note: 'Download QRs and create event capture links' },
    { label: 'Connect Capture (public)', href: `/connect/${slug}`, note: 'Public scan-to-capture page — no login' },
    { label: 'Update Hub', href: `${portal}/updates`, note: 'Announcements and requests' },
    { label: 'Portal Home', href: portal, note: 'Full portal dashboard' },
    { label: 'Magnifi Story (no login)', href: '/story/selena', note: 'Public demo experience' },
  ];
}

const GUEST_LINKS: TestLink[] = [
  { label: 'Try capture without login', href: '/simplifi/capture', note: 'Guest mode — limited save' },
  { label: 'Magnifi story demo', href: '/story/selena', note: 'No account needed' },
];

type Props = {
  initialSlug: string | null;
  initialEmail: string | null;
};

export default function TryTestingHub({ initialSlug, initialEmail }: Props) {
  const router = useRouter();
  const signedIn = Boolean(initialSlug);
  const links = signedIn ? buildTestLinks(initialSlug!) : GUEST_LINKS;

  return (
    <main className="min-h-screen bg-[#1B2B4D] text-white px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C9A844]">Tester kit</p>
        <h1 className="mt-4 text-3xl font-black">Try every page — one login</h1>
        <p className="mt-3 text-neutral-300 leading-relaxed">
          Sign in once with the demo account below. Your session works on{' '}
          <strong className="text-white">every</strong> Simplifi and portal page — capture, workspace, Pulse,
          Amplifi, and more.
        </p>

        {signedIn ? (
          <section className="mt-8 border border-emerald-500/40 bg-emerald-950/30 p-5 rounded-lg">
            <p className="font-bold text-emerald-300">You&apos;re signed in</p>
            <p className="mt-1 text-sm text-neutral-300">
              Portal: <strong className="text-white">{initialSlug}</strong>
              {initialEmail ? (
                <>
                  {' '}
                  · {initialEmail}
                </>
              ) : null}
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Open any link below — you won&apos;t need to sign in again.
            </p>
          </section>
        ) : (
          <section className="mt-8 pl-page" style={{ minHeight: 'auto', padding: 0, background: 'transparent' }}>
            <div className="pl-shell" style={{ maxWidth: '100%' }}>
              <div className="pl-card">
                <DemoPasswordLogin
                  next="/try"
                  onSuccess={() => router.refresh()}
                />
              </div>
            </div>
          </section>
        )}

        <section className="mt-10 grid gap-3">
          <p className="text-sm font-bold text-[#C9A844]">
            {signedIn ? 'Pages to test (same session everywhere)' : 'No login yet — start here'}
          </p>
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block border border-white/15 p-5 rounded-lg hover:border-[#C9A844]/50 transition-colors"
            >
              <p className="font-bold text-[#C9A844]">{item.label}</p>
              <p className="text-sm text-neutral-400 mt-1">{item.note}</p>
            </Link>
          ))}
        </section>

        <section className="mt-10 border border-white/15 p-5 rounded-lg">
          <p className="text-sm font-bold text-[#C9A844]">Send to testers</p>
          <pre className="mt-3 text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">{`Open: https://ea-payments.vercel.app/try

1. Click "Sign in with demo account"
2. Open any page from the list — stay signed in everywhere
3. Use the gold orb (bottom-right) to jump between Capture, Workspace, Pulse, etc.
4. Connect: portal kit for QRs + public /connect/demo-client for capture testing`}</pre>
        </section>

        {!signedIn ? (
          <p className="mt-6 text-sm text-neutral-500">
            Already have your own account?{' '}
            <Link href="/simplifi/login?next=/try" className="text-[#C9A844] underline">
              Magic-link sign in
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  );
}
