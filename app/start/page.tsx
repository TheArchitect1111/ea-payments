import Link from 'next/link';
import { PUBLIC_LINKS } from '@/lib/marketing-urls';

const testerMessage = `Efficiency Architects preview — try these:

Capture (Simplifi): ${PUBLIC_LINKS.capture}
Amplify & share: ${PUBLIC_LINKS.amplify}
Magnifi story (no login): ${PUBLIC_LINKS.storyDemo}

No password needed — tap Start on /capture or /amplify. Optional account: ${PUBLIC_LINKS.signIn}

Use ea-payments.vercel.app or www.efficiencyarchitects.online (same platform).`;

export default function StartPage() {
  return (
    <main className="min-h-screen bg-[#1B2B4D] text-white px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C9A844]">Friend test kit</p>
        <h1 className="mt-4 text-3xl font-black">Start here</h1>
        <p className="mt-3 text-neutral-300 leading-relaxed">
          Send this page to testers. Pipeline: <strong className="text-white">Simplifi captures → Magnifi opens automatically → Amplifi shares the link.</strong>
        </p>

        <section className="mt-6 border border-white/15 p-4 text-sm text-neutral-300">
          <p className="font-bold text-[#C9A844] mb-2">Browser buttons</p>
          <p>Chrome: load <code className="text-white">extension/</code> folder → toolbar icon + floating Capture & Amplify on every site.</p>
          <p className="mt-2">Guide: <Link href="/amplifi/install" className="underline text-[#C9A844]">/amplifi/install</Link></p>
        </section>

        <section className="mt-10 grid gap-4">
          {[
            { label: 'Capture — Simplifi', href: PUBLIC_LINKS.capture, note: 'Guest session — tap Capture now' },
            { label: 'Amplify — share a story', href: PUBLIC_LINKS.amplify, note: 'Guest session — tap Amplify' },
            { label: 'Magnifi story (no login)', href: PUBLIC_LINKS.storyDemo, note: 'Full demo experience' },
            { label: 'Connect browser extension', href: '/extension/connect', note: 'One-click Chrome/Firefox pairing' },
            { label: 'Install guide', href: PUBLIC_LINKS.installAmplifi, note: 'Bookmarklet, extension, home screen' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block border border-white/15 p-5 hover:border-[#C9A844]/50 transition-colors"
            >
              <p className="font-bold text-[#C9A844]">{item.label}</p>
              <p className="text-sm text-neutral-400 mt-1">{item.note}</p>
              <p className="text-xs text-neutral-500 mt-2 break-all">{item.href}</p>
            </a>
          ))}
        </section>

        <section className="mt-10 border border-white/15 p-5">
          <p className="text-sm font-bold text-[#C9A844]">Copy message for friends</p>
          <pre className="mt-3 text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">{testerMessage}</pre>
        </section>

        <section className="mt-8 text-sm text-neutral-400 space-y-2">
          <p>
            <strong className="text-white">Launch Command Center:</strong>{' '}
            <Link href="/launch" className="underline text-[#C9A844]">
              /launch
            </Link>
            {' · '}
            <Link href="/api/health/command-center" className="underline text-[#C9A844]">
              JSON
            </Link>
          </p>
          <p>
            <strong className="text-white">Health check:</strong>{' '}
            <Link href="/api/health/launch" className="underline text-[#C9A844]">
              /api/health/launch
            </Link>
          </p>
          <p>
            <strong className="text-white">DNS cutover guide:</strong> see{' '}
            <code className="text-[#C9A844]">docs/DNS-THREE-CLICKS.md</code> in the repo
          </p>
        </section>
      </div>
    </main>
  );
}
