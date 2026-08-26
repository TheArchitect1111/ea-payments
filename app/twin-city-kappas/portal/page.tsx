import './portal.css';

const chapterLogo='https://static.wixstatic.com/media/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png/v1/fill/w_280,h_220,al_c,q_90/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png';
const golfImage='https://static.wixstatic.com/media/422737_410fa7359edf4b6abff836c5d1dad2c6~mv2.jpg/v1/fill/w_1200,h_900,al_c,q_90/2025%20Kappa%20Golf%20Tournament%20Promo_20260128_125931_0000.jpg';

const nav=[
  ['⌂','Home','#home'],['◈','Chapter','#chapter'],['▣','Calendar','#calendar'],['▤','Events','#events'],
  ['⚑','Golf Tournament','/twin-city-kappas/portal/golf'],['♟','Brothers','#brothers'],['◉','Committees','#committees'],
  ['⌂','Foundation','#foundation'],['▥','Programs','#programs'],['▱','Payments','#payments'],['▧','Documents','#documents'],
  ['◌','Communications','#communications'],['A','Amplifi','/amplifi/workspace'],['⌁','Reports','#reports'],['⚙','Settings','#settings']
];

const priorities=[
  ['01','Golf tournament setup','Confirm registration flow, payment connection and event-day workflow.','/twin-city-kappas/portal/golf'],
  ['02','Chapter information','Review the member-facing content that should be current before launch.','#chapter'],
  ['03','Digital team readiness','Assign the brothers who will manage updates, communications and golf operations.','#communications']
];

const tools=[
  ['⚑','Golf Manager','Registration, payment tracking, teams, check-in and reports.','/twin-city-kappas/portal/golf'],
  ['▧','Documents','Keep chapter files, agendas, forms and event assets in one place.','#documents'],
  ['◌','Communications','Create and manage chapter updates without scattered email threads.','#communications'],
  ['A','Amplifi','Turn chapter activity into social content and campaign ideas.','/amplifi/workspace']
];

export default function TwinCityBrotherHub(){return <main className="tc-portal-shell">
  <aside className="tc-leftnav">
    <div className="tc-logo-row"><img src={chapterLogo} alt="Twin City Kappas crest"/><div><b>BROTHERHUB</b><small>TWIN CITY KAPPAS</small></div></div>
    <nav>{nav.map(([icon,label,href])=><a key={label} href={href} className={label==='Home'?'active':label==='Amplifi'?'amp':''}><i>{icon}</i><span>{label}</span></a>)}</nav>
    <div className="tc-nav-foot"><small>POWERED BY</small><b>Efficiency Architects</b></div>
  </aside>

  <section className="tc-app" id="home">
    <header className="tc-appbar"><div className="tc-mobile-brand"><img src={chapterLogo} alt=""/><span>BrotherHub</span></div><div className="tc-app-actions"><a href="/twin-city-kappas/next">View Chapter Site</a><div className="tc-person"><div className="avatar">TC</div><div><strong>Twin City</strong><small>Admin workspace</small></div></div></div></header>

    <div className="tc-workspace">
      <section className="tc-hero">
        <div><p>CHAPTER COMMAND CENTER</p><h1>Everything that matters.<br/><em>One place.</em></h1><span>BrotherHub is the chapter’s private operating space for members, events, communication, documents and the Provincial Meeting golf tournament.</span></div>
        <div className="tc-hero-actions"><a href="/twin-city-kappas/portal/golf">Open Golf Manager</a><a href="#communications">Chapter Updates</a></div>
      </section>

      <section className="tc-status-strip">
        <article><small>PORTAL STATUS</small><b>Launch preparation</b><span>Core experience is built. Final chapter data and integrations remain.</span></article>
        <article><small>FEATURED EVENT</small><b>Provincial Meeting Golf</b><span>March 12 · 8:00 AM · Winston Lake Golf Course</span></article>
        <article><small>REGISTRATION</small><b>$85 per player</b><span>Two-man team format</span></article>
      </section>

      <section className="tc-priority-grid">
        <div className="tc-section-heading"><div><p>NEXT BEST ACTIONS</p><h2>What needs attention now</h2></div><span>Three priorities keep the launch moving without overwhelming the chapter.</span></div>
        <div className="tc-priority-list">{priorities.map(([n,t,c,h])=><a href={h} key={n}><b>{n}</b><span><strong>{t}</strong><small>{c}</small></span><i>↗</i></a>)}</div>
      </section>

      <section className="tc-golf-feature" style={{backgroundImage:`linear-gradient(90deg,rgba(17,17,17,.96) 0%,rgba(17,17,17,.84) 48%,rgba(17,17,17,.2) 100%),url('${golfImage}')`}}>
        <div><p>PROVINCIAL MEETING · GOLF EXPERIENCE</p><h2>One event.<br/>One command center.</h2><span>Manage the operating details behind the tournament without spreadsheets, text chains or scattered payment records.</span><div className="tc-event-facts"><b>MAR 12</b><b>8:00 AM</b><b>$85 / PLAYER</b><b>2-MAN TEAMS</b></div><a href="/twin-city-kappas/portal/golf">Enter Golf Manager →</a></div>
      </section>

      <section className="tc-tools" id="chapter">
        <div className="tc-section-heading"><div><p>CHAPTER TOOLS</p><h2>Useful, not crowded</h2></div><span>The portal surfaces the work brothers actually need to do, then gets out of the way.</span></div>
        <div className="tc-tools-grid">{tools.map(([icon,t,c,h])=><a href={h} key={t}><i>{icon}</i><span><strong>{t}</strong><small>{c}</small></span><b>↗</b></a>)}</div>
      </section>

      <section className="tc-info-grid">
        <article id="communications"><p>COMMUNICATIONS</p><h3>One chapter voice.</h3><span>Draft announcements, event reminders and member updates from one source of truth. Amplifi extends those same updates into social content when needed.</span><a href="/amplifi/workspace">Open Amplifi →</a></article>
        <article id="documents"><p>DOCUMENTS</p><h3>Stop hunting for files.</h3><span>Chapter forms, agendas, golf assets, reports and shared documents belong in the portal, organized around the work instead of buried in inboxes.</span><a href="#documents">Document center preparing →</a></article>
        <article id="reports"><p>REPORTING</p><h3>Know what happened.</h3><span>Golf participation, payments, sponsor activity and post-event outcomes can roll into clear reports once live data connections are turned on.</span><a href="/twin-city-kappas/portal/golf#reports">View golf reporting →</a></article>
      </section>

      <section className="tc-launch-note"><div><p>LAUNCH READINESS</p><h2>Designed for adoption, not intimidation.</h2></div><span>The final launch experience should feel simple enough for a first-time user and powerful enough for the small digital team managing the chapter behind the scenes.</span></section>
    </div>
  </section>
</main>}
