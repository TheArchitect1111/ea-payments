import '../portal.css';
import './golf.css';

const chapterLogo='https://static.wixstatic.com/media/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png/v1/fill/w_280,h_220,al_c,q_90/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png';
const nav=[['⌂','Home','/twin-city-kappas/portal'],['◈','Chapter','#'],['▣','Calendar','#'],['▤','Events','#'],['⚑','Golf Tournament','/twin-city-kappas/portal/golf'],['♟','Brothers','#'],['◉','Committees','#'],['⌂','Foundation','#'],['▥','Programs','#'],['▱','Payments','#'],['▧','Documents','#'],['◌','Communications','#'],['A','Amplifi','/amplifi/workspace'],['⌁','Reports','#'],['⚙','Settings','#']];

export default function TwinCityGolfManager(){return <main className="tc-portal-shell golf-manager-shell">
  <aside className="tc-leftnav">
    <div className="tc-logo-row"><img src={chapterLogo} alt="Twin City Kappas crest"/><div><b>BROTHERHUB</b><small>TWIN CITY KAPPAS</small></div></div>
    <nav>{nav.map(([icon,label,href])=><a key={label} href={href} className={label==='Golf Tournament'?'active':label==='Amplifi'?'amp':''}><i>{icon}</i><span>{label}</span></a>)}</nav>
  </aside>
  <section className="tc-app">
    <header className="tc-appbar"><a className="golf-back" href="/twin-city-kappas/portal">← Portal Home</a><div className="tc-person"><div className="avatar">TC</div><div><strong>Chapter Admin</strong><small>Twin City Kappas</small></div></div></header>
    <div className="tc-workspace">
      <section className="golf-title"><div><p>JOSEPH BRADSHAW & WILLIAM BRYANT MEMORIAL</p><h1>Golf Tournament Manager</h1><span>Registration, payments, teams, sponsors, check-in and reporting in one command center.</span></div></section>
      <section className="golf-kpis">
        <article><small>Registrations</small><b>0</b><span>verified records</span></article>
        <article><small>Foursomes</small><b>0</b><span>verified teams</span></article>
        <article><small>Sponsors</small><b>0</b><span>verified sponsors</span></article>
        <article><small>Revenue</small><b>$0</b><span>verified payments</span></article>
        <article><small>Checked In</small><b>0</b><span>event-day records</span></article>
      </section>
      <section className="golf-command-grid">
        <article className="golf-panel"><div className="golf-panel-head"><div><small>TOURNAMENT CONTROL</small><h2>2026 event record</h2></div><span className="status-draft">DRAFT</span></div><div className="event-details"><div><small>Event year</small><b>2026</b></div><div><small>Event date</small><b>Not verified</b></div><div><small>Course</small><b>Not verified</b></div><div><small>Pricing</small><b>Not verified</b></div></div></article>
        <article className="golf-panel"><div className="golf-panel-head"><div><small>NEXT BEST ACTION</small><h2>Launch readiness</h2></div></div><div className="empty-state"><b>Verify tournament details</b><p>Current date, course, registration pricing and payment setup must be confirmed before public registration is activated.</p></div></article>
      </section>
      <section className="golf-tabs"><a href="#registrations">Registrations</a><a href="#teams">Teams / Foursomes</a><a href="#sponsors">Sponsors</a><a href="#checkin">Check-In</a><a href="#payments">Payments</a><a href="#reports">Reports</a></section>
      <section id="registrations" className="golf-panel empty-state"><b>No verified registrations yet</b><p>Production records will appear here after registration is connected. No sample golfers or payments are shown.</p></section>
      <section className="golf-three-col">
        <article id="teams" className="golf-panel mini"><small>TEAM MANAGEMENT</small><h3>Foursomes</h3><b>0</b><span>verified teams</span></article>
        <article id="sponsors" className="golf-panel mini"><small>SPONSOR FULFILLMENT</small><h3>Sponsors</h3><b>0</b><span>verified commitments</span></article>
        <article id="checkin" className="golf-panel mini"><small>EVENT DAY</small><h3>Check-In</h3><b>0</b><span>verified check-ins</span></article>
      </section>
    </div>
  </section>
</main>}
