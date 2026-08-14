import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AmplifiBrand from './AmplifiBrand';
import AmplifiDemo from './AmplifiDemo';
import './amplifi-site.css';
import './amplifi-revision.css';

export const metadata: Metadata = {
  title: 'Amplifi | Your guided social media system',
  description: 'Amplifi researches, creates, organizes, and moves approved social media content forward through one guided system.',
};

const plans = [
  { level: '01', name: 'Social', price: '$29', cue: 'You provide what is happening.', promise: 'Amplifi creates the campaign and posts every approved message for you.', features: ['Add an event, update, offer, photo, or idea', 'Receive posts written for each connected channel', 'Review, approve, and schedule from one place', 'Amplifi publishes the approved posts', 'Track engagement and clicks'], href: '/amplifi/register?plan=amplifi_social', action: 'Begin with Social' },
  { level: '02', name: 'Intelligence', price: '$59', cue: 'Amplifi does the searching and creating.', promise: 'Amplifi finds timely opportunities, checks the sources, creates the campaign, and prepares it for your approval.', features: ['Everything in Social', 'Search a specific topic whenever you need it', 'Continuously monitor up to three subjects', 'Verify sources and filter irrelevant findings', 'Turn useful findings into complete campaigns'], href: '/contact?subject=Amplifi%20Intelligence%20access', action: 'Explore Intelligence' },
  { level: '03', name: 'Complete', price: '$129', cue: 'Amplifi helps manage the complete content operation.', promise: 'Research, campaign planning, content creation, approvals, publishing, and learning work together.', features: ['Everything in Social and Intelligence', 'Coordinated multi-channel campaign planning', 'Social, email, blog, graphic, and video concepts', 'Approval and publishing rules', 'Smartchitecture learning across every campaign'], href: '/contact?subject=Amplifi%20Complete%20access', action: 'Explore Complete' },
] as const;

const campaignPosts = [
  ['Facebook','Event announcement','Ready for review','/home/scene-event-registration.jpg'],['Instagram','Square announcement','Draft','/home/he-business-dinner.jpg'],['LinkedIn','Partner and sponsor post','Approved','/home/scene-business.jpg'],['Facebook','Registration reminder','Scheduled','/home/he-nonprofit-golf.jpg'],['Instagram','Activity spotlight','Ready for review','/home/he-creator-filming.jpg'],['LinkedIn','Sponsor recognition','Approved','/images/ctp-editorial/06-capacity-team-collaboration.png'],['Facebook','Deadline reminder','Scheduled','/home/ch1-why-start.jpg'],['Instagram','Day-of event post','Draft','/images/ctp-editorial/07-stewardship-community-service.png'],['LinkedIn','Thank-you and results','Planned','/images/ctp-editorial/08-growth-relaxed-service-team.png']
] as const;

