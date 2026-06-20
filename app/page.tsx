import Image from 'next/image';
import Link from 'next/link';

const CREAM = '#F8F6F2';
const INK = '#111827';

const impactMetrics = [
  { value: '10-20+', label: 'hours recovered each week', note: 'Time returned to owners and teams through better operating visibility.' },
  { value: '$25K-$150K+', label: 'capacity unlocked annually', note: 'Estimated opportunity value from reducing friction and leakage.' },
  { value: '3-7', label: 'systems clarified', note: 'Core workflows mapped, improved, and connected around the way the business runs.' },
];

const solveSteps = [
  {
    title: 'Find the friction',
    copy: 'We look at how work actually moves through your business so the hidden bottlenecks become visible.',
  },
  {
    title: 'Design the operating system',
    copy: 'We translate scattered tasks, handoffs, and communication into clear workflows your team can follow.',
  },
  {
    title: 'Build with accountability',
    copy: 'You get practical systems, dashboards, portals, and communication paths that support day-to-day execution.',
  },
];

const solutions = [
  {
    eyebrow: 'Operational MRI',
    title: 'See what is really slowing the business down.',
    copy: 'A focused diagnostic that identifies inefficiencies, process friction, communication gaps, and growth constraints before they become expensive.',
    bullets: ['Capacity analysis', 'Workflow visibility', 'Friction findings', 'Prioritized action plan'],
  },
  {
    eyebrow: 'Client Portal',
    title: 'Give clients one organized place to move forward.',
    copy: 'A premium portal experience for project milestones, updates, requests, documents, and next steps.',
    bullets: ['Secure client access', 'Milestone clarity', 'Update requests', 'Project visibility'],
  },
  {
    eyebrow: 'Event Management Portal',
    title: 'Coordinate complex events without scattered communication.',
    copy: 'Centralized event planning, registration, content updates, sponsor visibility, and operational tracking.',
    bullets: ['Event workflows', 'Content updates', 'Sponsor assets', 'Team coordination'],
  },
  {
    eyebrow: 'Communication Hub',
    title: 'Turn scattered messages into one clean command center.',
    copy: 'A structured communication layer that helps teams, clients, and leadership know what matters next.',
    bullets: ['Status updates', 'Request routing', 'Leadership visibility', 'Less follow-up'],
  },
];

