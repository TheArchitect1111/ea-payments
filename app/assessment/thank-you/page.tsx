import { eaPulseTheme } from '@ea/premium-chassis/theme';

const NAVY = eaPulseTheme.colors.navy;
const GOLD = eaPulseTheme.colors.gold;
const CREAM = eaPulseTheme.colors.creamAlt;
const SUPPORT_EMAIL = 'freedom@efficiencyarchitects.online';

const steps = [
  {
    icon: 'clock',
    title: 'We are turning your answers into an organization profile and first blueprint.',
  },
  {
    icon: 'email',
    title: 'You will receive next steps with the clearest opportunities we found.',
  },
  {
    icon: 'handshake',
    title: 'When you are ready, we will walk through the recommended experience and roadmap together.',
  },
];

function StepIcon({ type }: { type: string }) {
  if (type === 'email') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
        <path fill="currentColor" d="M3 5h18v14H3V5Zm9 8.2L5.8 7H5v10h14V7h-.8L12 13.2ZM12 11l4-4H8l4 4Z" />
      </svg>
    );
  }
  if (type === 'handshake') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
        <path fill="currentColor" d="M8.8 12.3 6.5 10 3 13.5l4.7 4.7a3 3 0 0 0 4.2 0l.6-.6.6.6a2.2 2.2 0 0 0 3.1 0l4.8-4.8-3.5-3.5-2.2 2.2-2.1-2.1a3.1 3.1 0 0 0-4.4 0Zm1.4 1.4a1.1 1.1 0 0 1 1.6 0l2.8 2.8.2.2a.2.2 0 0 1-.3.3l-3.8-3.8-1.4 1.4 1.7 1.7-.5.5a1 1 0 0 1-1.4 0l-3.3-3.3.7-.7 2.3 2.3 1.4-1.4Z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 10.6 3.2 1.9-1 1.7-4.2-2.5V6h2v6.6Z" />
    </svg>
  );
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ proposal?: string; received?: string }>;
}) {
  const { proposal, received } = await searchParams;
  const proposalUrl = proposal ? `/proposal/${encodeURIComponent(proposal)}` : null;
  const receivedOnly = received === '1';

  return (
    <main className="min-h-screen" style={{ backgroundColor: CREAM }}>
      <section className="px-6 py-8 text-white" style={{ backgroundColor: NAVY }}>
        <div className="mx-auto max-w-4xl">
          <img src="/images/ea-logo.png" alt="Efficiency Architects" className="h-20 w-auto" />
          <div className="pb-12 pt-10">
            <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
              Discover The Possibilities™
            </p>
            <h1 className="mt-4 text-4xl font-black uppercase tracking-wide sm:text-5xl" style={{ color: GOLD }}>
              Your Blueprint Is Starting.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-blue-50">
              {receivedOnly
                ? 'We received your responses. Our team will email you within 1–2 business days with next steps.'
                : 'Here is what happens next.'}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="border border-neutral-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center" style={{ backgroundColor: GOLD, color: NAVY }}>
                <StepIcon type={step.icon} />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
                Step {index + 1}
              </p>
              <p className="mt-2 text-base font-semibold leading-7" style={{ color: NAVY }}>
                {step.title}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {proposalUrl && (
            <a
              href={proposalUrl}
              className="inline-flex items-center justify-center px-8 py-4 text-xs font-black uppercase tracking-[0.22em]"
              style={{ backgroundColor: NAVY, color: GOLD }}
            >
              View My Blueprint
            </a>
          )}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center justify-center px-8 py-4 text-xs font-black uppercase tracking-[0.22em]"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            Contact Our Team
          </a>
        </div>
      </section>
    </main>
  );
}
