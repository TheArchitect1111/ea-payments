import type { Metadata } from 'next';
import Link from 'next/link';
import { PRODUCT_NAMES, PUBLIC_LINKS } from '@/lib/marketing-urls';

export const metadata: Metadata = {
  title: 'Install Amplifi™ — Browser Button',
  description: 'Add Amplifi to Chrome, Firefox, Safari, or your home screen.',
};

export default function AmplifiInstallPage() {
  const base = PUBLIC_LINKS.capture.replace(/\/capture$/, '');
  const bookmarklet = `javascript:(function(){var u=location.href;var b='${base}';window.open(b+'/amplify?url='+encodeURIComponent(u),'_blank');})();`;

  return (
    <main className="min-h-screen bg-[#1B2B4D] text-white px-6 py-12">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C9A844]">Amplifi™</p>
        <h1 className="mt-4 text-3xl font-black">Install your Amplify button</h1>
        <p className="mt-4 text-neutral-300 leading-relaxed">
          Five ways to amplify any page — pick what fits your device and browser.
        </p>

        <section className="mt-10 border border-white/15 p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#C9A844]">1. Phone — Add to Home Screen</h2>
          <p className="text-sm text-neutral-300">
            Opens Amplifi full-screen with floating <strong>Amplify</strong> and <strong>camera</strong> buttons.
          </p>
          <ol className="text-sm text-neutral-300 list-decimal pl-5 space-y-2">
            <li>
              Open <Link href="/amplify" className="underline text-[#C9A844]">/amplify</Link> in Safari or Chrome
            </li>
            <li>Sign in with your portal credentials</li>
            <li>Share → Add to Home Screen</li>
          </ol>
        </section>

        <section className="mt-6 border border-white/15 p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#C9A844]">2. Chrome / Edge / Brave — Extension</h2>
          <p className="text-sm text-neutral-300">
            Screenshot capture, background analysis, and Chrome notifications — no new tab required.
          </p>
          <ol className="text-sm text-neutral-300 list-decimal pl-5 space-y-2">
            <li>Optional: run <code className="text-[#C9A844]">scripts\package-extension.bat</code></li>
            <li>Open <code className="text-[#C9A844]">chrome://extensions</code> → Developer mode → Load unpacked → <code className="text-[#C9A844]">extension/</code></li>
            <li>Options → API Base URL + <strong>EA_CAPTURE_API_KEY</strong></li>
          </ol>
        </section>

        <section className="mt-6 border border-white/15 p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#C9A844]">3. Firefox — Extension</h2>
          <p className="text-sm text-neutral-300">Same extension folder — temporary add-on for Firefox 109+.</p>
          <ol className="text-sm text-neutral-300 list-decimal pl-5 space-y-2">
            <li>Open <code className="text-[#C9A844]">about:debugging#/runtime/this-firefox</code></li>
            <li>Load Temporary Add-on → <code className="text-[#C9A844]">extension/manifest.json</code></li>
            <li>Configure options same as Chrome</li>
          </ol>
        </section>

        <section className="mt-6 border border-white/15 p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#C9A844]">4. Any browser — Bookmarklet</h2>
          <p className="text-sm text-neutral-300">
            Opens <code className="text-[#C9A844]">/amplify?url=…</code> — full async URL capture after sign-in.
          </p>
          <a
            href={bookmarklet}
            className="inline-block rounded-full bg-[#C9A844] px-6 py-3 text-sm font-black text-[#1B2B4D]"
          >
            Amplifi This Page
          </a>
        </section>

        <section className="mt-6 border border-white/15 p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#C9A844]">5. Safari / iPhone — Screenshot upload</h2>
          <p className="text-sm text-neutral-300">
            No extension on iOS. Use the <strong>camera FAB</strong> on <Link href="/amplify" className="underline text-[#C9A844]">/amplify</Link> to
            upload a screenshot — server-side vision analysis builds Magnifi.
          </p>
        </section>

        <p className="mt-10 text-sm text-neutral-400">
          <Link href="/amplify" className="underline">/amplify</Link> · <Link href="/capture" className="underline">/capture</Link> ·{' '}
          <Link href="/story/selena" className="underline">/story/selena</Link>
        </p>
      </div>
    </main>
  );
}
