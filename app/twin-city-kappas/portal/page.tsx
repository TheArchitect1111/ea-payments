import './portal.css';

const nav=['Home','Chapter','Calendar','Events','Golf Tournament','Brothers','Committees','Foundation','Programs','Payments','Documents','Communications','Amplifi','Reports','Settings'];
const announcements=[['Chapter Meeting','Monthly chapter meeting information and agenda.'],['Kappa League','Program update ready for review.'],['Community Service','Volunteer opportunity and event details.']];
const docs=[['Chapter Agenda','PDF · Updated recently'],['Golf Tournament Brief','PDF · Draft'],['Kappa League Update','PDF · Updated recently'],['Budget Report','PDF · Updated recently']];

export default function TwinCityBrotherHub(){return <main className="tc-portal">
  <aside className="tc-side">
    <div className="tc-side-brand"><div className="tc-crest">ΚΑΨ</div><div><b>BROTHERHUB</b><small>TWIN CITY KAPPAS</small></div></div>
    <nav>{nav.map(item=>item==='Amplifi'?<a key={item} href="/amplifi/workspace" className="amp-link">A <span>{item}</span></a>:<a key={item} href={item==='Home'?'#home':item==='Golf Tournament'?'#golf':'#'} className={item==='Home'?'active':''}><i>{item==='Home'?'⌂':item==='Calendar'?'□':item==='Golf Tournament'?'⚑':item==='Brothers'?'◎':item==='Payments'?'$':item==='Documents'?'▤':item==='Reports'?'↗':'•'}</i><span>{item}</span></a>)}</nav>
    <div className="tc-side-amplifi"><span className="amp-mark">A</span><b>AMPLIFI</b><small>Create, connect and communicate.</small><a href="/amplifi/workspace">Launch Amplifi</a></div>
  </aside>

  <section className="tc-main" id="home">
    <header className="tc-topbar"><div className="tc-search">⌕ <span>Search BrotherHub...</span></div><div className="tc-top-actions"><span className="tc-badge">3</span><span>◉</span><span className="tc-badge">5</span><span>✉</span><div className="tc-user"><b>RB</b><span><strong>Brother Robert</strong><small>Chapter Leadership</small></span></div></div></header>

    <div className="tc-content">
      <section className="tc-welcome"><div><h1>Welcome back, Brother.</h1><p>Here is what is happening with Twin City Kappas.</p></div><button>＋ Quick Action</button></section>

      <section className="tc-kpis"><article><span>Next Chapter Meeting</span><b>May 18</b><small>3:00 PM · Kappas Center</small><a href="#">View Details</a></article><article><span>My Action Items</span><b>5</b><small>Items</small><a href="#">View All</a></article><article><span>Dues Status</span><b className="good">PAID</b><small>Current through 2026</small><a href="#">View Receipt</a></article><article><span>Unread Messages</span><b>3</b><small>New Messages</small><a href="#">View All</a></article></section>

      <section className="tc-command-row">
        <div id="golf" className="tc-golf-command"><div className="tc-golf-visual"><div><p>REGIONAL MEETING</p><h2>GOLF TOURNAMENT</h2><span>Tournament Status Overview</span></div><i>⛳</i></div><div className="tc-golf-stats"><div><small>Registrations</small><b>48</b><span>of 120 Golfers</span></div><div><small>Foursomes</small><b>12</b><span>of 30 Teams</span></div><div><small>Sponsors</small><b>9</b><span>Committed</span></div><div><small>Revenue</small><b>$6,240</b><span>of Goal</span></div></div><div className="tc-golf-progress"><div><i/><span>52% to Goal</span></div><a href="#">View Golf Dashboard</a></div></div>

        <div className="tc-announcements"><div className="tc-panel-head"><h2>Announcements</h2><a href="#">View All</a></div>{announcements.map(([title,copy])=><div className="tc-announcement" key={title}><b>{title}</b><p>{copy}</p></div>)}</div>
      </section>

      <section className="tc-lower-grid">
        <div className="tc-panel"><div className="tc-panel-head"><h2>Upcoming Events</h2><a href="#">View All</a></div><div className="tc-event"><b>18</b><span><strong>Chapter Meeting</strong><small>May 18 · 3:00 PM</small></span></div><div className="tc-event"><b>31</b><span><strong>Kappa League Banquet</strong><small>May 31 · 6:00 PM</small></span></div><div className="tc-event"><b>14</b><span><strong>Community Service Day</strong><small>June 14 · 8:00 AM</small></span></div></div>

        <div className="tc-panel"><div className="tc-panel-head"><h2>Committee Activity</h2><a href="#">View All</a></div><div className="tc-committee"><i className="green"/><span><strong>Achievement</strong><small>Meeting scheduled</small></span></div><div className="tc-committee"><i className="green"/><span><strong>Finance</strong><small>Budget review in progress</small></span></div><div className="tc-committee"><i className="gold"/><span><strong>Membership</strong><small>3 applications pending</small></span></div><div className="tc-committee"><i className="green"/><span><strong>Programs</strong><small>Planning meeting upcoming</small></span></div></div>

        <div className="tc-panel"><div className="tc-panel-head"><h2>Recent Documents</h2><a href="#">View All</a></div>{docs.map(([name,meta])=><div className="tc-doc" key={name}><i>PDF</i><span><strong>{name}</strong><small>{meta}</small></span></div>)}</div>
      </section>

      <section className="tc-bottom-row">
        <div className="tc-quick"><div className="tc-panel-head"><h2>Quick Links</h2></div><div><a href="#">$<span>Pay Dues</span></a><a href="#">◎<span>Update Profile</span></a><a href="#">◉<span>Member Directory</span></a><a href="#">▤<span>Submit Document</span></a><a href="/amplifi/workspace">A<span>Open Amplifi</span></a></div></div>
        <div className="tc-calendar"><div className="tc-panel-head"><h2>Chapter Calendar</h2><a href="#">View Calendar</a></div><div className="tc-calendar-grid"><b>May 2026</b><div className="tc-days"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>{Array.from({length:35},(_,i)=><i key={i} className={i===17?'today':''}>{i<3?'':i-2}</i>)}</div></div></div>
      </section>
    </div>
  </section>
</main>}
