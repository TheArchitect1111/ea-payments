import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import './amplifi-site.css';

export const metadata: Metadata = {
  title: 'Amplifi\u2122 \u2014 Keep your message moving',
  description:
    'Amplifi helps small teams move from idea to research, content, review, publishing, and learning without restarting every week.',
};

const loop = [
  ['Discover', 'Notice what changed and what your audience actually needs right now.'],
  ['Understand', 'Check whether it matters for your business before spending energy on it.'],
  ['Create', 'Turn the signal into channel-ready posts, emails, and supporting content.'],
  ['Review', 'Accept, edit, or reject with clear controls.'],
  ['Publish', 'Schedule by channel and timezone, then publish with provider confirmation.'],
  ['Learn', 'Use real response data to improve the next round.'],
] as const;

const smartchitecture = [
  'Campaign Architect turns one objective into audience, messaging direction, channel plan, cadence, and success signals.',
  'Smart Research grounds factual claims in source-backed evidence with provenance.',
  'Verification Gate checks factual grounding, safety, duplicates, CTA integrity, and media rights before publish.',
  'Approval + Autopilot keeps humans in control while allowing low-friction automation inside approved rules.',
  'Exception Queue isolates edge cases so routine work keeps moving.',
  'Learning Engine captures outcomes and improves hooks, formats, timing, and CTA choices over time.',
];

export default async function AmplifiMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; title?: string; capture?: string }>;
}) {
  const params = await searchParams;
  if (params.url || params.title || params.capture) {
    const query = new URLSearchParams();
    if (params.url) query.set('url', params.url);
    if (params.title) query.set('title', params.title);
    if (params.capture) query.set('capture', params.capture);
    redirect(`/amplifi/workspace${query.toString() ? `?${query.toString()}` : ''}`);
  }

  return (
    <main className="am-site">
      <section className="am-hero">
        <p className="am-kicker">AMPLIFI</p>
        <h1>Your business has something worth saying. Amplifi helps make sure people hear it.</h1>
        <p>
          Running a business leaves little time to decide what to post, what matters, when to publish, and whether
          anything worked. Amplifi keeps that work moving.
        </p>
        <div className="am-hero-actions">
          <Link href="/amplifi/pricing" className="am-primary">
            START FOR $29 A MONTH
          </Link>
          <Link href="/amplifi/workspace" className="am-secondary">
            See Amplifi in action
          </Link>
          <Link href="/portal/login?next=%2Famplifi%2Fworkspace" className="am-secondary">
            Sign in to your workspace
          </Link>
        </div>
      </section>

      <section className="am-section">
        <h2>The real problem</h2>
        <p>
          Monday you plan to post. Customers call. Meetings happen. Something breaks. Thursday arrives. Nothing went
          out.
        </p>
        <ul>
          <li>What should I talk about?</li>
          <li>Is this worth posting?</li>
          <li>What should it look like?</li>
          <li>When should it go out?</li>
          <li>Did anybody care?</li>
        </ul>
        <p>Amplifi exists to carry that workload with you.</p>
      </section>

      <section className="am-section am-loop">
        <h2>The Amplifi Loop</h2>
        <p className="am-loop-tag">You do not restart the process every Monday.</p>
        <div className="am-loop-grid">
          {loop.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="am-section">
        <h2>One realistic story</h2>
        <ol>
          <li>Amplifi notices an important development in a watched subject.</li>
          <li>Smart Research checks whether that update matters to this audience.</li>
          <li>Amplifi develops an angle and prepares platform-specific versions.</li>
          <li>The customer chooses Accept, Edit, or Reject.</li>
          <li>Accepted content is scheduled and published through confirmed providers.</li>
          <li>Results come back, and Amplifi uses them to improve the next round.</li>
        </ol>
      </section>

      <section className="am-section">
        <h2>Tell Amplifi what matters. It can keep watching.</h2>
        <p>
          Choose <strong>Search once</strong> for a single research sprint or <strong>Keep watching</strong> for
          ongoing monitoring at a cadence you control.
        </p>
        <p>
          The value is not more information. The value is identifying something worth acting on, with source history
          preserved and repeat noise filtered out.
        </p>
      </section>

      <section className="am-section am-smart">
        <p className="am-kicker">SMARTCHITECTURE&#x2122;</p>
        <h2>The operating system behind Amplifi</h2>
        <p>
          Smartchitecture is the production loop that keeps momentum without turning your brand into generic automated
          noise.
        </p>
        <ul>
          {smartchitecture.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="am-section am-start">
        <p className="am-kicker">AMPLIFI SOCIAL</p>
        <h2>One practical starting point. $29 a month.</h2>
        <p>Shape the message, review it, schedule it, publish it, and see what happened without rebuilding the process every week.</p>
        <Link href="/amplifi/pricing" className="am-primary">See what is included</Link>
      </section>

      <footer className="am-footer">
        <div className="am-footer-inner">
          <p className="am-footer-brand">Amplifi&#x2122; by Efficiency Architects</p>
          <p className="am-footer-legal">
            &copy; {new Date().getFullYear()} Ascension Systems LLC. All rights reserved.
          </p>
          <nav className="am-footer-links">
            <Link href="/legal/privacy">Privacy Policy</Link>
            <Link href="/legal/terms">Terms of Service</Link>
            <Link href="/legal/cookies">Cookie Policy</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
