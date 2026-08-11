import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import './amplifi-site.css';

export const metadata: Metadata = {
  title: 'Amplifi™ — Stay present without living on social media',
  description:
    'Amplifi helps small businesses keep their message moving through research, content, review, publishing, and learning.',
};

const loop = [
  ['01', 'Discover', 'Amplifi helps you research the subjects and signals that matter to your business.'],
  ['02', 'Understand', 'It separates useful opportunities from noise and connects them to your audience.'],
  ['03', 'Create', 'It turns those opportunities into content that sounds and feels like your business.'],
  ['04', 'Review', 'Accept it, edit it, or reject it. You decide how involved you want to be.'],
  ['05', 'Publish', 'Approved content moves toward the right channels at the right time.'],
  ['06', 'Learn', 'Real response data can help shape what Amplifi does next.'],
] as const;

const productViews = [
  ['Campaigns', 'See what is running, what is ready, and what needs your attention.'],
  ['Smart Research', 'Research the subjects that matter and keep the useful sources with the work.'],
  ['Content Studio', 'Review and refine what Amplifi creates before it moves.'],
  ['Calendar', 'Know what is planned to go out, where, and when.'],
  ['Results', 'See what people responded to and what deserves another look.'],
] as const;

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
      <header className="am-topbar">
        <Link href="/amplifi" className="am-wordmark">Amplifi™</Link>
        <nav className="am-topnav" aria-label="Amplifi navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#smart-research">Smart Research</a>
          <a href="#smartchitecture">Smartchitecture™</a>
          <a href="#plans">Plans</a>
          <Link href="/portal/login?next=%2Famplifi%2Fworkspace">Sign in</Link>
        </nav>
      </header>

      <section className="am-hero">
        <div className="am-hero-copy">
          <p className="am-kicker">AMPLIFI BY EFFICIENCY ARCHITECTS</p>
          <h1>Your business has something worth saying. Amplifi helps make sure people hear it.</h1>
          <p className="am-lede">
            Running a business leaves very little time to figure out what to post, what people care about, when to
            publish it, or whether any of it worked. Amplifi keeps that work moving.
          </p>
          <div className="am-hero-actions">
            <Link href="/amplifi/workspace" className="am-primary">See Amplifi in action</Link>
            <a href="#how-it-works" className="am-secondary">See how it works</a>
          </div>
        </div>
        <div className="am-hero-note">
          <span>Built for people with actual work to do.</span>
          <strong>Stay visible without making social media another full-time job.</strong>
        </div>
      </section>

      <section className="am-section am-problem">
        <p className="am-kicker">THE WEEK GETS BUSY</p>
        <h2>You should not have to become a content creator just to run your business.</h2>
        <div className="am-problem-story">
          <p>Monday, you plan to post.</p>
          <p>Customers call. A meeting runs long. Something needs fixing.</p>
          <p>Thursday arrives. Nothing went out.</p>
        </div>
        <div className="am-question-grid">
          <span>What should I talk about?</span>
          <span>Is this worth posting?</span>
          <span>What should it look like?</span>
          <span>When should it go out?</span>
          <span>Did anybody care?</span>
        </div>
        <p className="am-emphasis">Amplifi was built to carry that load with you.</p>
      </section>

      <section className="am-section am-loop" id="how-it-works">
        <p className="am-kicker">THE AMPLIFI LOOP</p>
        <h2>You do not restart the process every Monday.</h2>
        <div className="am-loop-grid">
          {loop.map(([number, title, body]) => (
            <article key={title}>
              <span className="am-step">{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <p className="am-repeat">Discover → Understand → Create → Review → Publish → Learn → Repeat.</p>
      </section>

      <section className="am-section am-story">
        <div className="am-story-copy">
          <p className="am-kicker">ONE DISCOVERY. ONE USEFUL NEXT MOVE.</p>
          <h2>Here is what Amplifi looks like in real life.</h2>
          <p>
            Amplifi finds something worth exploring in your industry. Smart Research checks whether it matters to your
            audience. Amplifi develops an angle that fits your business, prepares the content and supporting creative,
            and brings the finished work back to you.
          </p>
        </div>
        <div className="am-story-flow">
          <div><span>1</span><strong>A useful development is found</strong></div>
          <div><span>2</span><strong>Amplifi checks why it matters</strong></div>
          <div><span>3</span><strong>Your content is prepared</strong></div>
          <div className="am-review-demo"><span>4</span><strong>Accept · Edit · Reject</strong></div>
          <div><span>5</span><strong>Approved content is scheduled</strong></div>
          <div><span>6</span><strong>Results help shape what comes next</strong></div>
        </div>
      </section>

      <section className="am-section am-research" id="smart-research">
        <p className="am-kicker">SMART RESEARCH</p>
        <h2>Tell Amplifi what matters. Start with a focused search.</h2>
        <p>
          Choose the subjects that matter to your business and run focused research when you need it. Amplifi keeps
          sources with the work so useful discoveries can become content without losing where they came from.
        </p>
        <div className="am-research-modes">
          <article><span>SEARCH ONCE · AVAILABLE</span><h3>Need an answer now?</h3><p>Run a focused research sprint around a topic or opportunity.</p></article>
          <article><span>KEEP WATCHING · COMING NEXT</span><h3>Want Amplifi to stay on it?</h3><p>Recurring monitoring with a chosen cadence is the next Smart Research capability being added.</p></article>
        </div>
        <p className="am-emphasis">The point is not more information. It is knowing when there is something worth acting on.</p>
      </section>

      <section className="am-section am-smart" id="smartchitecture">
        <p className="am-kicker">SMARTCHITECTURE™</p>
        <h2>Start with Amplifi. Make it yours.</h2>
        <p className="am-smart-intro">
          Add the capabilities that help your business. Skip the ones that do not. Smartchitecture lets Amplifi grow
          around the way you work instead of forcing you into somebody else&apos;s setup.
        </p>
        <div className="am-smart-stack">
          <article className="am-smart-core"><span>AMPLIFI</span><p>Your foundation for creating, organizing, scheduling, and understanding your content.</p></article>
          <article><span>+ SMART RESEARCH</span><p>Researches the subjects you care about and keeps the sources connected to the work.</p></article>
          <article><span>+ CONTENT ENGINE</span><p>Turns discoveries and ideas into more kinds of useful content.</p></article>
          <article><span>+ CAMPAIGN ARCHITECT</span><p>Give Amplifi a goal and it helps build the campaign around it.</p></article>
          <article><span>+ AUTOPILOT</span><p>Lets Amplifi handle more routine work inside rules you control as that capability is enabled.</p></article>
        </div>
        <p className="am-smart-close">Add what helps. Skip what does not.</p>
      </section>

      <section className="am-section am-control">
        <p className="am-kicker">YOUR LEVEL OF CONTROL</p>
        <h2>You choose how hands-on you want to be.</h2>
        <div className="am-control-grid">
          <article><span>STAY INVOLVED</span><h3>Amplifi prepares the work.</h3><p>You accept, edit, or reject before anything moves forward.</p></article>
          <article><span>SHARE THE WORKLOAD</span><h3>Let Amplifi handle the routine.</h3><p>Important decisions still come back to you.</p></article>
          <article><span>LET IT RUN</span><h3>Use Autopilot inside your rules.</h3><p>When Autopilot is enabled, anything Amplifi should not decide is meant to stop and come back to you.</p></article>
        </div>
      </section>

      <section className="am-section am-product">
        <p className="am-kicker">ONE PLACE TO SEE THE WORK</p>
        <h2>Everything Amplifi is doing, without dashboard overload.</h2>
        <div className="am-product-grid">
          {productViews.map(([title, body]) => (
            <article key={title}><h3>{title}</h3><p>{body}</p></article>
          ))}
        </div>
        <Link href="/amplifi/workspace" className="am-text-link">Open the Amplifi workspace →</Link>
      </section>

      <section className="am-section am-results">
        <p className="am-kicker">WHAT HAPPENED NEXT?</p>
        <h2>See what people actually respond to.</h2>
        <div className="am-results-grid">
          <span>What got attention?</span>
          <span>What earned clicks?</span>
          <span>What brought people to your site?</span>
          <span>What led someone to take the next step?</span>
        </div>
        <p>
          Amplifi brings available signals together so the next campaign does not start from zero. When platform data is
          not available, Amplifi does not invent it.
        </p>
      </section>

      <section className="am-section am-for">
        <p className="am-kicker">WHO IT IS FOR</p>
        <h2>Built for businesses with actual work to do.</h2>
        <p>
          Amplifi is for business owners, organizations, and small teams that know staying present matters but have more
          important things competing for their time.
        </p>
      </section>

      <section className="am-section am-plans" id="plans">
        <p className="am-kicker">PLANS</p>
        <h2>Start where you are.</h2>
        <div className="am-plan-grid">
          <article>
            <span>AMPLIFI SOCIAL</span>
            <h3>$29 <small>/ month</small></h3>
            <p>Start with the core Amplifi social experience and your brand workspace.</p>
            <Link href="/checkout" className="am-secondary">View purchase options</Link>
          </article>
          <article>
            <span>AMPLIFI COMPLETE</span>
            <h3>$129 <small>/ month</small></h3>
            <p>Designed for the full Smartchitecture experience as those capabilities are certified for production use.</p>
            <a href="#smartchitecture" className="am-secondary">See what Complete adds</a>
          </article>
        </div>
        <p className="am-plan-note">We only sell capabilities that are ready for real customer use.</p>
      </section>

      <section className="am-close">
        <p className="am-kicker">AMPLIFI</p>
        <h2>Stay present without living on social media.</h2>
        <p>Let Amplifi research. Let Amplifi create. Choose how much it handles. Then get back to running your business.</p>
        <div className="am-hero-actions">
          <Link href="/amplifi/onboarding" className="am-primary">Start with Amplifi</Link>
          <Link href="/amplifi/workspace" className="am-secondary">See how Amplifi works</Link>
        </div>
      </section>

      <footer className="am-footer">
        <div className="am-footer-main">
          <div>
            <p className="am-footer-brand">Amplifi™ by Efficiency Architects</p>
            <p className="am-footer-copy">A product of Ascension Systems LLC.</p>
            <p className="am-footer-copy">Questions? Use our contact or support pages and we will point you in the right direction.</p>
          </div>
          <div className="am-footer-columns">
            <nav aria-label="Amplifi product links">
              <strong>Product</strong>
              <Link href="/amplifi">Amplifi</Link>
              <a href="#smart-research">Smart Research</a>
              <a href="#smartchitecture">Smartchitecture™</a>
              <a href="#plans">Pricing</a>
              <Link href="/portal/login?next=%2Famplifi%2Fworkspace">Sign in</Link>
              <Link href="/legal/support">Support</Link>
            </nav>
            <nav aria-label="Efficiency Architects company links">
              <strong>Company</strong>
              <Link href="/">Efficiency Architects</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/trust">Trust</Link>
            </nav>
            <nav aria-label="Legal links">
              <strong>Legal</strong>
              <Link href="/legal/privacy">Privacy Policy</Link>
              <Link href="/legal/terms">Terms of Service</Link>
              <Link href="/legal/cookies">Cookie Policy</Link>
              <Link href="/legal/ai-disclosure">AI & Data Disclosure</Link>
              <Link href="/legal/account-deletion">Account Deletion</Link>
            </nav>
          </div>
        </div>
        <div className="am-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Ascension Systems LLC. All rights reserved.</p>
          <p>Third-party social connections and publishing availability depend on the connected platform and current authorization.</p>
        </div>
      </footer>
    </main>
  );
}
