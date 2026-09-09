import type { Metadata } from 'next';
import Link from 'next/link';
import AmplifiBrand from './AmplifiBrand';
import './amplifi-brain-v4.css';

export const metadata: Metadata = {
  title: 'Amplifi | Focus on what you do.',
  description: 'Amplifi finds useful opportunities, builds coordinated social campaigns and brings the work back ready for review.'
};

const preview = '/api/amplifi/trial?next=%2Famplifi%2Fcreate%3Fmode%3Dcampaign';

const posts = [
  {
    role: 'RECOGNITION',
    scene: 'SATURDAY · BUSY SHOP',
    headline: 'School is back. Saturdays fill up fast.',
    caption: 'School-year routines put more errands and kids’ haircuts into the weekend. Brick & Blade has another way to get it handled.',
    reason: 'Starts with something customers already recognize: the Saturday rush.'
  },
  {
    role: 'REFRAME',
    scene: 'MIDWEEK · ROOM TO BREATHE',
    headline: 'Get the cut. Keep the Saturday.',
    caption: 'A Tuesday or Wednesday appointment gets one more weekend errand off the list.',
    reason: 'Turns weekday availability into time the customer gets back.'
  },
  {
    role: 'CONVERSION',
    scene: 'TUESDAY + WEDNESDAY',
    headline: 'Your midweek chair is ready.',
    caption: 'Choose a midweek time and leave Saturday for everything else.',
    reason: 'Makes the booking ask only after there is a reason to care.'
  }
];

const audience = [
  { label: 'BUSINESS OWNER', title: 'Keep customers moving while Amplifi keeps your social media moving.' },
  { label: 'CREATOR / INFLUENCER', title: 'Stay in your creative lane while Amplifi turns ideas into coordinated campaigns.' },
  { label: 'ORGANIZATION LEADER', title: 'Keep the mission in front while Amplifi handles the communication rhythm.' },
  { label: 'ATHLETE / PROFESSIONAL', title: 'Protect your focus while Amplifi helps build a consistent public presence.' }
];

