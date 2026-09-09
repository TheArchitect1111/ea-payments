import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import AmplifiBrand from './AmplifiBrand';
import './brain-demo.css';

export const metadata: Metadata = {
  title: 'Amplifi | Social media intelligence that does the work',
  description: 'See how Amplifi turns a business objective into research, campaign strategy, finished social posts, approval, learning and the next smarter move.'
};

const preview='/api/amplifi/trial?next=%2Famplifi%2Fcreate%3Fmode%3Dcampaign';

const searchResults=[
  {tag:'LOCAL SIGNAL',title:'Midweek appointment availability',why:'Your Tuesday and Wednesday capacity is underused.',angle:'Turn convenience into the campaign, not a discount.'},
  {tag:'CUSTOMER QUESTION',title:'When is the easiest time to book?',why:'Prospects are deciding when to fit the service into a busy week.',angle:'Make weekday flexibility the useful answer.'},
  {tag:'SEASONAL MOMENT',title:'Back-to-routine week',why:'People are rebuilding schedules after summer travel and school starts.',angle:'Position a midweek appointment as the easier reset.'}
];

const posts=[
  {job:'ATTENTION',image:'/home/ch7-consultant.jpg',headline:'Your weekend should not start with one more errand.',caption:'If the week is already full, your appointment does not have to compete with Saturday. We opened quieter midweek times for people who want to get it handled before the weekend starts.',why:'Interrupts the habit of waiting until Saturday.'},
  {job:'TRUST',image:'/home/ch7-healthcare.jpg',headline:'The easier appointment is the one that fits your life.',caption:'Good service is not only the result. It is making the experience easier to fit around work, family and everything else already on your calendar.',why:'Builds preference around convenience, not price.'},
  {job:'ACTION',image:'/home/ch1-why-start.jpg',headline:'Tuesday + Wednesday openings are live.',caption:'If you have been saying “I need to get that done this week,” this is your window. Choose a midweek time before the weekend rush begins.',why:'Turns campaign interest into a clear next step.'}
];

