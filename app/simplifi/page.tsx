import Link from 'next/link';

const BLUE = '#0A66FF';
const SOFT_BLUE = '#EAF2FF';
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
    <main className="min-h-screen bg-white" style={{ color: TEXT }}>
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-lg font-extrabold tracking-[0.3em]" style={{ color: BLUE }}>
            SIMPLIFI
          </Link>
          <a
            href="/checkout?package=simplifi_early_access"
            className="rounded-full px-5 py-3 text-sm font-bold text-white"
            style={{ backgroundColor: BLUE }}
          >
            Start Simplifi
          </a>
        </header>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: BLUE }}>
              The One-Tap System
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-extrabold leading-[1.02] sm:text-7xl">
              Never Lose An Opportunity Again
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8" style={{ color: MUTED }}>
              Capture anything with one tap. Simplifi identifies what matters, remembers it for
              you, and tells you when it is time to act.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/simplifi/capture"
                className="rounded-full px-7 py-4 text-sm font-bold text-white"
                style={{ backgroundColor: BLUE }}
              >
                Open Capture (mobile)
              </a>
              <a
                href="/checkout?package=simplifi_early_access"
                className="rounded-full border border-neutral-200 px-7 py-4 text-sm font-bold"
              >
                Start Simplifi
              </a>
              <a
                href="#how-it-works"
                className="rounded-full border border-neutral-200 px-7 py-4 text-sm font-bold"
              >
                See How It Works
              </a>
            </div>
            <p className="mt-4 text-sm" style={{ color: MUTED }}>
              Early access: $149/year.
            </p>
          </div>

          <div className="relative min-h-[440px] overflow-hidden rounded-[2rem] p-6" style={{ backgroundColor: SOFT_BLUE }}>
            <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200 bg-white shadow-2xl" />
            <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300" />
            <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: BLUE }} />
            <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            {captureTypes.slice(0, 6).map((item, index) => (
              <div
                key={item}
                className="absolute rounded-2xl bg-white px-4 py-3 text-sm font-bold shadow-lg"
                style={{
                  color: TEXT,
                  left: `${index % 2 === 0 ? 8 : 62}%`,
                  top: `${12 + index * 13}%`,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-extrabold leading-tight">
            Opportunities do not fail. They disappear.
          </h2>
          <p className="mt-5 text-lg leading-8" style={{ color: MUTED }}>
            Ideas, prospects, investments, articles, partnerships, and referrals are often
            forgotten before they are realized. Simplifi gives every opportunity a place to land.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {captureTypes.map((item) => (
            <div key={item} className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-5 h-10 w-10 rounded-full" style={{ backgroundColor: SOFT_BLUE }} />
              <p className="font-bold">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="max-w-3xl text-4xl font-extrabold leading-tight">
          One tap changes everything.
        </h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {steps.map(([title, body]) => (
            <div key={title} className="rounded-3xl p-6" style={{ backgroundColor: SOFT_BLUE }}>
              <p className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: BLUE }}>
                {title}
              </p>
              <p className="mt-4 text-sm leading-6" style={{ color: MUTED }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: BLUE }}>
          Simplifi Early Access
        </p>
        <h2 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">
          How much opportunity is sitting around you right now?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8" style={{ color: MUTED }}>
          The problem is rarely a lack of opportunity. The problem is seeing it, organizing it,
          and acting before it is gone.
        </p>
        <a
          href="/checkout?package=simplifi_early_access"
          className="mt-8 inline-block rounded-full px-8 py-4 text-sm font-bold text-white"
          style={{ backgroundColor: BLUE }}
        >
          Start Simplifi
        </a>
      </section>
    </main>
  );
}
