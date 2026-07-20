import Link from 'next/link';
import { Fraunces, Manrope } from 'next/font/google';
import './opportunity-review-experience.css';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const sans = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

type Props = {
  firstName: string;
  businessName: string;
  slug: string;
  reviewLabel?: string;
};

export default function OpportunityReviewConfirmed({
  firstName,
  businessName,
  slug,
  reviewLabel,
}: Props) {
  return (
    <main className={`ore ore-confirmed-page ${sans.className}`}>
      <div className="ore-grain" aria-hidden />

      <section className="ore-confirmed-shell" aria-labelledby="ore-confirmed-title">
        <div className="ore-confirmed-copy">
          <p className="ore-kicker">You&apos;re scheduled</p>
          <h1 id="ore-confirmed-title" className={`ore-headline ${display.className}`}>
            We look forward to speaking with you, {firstName}.
          </h1>
          <p className="ore-lede">
            A calendar invitation is on its way. We&apos;ll use our time together to explore
            what&apos;s possible for {businessName}.
          </p>
          {reviewLabel ? (
            <div className="ore-badge-row">
              <span className="ore-badge">Scheduled</span>
              <span className="ore-confirmed">
                Confirmed · <strong>{reviewLabel}</strong>
              </span>
            </div>
          ) : (
            <div className="ore-badge-row">
              <span className="ore-badge">Scheduled</span>
            </div>
          )}
          <div className="ore-hero-actions">
            <Link className="ore-cta" href={`/portal/${slug}/ctp/progress`}>
              Return to Your Project
            </Link>
            <Link className="ore-secondary" href={`/portal/${slug}/ctp/progress`}>
              Open Progress
            </Link>
          </div>
        </div>
        <div className="ore-confirmed-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/client-experience/journey-continues.png"
            alt="Captain at the helm — your journey continues with us"
            width={1200}
            height={900}
          />
        </div>
      </section>
    </main>
  );
}