export default function Page(){return <main className="demo-page">
  <nav className="demo-nav"><AmplifiBrand/><div><Link href="/amplifi/pricing">Plans</Link><Link href="/portal/login?next=%2Famplifi%2Fworkspace">Sign in</Link></div></nav>

  <section className="demo-hero">
    <Image src="/home/build-hero.jpg" alt="Business owner focused on their work" fill priority sizes="100vw"/>
    <div className="demo-shade"/>
    <div className="demo-hero-copy">
      <span>AMPLIFI · SOCIAL MEDIA INTELLIGENCE</span>
      <h1>Tell Amplifi the business problem.<br/><em>It builds the social media.</em></h1>
      <p>No blank content calendar. No “what should I post?” loop. Amplifi researches the opportunity, builds a campaign, creates the posts and brings the work to you for approval.</p>
      <a href={preview}>BUILD MY FREE CAMPAIGN →</a>
      <small>Three answers. A real campaign reveal. No payment required to start.</small>
    </div>
  </section>

  <section className="demo-problem">
    <div><span>WHY THIS IS DIFFERENT</span><h2>Most tools give you tools.<br/>Amplifi gives you work.</h2><p>Instead of opening another dashboard and deciding what to create, you start with the outcome you need.</p></div>
    <div className="problem-stack"><i>WHAT SHOULD I POST?</i><i>WHAT IS WORTH TALKING ABOUT?</i><i>WHAT IMAGE SHOULD I USE?</i><i>WHEN SHOULD IT GO OUT?</i><i>DID IT WORK?</i><strong>Amplifi handles the questions behind the post.</strong></div>
  </section>

  <section className="demo-goal">
    <span>1 · START WITH THE GOAL</span>
    <div className="goal-card"><small>BUSINESS OBJECTIVE</small><blockquote>“I need more weekday appointments.”</blockquote><div className="goal-meta"><b>Audience</b><span>Busy working professionals</span><b>Desired action</b><span>Book Tuesday or Wednesday</span></div></div>
    <div className="goal-arrow">↓</div>
    <div className="smart-card"><div className="smart-icon">✦</div><div><small>SMARTCHITECTURE</small><h3>Build the campaign before writing the posts.</h3><p>Amplifi translates the objective into audience tension, campaign angle, content jobs, CTA and visual direction.</p></div></div>
  </section>

  <section className="demo-search">
    <div className="section-title"><span>2 · SEARCH + BUILD</span><h2>Amplifi can go looking for the opportunity.</h2><p>This is what the research step should feel like, not a paragraph explaining that research exists.</p></div>
    <div className="search-window">
      <div className="search-top"><div className="search-logo">⌕</div><div><small>WHAT SHOULD AMPLIFI LOOK FOR?</small><strong>Find something my customers should care about this week.</strong></div><button>Search + Build</button></div>
      <div className="search-results">{searchResults.map((r,i)=><article key={r.title}><div className="result-num">0{i+1}</div><div><small>{r.tag}</small><h3>{r.title}</h3><p><b>Why it matters:</b> {r.why}</p><p><b>Amplifi angle:</b> {r.angle}</p></div></article>)}</div>
      <div className="recommendation"><span>AMPLIFI RECOMMENDS</span><strong>MIDWEEK MADE EASY</strong><p>A three-post campaign that reframes weekday availability as convenience, then turns attention into bookings.</p><button>Build campaign →</button></div>
    </div>
  </section>

  <section className="demo-posts">
    <div className="section-title light"><span>3 · REAL CAMPAIGN OUTPUT</span><h2>One objective. Three posts with three different jobs.</h2><p>These are finished social-post examples, not abstract feature cards.</p></div>
    <div className="post-grid">{posts.map((p,i)=><article className="social-post" key={p.job}>
      <div className="social-chrome"><div className="avatar">A</div><div><b>Acme Service Co.</b><small>Sponsored example · Instagram</small></div><span>•••</span></div>
      <div className="social-image"><Image src={p.image} alt={`${p.job} campaign post example`} fill sizes="33vw"/><div className="social-overlay"><small>{p.job}</small><h3>{p.headline}</h3></div></div>
      <div className="social-actions"><span>♡</span><span>◯</span><span>↗</span><span className="save">⌑</span></div>
      <div className="social-caption"><p>{p.caption}</p><b>{i===2?'BOOK A MIDWEEK APPOINTMENT →':'Learn more →'}</b></div>
      <div className="amplifi-note"><small>WHY AMPLIFI BUILT THIS</small><p>{p.why}</p></div>
    </article>)}</div>
  </section>

  <section className="demo-idea">
    <div className="idea-left"><span>4 · IDEA BOX</span><h2>Already have something? Drop it in.</h2><p>A thought, photo, voice note, link, screenshot or document should become raw material, not another task.</p><div className="dropbox"><div className="upload-icon">＋</div><strong>Drop an idea or asset</strong><small>Photo · Voice note · Link · Screenshot · Document</small></div></div>
    <div className="idea-flow"><div className="asset-card"><span>📷</span><div><small>NEW ASSET</small><b>Customer transformation photo</b></div></div><div className="flow-arrow">↓</div><div className="idea-result"><small>AMPLIFI FOUND THE STORY</small><h3>Turn this into a trust post.</h3><p>Use the transformation as proof, explain the customer problem in plain language and end with one natural next step.</p><button>Build this post →</button></div></div>
  </section>

  <section className="demo-eva">
    <div className="eva-copy"><span>5 · EVA BRINGS YOU THE DECISION</span><h2>You should not have to manage the machine.</h2><p>Smartchitecture handles the connected intelligence. Eva surfaces what needs your attention and explains why.</p></div>
    <div className="eva-phone"><div className="eva-head"><div>E</div><span><b>Eva</b><small>Amplifi guide</small></span></div><div className="eva-bubble"><p>Your <b>Midweek Made Easy</b> campaign is ready.</p><ul><li>3 posts created ✓</li><li>Visual direction applied ✓</li><li>CTA checked ✓</li><li>Ready for your review ✓</li></ul><small>Post 1 should lead because it gives people a reason to reconsider Saturday before asking them to book.</small></div><div className="eva-buttons"><button>Approve campaign</button><button>Edit</button><button>Skip</button></div></div>
  </section>

  <section className="demo-learn">
    <div className="section-title"><span>6 · LEARN + ADAPT</span><h2>The next campaign should know more than the first.</h2></div>
    <div className="learn-grid"><div className="metric-card"><small>CAMPAIGN RESULT</small><strong>+31%</strong><p>weekday booking clicks</p></div><div className="metric-card"><small>BEST RESPONSE</small><strong>11:42 AM</strong><p>Wednesday lunch window</p></div><div className="metric-card"><small>TOP MESSAGE</small><strong>Convenience</strong><p>outperformed discount language</p></div></div>
    <div className="learn-panel"><div><small>AMPLIFI LEARNED</small><p>✓ Convenience angle resonated</p><p>✓ Midweek CTA earned more clicks</p><p>✓ Customer-reality language beat promotional copy</p></div><div className="next-arrow">→</div><div><small>NEXT CAMPAIGN ADAPTS</small><p>Lead with convenience again</p><p>Test Wednesday lunch timing</p><p>Use proof before promotion</p></div></div>
  </section>

  <section className="demo-free">
    <div><span>TRY THE PRODUCT STORY YOURSELF</span><h2>Give Amplifi three answers.<br/>Get something real back.</h2><ol><li><b>01</b> What do you do?</li><li><b>02</b> What are you trying to accomplish?</li><li><b>03</b> What should people do next?</li></ol><a href={preview}>BUILD MY FREE CAMPAIGN →</a><small>No payment. No social connection required to start.</small></div>
    <div className="reveal-card"><small>YOUR CAMPAIGN REVEAL</small><h3>What appears next</h3><div className="reveal-row"><span>✓</span><b>Objective understood</b></div><div className="reveal-row"><span>✓</span><b>Smartchitecture strategy</b></div><div className="reveal-row"><span>✓</span><b>Research opportunity</b></div><div className="reveal-row"><span>✓</span><b>3 coordinated posts</b></div><div className="reveal-row"><span>✓</span><b>Visual direction + CTA</b></div><div className="reveal-row"><span>✓</span><b>Eva review ready</b></div></div>
  </section>

  <section className="demo-close"><Image src="/home/build-hero.jpg" alt="Business owner focused on their craft" fill sizes="100vw"/><div className="demo-shade"/><div><span>AMPLIFI</span><h2>Focus on your craft.<br/><em>Let Amplifi handle the social media.</em></h2><a href={preview}>TRY AMPLIFI FREE →</a></div></section>

  <footer className="demo-footer"><AmplifiBrand/><nav><Link href="/amplifi/terms">Terms</Link><Link href="/amplifi/privacy">Privacy</Link><Link href="/amplifi/acceptable-use">Acceptable Use</Link><Link href="/trust">Trust Center</Link></nav><p>Amplifi assists with content strategy and creation. You remain responsible for review, accuracy, rights and publication decisions. Nothing publishes without your approval.</p><small>© 2026 Ascension Systems LLC · Efficiency Architects · Amplifi</small></footer>
</main>}
