import './portal.css';

const chapterLogo='https://static.wixstatic.com/media/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png/v1/fill/w_280,h_220,al_c,q_90/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png';
const nav=[['⌂','Home'],['◈','Chapter'],['▣','Calendar'],['▤','Events'],['⚑','Golf Tournament'],['♟','Brothers'],['◉','Committees'],['⌂','Foundation'],['▥','Programs'],['▱','Payments'],['▧','Documents'],['◌','Communications'],['A','Amplifi'],['⌁','Reports'],['⚙','Settings']];
const announcements=[['Chapter Meeting','Join us for our monthly chapter meeting.'],['Kappa League Banquet','Program and banquet update.'],['Community Service Day','Volunteers needed for the next service project.']];
const docs=[['May Chapter Agenda','PDF · Uploaded recently'],['Golf Tournament Flyer','PDF · Draft'],['Kappa League Update','PDF · Uploaded recently'],['Budget Report Q2','PDF · Uploaded recently']];

export default function TwinCityBrotherHub(){return <main className="tc-portal-shell">
  <aside className="tc-leftnav">
    <div className="tc-logo-row"><img src={chapterLogo} alt="Twin City Kappas crest"/><div><b>BROTHERHUB</b><small>TWIN CITY KAPPAS</small></div></div>
    <nav>{nav.map(([icon,label])=>label==='Amplifi'?<a key={label} href="/amplifi/workspace" className="amp"><i>{icon}</i><span>{label}</span></a>:<a key={label} href={label==='Home'?'#home':label==='Golf Tournament'?'/twin-city-kappas/portal/golf':'#'} className={label==='Home'?'active':''}><i>{icon}</i><span>{label}</span></a>)}</nav>
  </aside>

  <section className="tc-app" id="home">
    <header className="tc-appbar"><div className="tc-search">⌕</div><div className="tc-app-actions"><span>♧<b>3</b></span><span>✉<b>5</b></span><div className="tc-person"><div className="avatar">BM</div><div><strong>Brother Michael</strong><small>Polemarch</small></div><i>⌄</i></div></div></header>

    <div className="tc-workspace">
      <section className="tc-greeting"><div><h1>Welcome back, Brother Michael!</h1><p>Here’s what’s happening with Twin City Kappas.</p></div><button>＋ QUICK ACTION⌄</button></section>

      <section className="tc-summary-row">
        <article><span>▣ &nbsp; Next Chapter Meeting</span><b>May 18, 2026</b><small>3:00 PM<br/>Kappas Center</small><a href="#">View Details</a></article>
        <article><span>☑ &nbsp; My Action Items</span><b>5</b><small>Items</small><a href="#">View All</a></article>
        <article><span>$ &nbsp; Dues Status</span><b className="paid">PAID</b><small>Through Dec 31, 2026</small><a href="#">View Receipt</a></article>
        <article><span>▱ &nbsp; Unread Messages</span><b>3</b><small>New Messages</small><a href="#">View All</a></article>
      </section>

      <section className="tc-main-grid">
        <div id="golf" className="tc-golf-card"><div className="tc-golf-hero"><div><p>REGIONAL MEETING</p><h2>GOLF TOURNAMENT</h2><span>Tournament Status Overview</span></div><div className="golfball">●</div></div><div className="tc-golf-numbers"><div><small>Registrations</small><b>48</b><span>of 120 Golfers</span></div><div><small>Foursomes</small><b>12</b><span>of 30 Teams</span></div><div><small>Sponsors</small><b>9</b><span>Committed</span></div><div><small>Revenue</small><b>$6,240</b><span>of Goal</span></div></div><div className="tc-golf-footer"><div className="progress"><i/><span>52% to Goal</span></div><a href="/twin-city-kappas/portal/golf">VIEW GOLF DASHBOARD</a></div></div>

        <div className="tc-announcements"><div className="panel-title"><h3>Announcements</h3><a href="#">View All ›</a></div>{announcements.map(([t,c])=><div className="announce" key={t}><b>{t}</b><p>{c}</p></div>)}</div>
      </section>

      <section className="tc-three-col">
        <div className="panel"><div className="panel-title"><h3>Upcoming Events</h3><a href="#">View All ›</a></div><div className="event"><b><small>MAY</small>18</b><span><strong>Chapter Meeting</strong><small>May 18, 2026 · 3:00 PM<br/>Kappas Center</small></span></div><div className="event"><b><small>MAY</small>31</b><span><strong>Kappa League Banquet</strong><small>May 31, 2026 · 6:00 PM</small></span></div><div className="event"><b><small>JUN</small>14</b><span><strong>Community Service Day</strong><small>June 14, 2026 · 8:00 AM</small></span></div></div>
        <div className="panel"><div className="panel-title"><h3>Committee Activity</h3><a href="#">View All ›</a></div>{[['Achievement','Meeting on May 14','green'],['Finance','Budget review in progress','green'],['Membership','3 applications pending','gold'],['Programs','Planning meeting May 20','green']].map(([a,b,c])=><div className="committee" key={a}><i className={c}/><span><strong>{a}</strong><small>{b}</small></span></div>)}</div>
        <div className="panel"><div className="panel-title"><h3>Recent Documents</h3><a href="#">View All ›</a></div>{docs.map(([a,b])=><div className="doc" key={a}><i>PDF</i><span><strong>{a}</strong><small>{b}</small></span></div>)}</div>
      </section>

      <section className="tc-bottom-grid">
        <div className="panel quick"><div className="panel-title"><h3>Quick Links</h3></div><div className="quickgrid"><a href="#">$<span>Pay Dues</span><small>Make a payment</small></a><a href="#">♙<span>Update Profile</span><small>Manage your info</small></a><a href="#">♧<span>Member Directory</span><small>Find a Brother</small></a><a href="#">▧<span>Submit Document</span><small>Upload & share</small></a></div></div>
        <div className="panel calendar"><div className="panel-title"><h3>Chapter Calendar</h3><a href="#">View Calendar</a></div><b>May 2026</b><div className="calendar-grid"><span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>{Array.from({length:35},(_,i)=><i key={i} className={i===17?'today':''}>{i<3?'':i-2}</i>)}</div></div>
      </section>
    </div>
  </section>
</main>}
