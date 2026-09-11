import type { Metadata } from 'next';
import Link from 'next/link';
import AmplifiBrand from './AmplifiBrand';
import './amplifi-brain-v4.css';
import './amplifi-proof.css';
import './amplifi-image-brain.css';
import './amplifi-visual-fix.css';

export const metadata: Metadata = {
  title: 'Amplifi | Focus on your craft.',
  description: 'Give Amplifi an objective or an idea. It finds the angle, builds the campaign, creates the posts and brings everything back for approval.'
};

const start = '/api/amplifi/trial?next=%2Famplifi%2Fcreate%3Fmode%3Dcampaign';
const audience = ['BARBERS', 'CREATORS', 'SMALL BUSINESSES', 'COACHES & CONSULTANTS'];
const steps = [
  ['01', 'GOAL', 'Tell Amplifi what you want to accomplish.'],
  ['02', 'SEARCH', 'Amplifi finds timely trends, signals and opportunities.'],
  ['03', 'BUILD', 'It turns the opportunity into a coordinated campaign.'],
  ['04', 'REVIEW', 'Eva explains what was built and why it fits.'],
  ['05', 'APPROVE', 'You review, edit or approve before anything publishes.'],
  ['06', 'PUBLISH', 'Approved content moves into the publishing plan.'],
  ['07', 'LEARN', 'Amplifi learns from results and improves the next campaign.']
];

const sceneAssets: Record<string,string> = {
  hero: '/amplifi/hero-human-v2.jpg?v=2',
  problem: '/amplifi/amplifi-person-phone-v2.jpg?v=2',
  audiences: '/amplifi/amplifi-audiences.svg?v=2',
  search: '/amplifi/amplifi-smart-search.svg?v=2',
  smart: '/amplifi/amplifi-smartchitecture.svg?v=2',
  idea: '/amplifi/amplifi-idea-box.svg?v=2',
  eva: '/amplifi/amplifi-eva-control.svg?v=2',
  performance: '/amplifi/amplifi-performance.svg?v=2',
  closing: '/amplifi/amplifi-person-laptop-v2.jpg?v=2'
};

function Scene({ name, label }: { name: string; label: string }) {
  return <div className={`amp-scene amp-scene-${name}`} role="img" aria-label={label}><img className="amp-scene-img" src={sceneAssets[name]} alt="" aria-hidden="true"/></div>;
}

function BarberVisual({ className, label }: { className: string; label: string }) {
  return <div className={`amp-barber-crop ${className}`} role="img" aria-label={label}><img className="amp-scene-img" src="/amplifi/amplifi-barber-showcase.svg?v=3" alt="" aria-hidden="true"/></div>;
}

