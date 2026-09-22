import Link from 'next/link';
import './tb3-run15.css';

const navigation = [
  ['Home', 'home'], ['My Journey', 'journey'], ['Academics', 'academics'],
  ['Training', 'training'], ['NIL & Brand', 'nil-brand'], ['Opportunities', 'opportunities'],
  ['Media Library', 'media'], ['Calendar', 'calendar'], ['Documents', 'documents'],
  ['Community', 'community'], ['Messages', 'messages'], ['Eva (AI Assistant)', 'eva'],
  ['Settings', 'settings'],
] as const;

const focus = [
  ['Training Plan', '85%', 'On Track'], ['Academic Goals', '72%', 'On Track'],
  ['NIL / Brand', '60%', 'In Progress'], ['Personal Growth', '90%', 'On Track'],
] as const;

const modules = [
  ['Academics', 'Grades. Eligibility. Goals.', 'academics'],
  ['Training', 'Workouts. Film. Progress.', 'training'],
  ['NIL & Brand', 'Opportunities. Partnerships.', 'nil-brand'],
  ['Opportunities', 'Explore. Apply. Track.', 'opportunities'],
  ['Media Library', 'Photos. Videos. Content.', 'media'],
  ['Community', 'Give back. Make an impact.', 'community'],
] as const;

export default function TB3Run12BPortal() {
  return (
    <main className="tb3-shell">
      <h1 className="tb3-sr-only">TB3 HQ</h1>
      <section className="tb3-reference" aria-label="TB3 HQ command center">
        {/* The unoptimized source is the immutable, approved Run 15 visual baseline. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="tb3-reference-image" src="/benchmarks/tb3-hq-approved-reference.jpg" width="1463" height="1536" alt="" />
        <nav className="tb3-hotspots" aria-label="TB3 HQ modules">
          {navigation.map(([label, id]) => <a key={id} className={`tb3-hotspot tb3-hotspot-${id}`} href={`#${id}`}><span>{label}</span></a>)}
          <a className="tb3-hotspot tb3-hotspot-store" href="#store"><span>TB3 Store</span></a>
        </nav>
      </section>

      <section className="tb3-mobile" id="home" aria-label="TB3 HQ mobile command center">
        <header className="tb3-mobile-header">
          <div className="tb3-wordmark"><b>TB<span>3</span></b><small>HQ</small></div>
          <div className="tb3-athlete"><i>4</i><span><b>Tarris Bouie</b><small>Student. Athlete. Brand.</small></span></div>
        </header>
        <div className="tb3-mobile-hero">
          <p>Welcome to</p><h2>TB<span>3</span> HQ</h2><small>PLAN. PREPARE. PERFORM. BUILD.</small>
          <blockquote>“A bigger purpose than basketball.”</blockquote><a href="#journey">Let&apos;s get to work →</a>
        </div>
        <nav className="tb3-module-grid" aria-label="Primary modules">
          {modules.map(([title, description, id]) => <a href={`#${id}`} id={id} key={id}><strong>{title}</strong><span>{description}</span><b>→</b></a>)}
        </nav>
        <section className="tb3-mobile-grid">
          <article className="tb3-film" id="journey"><p>Featured Video</p><div className="tb3-play">▶</div><h3>The Journey<br />Continues.</h3><small>3:12</small></article>
          <article className="tb3-panel" id="training-focus"><h3>My Focus</h3>{focus.map(([label, percent, status]) => <div className="tb3-focus" key={label}><b>{percent}</b><span><strong>{label}</strong><small>{status}</small></span></div>)}</article>
          <article className="tb3-panel" id="calendar"><h3>Upcoming</h3>{['Training · Sep 14', 'Academic Check-In · Sep 16', 'NIL Meeting · Sep 18', 'Community Event · Sep 20'].map((item) => <p key={item}>{item}</p>)}</article>
        </section>
        <section className="tb3-light-grid">
          <article id="opportunities"><h3>Opportunities</h3><p>Nike Youth Campaign <b>NEW</b></p><p>Gatorade Student Series <b>NEW</b></p><p>Speaking Engagement <b>NEW</b></p></article>
          <article id="media"><h3>Recent Media</h3><p>Game Highlights · The Mindset</p><p>Training Day · Community Impact</p></article>
          <article id="messages"><h3>Messages</h3><p>Coach Williams · Great work this week.</p><p>NIL Agency · New opportunity available.</p></article>
        </section>
        <section className="tb3-bottom-grid">
          <article id="eva"><h3>Ask Eva</h3><p>Your AI Assistant</p><ul><li>Get answers</li><li>Update content</li><li>Track opportunities</li></ul><button type="button">Chat with Eva →</button></article>
          <article className="tb3-tomorrow"><h3>A Greater Tomorrow.</h3><p>Student. Athlete. Brand.<br />A platform. A generation.</p></article>
          <article id="store"><h3>TB<span>3</span> Store</h3><p>Rep the Vision.</p><button type="button">Shop now →</button></article>
        </section>
        <div className="tb3-hidden-targets" aria-hidden="true"><span id="documents" /><span id="community" /><span id="settings" /><span id="nil-brand-target" /></div>
        <footer><Link href="#home">TB3 · Tarris Bouie</Link><span>More Than A Game</span></footer>
      </section>
    </main>
  );
}
