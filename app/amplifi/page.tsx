import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AmplifiBrand from './AmplifiBrand';
import './amplifi-v3.css';

export const metadata: Metadata = {
  title: 'Amplifi | Give Amplifi the goal. Get the campaign.',
  description: 'Amplifi turns a business goal into strategy, premium creative, coordinated content, publishing and performance intelligence.'
};

const plans = [
  {name:'Starter',price:'Free',tag:'See the work first',copy:'Build a real sample campaign around your business before you decide what comes next.',features:['Guided campaign brief','Sample campaign','Premium graphic direction','No social connection required'],href:'/amplifi/create?mode=campaign',cta:'Create my sample'},
  {name:'Social',price:'$29',tag:'Create consistently',copy:'Turn what is already happening in your business into polished posts, series and campaigns.',features:['30 posts each month','4 series','4 campaigns','Graphics + short-form video','Approval, scheduling and publishing'],href:'/amplifi/register?plan=amplifi_social',cta:'Start Social'},
  {name:'Intelligence',price:'$59',tag:'Find the story',copy:'Add research and monitoring so Amplifi can surface timely reasons to communicate.',features:['Everything in Social','60 posts','8 series + 8 campaigns','Research + opportunity monitoring','3 watched subjects'],href:'/amplifi/register?plan=amplifi_intelligence',cta:'Start Intelligence'},
  {name:'Complete',price:'$129',tag:'Run the operation',copy:'Research, creative, campaigns, publishing and learning work together as one content system.',features:['Everything in Intelligence','Unlimited posts, series and campaigns','10 watched subjects','Social, email + blog planning','Complete learning loop'],href:'/amplifi/register?plan=amplifi_complete',cta:'Start Complete'}
] as const;

const modes = [
  {name:'Post',eyebrow:'ONE MOMENT',copy:'An announcement, offer, observation or timely idea becomes a finished piece with copy and creative.',href:'/amplifi/create?mode=post'},
  {name:'Series',eyebrow:'ONE IDEA, REPEATED WELL',copy:'Build coordinated thoughts, poems, tips, lessons, stories or recurring content without losing visual continuity.',href:'/amplifi/create?mode=series'},
  {name:'Campaign',eyebrow:'ONE GOAL, MANY MOVES',copy:'Amplifi connects strategy, creative, sequence, CTA and performance around one measurable objective.',href:'/amplifi/create?mode=campaign'}
] as const;

