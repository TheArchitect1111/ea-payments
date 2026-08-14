import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AmplifiBrand from './AmplifiBrand';
import AmplifiDemo from './AmplifiDemo';
import './amplifi-site.css';

export const metadata: Metadata = {
  title: 'Amplifi | Your guided social media system',
  description: 'Amplifi researches, creates, organizes, and moves approved social media content forward through one guided system.',
};

const plans = [
  { level: '01', name: 'Social', price: '$29', cue: 'You bring what is happening.', promise: 'Amplifi turns your update, event, offer, photo, or idea into social content ready for review.', features: ['Posts written in your voice', 'Versions for each connected channel', 'Visual and caption preparation', 'Review, scheduling, and publishing', 'Engagement and click tracking'], href: '/amplifi/register?plan=amplifi_social', action: 'Begin with Social' },
  { level: '02', name: 'Intelligence', price: '$59', cue: 'Amplifi finds what is worth saying.', promise: 'Amplifi does the searching and creates the content for you, so useful opportunities do not depend on your spare time.', features: ['Everything in Social', 'One-time research on demand', 'Continuous monitoring of up to three subjects', 'Source checks and noise filtering', 'Findings converted into ready-to-review posts'], href: '/contact?subject=Amplifi%20Intelligence%20access', action: 'Explore Intelligence' },
  { level: '03', name: 'Complete', price: '$129', cue: 'You bring the objective.', promise: 'Amplifi guides the full campaign across research, messaging, approvals, publishing, and results.', features: ['Everything in Social and Intelligence', 'Campaign strategy and audience guidance', 'Social, email, blog, graphic, and video concepts', 'Approval and automation rules', 'Learning across the complete campaign'], href: '/contact?subject=Amplifi%20Complete%20access', action: 'Explore Complete' },
] as const;

type IconName = 'spark' | 'search' | 'write' | 'adapt' | 'approve' | 'calendar' | 'learn';

