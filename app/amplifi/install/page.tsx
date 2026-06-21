import type { Metadata } from 'next';
import Link from 'next/link';
import { PRODUCT_NAMES, PUBLIC_LINKS } from '@/lib/marketing-urls';

export const metadata: Metadata = {
  title: 'Install Amplifi™ — Browser Button',
  description: 'Add Amplifi to Chrome, Safari, or your home screen.',
};

export default function AmplifiInstallPage() {
  const base = PUBLIC_LINKS.capture.replace(/\/capture$/, '');
  const bookmarklet = `javascript:(function(){window.open('${base}/amplifi/share?url='+encodeURIComponent(location.href),'_blank');})();`;

  return (
    <main className="min-h-screen bg-[#1B2B4D] text-white px-6 py-12">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C9A844]">Amplifi™</p>
        <h1 className="mt-4 text-3xl font-black">Install your Amplify button</h1>
        <p className="mt-4 text-neutral-300 leading-relaxed">
          Three ways to amplify any page in the real world — pick what fits your device.
        </p>

        <section className="mt-10 border border-white/15 p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#C9A844]">1. Phone — Add to Home Screen</h2>
          <p className="text-sm text-neutral-300">
            Opens Amplifi full-screen with a floating <strong>Amplify</strong> button. Uses your
            phone&apos;s native Share sheet to send Magnifi links.
          </p>
          <ol className="text-sm text-neutral-300 list-decimal pl-5 space-y-2">
            <li>
              Open{' '}
              <Link href="/amplifi/share" className="underline text-[#C9A844]">
                {PRODUCT_NAMES.amplifiShare}
              </Link>{' '}
              in Safari or Chrome
            </li>
            <li>Sign in with your portal credentials</li>
            <li>Tap Share → Add to Home Screen</li>
          </ol>
        </section>

        <section className="mt-6 border border-white/15 p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#C9A844]">2. Chrome — Extension + floating button</h2>
          <p className="text-sm text-neutral-300">
            Gold toolbar icon on every site, plus optional floating Amplify button bottom-right.
          </p>
          <ol className="text-sm text-neutral-300 list-decimal pl-5 space-y-2">
            <li>Open <code className="text-[#C9A844]">chrome://extensions</code></li>
            <li>Enable Developer mode → Load unpacked</li>
            <li>Select the <code className="text-[#C9A844]">extension/</code> folder in the ea-payments repo</li>
            <li>Extension options → API Base URL: {base}</li>
          </ol>
          <p className="text-xs text-neutral-400">
            Right-click any page → Amplifi this page. Or click the gold toolbar icon.
          </p>
        </section>

        <section className="mt-6 border border-white/15 p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#C9A844]">3. Safari / any browser — Bookmarklet</h2>
          <p className="text-sm text-neutral-300">
            Drag this link to your bookmarks bar, then click it on any page to amplify:
          </p>
          <a
            href={bookmarklet}
            className="inline-block rounded-full bg-[#C9A844] px-6 py-3 text-sm font-black text-[#1B2B4D]"
          >
            Amplifi This Page
          </a>
        </section>

        <p className="mt-10 text-sm text-neutral-400">
          Market links:{' '}
          <Link href="/amplify" className="underline">
            /amplify
          </Link>{' '}
          ·{' '}
          <Link href="/capture" className="underline">
            /capture
          </Link>{' '}
          ·{' '}
          <Link href="/story/selena" className="underline">
            /story/selena
          </Link>
        </p>
      </div>
    </main>
  );
}
