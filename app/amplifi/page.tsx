import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import AmplifiBrand from './AmplifiBrand';
import './amplifi-brain-v4.css';

export const metadata: Metadata = {
  title: 'Amplifi | Focus on your craft.',
  description: 'Give Amplifi an objective or an idea. It finds the angle, builds the campaign, creates the posts and brings everything back for approval.'
};

const start = '/api/amplifi/trial?next=%2Famplifi%2Fcreate%3Fmode%3Dcampaign';

const audience = ['BUSINESS OWNER', 'CREATOR / INFLUENCER', 'ORGANIZATION LEADER', 'ATHLETE / PROFESSIONAL'];

const steps = [
  ['01', 'YOU', 'Give Amplifi an objective or drop an idea into the Idea Box.'],
  ['02', 'SEARCH', 'Amplifi looks for the timely signal that makes the objective matter now.'],
  ['03', 'BUILD', 'It turns that connection into a coordinated campaign, posts and visual direction.'],
  ['04', 'EVA', 'Eva explains what was built, why it fits and what deserves your attention.'],
  ['05', 'YOU', 'Review, edit or approve. Nothing publishes without your decision.']
];

export default function Page() {
  return (
    <main className="amp">
      <nav className="amp-nav">
        <AmplifiBrand />
        <div className="amp-nav-links"><Link href="/amplifi/pricing">Plans</Link><Link href="/portal/login?next=%2Famplifi%2Fworkspace">Sign in</Link></div>
      </nav>

      <section className="amp-hero">
        <Image className="amp-hero-image" src="/amplifi/hero-human-v2.jpg" alt="Professional focused on their craft" fill priority sizes="100vw" />
        <div className="amp-hero-wash" />
        <div className="amp-hero-copy">
          <span className="amp-kicker">AMPLIFI</span>
          <h1>Focus on your craft.<br/><em>Let Amplifi handle the social media.</em></h1>
          <p>Give Amplifi an objective or an idea. It finds the timely angle, builds the campaign, creates the posts and brings everything back ready for your approval.</p>
          <div className="amp-hero-actions"><a className="amp-primary" href={start}>BUILD MY FREE CAMPAIGN →</a><small>Nothing publishes without your approval.</small></div>
        </div>
      </section>

      <section className="amp-pressure">
        <div className="amp-pressure-copy">
          <span className="amp-kicker dark">THE WORK BEHIND “JUST POST SOMETHING”</span>
          <h2>Social media keeps taking pieces of your attention.</h2>
          <p>What should we say? Is anything happening today? Do we need a photo? A reel? A follow-up? Is this the right time to post?</p>
          <strong>Amplifi takes that loop off your desk.</strong>
        </div>
        <div className="amp-transfer" aria-label="Social media workload transfer">
          <div className="amp-transfer-you"><small>WITHOUT AMPLIFI</small><b>Your attention gets split.</b><ul><li>Find the idea</li><li>Find the angle</li><li>Write the posts</li><li>Create the visuals</li><li>Plan the sequence</li><li>Remember to follow up</li></ul></div>
          <div className="amp-transfer-arrow">→</div>
          <div className="amp-transfer-amplifi"><small>WITH AMPLIFI</small><b>You stay on the work only you can do.</b><div className="amp-ready"><span>CAMPAIGN READY</span><p>Research complete</p><p>Sequence recommended</p><p>Posts + visuals prepared</p><p>Waiting for your approval</p></div></div>
        </div>
        <div className="amp-audience">{audience.map((item) => <span key={item}>{item}</span>)}</div>
      </section>

      <section className="amp-motion">
        <div className="amp-motion-head"><span className="amp-kicker">SEE IT WORK</span><h2>One objective. One connected path from problem to campaign.</h2><p>Brick &amp; Blade is an illustrative barbershop. Tuesdays and Wednesdays are quiet. Saturdays are packed.</p></div>
        <div className="amp-objective">
          <div className="amp-objective-photo"><Image src="/amplifi/amplifi-person-phone-v2.jpg" alt="Customer using a phone" fill sizes="(max-width: 800px) 100vw, 45vw" /></div>
          <div className="amp-objective-copy"><small>THE OBJECTIVE</small><h3>Fill more midweek appointments without discounting the service.</h3><p>Amplifi does not start by asking, “What should we post?” It starts with what the business wants to accomplish.</p></div>
        </div>

        <div className="amp-signal-grid">
          <article><small>AMPLIFI SEARCHES</small><b>School-year routines are back.</b><p>Weekends get crowded with errands, activities and haircuts.</p></article>
          <div className="amp-signal-line">→</div>
          <article><small>AMPLIFI CONNECTS</small><b>Saturday is already the busiest day.</b><p>Midweek availability can be positioned as time the customer gets back.</p></article>
          <div className="amp-signal-line">→</div>
          <article className="amp-signal-highlight"><small>AMPLIFI BUILDS</small><b>Give Saturday Back.</b><p>Handle the haircut Tuesday or Wednesday before the weekend rush begins.</p></article>
        </div>

        <div className="amp-proof">
          <div className="amp-proof-copy"><span className="amp-kicker dark">THE OUTPUT</span><h3>Not a suggestion. A campaign ready to review.</h3><p>The idea becomes a connected social sequence with a purpose for each post, visual direction and a clear next action.</p></div>
          <div className="amp-proof-images">
            <figure><Image src="/amplifi/amplifi-instagram-demo.jpg" alt="Amplifi Instagram campaign example" fill sizes="(max-width: 800px) 90vw, 34vw" /><figcaption>INSTAGRAM · CAMPAIGN PREVIEW</figcaption></figure>
            <figure><Image src="/amplifi/amplifi-facebook-demo.jpg" alt="Amplifi Facebook campaign example" fill sizes="(max-width: 800px) 90vw, 34vw" /><figcaption>FACEBOOK · CAMPAIGN PREVIEW</figcaption></figure>
          </div>
        </div>
      </section>

      <section className="amp-system">
        <div className="amp-system-head"><span className="amp-kicker">SMARTCHITECTURE</span><h2>You can see where the work is and what happens next.</h2></div>
        <div className="amp-track">{steps.map(([n, who, text]) => <div className="amp-track-step" key={n}><i>{n}</i><small>{who}</small><b>{text}</b></div>)}</div>
      </section>

      <section className="amp-idea">
        <div className="amp-idea-copy"><span className="amp-kicker dark">IDEA BOX</span><h2>You do not need a finished thought.</h2><p>Drop in the raw material already sitting in your head, camera roll or notes. Amplifi looks for the story inside it and connects it to what you are trying to accomplish.</p><div className="amp-input-types"><span>PHOTO</span><span>NOTE</span><span>SCREENSHOT</span><span>VOICE</span><span>LINK</span></div></div>
        <div className="amp-idea-device"><div className="amp-idea-source"><Image src="/amplifi/amplifi-person-laptop-v2.jpg" alt="Raw idea source" fill sizes="(max-width: 800px) 90vw, 45vw" /><span>YOU DROP IN</span><b>“This happened yesterday. Is there a post in here?”</b></div><div className="amp-idea-result"><small>AMPLIFI FINDS</small><h3>Proof → angle → campaign seed</h3><p>A raw moment becomes useful because Amplifi connects it to the audience and objective instead of treating it as random content.</p></div></div>
      </section>

      <section className="amp-eva">
        <div className="amp-eva-copy"><span className="amp-kicker">MEET EVA</span><h2>The guide between the machine and your decision.</h2><p>Eva does not greet you with a blank chat box. She tells you what Amplifi found, what it built, why it matters and exactly where your decision is needed.</p><strong>Your attention goes to the decision, not the production work.</strong></div>
        <div className="amp-eva-console">
          <div className="amp-eva-header"><div className="amp-eva-orb">E</div><div><b>EVA</b><small>AMPLIFI GUIDE · CAMPAIGN CONTROL</small></div><span>READY FOR REVIEW</span></div>
          <div className="amp-eva-status"><i>SEARCH <b>✓</b></i><i>UNDERSTAND <b>✓</b></i><i>BUILD <b>✓</b></i><i>RECOMMEND <b>✓</b></i><i className="active">APPROVAL</i></div>
          <div className="amp-eva-message"><small>EVA · 10:42 AM</small><h3>Your “Give Saturday Back” campaign is ready.</h3><p>I connected Brick &amp; Blade’s midweek objective to the return of packed school-year weekends. I built three posts that move from recognition → reframe → booking.</p><div className="amp-eva-summary"><span>3 POSTS</span><span>2 VISUAL FORMATS</span><span>CTA CHECKED</span></div></div>
          <div className="amp-eva-decision"><button>REVIEW CAMPAIGN</button><button>APPROVE</button><button>EDIT</button></div>
        </div>
      </section>

      <section className="amp-close">
        <Image src="/amplifi/amplifi-person-laptop-v2.jpg" alt="Professional focused on their work" fill sizes="100vw" />
        <div className="amp-close-wash" />
        <div className="amp-close-copy"><span className="amp-kicker">AMPLIFI</span><h2>Stay with the work that deserves you.</h2><h3>Let Amplifi handle the social media.</h3><a className="amp-primary" href={start}>TRY AMPLIFI FREE →</a></div>
      </section>

      <section className="amp-legal" id="legal"><p>Amplifi assists with research, strategy and content creation. You remain responsible for final review, factual accuracy, rights, permissions and publication decisions. Social-platform availability and behavior may change. Amplifi does not guarantee engagement, audience growth, revenue or other outcomes.</p></section>

      <footer className="amp-footer"><AmplifiBrand/><nav><Link href="/amplifi/terms">Terms</Link><Link href="/amplifi/privacy">Privacy</Link><Link href="/trust">Trust Center</Link></nav><small>© 2026 Ascension Systems LLC · Efficiency Architects · Amplifi</small></footer>
    </main>
  );
}