const SocialLogo = ({platform}:{platform:string}) => <span className={`amp-social-logo ${platform.toLowerCase()}`} aria-label={platform}>{platform==='Facebook'?'f':platform==='Instagram'?'◎':'in'}</span>;

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
      <div className="amp-hero-visual"><Image src="/amplifi/amplifi-person-laptop-v2.jpg" alt="A business leader using Amplifi on a laptop" width={1672} height={941} priority sizes="(max-width: 900px) 100vw, 56vw"/><div className="amp-live-review"><span className="amp-mini-mark">A</span><div><small>READY FOR YOUR REVIEW</small><strong>Community event announcement</strong><p>Facebook · Instagram · LinkedIn</p></div><button>Approve</button></div></div>
    </section>

    <section className="amp-pressure"><div className="amp-pressure-layout"><div className="amp-pressure-head"><p className="amp-kicker">THE WEEKLY RESTART</p><h2>Your work gives you something worth sharing.<br/><em>Finding time to share it is the problem.</em></h2><p>You are already managing customers, programs, events, employees, and daily responsibilities. Social media still expects a steady stream of fresh content.</p></div><div className="amp-pressure-photo"><Image src="/home/ch2-invisible-work.jpg" alt="A business owner feeling the pressure of another social media deadline" width={1200} height={800}/></div></div><div className="amp-task-river" aria-label="The repeating social media workload">{([['spark','Decide what to say'],['search','Research the topic'],['write','Write the message'],['adapt','Adapt every channel'],['approve','Get approval'],['calendar','Schedule and publish'],['learn','Track what worked']] as [IconName,string][]).map(([icon,label], i) => <div className="amp-task" key={label}><span>{String(i+1).padStart(2,'0')}</span><Icon name={icon}/><b>{label}</b>{i < 6 && <i>›</i>}</div>)}<div className="amp-restart"><span>THEN</span><strong>Start again.</strong></div></div><p className="amp-pivot">Amplifi turns what is already happening into complete social media campaigns.</p></section>

    <section className="amp-campaign-proof" id="how">
      <header className="amp-campaign-intro"><div><p className="amp-kicker">ONE EVENT. A COMPLETE SET OF POSTS.</p><h2>Tell Amplifi about the event once.</h2></div><div className="amp-create-prompt"><p>Amplifi prepares the announcement, reminders, platform versions, day-of posts, thank-you message, and recap.</p><button>Create Campaign</button><span className="amp-cursor" aria-hidden="true">➤</span></div></header>
      <div className="amp-campaign-board">
        <aside><span>YOUR EVENT BRIEF</span><h3>Fall Fundraiser</h3><dl><div><dt>Date</dt><dd>October 18</dd></div><div><dt>Location</dt><dd>Community Center</dd></div><div><dt>Goal</dt><dd>Registrations and sponsor support</dd></div><div><dt>Audience</dt><dd>Members, supporters, community partners</dd></div><div><dt>Channels</dt><dd>Facebook, Instagram, LinkedIn</dd></div></dl><strong>One brief in.</strong></aside>
        <div className="amp-post-stream"><div className="amp-stream-head"><div><span>AMPLIFI CAMPAIGN</span><h3>9 posts prepared</h3></div><p>Every post includes its own image, platform-specific message, campaign purpose, and publishing status.</p></div><div className="amp-platform-posts">{campaignPosts.map(([platform,title,status,image],i)=><article key={title} className={`platform-${platform.toLowerCase()}`}><div><b><SocialLogo platform={platform}/>{platform}</b><small>{status}</small></div><div className="amp-post-image"><Image src={image} alt="" width={420} height={240}/></div><span>{String(i+1).padStart(2,'0')}</span><h4>{title}</h4><p>{i < 3 ? 'Introduce the event to the right audience.' : i < 6 ? 'Keep interest and registration moving.' : 'Carry the story through the event and beyond.'}</p><div className="amp-post-actions"><button>Deny</button><button>Edit</button><button>Approve</button></div></article>)}</div></div>
      </div>
    </section>

    <section className="amp-intelligence" id="smartchitecture"><div className="amp-intro"><p className="amp-kicker">SMARTCHITECTURE</p><h2>The intelligence Amplifi builds around <em>your organization.</em></h2><p><strong>Smartchitecture learns how your organization communicates, who it serves, what it promotes, which topics matter, who approves content, and what may or may not be published.</strong> That knowledge becomes the foundation Amplifi uses whenever it researches, creates, schedules, publishes, or improves your content.</p><p>Most content tools start from zero every time. Smartchitecture keeps your voice, audience, goals, rules, and campaign learning connected, so Amplifi becomes more useful and consistent instead of treating every post like an unrelated assignment.</p></div><div className="amp-intelligence-stage"><div className="amp-signal amp-signal-left"><span>WHAT IT LEARNS</span><b>Your voice</b><b>Your audience</b><b>Your goals</b><b>Your approval rules</b><b>Your publishing limits</b></div><div className="amp-smart-core"><Image src="/amplifi/amplifi-logo-premium.png" alt="Amplifi by Efficiency Architects" width={1973} height={797}/><p>Smartchitecture turns Amplifi from a content generator into a social media system that understands how your organization works.</p></div><div className="amp-signal amp-signal-right"><span>WHY IT MATTERS</span><b>On-brand content</b><b>Relevant research</b><b>Consistent rules</b><b>Faster approvals</b><b>Better campaigns over time</b></div></div><div className="amp-smart-impact"><strong>The impact</strong><p>Less explaining. Fewer off-brand drafts. Consistent approvals. Knowledge that stays with the organization when staff or responsibilities change.</p></div></section>

    <section className="amp-research"><div className="amp-research-copy"><p className="amp-kicker">AMPLIFI INTELLIGENCE</p><h2>It does the searching.<br/>Then it creates the content.</h2><p>Choose the subjects, industries, competitors, community issues, or trends that matter. Amplifi finds useful developments, checks the sources, explains why they matter, and creates platform-ready posts.</p><dl><div><dt>Search once</dt><dd>Research a specific topic when you need an answer or campaign now.</dd></div><div><dt>Keep watching</dt><dd>Continuously monitor up to three approved subjects and turn useful findings into content.</dd></div></dl></div><div className="amp-research-screen"><div className="amp-screen-bar"><span className="amp-mini-mark">A</span><b>Smart Research</b><button>Watch a subject</button></div><div className="amp-watch"><small>WATCHING</small><strong>Local funding opportunities</strong><em>New verified finding</em></div><div className="amp-finding"><span>TIMELY OPPORTUNITY</span><h3>A new small-business grant was announced.</h3><p>Amplifi verified the announcement, identified why it matters to your audience, and prepared Facebook, Instagram, and LinkedIn posts explaining the opportunity.</p><div><small>Official source · Published today</small><button>Review 3 posts</button></div></div><div className="amp-source-trail"><span>Source link saved</span><span>Audience relevance explained</span><span>3 posts ready for review</span></div></div></section>

    <section className="amp-plans" id="plans"><header><p className="amp-kicker">THREE LEVELS OF SUPPORT</p><h2>You bring the update. Amplifi finds the opportunity. Or Amplifi manages the complete campaign.</h2></header><div className="amp-plan-journey">{plans.map((plan, index) => <article className={index === 1 ? 'is-featured' : ''} key={plan.name}><div className="amp-plan-index"><span>{plan.level}</span><i/></div><div className="amp-plan-main"><p>{plan.cue}</p><h3>{plan.name}</h3><h4>{plan.promise}</h4><ul>{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul></div><div className="amp-plan-price"><strong>{plan.price}</strong><small>per month</small><Link href={plan.href}>{plan.action} <span>↗</span></Link></div></article>)}</div></section>

    <AmplifiDemo />

    <section className="amp-human-story"><div className="amp-created-post"><div className="amp-created-post-shell"><div className="amp-created-post-head"><SocialLogo platform="Instagram"/><div><b>Fall Fundraiser</b><small>READY FOR REVIEW</small></div></div><Image src="/home/he-nonprofit-golf.jpg" alt="Golf fundraiser social media post" width={1200} height={800}/><div className="amp-created-caption"><strong>Bring your best swing. Build a stronger community.</strong><p>Join us October 18 for an afternoon of golf, connection, and purpose. Registration is now open.</p></div><div className="amp-created-actions"><button>Decline</button><button>Edit</button><button>Approve</button></div></div></div><div className="amp-human-copy"><p className="amp-kicker">CONTROL WITHOUT THE DESK</p><h2>Review the finished post from anywhere.</h2><p>Amplifi prepares the image, writes the platform-specific message, and presents the completed post for your decision. Approve it, decline it, or make an edit from your phone.</p><blockquote>You remain in control. Amplifi handles the follow-through.</blockquote></div></section>

    <section className="amp-posting-promise"><p className="amp-kicker">FROM APPROVAL TO PUBLISHING</p><h2>Amplifi does the posting for you!</h2><p>Connect your approved Facebook, Instagram, and LinkedIn accounts. After you approve the campaign, Amplifi places every post on the calendar and publishes it to the correct account at the scheduled time.</p><div><span><SocialLogo platform="Facebook"/>A version written for Facebook</span><span><SocialLogo platform="Instagram"/>A version built for Instagram</span><span><SocialLogo platform="LinkedIn"/>A version prepared for LinkedIn</span></div><strong>Nothing publishes until you approve it. Once approved, Amplifi handles the scheduled follow-through.</strong></section>

    <section className="amp-outcomes"><p className="amp-kicker">WHAT CHANGES</p><h2>Three practical differences in your week.</h2><div className="amp-outcome-list"><article><span>01</span><div><small>FROM</small><p>Trying to create every social media post yourself</p></div><i>→</i><div><small>TO</small><h3>Complete, platform-ready posts waiting for your approval</h3></div></article><article><span>02</span><div><small>FROM</small><p>Posting one announcement and remembering every follow-up</p></div><i>→</i><div><small>TO</small><h3>A complete campaign scheduled from announcement through recap</h3></div></article><article><span>03</span><div><small>FROM</small><p>Logging into every social account to publish manually</p></div><i>→</i><div><small>TO</small><h3>Amplifi publishing every approved post at the scheduled time</h3></div></article></div></section>

    <section className="amp-close"><AmplifiBrand /><h2>Social media will keep asking for more content.</h2><h3>You do not have to keep creating it alone.</h3><p>Start with a real event, update, offer, or objective. Amplifi helps turn it into a clear, controlled content system.</p><div className="amp-actions"><Link className="amp-btn amp-btn-primary" href="/amplifi/pricing">Choose your Amplifi level</Link><a className="amp-text-link" href="#demo">Experience the campaign demo <span>↑</span></a></div></section>
    <footer className="amp-footer"><p>© {new Date().getFullYear()} Ascension Systems LLC</p><nav><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/contact">Contact</Link></nav></footer>
  </main>;
}
