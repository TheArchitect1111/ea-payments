import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import AmplifiBrand from './AmplifiBrand';
import './amplifi-v3.css';

export const metadata: Metadata={
  title:'Amplifi | Focus on your craft.',
  description:'Focus on your craft. Let Amplifi handle the social media. Find relevant ideas, create premium content, review it and keep moving.'
};

const preview='/api/amplifi/trial?next=%2Famplifi%2Fcreate%3Fmode%3Dcampaign';

const people=[
  {src:'/amplifi/amplifi-person-laptop-v2.jpg',alt:'Business owner focused on work'},
  {src:'/home/ch7-consultant.jpg',alt:'Professional meeting with a client'},
  {src:'/home/ch7-healthcare.jpg',alt:'Healthcare professional focused on patients'},
  {src:'/home/ch7-school.jpg',alt:'Community leader focused on people'}
];

const posts=[
  {
    image:'/home/ch7-consultant.jpg',
    eyebrow:'PROFESSIONAL SERVICES',
    headline:'Your biggest competitor might be “I’ll do it later.”',
    caption:'Your clients do not always need more information. Sometimes they need a clear reason to move. This post turns hesitation into a next step without sounding like a sales pitch.',
    reason:'Timely, useful, and tied to a real customer behavior.'
  },
  {
    image:'/home/ch7-healthcare.jpg',
    eyebrow:'HEALTH + WELLNESS',
    headline:'Feeling fine is not the same as staying ahead.',
    caption:'A calm, confident reminder that prevention is easier than recovery. Built to educate first, then invite the right next action.',
    reason:'Educational content that earns attention before asking for it.'
  },
  {
    image:'/home/ch7-school.jpg',
    eyebrow:'COMMUNITY + NONPROFIT',
    headline:'The work changes lives. The story helps more people find it.',
    caption:'Turn a real moment from the work into a post that shows impact, builds trust, and gives supporters a reason to lean in.',
    reason:'Mission-led storytelling with a clear purpose.'
  }
];