const Icon = ({ name }: { name: IconName }) => {
  const paths = {
    spark: <><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="3.5"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></>,
    write: <><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></>,
    adapt: <><path d="M7 7h10M7 17h10M4 4v6M20 14v6"/><path d="m4 10 2-2M20 14l-2 2"/></>,
    approve: <><path d="M20 11.1V12a8 8 0 1 1-4.7-7.3"/><path d="m9 11 3 3L22 4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 15h3"/></>,
    learn: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V2"/><path d="M2 21h22"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
};

export default async function AmplifiMarketingPage({ searchParams }: { searchParams: Promise<{ url?: string; title?: string; capture?: string }> }) {
  const params = await searchParams;
  if (params.url || params.title || params.capture) {
    const query = new URLSearchParams();
    if (params.url) query.set('url', params.url);
    if (params.title) query.set('title', params.title);
    if (params.capture) query.set('capture', params.capture);
    redirect(`/amplifi/workspace${query.toString() ? `?${query.toString()}` : ''}`);
  }

  return <main className="amp-page">
    <nav className="amp-nav"><AmplifiBrand /><div><a href="#how">How it works</a><a href="#smartchitecture">Smartchitecture</a><a href="#plans">Plans</a><Link href="/portal/login?next=%2Famplifi%2Fworkspace">Sign in</Link></div></nav>

    <section className="amp-hero">
      <div className="amp-hero-copy"><p className="amp-kicker">YOUR GUIDED SOCIAL MEDIA SYSTEM</p><h1>Social media always needs <em>another post.</em></h1><p className="amp-lead">Amplifi helps research, create, organize, and move approved content forward, so your message stays active without consuming your day.</p><div className="amp-actions"><a className="amp-btn amp-btn-primary" href="#demo">Experience the campaign demo</a><a className="amp-text-link" href="#plans">Compare the three levels <span>↗</span></a></div></div>
      <div className="amp-hero-visual"><Image src="/amplifi/amplifi-person-laptop.png" alt="A business leader using Amplifi on a laptop" fill priority sizes="(max-width: 900px) 100vw, 56vw"/><div className="amp-live-review"><span className="amp-mini-mark">A</span><div><small>READY FOR YOUR REVIEW</small><strong>Community event announcement</strong><p>Facebook · Instagram · LinkedIn</p></div><button>Approve</button></div></div>
    </section>

    <section className="amp-pressure"><div className="amp-pressure-head"><p className="amp-kicker">THE WEEKLY RESTART</p><h2>One post is manageable.<br/><em>Starting over every week is the problem.</em></h2></div><div className="amp-task-river" aria-label="The repeating social media workload">{([['spark','Decide what to say'],['search','Research the topic'],['write','Write the message'],['adapt','Adapt every channel'],['approve','Get approval'],['calendar','Schedule and publish'],['learn','Track what worked']] as [IconName,string][]).map(([icon,label], i) => <div className="amp-task" key={label}><span>{String(i+1).padStart(2,'0')}</span><Icon name={icon}/><b>{label}</b>{i < 6 && <i>›</i>}</div>)}<div className="amp-restart"><span>THEN</span><strong>Start again.</strong></div></div><p className="amp-pivot">Amplifi turns the restart into a system.</p></section>

    <section className="amp-story" id="how"><header><p className="amp-kicker">ONE GUIDED PATH</p><h2>Bring what is happening.<br/>Amplifi carries it forward.</h2><p>Instead of six disconnected tools and a blank page, you move through one clear process with control at every decision.</p></header><div className="amp-story-line"><div className="amp-origin"><span>YOU ADD</span><h3>Fall fundraiser</h3><p>Date, goal, location, link, and one photo.</p></div><div className="amp-route" aria-hidden="true"><i/><i/><i/><i/><i/></div><div className="amp-moments"><article><Icon name="write"/><span>01</span><h3>Shape</h3><p>Amplifi applies your voice, audience, and goal.</p></article><article><Icon name="adapt"/><span>02</span><h3>Adapt</h3><p>Each channel receives the version it needs.</p></article><article><Icon name="approve"/><span>03</span><h3>Decide</h3><p>You approve, edit, replace, or request a change.</p></article><article><Icon name="calendar"/><span>04</span><h3>Move</h3><p>Approved content enters the calendar and publishes.</p></article><article><Icon name="learn"/><span>05</span><h3>Learn</h3><p>Results strengthen what Amplifi recommends next.</p></article></div><div className="amp-result"><span>AMPLIFI PREPARES</span><strong>9 coordinated posts</strong><small>Ready for your review</small></div></div></section>

    <section className="amp-intelligence" id="smartchitecture"><div className="amp-intro"><p className="amp-kicker">SMARTCHITECTURE</p><h2>The intelligence is not a separate feature.<br/><em>It connects the entire process.</em></h2><p>Smartchitecture preserves how your organization communicates, what it watches, who approves the work, when content can publish, and what audiences respond to.</p></div><div className="amp-intelligence-stage"><div className="amp-signal amp-signal-left"><span>CONTEXT</span><b>Your voice</b><b>Your audience</b><b>Your rules</b><b>Your goals</b></div><div className="amp-smart-core"><Image src="/amplifi/amplifi-logo-premium.png" alt="Amplifi by Efficiency Architects" width={1973} height={797}/><p>Smartchitecture keeps the knowledge behind the content connected.</p></div><div className="amp-signal amp-signal-right"><span>ACTION</span><b>Research</b><b>Creation</b><b>Approval</b><b>Publishing</b><b>Learning</b></div></div></section>

    <section className="amp-research"><div className="amp-research-copy"><p className="amp-kicker">AMPLIFI INTELLIGENCE</p><h2>It does the searching.<br/>Then it creates the content.</h2><p>Choose the subjects, industries, competitors, community issues, or trends that matter. Amplifi finds useful developments, checks the sources, recommends an angle, and prepares posts for review.</p><dl><div><dt>Search once</dt><dd>Research a specific topic when you need ideas or context now.</dd></div><div><dt>Keep watching</dt><dd>Continuously monitor up to three approved subjects for useful changes.</dd></div></dl></div><div className="amp-research-screen"><div className="amp-screen-bar"><span className="amp-mini-mark">A</span><b>Smart Research</b><button>Watch a subject</button></div><div className="amp-watch"><small>WATCHING</small><strong>Small business customer retention</strong><em>8 useful updates</em></div><div className="amp-finding"><span>NEW OPPORTUNITY</span><h3>Behind-the-scenes service stories are building trust.</h3><p>Three credible sources point to the same opportunity. Amplifi has preserved the source history and prepared a useful angle for your audience.</p><div><small>3 sources checked</small><button>Create the posts</button></div></div><div className="amp-source-trail"><span>Source history preserved</span><span>Repeated noise filtered</span><span>Ready for review</span></div></div></section>

    <section className="amp-plans" id="plans"><header><p className="amp-kicker">THREE LEVELS OF SUPPORT</p><h2>Choose where Amplifi begins<br/>and how far it carries the work.</h2></header><div className="amp-plan-journey">{plans.map((plan, index) => <article className={index === 1 ? 'is-featured' : ''} key={plan.name}><div className="amp-plan-index"><span>{plan.level}</span><i/></div><div className="amp-plan-main"><p>{plan.cue}</p><h3>{plan.name}</h3><h4>{plan.promise}</h4><ul>{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul></div><div className="amp-plan-price"><strong>{plan.price}</strong><small>per month</small><Link href={plan.href}>{plan.action} <span>↗</span></Link></div></article>)}</div></section>

    <AmplifiDemo />

    <section className="amp-human-story"><div className="amp-human-image"><Image src="/amplifi/amplifi-person-phone.png" alt="A business leader reviewing Amplifi from a phone" fill sizes="(max-width: 900px) 100vw, 52vw"/></div><div className="amp-human-copy"><p className="amp-kicker">CONTROL WITHOUT THE DESK</p><h2>Review the work.<br/>Keep your day.</h2><p>Approve a post, request a change, adjust the schedule, or check campaign progress from your phone. Amplifi prepares the work. You remain the decision-maker.</p><blockquote>Nothing publishes outside the control level you choose.</blockquote></div></section>

    <section className="amp-outcomes"><p className="amp-kicker">WHAT CHANGES</p><h2>Three shifts you can feel in the work.</h2><div className="amp-outcome-list"><article><span>01</span><div><small>FROM</small><p>A blank page and another deadline</p></div><i>→</i><div><small>TO</small><h3>A guided draft ready to shape</h3></div></article><article><span>02</span><div><small>FROM</small><p>One event and scattered reminders</p></div><i>→</i><div><small>TO</small><h3>A complete, coordinated campaign</h3></div></article><article><span>03</span><div><small>FROM</small><p>Good intentions and inconsistent posting</p></div><i>→</i><div><small>TO</small><h3>A visible rhythm that keeps moving</h3></div></article></div></section>

    <section className="amp-close"><AmplifiBrand /><h2>Social media will keep asking for more content.</h2><h3>You do not have to keep creating it alone.</h3><p>Start with a real event, update, offer, or objective. Amplifi helps turn it into a clear, controlled content system.</p><div className="amp-actions"><Link className="amp-btn amp-btn-primary" href="/amplifi/pricing">Choose your Amplifi level</Link><a className="amp-text-link" href="#demo">Experience the campaign demo <span>↑</span></a></div></section>
    <footer className="amp-footer"><p>© {new Date().getFullYear()} Ascension Systems LLC</p><nav><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/contact">Contact</Link></nav></footer>
  </main>;
}