export default function Page() {
  return <main className="amp amp-image-brain">
    <nav className="amp-nav"><AmplifiBrand/><div className="amp-nav-links"><Link href="/amplifi/pricing">Plans</Link><Link href="/portal/login?next=%2Famplifi%2Fworkspace">Sign in</Link></div></nav>

    <section className="amp-hero amp-hero-new"><Scene name="hero" label="Professional focused on his craft while Amplifi handles social media work"/><div className="amp-hero-wash"/><div className="amp-hero-copy"><span className="amp-kicker">AMPLIFI</span><h1>Focus on your craft.<br/><em>Let Amplifi handle the social media.</em></h1><p>You bring the goal. Amplifi finds the timely angle, builds the campaign, creates the posts and brings everything back ready for your approval.</p><div className="amp-hero-actions"><a className="amp-primary" href={start}>BUILD MY FREE CAMPAIGN →</a><small>Nothing publishes without your approval.</small></div></div></section>

    <section className="amp-pressure"><div className="amp-pressure-copy"><span className="amp-kicker dark">THE REAL PROBLEM</span><h2>You have a business to run. Social media keeps asking for your attention.</h2><p>Ideas. Trends. Photos. Captions. Scheduling. Comments. Results. The work never arrives as one task. It arrives as a hundred tiny interruptions.</p><strong>Amplifi takes that loop off your desk.</strong></div><div className="amp-wide-visual"><Scene name="problem" label="Business owner overwhelmed by the many tasks required to manage social media"/></div><div className="amp-audience-visual"><Scene name="audiences" label="Four Amplifi audiences: barber, creator, small business owner, coach or consultant"/><div className="amp-audience">{audience.map(item=><span key={item}>{item}</span>)}</div></div></section>

    <section className="amp-motion"><div className="amp-motion-head"><span className="amp-kicker">SEE IT WORK</span><h2>Follow one business from objective to finished campaign.</h2><p>Brick & Blade is our demonstration barbershop. Tuesdays and Wednesdays are quiet. Saturdays are packed. Amplifi starts with the business goal, not with “What should we post?”</p></div>
      <div className="amp-objective amp-objective-barber"><BarberVisual className="amp-barber-objective" label="Brick and Blade barbershop campaign showcase"/><div className="amp-objective-copy"><small>THE OBJECTIVE</small><h3>Fill more midweek appointments without discounting the service.</h3><p>That objective becomes the north star. Every search, angle, visual and post has to help move the same business outcome.</p></div></div>
      <div className="amp-search-story"><div className="amp-search-copy"><span className="amp-kicker dark">SMART SEARCH</span><h3>Amplifi finds the reason to talk about it now.</h3><p>It looks for timely context, audience behavior and relevant opportunities, then connects the strongest signal back to the objective.</p></div><Scene name="search" label="Amplifi smart search finding barber content trends and opportunities"/></div>
      <div className="amp-signal-grid"><article><small>SEARCH</small><b>School-year routines are back.</b><p>Weekends are getting crowded with errands, activities and haircuts.</p></article><div className="amp-signal-line">→</div><article><small>CONNECT</small><b>Saturday is already the busiest day.</b><p>Midweek availability can be positioned as time the customer gets back.</p></article><div className="amp-signal-line">→</div><article className="amp-signal-highlight"><small>BUILD</small><b>Give Saturday Back.</b><p>Handle the haircut Tuesday or Wednesday before the weekend rush begins.</p></article></div>
      <div className="amp-proof amp-proof-barber"><div className="amp-proof-copy"><span className="amp-kicker dark">THE ACTUAL CAMPAIGN PROOF</span><h3>Now show the work, not another promise.</h3><p>The earlier Brick & Blade visuals become the proof thread: campaign concept, coordinated social posts and the finished strategy shown together as one real example.</p><div className="amp-proof-tags"><span>RECOGNITION</span><span>REFRAME</span><span>CONVERSION</span></div></div><BarberVisual className="amp-barber-campaign" label="Previously created Brick and Blade Amplifi campaign posts"/></div>
    </section>

    <section className="amp-system"><div className="amp-system-head"><span className="amp-kicker">SMARTCHITECTURE</span><h2>You can see the entire path from goal to growth.</h2></div><div className="amp-system-visual"><Scene name="smart" label="Amplifi Smartchitecture visual process from goal through search, build, review, approval, publish and learn"/></div><div className="amp-track amp-track-seven">{steps.map(([n,who,text])=><div className="amp-track-step" key={n}><i>{n}</i><small>{who}</small><b>{text}</b></div>)}</div></section>

    <section className="amp-idea"><div className="amp-idea-copy"><span className="amp-kicker dark">IDEA BOX</span><h2>You do not need a finished thought.</h2><p>Drop in the raw material already sitting in your head, camera roll or notes. Amplifi finds the useful story inside it and develops the campaign seed.</p><div className="amp-input-types"><span>PHOTO</span><span>NOTE</span><span>SCREENSHOT</span><span>VOICE</span><span>LINK</span></div></div><div className="amp-idea-device amp-idea-new"><Scene name="idea" label="Idea Box transforming a rough thought into a complete campaign concept"/><div className="amp-idea-result"><small>AMPLIFI FINDS</small><h3>Rough thought → usable campaign</h3><p>A raw moment becomes useful because Amplifi connects it to the audience, objective, formats and posting opportunity.</p></div></div></section>

    <section className="amp-eva"><div className="amp-eva-copy"><span className="amp-kicker">MEET EVA</span><h2>Your campaign control room has a guide.</h2><p>Eva does not greet you with a blank chatbot. She tells you what Amplifi found, what it built, why it matters and exactly where your decision is needed.</p><strong>Your attention goes to the decision, not the production work.</strong></div><div className="amp-eva-stack"><Scene name="eva" label="Premium Eva campaign guide and control-room experience"/><div className="amp-eva-console"><div className="amp-eva-header"><div className="amp-eva-orb">E</div><div><b>EVA</b><small>AMPLIFI GUIDE · CAMPAIGN CONTROL</small></div><span>READY FOR REVIEW</span></div><div className="amp-eva-message"><small>EVA · CAMPAIGN READY</small><h3>Your “Give Saturday Back” campaign is ready.</h3><p>I connected Brick & Blade’s midweek objective to the return of packed school-year weekends. Review the three-post sequence, make any edits, then approve when you are ready.</p><div className="amp-eva-summary"><span>3 POSTS</span><span>VISUALS READY</span><span>CTA CHECKED</span></div></div><div className="amp-eva-decision"><button>REVIEW CAMPAIGN</button><button>APPROVE</button><button>EDIT</button></div></div></div></section>

    <section className="amp-performance"><div className="amp-performance-copy"><span className="amp-kicker dark">AFTER PUBLISHING</span><h2>Amplifi learns what deserves another turn.</h2><p>Performance is not the end of the story. The system reads the campaign results and carries the useful learning into the next recommendation.</p><div className="amp-performance-pills"><span>WHAT WORKED</span><span>WHEN IT WORKED</span><span>WHAT TO BUILD NEXT</span></div></div><Scene name="performance" label="Amplifi campaign performance and continuous learning dashboard"/></section>

    <section className="amp-close amp-close-new"><Scene name="closing" label="Professional back to his craft while Amplifi continues handling social media"/><div className="amp-close-wash"/><div className="amp-close-copy"><span className="amp-kicker">THE POINT OF THE WHOLE SYSTEM</span><h2>You do what you do best.</h2><h3>Amplifi handles the social media.</h3><a className="amp-primary" href={start}>TRY AMPLIFI FREE →</a></div></section>

    <section className="amp-legal" id="legal"><p>Amplifi assists with research, strategy and content creation. You remain responsible for final review, factual accuracy, rights, permissions and publication decisions. Social-platform availability and behavior may change. Amplifi does not guarantee engagement, audience growth, revenue or other outcomes.</p></section>
    <footer className="amp-footer"><AmplifiBrand/><nav><Link href="/amplifi/terms">Terms</Link><Link href="/amplifi/privacy">Privacy</Link><Link href="/trust">Trust Center</Link></nav><small>© 2026 Ascension Systems LLC · Efficiency Architects · Amplifi</small></footer>
  </main>;
}