export default function Page(){return <main className="ampx-page ampx-craft">
  <nav className="ampx-nav"><AmplifiBrand/><div className="ampx-navlinks"><Link href="/amplifi/pricing">Plans</Link><Link href="/portal/login?next=%2Famplifi%2Fworkspace">Sign in</Link></div></nav>

  <section className="ampx-hero craft-hero">
    <div className="ampx-hero-copy">
      <span className="ampx-kicker">AMPLIFI</span>
      <h1>Focus on your craft.<br/><em>Let Amplifi handle the social media.</em></h1>
      <p>You have better things to do than constantly figure out what to post. Amplifi helps find relevant ideas, create polished content, organize it for approval, and keep your social media moving.</p>
      <div className="ampx-hero-actions"><a className="ampx-primary" href={preview}>Try Amplifi Free</a></div>
      <small>No payment. No social connection. Nothing publishes.</small>
    </div>
    <div className="ampx-hero-media">
      <Image src="/amplifi/amplifi-person-laptop-v2.jpg" alt="Business owner focused on their craft" fill priority sizes="(max-width:900px) 100vw,50vw"/>
      <div className="ampx-floating-card"><span>AMPLIFI</span><strong>3 posts are ready for you.</strong><p>You keep working. Amplifi keeps social moving.</p></div>
    </div>
  </section>

  <section className="craft-pain">
    <span className="ampx-kicker">THE PROBLEM</span>
    <h2>Social media keeps asking for more.</h2>
    <p>You post today. Tomorrow it needs another idea, another caption, another graphic, another video. And it still has to feel relevant, polished, and worth someone’s attention.</p>
    <div className="craft-demand-row"><span>What should I post?</span><span>I need another idea.</span><span>I haven’t posted this week.</span><span>I need a graphic.</span><span>What should I say?</span><span>I don’t have time for this.</span></div>
    <h3>Meanwhile, you have actual work to do.</h3>
  </section>

  <section className="craft-people">
    <div className="craft-section-head"><span className="ampx-kicker">FOUR PEOPLE. SAME PROBLEM.</span><h2>The work changes. The social media demand doesn’t.</h2><p>Different crafts. Same pressure to keep showing up online.</p></div>
    <div className="craft-people-grid">{people.map((p,i)=><article key={p.src}><div className="craft-person-img"><Image src={p.src} alt={p.alt} fill sizes="(max-width:700px) 50vw,25vw"/></div><div className="craft-person-demand"><span>{['What should I post?','I need another idea.','I need a graphic.','I haven’t posted this week.'][i]}</span><b>AMPLIFI IS HANDLING IT →</b></div></article>)}</div>
    <h3 className="craft-center-line">Your attention stays on the work that matters.</h3>
  </section>

  <section className="craft-try">
    <div><span className="ampx-kicker">TRY AMPLIFI</span><h2>See what Amplifi would create for your business.</h2><p>Give Amplifi three simple answers. It will turn them into a campaign you can actually see.</p></div>
    <div className="craft-try-card"><span>YOUR FIRST CAMPAIGN</span><h3>Three answers. One real preview.</h3><p>No marketing plan. No perfect prompt. Just tell Amplifi what you do, what you want to accomplish, and what you want people to do next.</p><a className="ampx-primary" href={preview}>Try Amplifi Free</a><small>The button opens the 3-question experience.</small></div>
  </section>

  <section className="craft-focus">
    <span className="ampx-kicker">BUILT AROUND YOUR TIME</span><h2>Designed so you can focus on your craft.</h2><p>Amplifi helps figure out what is worth talking about, what is relevant right now, what to say, what kind of content fits, and what should happen next. Then it helps create the content.</p><strong>You remain in control without carrying the whole social-media workload.</strong>
  </section>

  <section className="craft-brains">
    <div className="craft-section-head"><span className="ampx-kicker">THE THINKING IS BUILT IN</span><h2>Smartchitecture + Eva</h2></div>
    <div className="craft-brain-grid">
      <article><span>SMARTCHITECTURE</span><h3>The thinking behind Amplifi.</h3><p>Smartchitecture connects what Amplifi knows about your business with what you are trying to accomplish.</p><ul><li>What should we focus on?</li><li>What is relevant?</li><li>What should we say?</li><li>What should we create?</li><li>What should we try next?</li></ul></article>
      <article><span>EVA</span><h3>Your guide inside Amplifi.</h3><p>Tell Eva what you are trying to accomplish. Ask what you should post. Talk through an idea. Ask what is working and what should happen next.</p><div className="craft-eva-chat"><small>YOU</small><b>Eva, what should we talk about this week?</b><small>EVA</small><b>I found three ideas that fit your audience. Let’s start with the strongest one.</b></div></article>
    </div>
    <h3 className="craft-center-line">Smartchitecture does the thinking. Eva guides you through it. Amplifi helps get it done.</h3>
  </section>

  <section className="craft-three">
    <span className="ampx-kicker">NO MORE BLANK SCREEN</span><h2>Bring an idea. Save an idea. Or let Amplifi find one.</h2>
    <div className="craft-three-grid">
      <article><b>01</b><h3>Ask Eva</h3><p>Have something in mind? Tell Eva. A simple thought can become usable content.</p></article>
      <article><b>02</b><h3>Idea Box</h3><p>Drop in a thought, event, inspiration, image, file, or link. Amplifi helps find the opportunity inside it.</p></article>
      <article><b>03</b><h3>Custom Search + Build</h3><p>Tell Amplifi what to look for. It can find relevant information and turn the strongest opportunity into content.</p></article>
    </div>
  </section>

  <section className="craft-search">
    <div className="craft-search-copy"><span className="ampx-kicker">CUSTOM SEARCH + BUILD</span><h2>Let Amplifi find something worth talking about.</h2><p>Give Amplifi a topic, issue, audience, event, or trend. It searches for relevant information, identifies useful possibilities, and helps turn the best one into a post.</p></div>
    <div className="craft-search-ui"><small>WHAT SHOULD AMPLIFI LOOK FOR?</small><div className="craft-search-input"><span>New developments affecting small-business owners</span><b>Search + Build</b></div><div className="craft-found"><span>BEST OPPORTUNITY</span><strong>A change your audience should know about.</strong><p>Amplifi explains why it matters and suggests the angle your business can own.</p><small>AMPLIFI’S ANGLE</small><p>Make the update useful, specific, and easy to act on.</p><button>Build This Post →</button></div></div>
  </section>

  <section className="craft-premium">
    <div className="craft-section-head"><span className="ampx-kicker">THE CONTENT IS THE PROOF</span><h2>Posts should look worth paying for.</h2><p>Amplifi is not here to fill a calendar with generic filler. The goal is content you would be proud to put your name on.</p></div>
    <div className="premium-post-grid">{posts.map((post,i)=><article className="premium-post" key={post.headline}><div className="premium-post-creative"><Image src={post.image} alt="Premium social post example" fill sizes="(max-width:800px) 100vw,33vw"/><div className="premium-post-shade"/><div className="premium-post-copy"><span>{post.eyebrow}</span><h3>{post.headline}</h3></div></div><div className="premium-post-meta"><small>AMPLIFI CAPTION</small><p>{post.caption}</p><b>{post.reason}</b><div className="craft-actions"><button>Approve</button><button>Edit</button><button>Skip</button></div></div></article>)}</div>
  </section>

  <section className="craft-approval">
    <div className="craft-section-head"><span className="ampx-kicker">YOUR APPROVAL FOLDER</span><h2>Amplifi does the work. You make the call.</h2><p>Finished posts are stored together for review. See the visual, read the caption, understand why Amplifi recommends it, then approve, edit, or skip.</p></div>
    <div className="craft-approval-stack"><div className="craft-approval-head"><span>READY FOR APPROVAL</span><b>3 premium posts waiting</b></div>{posts.slice(0,2).map((post,i)=><article key={post.headline}><div className="approval-thumb"><Image src={post.image} alt="Post ready for approval" fill sizes="180px"/></div><div className="approval-copy"><small>POST {String(i+1).padStart(2,'0')} · WHY AMPLIFI CREATED THIS</small><h3>{post.headline}</h3><p>{post.reason}</p><div className="craft-actions"><button>Approve</button><button>Edit</button><button>Skip</button></div></div></article>)}</div>
  </section>

  <section className="craft-flow"><span className="ampx-kicker">FROM ONE IDEA TO AN ENTIRE CAMPAIGN</span><h2>Start with what you know.</h2><blockquote>“Tuesday nights are slow.”</blockquote><div className="craft-flow-row"><span>The idea</span><i>→</i><span>The message</span><i>→</i><span>The posts</span><i>→</i><span>The graphics</span><i>→</i><span>The captions</span><i>→</i><span>The campaign</span></div><h3>You bring the goal. Amplifi helps build what comes next.</h3></section>

  <section className="craft-learns"><div><span className="ampx-kicker">AMPLIFI GETS SMARTER</span><h2>The more Amplifi understands, the less you have to explain.</h2><p>Amplifi remembers important context about your business, audience, goals, previous campaigns, ideas, and available results. So every conversation does not start from zero.</p></div><div className="craft-truth"><article><b>KNOWS</b><p>What you told Amplifi.</p></article><article><b>OBSERVES</b><p>What the evidence shows.</p></article><article><b>INFERS</b><p>What may be happening.</p></article><article><b>RECOMMENDS</b><p>What makes sense to try next.</p></article></div></section>

  <section className="craft-next"><span className="ampx-kicker">KEEP MOVING</span><h2>You should not need another great idea tomorrow.</h2><p>Amplifi helps keep watch for what is happening, what is relevant, what is worth talking about, what is working, what is in your Idea Box, and what makes sense next.</p><blockquote>“Eva, what should we do next?”</blockquote></section>

  <section className="craft-trial"><span className="ampx-kicker">10-DAY TRIAL</span><h2>Put Amplifi to work.</h2><p>Start with your free campaign. Then bring your own ideas, use the Idea Box, let Amplifi search for relevant content, create posts, and review the work in your Approval Folder.</p><div className="craft-trial-points"><span>No developer accounts.</span><span>No complicated setup.</span><span>No social-media expertise required.</span></div><a className="ampx-primary" href={preview}>Try Amplifi Free</a></section>

  <section className="ampx-final craft-final"><span className="ampx-kicker">AMPLIFI</span><h2>Focus on your craft.<br/><em>Let Amplifi handle the social media.</em></h2><a className="ampx-primary" href={preview}>Try Amplifi Free</a></section>
</main>}
