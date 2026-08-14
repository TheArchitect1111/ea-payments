import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AmplifiBrand from './AmplifiBrand';
import './amplifi-site.css';
import './amplifi-assets.css';

export const metadata: Metadata = {
  title: 'Amplifi | Your digital content teammate',
  description: 'Amplifi helps small teams discover what matters, create on-brand content, approve it, publish it, and learn what worked.',
};

const loop = [
  ['01', 'Discover', 'Find the signal worth sharing.'],
  ['02', 'Create', 'Turn it into content that sounds like you.'],
  ['03', 'Approve', 'Accept, edit, or reject before anything goes live.'],
  ['04', 'Publish', 'Schedule once. Amplifi handles the follow-through.'],
  ['05', 'Learn', 'See what moved people and improve the next round.'],
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
          <p className="am-kicker">YOUR DIGITAL CONTENT TEAMMATE</p>
          <h1>Stay visible.<br /><em>Keep living.</em></h1>
          <p className="am-hero-lead">Amplifi watches what matters, helps shape the message, and keeps your content moving while you run the business.</p>
          <div className="am-hero-actions">
            <Link href="/amplifi/pricing" className="am-primary">Find your plan <span>→</span></Link>
            <Link href="/amplifi/workspace" className="am-text-link">Explore the workspace</Link>
          </div>
          <p className="am-proofline"><strong>You stay in control.</strong> Nothing publishes without the approval level you choose.</p>
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
        <p>Amplifi is not another blank tool asking you to do more.</p>
        <h2>It is the teammate that keeps the work from stopping when your day gets busy.</h2>
      </section>

      <section className="am-story-split">
        <div className="am-story-photo"><span>Monday, 8:04 AM</span></div>
        <div className="am-story-copy">
          <p className="am-kicker">THE OLD MONDAY</p>
          <h2>You know you need to post. You just do not have time to become a content department.</h2>
          <p>First comes the topic. Then research. Then the words, the image, the timing, the approvals, and the reporting. One post turns into a pile of decisions.</p>
          <blockquote>Amplifi turns that pile into one guided flow.</blockquote>
        </div>
      </section>

      <section className="am-loop-v2" id="how-it-works">
        <div className="am-section-heading">
          <p className="am-kicker">SMARTCHITECTURE™ INSIDE</p>
          <h2>One idea enters.<br />A complete content rhythm comes out.</h2>
        </div>
        <div className="am-loop-line">
          {loop.map(([number, title, body]) => <article key={title}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>

      <section className="am-outcome-stage">
        <div className="am-outcome-copy">
          <p className="am-kicker">WHAT CHANGES</p>
          <h2>Your message keeps moving, even when your day does not go as planned.</h2>
        </div>
        <div className="am-outcome-list">
          <p><strong>Know what to say</strong><span>Research and campaign guidance replace the blank page.</span></p>
          <p><strong>Sound like yourself</strong><span>Your brand voice guides every draft.</span></p>
          <p><strong>Stay in control</strong><span>Approve, edit, reject, or automate within your rules.</span></p>
          <p><strong>Learn what works</strong><span>Results shape the next message instead of disappearing in a report.</span></p>
        </div>
      </section>

      <section className="am-cta-stage">
        <AmplifiBrand light />
        <h2>Your audience should not forget you because your calendar got full.</h2>
        <Link href="/amplifi/pricing" className="am-primary am-primary-light">See all three plans <span>→</span></Link>
      </section>

      <footer className="am-footer-v2"><p>© {new Date().getFullYear()} Ascension Systems LLC</p><nav><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/contact">Contact</Link></nav></footer>
    </main>
  );
}
