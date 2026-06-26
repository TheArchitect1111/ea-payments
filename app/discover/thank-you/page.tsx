import Link from 'next/link';

const BLACK = '#030303';
const CHARCOAL = '#111111';
const PANEL = '#171717';
const GOLD = '#D8AD3D';
const GOLD_BRIGHT = '#F6D66B';
const SUPPORT_EMAIL = 'freedom@efficiencyarchitects.online';

export default async function DiscoverThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ proposal?: string; received?: string }>;
}) {
  const { proposal, received } = await searchParams;
  const proposalUrl = proposal ? `/proposal/${encodeURIComponent(proposal)}` : null;
  const receivedOnly = received === '1';

  return (
    <main
      className="min-h-screen text-white"
      style={{
        background:
          'radial-gradient(circle at 20% 8%, rgba(216,173,61,0.2), transparent 30%), radial-gradient(circle at 92% 22%, rgba(246,214,107,0.12), transparent 26%), #030303',
      }}
    >
      <section className="relative overflow-hidden border-b border-[#D8AD3D]/20 text-white">
        <div className="pointer-events-none absolute right-12 top-20 h-40 w-40 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(216,173,61,0.22)' }} />
        <div className="mx-auto grid min-h-[62vh] max-w-6xl content-between px-6 py-8">
          <div className="flex items-center justify-between gap-6">
            <img src="/images/ea-logo-premium.png" alt="Efficiency Architects" className="h-24 w-auto rounded-md object-contain" />
            <p className="hidden text-xs font-black uppercase tracking-[0.24em] text-white/60 sm:block">
              Discover The Possibilities™
            </p>
          </div>

          <div className="max-w-4xl pb-12">
            <p className="text-xs font-black uppercase tracking-[0.32em]" style={{ color: GOLD }}>
              Reclaim Time. Reduce Costs. Maximize Output. Fuel Growth.
            </p>
            <h1 className="mt-5 text-5xl font-black leading-[1.02] sm:text-7xl" style={{ color: GOLD }}>
              Thank you. You opened the door.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-white/82">
              {receivedOnly
                ? 'Your selections are saved. We will review what you shared and send the next step within 1-2 business days.'
                : 'Your selections give us a strong starting point for recommending what to create first and why it matters.'}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-[#D8AD3D]/20 p-7 shadow-2xl" style={{ backgroundColor: PANEL }}>
            <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD_BRIGHT }}>
              What happens next
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">
              We will turn your answers into practical next steps.
            </h2>
            <div className="mt-6 grid gap-4 text-sm font-semibold leading-7 text-white/72 sm:grid-cols-3">
              <p className="border-l-4 pl-4" style={{ borderColor: GOLD }}>
                A clear picture of your organization, audience, goals, and existing assets.
              </p>
              <p className="border-l-4 pl-4" style={{ borderColor: GOLD }}>
                Recommended pages, profiles, portals, automation, training, or communication ideas.
              </p>
              <p className="border-l-4 pl-4" style={{ borderColor: GOLD }}>
                A practical first step so the work begins with confidence.
              </p>
            </div>
          </article>

          <aside className="rounded-3xl border border-[#D8AD3D]/25 p-7 text-white shadow-2xl" style={{ backgroundColor: CHARCOAL }}>
            <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
              Ready when you are
            </p>
            <p className="mt-4 text-sm leading-7 text-white/78">
              You have already taken the first step by naming what you want to make possible. We are honored to help you shape what comes next.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {proposalUrl ? (
                <Link
                  href={proposalUrl}
                  className="inline-flex items-center justify-center rounded-full px-6 py-4 text-xs font-black uppercase tracking-[0.18em]"
                  style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`, color: BLACK }}
                >
                  View My Blueprint
                </Link>
              ) : null}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
              >
                Contact Our Team
              </a>
            </div>
          </aside>
        </div>

        <div className="mt-10 rounded-3xl border border-[#D8AD3D]/25 p-8 text-center shadow-[0_0_50px_rgba(216,173,61,0.14)]" style={{ backgroundColor: PANEL }}>
          <p className="text-sm font-bold leading-7 text-white/65">
            Keep imagining what your organization can become with the right experience supporting it.
          </p>
          <h2 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] sm:text-6xl" style={{ color: GOLD }}>
            Consider the Possibilities!
          </h2>
        </div>
      </section>
    </main>
  );
}