const results = [
  'Owners regain visibility into what is happening across the business.',
  'Teams stop relying on memory, screenshots, and scattered follow-up.',
  'Clients get a more premium and predictable experience.',
  'Growth becomes easier because the operating foundation is clearer.',
];

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1B2B4D]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Efficiency Architects home">
          <Image src="/images/ea-logo.png" alt="Efficiency Architects" width={56} height={56} className="h-12 w-auto" priority />
          <div className="leading-none">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-[#C9A844]">Efficiency</div>
            <div className="text-sm font-black uppercase tracking-[0.2em] text-white">Architects</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 text-xs font-bold uppercase tracking-[0.2em] text-white/75 lg:flex">
          <a href="#process" className="hover:text-white">Process</a>
          <a href="#solutions" className="hover:text-white">Solutions</a>
          <a href="#results" className="hover:text-white">Results</a>
          <a href="#portal" className="hover:text-white">Portal</a>
        </nav>
        <Link
          href="/assessment"
          className="shrink-0 rounded-sm bg-[#C9A844] px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.18em] text-[#1B2B4D] transition hover:bg-[#D8B95A]"
        >
          Free MRI
        </Link>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#1B2B4D] text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A844] to-transparent" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <p className="mb-5 text-xs font-black uppercase tracking-[0.32em] text-[#C9A844]">Operational Architecture For Growing Businesses</p>
          <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Build the operating system your business has outgrown.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
            Efficiency Architects helps organizations reclaim time, reduce costs, unlock capacity, and fuel growth through systems design.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/assessment" className="rounded-sm bg-[#C9A844] px-6 py-4 text-center text-xs font-black uppercase tracking-[0.2em] text-[#1B2B4D] transition hover:bg-[#D8B95A]">
              Take The Free Operational MRI™
            </Link>
            <a href="#results" className="rounded-sm border border-white/25 px-6 py-4 text-center text-xs font-black uppercase tracking-[0.2em] text-white transition hover:border-white">
              View Sample Findings
            </a>
          </div>
        </div>
        <div className="rounded-sm border border-white/12 bg-white/[0.06] p-4 shadow-2xl shadow-black/20">
          <div className="rounded-sm bg-white p-5 text-[#111827] sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Operational MRI</p>
                <h2 className="mt-2 text-2xl font-black text-[#1B2B4D]">Visibility Snapshot</h2>
              </div>
              <span className="rounded-sm bg-[#F8F6F2] px-3 py-2 text-xs font-black text-[#1B2B4D]">Live</span>
            </div>
            <div className="mt-6 grid gap-4">
              {[
                ['Workflow friction', 'High', '78%'],
                ['Communication leakage', 'Medium', '52%'],
                ['Capacity opportunity', 'High', '84%'],
              ].map(([label, level, value]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold">{label}</span>
                    <span className="text-slate-500">{level}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#C9A844]" style={{ width: value }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-sm bg-[#1B2B4D] p-4 text-white">
                <div className="text-2xl font-black">14h</div>
                <div className="mt-1 text-xs text-white/70">weekly recovery</div>
              </div>
              <div className="rounded-sm bg-[#F8F6F2] p-4">
                <div className="text-2xl font-black text-[#1B2B4D]">$84K</div>
                <div className="mt-1 text-xs text-slate-500">capacity signal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowWeSolveIt() {
  return (
    <section id="process" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="How We Solve It"
          title="We do not start with tools. We start with how your business actually works."
          copy="Most operational problems are not people problems. They are visibility, process, and communication problems hiding inside daily work."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {solveSteps.map((step, index) => (
            <article key={step.title} className="border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-7 flex h-11 w-11 items-center justify-center bg-[#1B2B4D] text-sm font-black text-[#C9A844]">
                0{index + 1}
              </div>
              <h3 className="text-xl font-black text-[#1B2B4D]">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{step.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImpactMetrics() {
  return (
    <section className="bg-[#F8F6F2] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Impact Metrics"
          title="The goal is not more software. The goal is more usable capacity."
          copy="EA focuses on measurable operational outcomes: time recovered, cost reduced, friction removed, and growth capacity unlocked."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {impactMetrics.map((metric) => (
            <article key={metric.label} className="bg-white p-6 shadow-sm">
              <div className="text-4xl font-black tracking-tight text-[#1B2B4D] sm:text-5xl">{metric.value}</div>
              <h3 className="mt-3 text-base font-black uppercase tracking-[0.14em] text-[#C9A844]">{metric.label}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{metric.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClientResults() {
  return (
    <section id="results" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#C9A844]">Client Results</p>
          <h2 className="mt-4 text-3xl font-black leading-tight text-[#1B2B4D] sm:text-5xl">
            A clearer business creates a calmer business.
          </h2>
        </div>
        <div className="grid gap-3">
          {results.map((result) => (
            <div key={result} className="flex gap-4 border border-slate-200 bg-white p-5">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center bg-[#C9A844] text-xs font-black text-[#1B2B4D]">✓</span>
              <p className="text-base leading-7 text-slate-700">{result}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OperationalMriCta() {
  return (
    <section className="bg-[#F8F6F2] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl border-l-4 border-[#C9A844] bg-white p-7 shadow-sm sm:p-10 lg:p-12">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#C9A844]">Operational MRI™</p>
        <h2 className="mt-4 max-w-4xl text-3xl font-black leading-tight text-[#1B2B4D] sm:text-5xl">
          Ready To See What&apos;s Slowing Your Business Down?
        </h2>
        <p className="mt-5 text-xl font-semibold text-[#111827]">
          Most businesses don&apos;t have a people problem. They have a visibility problem.
        </p>
        <p className="mt-5 max-w-4xl text-base leading-8 text-slate-600">
          Our Operational MRI™ identifies hidden inefficiencies, process friction, communication breakdowns, and growth constraints that may be costing your business time, money, and capacity.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/assessment" className="rounded-sm bg-[#1B2B4D] px-6 py-4 text-center text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#22375F]">
            Take The Free Operational MRI™
          </Link>
          <a href="#results" className="rounded-sm border border-[#1B2B4D]/20 px-6 py-4 text-center text-xs font-black uppercase tracking-[0.2em] text-[#1B2B4D] transition hover:border-[#1B2B4D]">
            View Sample Findings
          </a>
        </div>
      </div>
    </section>
  );
}

function SolutionsSection() {
  return (
    <section id="solutions" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Solutions"
          title="Business transformation needs structure your team can actually use."
          copy="EA builds operating layers that make the business easier to see, manage, and grow."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {solutions.map((solution) => (
            <article key={solution.title} className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#C9A844]">{solution.eyebrow}</p>
              <h3 className="mt-4 text-2xl font-black leading-tight text-[#1B2B4D]">{solution.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{solution.copy}</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {solution.bullets.map((bullet) => (
                  <div key={bullet} className="bg-[#F8F6F2] px-4 py-3 text-sm font-bold text-[#1B2B4D]">
                    {bullet}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StorySection() {
  return (
    <section className="bg-[#1B2B4D] px-5 py-16 text-white sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#C9A844]">The Problem</p>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">Growth creates pressure when the operating system is unclear.</h2>
          <p className="mt-5 text-base leading-8 text-white/75">
            The business starts relying on the owner, the strongest team members, and constant communication just to keep things moving. That works until it does not.
          </p>
        </div>
        <div className="bg-white p-7 text-[#111827] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#C9A844]">The Solution</p>
          <h3 className="mt-4 text-2xl font-black text-[#1B2B4D]">Architect the way the business should run.</h3>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            EA turns invisible friction into a visible operating model, then builds the workflows, portals, dashboards, and communication paths that help the organization move with less drag.
          </p>
        </div>
      </div>
    </section>
  );
}

function PortalSection() {
  return (
    <section id="portal" className="bg-[#F8F6F2] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#C9A844]">Client Portal</p>
          <h2 className="mt-4 text-3xl font-black leading-tight text-[#1B2B4D] sm:text-5xl">
            A premium client experience after the decision is made.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            The EA portal keeps clients connected to milestones, requests, updates, documents, and the Content Command Center without making them chase information.
          </p>
        </div>
        <div className="bg-white p-5 shadow-sm sm:p-7">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Client Operating Hub</p>
            <h3 className="mt-2 text-2xl font-black text-[#1B2B4D]">Current Project Status</h3>
          </div>
          <div className="mt-5 grid gap-3">
            {['Assessment reviewed', 'Architecture mapped', 'Build in progress', 'Review and approval'].map((item, index) => (
              <div key={item} className="flex items-center justify-between bg-[#F8F6F2] px-4 py-3">
                <span className="text-sm font-bold text-[#1B2B4D]">{item}</span>
                <span className={`text-xs font-black ${index < 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {index < 2 ? 'Complete' : 'Next'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#C9A844]">Start With Visibility</p>
        <h2 className="mt-4 text-3xl font-black leading-tight text-[#1B2B4D] sm:text-5xl">
          Know what is costing you capacity before you invest in another fix.
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600">
          Take the free Operational MRI™ and get a clearer view of where time, money, and momentum may be leaking from the business.
        </p>
        <div className="mt-8">
          <Link href="/assessment" className="inline-flex rounded-sm bg-[#C9A844] px-7 py-4 text-center text-xs font-black uppercase tracking-[0.2em] text-[#1B2B4D] transition hover:bg-[#D8B95A]">
            Take The Free Operational MRI™
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[#C9A844]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black leading-tight text-[#1B2B4D] sm:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-slate-600">{copy}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main style={{ backgroundColor: CREAM, color: INK }}>
      <Header />
      <HeroSection />
      <HowWeSolveIt />
      <ImpactMetrics />
      <ClientResults />
      <OperationalMriCta />
      <SolutionsSection />
      <StorySection />
      <PortalSection />
      <FinalCta />
      <footer className="bg-[#1B2B4D] px-5 py-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/60 sm:px-8">
        <div className="mb-3 flex flex-wrap items-center justify-center gap-6 text-[10px]">
          <a href="/scorecard" className="hover:text-white">Visibility Scorecard</a>
          <a href="/portal/login" className="hover:text-white">Client Portal</a>
          <a href="/assessment" className="hover:text-white">Operational MRI</a>
        </div>
        Efficiency Architects · Operational Architecture For Growing Businesses
      </footer>
    </main>
  );
}
