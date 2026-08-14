import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AmplifiBrand from './AmplifiBrand';
import './amplifi-site.css';
import './amplifi-assets.css';

export const metadata: Metadata = {
  title: 'Amplifi | Guided content support for busy teams',
  description: 'Amplifi guides small teams from the next useful idea to approved, published content without taking control away from them.',
};

const loop = [
  ['01', 'Notice', 'Start with what matters to your business right now.'],
  ['02', 'Shape', 'Turn the idea into a clear message in your voice.'],
  ['03', 'Review', 'Approve, edit, or reject before anything moves forward.'],
  ['04', 'Share', 'Choose when and where the message should appear.'],
  ['05', 'Learn', 'Use the response to guide what comes next.'],
] as const;

export default async function AmplifiMarketingPage({ searchParams }: { searchParams: Promise<{ url?: string; title?: string; capture?: string }> }) {
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
      <nav className="am-topbar">
        <AmplifiBrand />
        <div className="am-toplinks">
          <a href="#how-it-works">How it works</a>
          <Link href="/amplifi/pricing">Pricing</Link>
          <Link href="/portal/login?next=%2Famplifi%2Fworkspace">Sign in</Link>
        </div>
      </nav>

      <section className="am-hero-v2">
        <div className="am-hero-copy">
          <p className="am-kicker">YOUR CONTENT GUIDE</p>
          <h1>Stay present.<br /><em>Keep your time.</em></h1>
          <p className="am-hero-lead">Tell Amplifi what matters. It helps you find the next useful story, shape it in your voice, and move it forward one clear step at a time.</p>
          <div className="am-hero-actions">
            <a href="#how-it-works" className="am-primary">See the guided path <span>→</span></a>
            <Link href="/amplifi/pricing" className="am-text-link">Choose a starting point</Link>
          </div>
          <p className="am-proofline"><strong>You make the decisions.</strong> Amplifi prepares the next step and asks when your judgment is needed.</p>
        </div>
        <div className="am-hero-visual" aria-label="A business owner using Amplifi">
          <div className="am-product-float">
            <div className="am-product-bar"><span className="am-mini-mark">A</span><strong>Today in Amplifi</strong><span className="am-live-dot">Live</span></div>
            <p className="am-product-label">READY FOR YOUR REVIEW</p>
            <h3>3 posts built from one idea</h3>
            <div className="am-channel-row"><span>f</span><span>◎</span><span>in</span><b>Brand voice matched</b></div>
            <div className="am-product-actions"><span>Reject</span><span>Edit</span><strong>Approve</strong></div>
          </div>
        </div>
      </section>

      <section className="am-relief-band">
        <p>You do not need another tool to manage.</p>
        <h2>You need a clear next step and help carrying the work between decisions.</h2>
      </section>

      <section className="am-story-split">
        <div className="am-story-photo"><span>Monday, 8:04 AM</span></div>
        <div className="am-story-copy">
          <p className="am-kicker">WHEN CONTENT KEEPS SLIPPING</p>
          <h2>You are not short on ideas. You are short on uninterrupted time.</h2>
          <p>Bring a goal, an update, a link, or a question. Amplifi helps you decide what is worth sharing, then guides the work from there.</p>
          <blockquote>No blank page. No complicated setup. Just the next useful step.</blockquote>
        </div>
      </section>

      <section className="am-loop-v2" id="how-it-works">
        <div className="am-section-heading">
          <p className="am-kicker">A GUIDED PATH, BUILT IN</p>
          <h2>Keep the process moving without giving up the decisions.</h2>
        </div>
        <div className="am-loop-line">
          {loop.map(([number, title, body]) => <article key={title}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>

      <section className="am-outcome-stage">
        <div className="am-outcome-copy">
          <p className="am-kicker">WHAT AMPLIFI HELPS YOU DO</p>
          <h2>Build a communication rhythm you can actually sustain.</h2>
        </div>
        <div className="am-outcome-list">
          <p><strong>Choose the right story</strong><span>Start with the ideas and updates that matter most now.</span></p>
          <p><strong>Keep your voice</strong><span>Review language shaped around the way your organization speaks.</span></p>
          <p><strong>Set the boundaries</strong><span>Approve every step or let Amplifi carry only the work you choose.</span></p>
          <p><strong>Know what comes next</strong><span>Use what worked to guide the next useful message.</span></p>
        </div>
      </section>

      <section className="am-cta-stage">
        <AmplifiBrand light />
        <h2>Start with the level of guidance you need today.</h2>
        <Link href="/amplifi/pricing" className="am-primary am-primary-light">Compare the three paths <span>→</span></Link>
      </section>

      <footer className="am-footer-v2"><p>© {new Date().getFullYear()} Ascension Systems LLC</p><nav><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/contact">Contact</Link></nav></footer>
    </main>
  );
}
