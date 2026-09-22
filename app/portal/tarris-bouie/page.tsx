import Link from 'next/link';
import '../tb3-run12b/tb3-run15.css';

const nav = [
  ['⌂','Home',''], ['↗','My Journey','journey'], ['A','Academics','academics'],
  ['T','Training','training'], ['N','NIL & Brand','nil-brand'], ['◎','Opportunities','opportunities'],
  ['▶','Media Library','media'], ['□','Calendar','calendar'], ['D','Documents','documents'],
  ['C','Community','community'], ['M','Messages','messages'], ['E','Eva','eva'], ['⚙','Settings','settings'],
] as const;

const quick = [
  ['Academics','Grades, eligibility, goals','academics'],
  ['Training','Workouts, film, progress','training'],
  ['NIL & Brand','Opportunities, partnerships','nil-brand'],
  ['Opportunities','Explore, apply, track','opportunities'],
  ['Media Library','Photos, videos, content','media'],
  ['Community','Give back, make an impact','community'],
] as const;

const media = [
  ['Game Highlights','3:12'], ['The Mindset','5:24'], ['Training Day','4:08'], ['Community Impact','2:37'],
] as const;

const href = (module:string) => module ? `/portal/tarris-bouie/${module}` : '/portal/tarris-bouie';

export default function TarrisBouiePortal() {
  return <main className="tb3-app">
    <aside className="tb3-sidebar">
      <Link className="tb3-brand" href="/portal/tarris-bouie"><span>TB3</span><small>HQ</small><em>MORE THAN A GAME</em></Link>
      <nav aria-label="TB3 HQ modules">{nav.map(([icon,label,module]) =>
        <Link key={label} className={module ? '' : 'active'} href={href(module)}><b aria-hidden>{icon}</b><span>{label}</span></Link>
      )}</nav>
      <div className="tb3-sidebar-art"><strong>4</strong><span>Different<br/>On Purpose.</span></div>
    </aside>

    <section className="tb3-workspace">
      <header className="tb3-topbar">
        <label><span>⌕</span><input aria-label="Search TB3 HQ" placeholder="Search TB3 HQ..." /></label>
        <div className="tb3-profile"><span className="tb3-bell">●</span><span className="tb3-avatar">TB</span><p><strong>Tarris Bouie</strong><small>Student. Athlete. Brand.</small></p></div>
      </header>

      <section className="tb3-hero">
        <div className="tb3-hero-copy"><small>WELCOME TO</small><h1><span>TB3</span> HQ</h1><p className="tb3-kicker">PLAN. PREPARE. PERFORM. BUILD.</p><blockquote>“A bigger purpose<br/>than basketball.”</blockquote><cite>— TARRIS BOUIE III</cite><Link href="/portal/tarris-bouie/journey">LET&apos;S GET TO WORK <b>→</b></Link></div>
        <div className="tb3-athlete-art" aria-label="Tarris Bouie athlete artwork"><span className="tb3-number">4</span><span className="tb3-silhouette">TB</span></div>
        <div className="tb3-purpose"><b>DISCIPLINE</b><b>DETERMINATION</b><b>DEVELOPMENT</b><b>DESTINY</b><i>Different<br/>On Purpose.</i><span>SAME VISION<br/>BIGGER PURPOSE</span></div>
      </section>

      <nav className="tb3-quick" aria-label="Quick access">{quick.map(([title,copy,module]) =>
        <Link href={href(module)} key={title}><b>{title}</b><span>{copy}</span><em>→</em></Link>
      )}</nav>

      <section className="tb3-dashboard">
        <Link className="tb3-card tb3-feature" href="/portal/tarris-bouie/journey"><span className="tb3-label">FEATURED VIDEO</span><div className="tb3-video-mark">▶</div><h2>THE<br/>JOURNEY<br/>CONTINUES.</h2><small>ALABAMA · 4</small></Link>

        <article className="tb3-card tb3-focus"><header><span>MY FOCUS</span><Link href="/portal/tarris-bouie/journey">Edit →</Link></header>{[['85','Training Plan'],['74','Academic Goals'],['62','NIL / Brand'],['90','Personal Growth']].map(([n,t])=><div className="tb3-focus-row" key={t}><i style={{'--p':`${n}%`} as React.CSSProperties}>{n}%</i><p><b>{t}</b><small>On Track</small></p></div>)}</article>

        <article className="tb3-card tb3-upcoming"><header><span>UPCOMING</span><Link href="/portal/tarris-bouie/calendar">View All →</Link></header>{[['14','Training: Strength & Conditioning','10:00 AM'],['16','Academic Check-In','4:00 PM'],['18','NIL Meeting (Virtual)','2:00 PM'],['20','Community Event','11:00 AM']].map(([d,t,time])=><div key={t}><time>SEP <b>{d}</b></time><p><b>{t}</b><small>{time}</small></p></div>)}</article>

        <article className="tb3-card tb3-opps"><header><span>OPPORTUNITIES</span><Link href="/portal/tarris-bouie/opportunities">View All →</Link></header>{[['NIKE','Nike Youth Campaign'],['G','Gatorade Student Series'],['◎','Speaking Engagement'],['♟','Camp Appearance']].map(([logo,t])=><Link href="/portal/tarris-bouie/opportunities" key={t}><strong>{logo}</strong><p><b>{t}</b><small>View opportunity</small></p><em>NEW</em></Link>)}</article>

        <article className="tb3-card tb3-media"><header><span>RECENT MEDIA</span><Link href="/portal/tarris-bouie/media">View All →</Link></header><div>{media.map(([title,time],i)=><Link href="/portal/tarris-bouie/media" key={title}><span className={`tb3-thumb tone-${i}`}><b>▶</b></span><strong>{title}</strong><small>{time}</small></Link>)}</div></article>

        <article className="tb3-card tb3-messages"><header><span>MESSAGES</span><Link href="/portal/tarris-bouie/messages">View All →</Link></header>{[['C','Coach Williams','Great work this week. Keep pushing.'],['N','NIL Agency','New opportunity available.'],['A','Academic Advisor','Your transcript has been updated.'],['M','Mentor','Proud of your progress. Keep going.']].map(([initial,name,msg])=><Link href="/portal/tarris-bouie/messages" key={name}><i>{initial}</i><p><b>{name}</b><small>{msg}</small></p></Link>)}</article>

        <Link className="tb3-card tb3-eva" href="/portal/tarris-bouie/eva"><span className="tb3-eva-face">EVA</span><div><h3>ASK EVA</h3><p>Your AI Assistant</p><ul><li>Get answers</li><li>Update content</li><li>Track opportunities</li><li>Manage requests</li></ul><b>CHAT WITH EVA →</b></div></Link>
        <Link className="tb3-card tb3-tomorrow" href="/portal/tarris-bouie/journey"><div><h3>A GREATER<br/>TOMORROW.</h3><p>STUDENT. ATHLETE. BRAND.<br/>A PLATFORM. A GENERATION.</p></div><strong>4</strong></Link>
        <Link className="tb3-card tb3-store" href="/portal/tarris-bouie/store"><div><b><span>TB3</span> STORE</b><p>Rep the Vision.</p></div><div className="tb3-merch"><i>TB3</i><i>TB3</i><i>4</i></div><strong>SHOP NOW →</strong></Link>
      </section>

      <footer><span>TB3 · TARRIS BOUIE</span><nav><Link href="/portal/tarris-bouie/settings">Support</Link><Link href="/portal/tarris-bouie/settings">Privacy</Link><Link href="/portal/tarris-bouie/settings">Terms</Link></nav><b>Different On Purpose.</b></footer>
    </section>
  </main>;
}
