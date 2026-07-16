import Link from 'next/link';
import { NAVY, GOLD, CREAM } from '@/lib/design-system';

const TEXT = '#111111';
const MUTED = '#5F6B7A';

const captureTypes = [
  'Prospects',
  'Introductions',
  'Articles',
  'Videos',
  'Ideas',
  'Partnerships',
  'Investments',
  'Follow-ups',
];

const steps = [
  ['Capture', 'Save an opportunity the moment you see it.'],
  ['Clarify', 'Simplifi identifies what matters and why.'],
  ['Prioritize', 'The strongest opportunities rise to the top.'],
  ['Act', 'You get the next move before momentum disappears.'],
];

export default function SimplifiLaunchPage() {
  return (
    <main className="min-h-screen" style={{ color: TEXT, backgroundColor: CREAM }}>
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-lg font-extrabold tracking-[0.3em]" style={{ color: NAVY }}>
            SIMPLIFI
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/simplifi/login?next=/simplifi/workspace" className="text-sm font-bold" style={{ color: NAVY }}>
              Sign in
            </Link>
            <a
              href="/checkout?package=simplifi_early_access"
              className="rounded-full px-5 py-3 text-sm font-bold"
              style={{ backgroundColor: NAVY, color: GOLD }}
            >
              Start Simplifi
            </a>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: GOLD }}>
              Personal Opportunity Intelligence
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-extrabold leading-[1.02] sm:text-7xl" style={{ color: NAVY }}>
              Never Lose An Opportunity Again
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8" style={{ color: MUTED }}>
              Open Today&apos;s Brief. Capture anything with one tap. Simplifi remembers what matters
              and tells you when it is time to act.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/simplifi/workspace"
                className="rounded-full px-7 py-4 text-sm font-bold"
                style={{ backgroundColor: NAVY, color: GOLD }}
              >
                Open Today&apos;s Brief
              </a>
              <a
                href="/simplifi/capture"
                className="rounded-full border px-7 py-4 text-sm font-bold"
                style={{ borderColor: `${NAVY}33`, color: NAVY }}
              >
                Quick Capture
              </a>
              <a
                href="/checkout?package=simplifi_early_access"
                className="rounded-full border px-7 py-4 text-sm font-bold"
                style={{ borderColor: `${NAVY}33`, color: NAVY }}
              >
                Start Simplifi
              </a>
            </div>
            <p className="mt-4 text-sm" style={{ color: MUTED }}>
              Early access: $149/year.
            </p>
          </div>

          <div className="relative min-h-[440px] overflow-hidden rounded-[2rem] p-6" style={{ backgroundColor: '#fff' }}>
            <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-2xl" style={{ borderColor: `${GOLD}55`, backgroundColor: CREAM }} />
            <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ borderColor: `${GOLD}88` }} />
            <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: NAVY }} />
            <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: GOLD }} />
            {captureTypes.slice(0, 6).map((item, index) => (
              <div
                key={item}
                className="absolute rounded-2xl bg-white px-4 py-3 text-sm font-bold shadow-lg"
                style={{
                  color: NAVY,
                  left: `${12 + (index % 3) * 28}%`,
                  top: `${14 + Math.floor(index / 3) * 58}%`,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t px-6 py-20" style={{ borderColor: `${NAVY}14`, backgroundColor: '#fff' }}>
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-extrabold" style={{ color: NAVY }}>
            Observe. Capture. Understand. Act.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {steps.map(([title, detail], index) => (
              <article key={title} className="rounded-3xl border p-6" style={{ borderColor: `${NAVY}14` }}>
                <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                  Step {index + 1}
                </p>
                <h3 className="mt-3 text-xl font-bold" style={{ color: NAVY }}>
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6" style={{ color: MUTED }}>
                  {detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