export default function Page() {
  return (
    <main className="a4">
      <nav className="a4-nav">
        <AmplifiBrand />
        <div><Link href="/amplifi/pricing">Plans</Link><Link href="/portal/login?next=%2Famplifi%2Fworkspace">Sign in</Link></div>
      </nav>

      <section className="a4-hero visual-scene hero-scene">
        <div className="a4-shade" />
        <div className="a4-hero-copy">
          <span>AMPLIFI</span>
          <h1>Focus on your business.<br/>Your organization.<br/>Your career.<br/><em>Let Amplifi handle the social media.</em></h1>
          <p>You bring the objective. Amplifi finds what matters, turns it into campaign-ready work and brings it back for your review.</p>
          <a href={preview}>BUILD MY FREE CAMPAIGN →</a>
        </div>
      </section>

      <section className="a4-recognition">
        <div className="a4-rec-copy">
          <span>THE PAIN IS THE SAME</span>
          <h2>Social media keeps asking for time you should be spending somewhere else.</h2>
          <p>The problem is not clicking “post.” It is the constant demand to decide what to say, what matters now, how it should look, when it should go out and what should happen next.</p>
          <strong>Amplifi is built to reduce that mental load, not give you another dashboard to manage.</strong>
        </div>
        <div className="a4-burden">
          <div className="burden-list"><i>Find something worth saying</i><i>Choose the right angle</i><i>Create the campaign</i><i>Make the posts</i><i>Review the response</i></div>
          <div className="burden-relief"><span>AMPLIFI WORKSPACE</span><b>Amplifi prepares the work while you stay focused on your craft.</b><div className="ready-list"><small>CAMPAIGN READY</small><p>✓ Research complete</p><p>✓ Recommended sequence</p><p>✓ Visuals + captions complete</p><p>✓ CTA checked</p><button>REVIEW CAMPAIGN →</button></div></div>
        </div>
      </section>

      <section className="a4-story">
        <header><span>WHO THIS IS FOR</span><h2>Different careers. Same social-media burden.</h2><p>Amplifi is designed around the work people are already trying to protect.</p></header>
        <div className="audience-grid">
          {audience.map((item) => <article className="audience-card" key={item.label}><small>{item.label}</small><h3>{item.title}</h3></article>)}
        </div>
      </section>

      <div className="flow-break"><span>SEE THE SYSTEM IN MOTION</span><b>Enough describing it. Here is one clear example from objective to finished campaign.</b></div>

      <section className="a4-story">
        <header><span>WATCH AMPLIFI WORK</span><h2>One barbershop. One real business problem.</h2><p>Brick & Blade wants more Tuesday and Wednesday appointments without discounting the service.</p></header>
        <div className="story-photo visual-scene shop-scene"><div><span>BRICK & BLADE · DEMONSTRATION</span><b>A strong Saturday is not the problem. Empty chairs during the week are.</b></div></div>
        <div className="brand-card"><div className="bb-mark">B<span>&</span>B</div><div><small>BRICK & BLADE BARBERSHOP · DEMONSTRATION BUSINESS</small><h3>“Tuesdays and Wednesdays are quiet. Saturdays are packed.”</h3><p>The goal is simple: move some demand into the week without turning the service into a discount promotion.</p></div></div>
        <div className="clarity-callout"><div className="clarity-num">1</div><div><span className="section-label">OBJECTIVE</span><h3>Fill more midweek appointments.</h3><p>That single objective becomes the starting point. Amplifi then looks for a timely reason the customer might actually care.</p></div></div>
      </section>

      <section className="a4-search">
        <div className="a4-side-title"><span>SEARCH + UNDERSTAND</span><h2>Amplifi finds the connection between your objective and what matters now.</h2><p>For Brick & Blade, the useful connection is not “post more.” It is the return of packed school-year weekends.</p></div>
        <div className="search-ui">
          <div className="search-query"><div className="search-icon">⌕</div><div><small>BUSINESS OBJECTIVE</small><b>More Tuesday and Wednesday appointments.</b></div><button>Search</button></div>
          <div className="insight-stack">
            <article><small>WHAT AMPLIFI FOUND</small><h3>School is back. Weekend schedules get crowded again.</h3><p>Kids are back in class, routines tighten up, and haircuts join the pile of Saturday errands.</p></article>
            <article><small>WHY IT MATTERS</small><h3>Saturday is already Brick & Blade’s busiest day.</h3><p>The quieter weekdays offer something useful: less waiting and more Saturday left.</p></article>
            <article><small>THE CAMPAIGN IDEA</small><h3>Give Saturday Back.</h3><p>Handle the haircut Tuesday or Wednesday before the weekend rush begins.</p></article>
          </div>
        </div>
      </section>

      <section className="a4-smart">
        <div className="smart-intro"><span>SMARTCHITECTURE</span><h2>Five visible steps. No black box.</h2></div>
        <div className="smart-flow">
          <div><small>1 · SEARCH</small><b>Find the timely signal</b></div>
          <div><small>2 · UNDERSTAND</small><b>Connect it to the objective</b></div>
          <div><small>3 · BUILD</small><b>Turn the connection into a campaign</b></div>
          <div><small>4 · RECOMMEND</small><b>Organize the strongest sequence</b></div>
          <div><small>5 · APPROVAL</small><b>You review before anything publishes</b></div>
        </div>
        <p className="smart-note">Amplifi does the preparation. You make the decision.</p>
      </section>

      <section className="standout"><span>THE DIFFERENCE</span><h2>Amplifi does not hand you more work. It brings work back ready to review.</h2><p>That is the line between another social-media tool and a system designed to protect your time.</p></section>

      <section className="a4-campaign">
        <header><span>THE CAMPAIGN</span><h2>Three posts. One connected story.</h2><p>Each post has a job, and the labels make that job visible.</p></header>
        <div className="a4-posts">{posts.map((p, i) => <article className="ig" key={p.role}><div className="ig-head"><div className="bb-avatar">B&B</div><div><b>brickandblade</b><small>Brick & Blade Barbershop · Demo</small></div><span>•••</span></div><div className={`ig-image visual-scene post-scene post-${i + 1}`}><div className="ig-art"><small>{p.scene}</small><h3>{p.headline}</h3><div>BRICK & BLADE</div></div></div><div className="ig-copy"><p><b>brickandblade</b> {p.caption}</p></div><div className="ig-why"><small>{p.role} · WHY THIS POST EXISTS</small><p>{p.reason}</p></div></article>)}</div>
      </section>

      <div className="flow-break"><span>FROM CAMPAIGN BUILDING TO IDEA CAPTURE</span><b>Amplifi can start with a business objective, or with the raw idea already sitting in your head, camera roll or notes.</b></div>

      <section className="a4-idea">
        <div className="idea-copy"><span>IDEA BOX</span><h2>Your starting point does not have to be polished.</h2><p>Drop in a photo, thought, screenshot, voice note or link. Amplifi looks for the useful story inside it.</p></div>
        <div className="idea-demo"><div className="raw"><small>YOU DROP IN</small><div className="raw-photo visual-scene detail-scene"><span>FRESH CUT · SOURCE PHOTO</span></div><b>📷 “Great cut from yesterday. Could this be useful?”</b></div><div className="idea-arrow">→</div><div className="found"><small>AMPLIFI FINDS THE STORY</small><h3>A finished cut becomes proof.</h3><p>The result can build trust and connect naturally to the midweek opening.</p></div></div>
      </section>

      <section className="a4-eva">
        <div className="eva-copy"><span>MEET EVA · YOUR SMARTCHITECTURE GUIDE</span><h2>Eva shows you what Amplifi did, why it matters and what comes next.</h2><p>She is the guide to the system beneath the campaign, not another blank chatbot.</p><strong>Nothing publishes without your approval.</strong></div>
        <div className="eva-device"><div className="eva-top"><div>✦</div><span><b>Eva</b><small>Amplifi Smartchitecture</small></span></div><div className="eva-pipeline"><span>SEARCH ✓</span><span>UNDERSTAND ✓</span><span>BUILD ✓</span><span>RECOMMEND ✓</span><span>APPROVAL · YOUR TURN</span></div><div className="eva-chat"><p>Your <b>Give Saturday Back</b> campaign is ready.</p><p>I connected the school-year weekend signal to Brick & Blade’s midweek objective and built the strongest route into three connected posts.</p><small>3 posts ready · sequence recommended · visuals complete · CTA checked</small></div><div className="eva-actions"><button>Review campaign</button><button>Approve</button><button>Edit</button><button>Skip</button></div></div>
      </section>

      <section className="a4-free"><div className="free-copy"><span>NOW GIVE IT YOUR OBJECTIVE</span><h2>Three answers are enough to start.</h2><p>Tell Amplifi what you do, what you want to accomplish and what you want people to do next.</p><a href={preview}>BUILD MY FREE CAMPAIGN →</a></div><div className="free-reveal"><small>AMPLIFI BRINGS BACK</small><ul><li>What Amplifi understood</li><li>The recommended campaign idea</li><li>Why it fits the objective</li><li>Coordinated social posts</li><li>Visual + CTA direction</li><li>Eva-guided review</li></ul><strong>You bring the objective. Amplifi brings back the work.</strong></div></section>

      <section className="legal-strip" id="legal"><div className="legal-grid">
        <article className="legal-card"><small>CONTENT RESPONSIBILITY</small><h3>You approve before publication.</h3><p>Amplifi assists with research, strategy and content creation. You remain responsible for final review, factual accuracy, rights, permissions and publication decisions.</p></article>
        <article className="legal-card"><small>PLATFORM DEPENDENCIES</small><h3>Social platforms stay outside our control.</h3><p>Availability, reach, account access, APIs and publishing behavior may change based on third-party platform rules and service availability.</p></article>
        <article className="legal-card"><small>NO GUARANTEED OUTCOME</small><h3>Strategy is not a promise of results.</h3><p>Amplifi can improve preparation and consistency, but does not guarantee engagement, audience growth, revenue, bookings or other business outcomes.</p></article>
      </div></section>

      <section className="a4-close visual-scene close-scene"><div className="a4-shade"/><div><span>AMPLIFI</span><h2>Stay focused on what you do best.</h2><h3>Let Amplifi handle the social media.</h3><a href={preview}>TRY AMPLIFI FREE →</a></div></section>

      <footer className="a4-footer"><AmplifiBrand/><nav><a href="#legal">Legal</a><Link href="/amplifi/terms">Terms</Link><Link href="/amplifi/privacy">Privacy</Link><Link href="/trust">Trust Center</Link></nav><p>Amplifi assists with content strategy and creation. You remain responsible for review, accuracy, rights and publication decisions. Nothing publishes without your approval.</p><small>© 2026 Ascension Systems LLC · Efficiency Architects · Amplifi</small></footer>
    </main>
  );
}