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
    <header className="tc-appbar"><a className="golf-back" href="/twin-city-kappas/portal">← Portal Home</a><div className="tc-app-actions"><a href="/twin-city-kappas/golf">Public Event Page</a><div className="tc-person"><div className="avatar">TC</div><div><strong>Twin City</strong><small>Chapter Portal</small></div></div></div></header>

    <div className="tc-workspace golf-workspace">
      <section className="golf-title"><div><p>KAPPA PROVINCIAL MEETING · WINSTON-SALEM</p><h1>Golf Tournament Manager</h1><span>March 12 · 8:00 AM · Winston Lake Golf Course · $85 per golfer · 2-man teams</span></div><div className="golf-title-actions"><a href="/twin-city-kappas/golf">Public Page</a><a href="/twin-city-kappas/golf/flyer">Open Flyer</a></div></section>

      <section className="golf-kpis">
        <article><small>Working Date</small><b>Mar 12</b><span>final confirmation pending</span></article>
        <article><small>Start</small><b>8:00</b><span>AM</span></article>
        <article><small>Player Fee</small><b>$85</b><span>per individual</span></article>
        <article><small>Format</small><b>2-Man</b><span>team format</span></article>
        <article><small>Venue</small><b>Winston Lake</b><span>Winston-Salem, NC</span></article>
      </section>

      <section className="golf-command-grid">
        <article className="golf-panel"><div className="golf-panel-head"><div><small>TOURNAMENT CONTROL</small><h2>Current event brief</h2></div><span className="status-live">PLANNING</span></div><div className="event-details"><div><small>Date</small><b>March 12</b></div><div><small>Venue</small><b>Winston Lake Golf Course</b></div><div><small>Start</small><b>8:00 AM</b></div><div><small>Format</small><b>2-man teams</b></div></div><div className="goalbar"><span>Held in conjunction with the Kappa Provincial Meeting in Winston-Salem.</span></div></article>

        <article className="golf-panel"><div className="golf-panel-head"><div><small>NEXT BEST ACTIONS</small><h2>Action Center</h2></div></div><div className="action-row"><b>1</b><span><strong>Confirm March 12 as the final date</strong><small>The portal is treating March 12 as the working date.</small></span></div><div className="action-row"><b>2</b><span><strong>Connect registration and payment flow</strong><small>Set the live player fee at $85 per individual.</small></span></div><div className="action-row"><b>3</b><span><strong>Creative package ready</strong><small>Public event page, print-ready flyer and QR journey are connected.</small></span></div></article>
      </section>

      <section className="golf-tabs"><a href="#registrations">Registrations</a><a href="#teams">2-Man Teams</a><a href="#sponsors">Sponsors</a><a href="#checkin">Check-In</a><a href="#payments">Payments</a><a href="#reports">Reports</a></section>

      <section id="registrations" className="golf-panel golf-table-panel"><div className="golf-panel-head"><div><small>PLAYER OPERATIONS</small><h2>Registration roster</h2></div></div><div className="team-row"><b>Live roster not connected yet</b><span>Registrations will populate here when the registration and payment flow is enabled.</span><em>Setup</em></div></section>

      <section className="golf-two-col">
        <article id="teams" className="golf-panel"><div className="golf-panel-head"><div><small>TEAM MANAGEMENT</small><h2>2-man team board</h2></div></div><div className="team-row"><b>Team assignments</b><span>Players will be paired into 2-man teams from the live registration roster.</span><em>Pending</em></div></article>

        <article id="sponsors" className="golf-panel"><div className="golf-panel-head"><div><small>SPONSOR FULFILLMENT</small><h2>Sponsor status</h2></div></div><div className="team-row"><b>Sponsor records</b><span>No verified sponsor roster has been connected to this event yet.</span><em>Pending</em></div></article>
      </section>

      <section className="golf-three-col">
        <article id="checkin" className="golf-panel mini"><small>EVENT DAY</small><h3>Check-In</h3><b>Ready to configure</b><span>QR or manual check-in can activate once registration is live.</span></article>
        <article id="payments" className="golf-panel mini"><small>PAYMENTS</small><h3>Player Fee</h3><b>$85</b><span>per individual golfer</span></article>
        <article id="reports" className="golf-panel mini"><small>REPORTING</small><h3>Event Reports</h3><b>Live after launch</b><span>Roster, teams, payments, sponsors and post-event reporting.</span></article>
      </section>
    </div>
  </section>
</main>}
