import '../portal.css';
import './golf.css';

const chapterLogo='https://static.wixstatic.com/media/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png/v1/fill/w_280,h_220,al_c,q_90/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png';
const nav=[['⌂','Home','/twin-city-kappas/portal'],['◈','Chapter','#'],['▣','Calendar','#'],['▤','Events','#'],['⚑','Golf Tournament','/twin-city-kappas/portal/golf'],['♟','Brothers','#'],['◉','Committees','#'],['⌂','Foundation','#'],['▥','Programs','#'],['▱','Payments','#'],['▧','Documents','#'],['◌','Communications','#'],['A','Amplifi','/amplifi/workspace'],['⌁','Reports','#'],['⚙','Settings','#']];
const registrations=[
  ['Marcus Allen','Individual','Paid','$150','Assigned'],
  ['Derrick Moore','Foursome','Paid','$600','Team 08'],
  ['Anthony Price','Individual','Pending','$150','Unassigned'],
  ['James Carter','Foursome','Paid','$600','Team 11'],
];
const sponsors=[
  ['Atrium Health','Gold','Paid','Logo received'],
  ['Hanesbrands','Silver','Paid','Fulfillment ready'],
  ['Local Partner','Tee Sponsor','Pending','Asset needed'],
];

export default function TwinCityGolfManager(){return <main className="tc-portal-shell golf-manager-shell">
  <aside className="tc-leftnav">
    <div className="tc-logo-row"><img src={chapterLogo} alt="Twin City Kappas crest"/><div><b>BROTHERHUB</b><small>TWIN CITY KAPPAS</small></div></div>
    <nav>{nav.map(([icon,label,href])=><a key={label} href={href} className={label==='Golf Tournament'?'active':label==='Amplifi'?'amp':''}><i>{icon}</i><span>{label}</span></a>)}</nav>
  </aside>

  <section className="tc-app">
    <header className="tc-appbar"><a className="golf-back" href="/twin-city-kappas/portal">← Portal Home</a><div className="tc-app-actions"><span>♧<b>3</b></span><span>✉<b>5</b></span><div className="tc-person"><div className="avatar">BM</div><div><strong>Brother Michael</strong><small>Polemarch</small></div><i>⌄</i></div></div></header>

    <div className="tc-workspace golf-workspace">
      <section className="golf-title"><div><p>JOSEPH BRADSHAW & WILLIAM BRYANT MEMORIAL</p><h1>Golf Tournament Manager</h1><span>Registration, payments, teams, sponsors, check-in and reporting in one command center.</span></div><div className="golf-title-actions"><a href="#registrations">＋ Add Registration</a><a href="#checkin">✓ Check-In</a></div></section>

      <section className="golf-kpis">
        <article><small>Registrations</small><b>48</b><span>of 120 golfers</span></article>
        <article><small>Foursomes</small><b>12</b><span>of 30 teams</span></article>
        <article><small>Sponsors</small><b>9</b><span>committed</span></article>
        <article><small>Revenue</small><b>$6,240</b><span>52% to goal</span></article>
        <article><small>Checked In</small><b>0</b><span>event-day status</span></article>
      </section>

      <section className="golf-command-grid">
        <article className="golf-panel"><div className="golf-panel-head"><div><small>TOURNAMENT CONTROL</small><h2>Current event</h2></div><span className="status-live">ACTIVE</span></div><div className="event-details"><div><small>Event year</small><b>2026</b></div><div><small>Registration status</small><b>Open</b></div><div><small>Payment reconciliation</small><b>In progress</b></div><div><small>Unassigned golfers</small><b>4</b></div></div><div className="goalbar"><i/><span>52% of revenue goal</span></div></article>

        <article className="golf-panel"><div className="golf-panel-head"><div><small>NEXT BEST ACTIONS</small><h2>Action Center</h2></div></div><div className="action-row"><b>1</b><span><strong>Resolve 3 pending payments</strong><small>Before final foursome assignment</small></span></div><div className="action-row"><b>2</b><span><strong>Place 4 unassigned golfers</strong><small>Open roster pool</small></span></div><div className="action-row"><b>3</b><span><strong>Request 1 sponsor asset</strong><small>Logo needed for fulfillment</small></span></div></article>
      </section>

      <section className="golf-tabs"><a href="#registrations">Registrations</a><a href="#teams">Teams / Foursomes</a><a href="#sponsors">Sponsors</a><a href="#checkin">Check-In</a><a href="#payments">Payments</a><a href="#reports">Reports</a></section>

      <section id="registrations" className="golf-panel golf-table-panel"><div className="golf-panel-head"><div><small>PLAYER OPERATIONS</small><h2>Recent registrations</h2></div><a href="#">Export roster</a></div><table><thead><tr><th>Golfer / Registrant</th><th>Type</th><th>Payment</th><th>Amount</th><th>Team status</th></tr></thead><tbody>{registrations.map(r=><tr key={r[0]}>{r.map((v,i)=><td key={i}><span className={i===2?(v==='Paid'?'pill paid':'pill pending'):''}>{v}</span></td>)}</tr>)}</tbody></table></section>

      <section className="golf-two-col">
        <article id="teams" className="golf-panel"><div className="golf-panel-head"><div><small>TEAM MANAGEMENT</small><h2>Foursome board</h2></div><a href="#">Manage teams</a></div><div className="team-row"><b>Team 08</b><span>4 / 4 golfers</span><em>Ready</em></div><div className="team-row"><b>Team 11</b><span>4 / 4 golfers</span><em>Ready</em></div><div className="team-row"><b>Unassigned Pool</b><span>4 golfers</span><em className="warn">Needs action</em></div></article>

        <article id="sponsors" className="golf-panel"><div className="golf-panel-head"><div><small>SPONSOR FULFILLMENT</small><h2>Sponsor status</h2></div><a href="#">Manage sponsors</a></div>{sponsors.map(s=><div className="sponsor-row" key={s[0]}><span><b>{s[0]}</b><small>{s[1]}</small></span><span><b>{s[2]}</b><small>{s[3]}</small></span></div>)}</article>
      </section>

      <section className="golf-three-col">
        <article id="checkin" className="golf-panel mini"><small>EVENT DAY</small><h3>Check-In</h3><b>0 / 48</b><span>QR or manual check-in ready</span><a href="#">Open check-in roster</a></article>
        <article id="payments" className="golf-panel mini"><small>RECONCILIATION</small><h3>Payments</h3><b>45 paid</b><span>3 pending payments require review</span><a href="#">Review payments</a></article>
        <article id="reports" className="golf-panel mini"><small>REPORTING</small><h3>Exports & Impact</h3><b>6 reports</b><span>Roster, sponsors, revenue and post-event impact</span><a href="#">Open reports</a></article>
      </section>
    </div>
  </section>
</main>}