export default async function AmplifiMarketingPage({searchParams}:{searchParams:Promise<{url?:string;title?:string;capture?:string}>}) {
  const params = await searchParams;
  if(params.url||params.title||params.capture){
    const query=new URLSearchParams();
    if(params.url)query.set('url',params.url);
    if(params.title)query.set('title',params.title);
    if(params.capture)query.set('capture',params.capture);
    redirect(`/amplifi/workspace${query.toString()?`?${query.toString()}`:''}`);
  }

  return <main className="ampx-page">
    <nav className="ampx-nav">
      <AmplifiBrand />
      <div className="ampx-navlinks"><a href="#proof">Try it</a><a href="#create">Create</a><a href="#plans">Plans</a><Link href="/portal/login?next=%2Famplifi%2Fworkspace">Sign in</Link></div>
    </nav>

    <section className="ampx-hero">
      <div className="ampx-hero-copy">
        <span className="ampx-kicker">YOUR MARKETING OPERATING SYSTEM</span>
        <h1>Give Amplifi<br/>the goal.<br/><em>Get the campaign.</em></h1>
        <p>You already know what you want your business to accomplish. Amplifi turns that goal into strategy, copy, graphics, coordinated content, publishing and the next useful move.</p>
        <div className="ampx-hero-actions"><Link className="ampx-primary" href="/amplifi/create?mode=campaign">Create my sample campaign</Link><a className="ampx-secondary" href="#proof">See what you get</a></div>
        <small>No developer accounts required to create. Connect channels only when you are ready to publish.</small>
      </div>
      <div className="ampx-hero-media">
        <Image src="/amplifi/amplifi-person-laptop-v2.jpg" alt="Business owner using Amplifi to plan a campaign" fill priority sizes="(max-width: 900px) 100vw, 50vw"/>
        <div className="ampx-floating-card"><span>AMPLIFI</span><strong>Fill Tuesday afternoons.</strong><p>Strategy ready · 5 posts · Carousel · Video plan</p><b>Campaign ready</b></div>
      </div>
    </section>

    <section className="ampx-human-strip">
      <div className="ampx-human-copy"><span className="ampx-kicker">BUILT AROUND REAL GOALS</span><h2>More appointments. More registrations. More attention. More momentum.</h2><p>Amplifi starts with the thing the business is actually trying to change, then builds the communication system around it.</p></div>
      <div className="ampx-mosaic">
        <div className="ampx-img tall"><Image src="/home/ch7-consultant.jpg" alt="Consultant working with clients" fill sizes="33vw"/></div>
        <div className="ampx-img"><Image src="/home/ch7-healthcare.jpg" alt="Healthcare professional serving people" fill sizes="33vw"/></div>
        <div className="ampx-img"><Image src="/home/ch7-school.jpg" alt="Education and community work" fill sizes="33vw"/></div>
      </div>
    </section>

    <section className="ampx-proof" id="proof">
      <div className="ampx-proof-head"><span className="ampx-kicker">INSTANT PROOF</span><h2>Do not buy the promise.<br/><em>See the work.</em></h2><p>Answer a short guided set of questions. Amplifi builds a real campaign preview around your business and emails you a link so you can come back to it.</p></div>
      <div className="ampx-proof-stage">
        <div className="ampx-brief-card"><span>01 · YOUR BRIEF</span><h3>What are you trying to accomplish?</h3><div className="ampx-answer">Increase appointments</div><div className="ampx-answer">Busy professionals within 10 miles</div><div className="ampx-answer">Book midweek online</div><div className="ampx-answer">Fast booking + clear availability</div><Link href="/amplifi/create?mode=campaign">Build mine →</Link></div>
        <div className="ampx-output-card">
          <div className="ampx-output-top"><span>02 · AMPLIFI BUILDS</span><strong>Own Your Week</strong><p>A coordinated campaign built to turn midweek availability into a reason to act now.</p></div>
          <div className="ampx-output-grid">
            <article><b>01</b><h4>Campaign idea</h4><p>One sharp positioning concept.</p></article>
            <article><b>02</b><h4>Creative system</h4><p>Graphics, imagery and visual direction.</p></article>
            <article><b>03</b><h4>Post sequence</h4><p>Connected pieces, not random captions.</p></article>
            <article><b>04</b><h4>Next move</h4><p>What the data or workflow says to do next.</p></article>
          </div>
        </div>
      </div>
    </section>

    <section className="ampx-create" id="create">
      <div className="ampx-create-head"><span className="ampx-kicker">THREE WAYS TO CREATE</span><h2>One post.<br/>A recurring idea.<br/><em>Or the whole campaign.</em></h2></div>
      <div className="ampx-mode-grid">{modes.map((mode,index)=><Link href={mode.href} className="ampx-mode" key={mode.name}><span>0{index+1}</span><small>{mode.eyebrow}</small><h3>{mode.name}</h3><p>{mode.copy}</p><b>Create {mode.name.toLowerCase()} →</b></Link>)}</div>
    </section>

    <section className="ampx-system">
      <div className="ampx-system-image"><Image src="/amplifi/amplifi-person-phone-v2.jpg" alt="Entrepreneur reviewing Amplifi work on a phone" fill sizes="(max-width: 900px) 100vw, 45vw"/></div>
      <div className="ampx-system-copy"><span className="ampx-kicker">NOT JUST CONTENT</span><h2>Amplifi creates.<br/>Measures.<br/><em>Then diagnoses.</em></h2><p>A campaign is only useful if you can understand what happened. Amplifi can turn impressions, clicks and conversions into a plain-English diagnosis and a recommended next move.</p><div className="ampx-loop"><span>Goal</span><i>→</i><span>Create</span><i>→</i><span>Publish</span><i>→</i><span>Measure</span><i>→</i><span>Diagnose</span></div><Link href="/amplifi/performance">See Performance Intelligence →</Link></div>
    </section>

    <section className="ampx-growth">
      <div><span className="ampx-kicker">WHEN MARKETING IS NOT THE BOTTLENECK</span><h2>Sometimes the campaign reveals the system that needs fixing.</h2></div>
      <div className="ampx-growth-card"><span>OPPORTUNITY DETECTED</span><strong>Your campaign is getting clicks.</strong><p>But customers still have to call to book. Amplifi can flag the friction and surface a Growth System recommendation such as online reservations, CRM, follow-up automation, intake, payments or a client portal.</p><b>Marketing finds the demand. Better systems help capture it.</b></div>
    </section>

    <section className="ampx-plans" id="plans">
      <div className="ampx-plans-head"><span className="ampx-kicker">FOUR LEVELS</span><h2>Start by seeing the work.<br/><em>Grow into the system you need.</em></h2></div>
      <div className="ampx-plan-grid">{plans.map((plan,index)=><article className={`ampx-plan ${index===1?'featured':''}`} key={plan.name}>{index===1?<span className="ampx-plan-badge">BEST PLACE TO START</span>:null}<small>{plan.tag}</small><h3>{plan.name}</h3><div className="ampx-price">{plan.price}{plan.price!=='Free'?<span>/mo</span>:null}</div><p>{plan.copy}</p><ul>{plan.features.map(feature=><li key={feature}>{feature}</li>)}</ul><Link href={plan.href}>{plan.cta} →</Link></article>)}</div>
    </section>

    <section className="ampx-final">
      <span className="ampx-kicker">ONE BRIEF. EVERYWHERE.</span>
      <h2>You have a business to run.<br/><em>Marketing should not become another one.</em></h2>
      <p>Tell Amplifi what you want to happen.</p>
      <Link className="ampx-primary" href="/amplifi/create?mode=campaign">Create my sample campaign</Link>
      <small>Nothing publishes until you approve it.</small>
    </section>
  </main>;
}
