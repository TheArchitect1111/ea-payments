import './portal.css';

const nav=['Dashboard','My Chapter','Calendar','Events','Golf Tournament','Brothers','Committees','Foundation','Programs','Payments','Documents','Communications','Amplifi','Reports','Settings'];
const actions=[
  ['Golf','Confirm tournament registration fields','Today'],
  ['Foundation','Review sponsor follow-up list','Today'],
  ['Programs','Approve Kappa League announcement','Tomorrow'],
  ['Membership','Review two pending updates','Fri']
];
const docs=[['May Chapter Agenda','PDF · Updated May 8'],['Golf Tournament Brief','PDF · Draft'],['Kappa League Update','PDF · Updated May 5']];

export default function TwinCityBrotherHub(){return <main className="tc-portal">
  <aside className="tc-side">
    <div className="tc-side-brand"><div className="tc-crest">ΚΑΨ</div><div><b>BROTHERHUB</b><small>Twin City Kappas</small></div></div>
    <nav>{nav.map(item=>item==='Amplifi'?<a key={item} href="/amplifi/workspace" className="amp-link">◈ <span>{item}</span></a>:<a key={item} href={item==='Dashboard'?'#home':item==='Golf Tournament'?'#golf':'#'} className={item==='Dashboard'?'active':''}><i>{item==='Dashboard'?'⌂':item==='Calendar'?'□':item==='Golf Tournament'?'⚑':item==='Brothers'?'◎':item==='Payments'?'$':item==='Documents'?'▤':item==='Reports'?'↗':'•'}</i><span>{item}</span></a>)}</nav>
    <div className="tc-side-amplifi"><span className="amp-mark">A</span><b>AMPLIFI</b><small>Create, connect, communicate.</small><a href="/amplifi/workspace">Launch workspace</a></div>
  </aside>

  <section className="tc-main" id="home">
    <header className="tc-topbar"><div className="tc-search">⌕ <span>Search BrotherHub...</span></div><div className="tc-top-actions"><button>＋ Quick Action</button><span>◉</span><span>✉</span><div className="tc-user"><b>RB</b><span><strong>Brother Robert</strong><small>Chapter Leadership</small></span></div></div></header>

    <div className="tc-content">
      <section className="tc-welcome"><div><p className="tc-kicker">TWIN CITY KAPPAS</p><h1>Welcome back, Brother.</h1><p>Here is what changed, what needs you, and what happens next.</p></div><a href="#golf">Open Golf Command Center</a></section>

      <section className="tc-kpis"><article><span>Next chapter meeting</span><b>May 18</b><small>3:00 PM · Kappas Center</small></article><article><span>My action items</span><b>4</b><small>2 due today</small></article><article><span>Dues status</span><b className="good">Paid</b><small>Current through 2026</small></article><article><span>Unread updates</span><b>2</b><small>Latest chapter notices</small></article></section>

      <section className="tc-command-row">
        <div id="golf" className="tc-golf-command"><div className="tc-golf-visual"><div><p>REGIONAL MEETING</p><h2>Golf Tournament</h2><span>Command Center</span></div><i>⛳</i></div><div className="tc-golf-stats"><div><b>Registration</b><span>Individual + foursome</span></div><div><b>Payments</b><span>Paid / pending</span></div><div><b>Sponsors</b><span>Packages + fulfillment</span></div><div><b>Event Day</b><span>Check-in + results</span></div></div><div className="tc-golf-progress"><span>Structure ready</span><b>Updated tournament details pending</b></div></div>

        <div className="tc-action-center"><div className="tc-panel-head"><h2>Action Center</h2><a href="#">View all</a></div>{actions.map(([area,task,due])=><div className="tc-action-row" key={task}><i/><div><small>{area}</small><b>{task}</b></div><span>{due}</span></div>)}</div>
      </section>

      <section className="tc-lower-grid">
        <div className="tc-panel"><div className="tc-panel-head"><h2>Upcoming Events</h2><a href="#">Calendar</a></div><div className="tc-event"><b>18</b><span><strong>Chapter Meeting</strong><small>May 18 · 3:00 PM</small></span></div><div className="tc-event"><b>31</b><span><strong>Kappa League Banquet</strong><small>May 31 · 6:00 PM</small></span></div><div className="tc-event"><b>14</b><span><strong>Community Service Day</strong><small>June 14 · 8:00 AM</small></span></div></div>

        <div className="tc-panel"><div className="tc-panel-head"><h2>Committee Activity</h2><a href="#">View all</a></div><div className="tc-committee"><i className="green"/><span><strong>Achievement</strong><small>Meeting on May 14</small></span></div><div className="tc-committee"><i className="green"/><span><strong>Finance</strong><small>Budget review in progress</small></span></div><div className="tc-committee"><i className="gold"/><span><strong>Membership</strong><small>3 applications pending</small></span></div><div className="tc-committee"><i className="green"/><span><strong>Programs</strong><small>Planning meeting May 20</small></span></div></div>

        <div className="tc-panel"><div className="tc-panel-head"><h2>Recent Documents</h2><a href="#">View all</a></div>{docs.map(([name,meta])=><div className="tc-doc" key={name}><i>PDF</i><span><strong>{name}</strong><small>{meta}</small></span></div>)}</div>
      </section>

      <section className="tc-bottom-row"><div className="tc-calendar"><div className="tc-panel-head"><h2>Chapter Calendar</h2><a href="#">Full calendar</a></div><div className="tc-calendar-grid"><b>May 2026</b><div className="tc-days"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>{Array.from({length:35},(_,i)=><i key={i} className={i===17?'today':''}>{i<3?'':i-2}</i>)}</div></div></div><div className="tc-quick"><div className="tc-panel-head"><h2>Quick Links</h2></div><div><a href="#">$<span>Pay Dues</span></a><a href="#">◎<span>Update Profile</span></a><a href="#">◉<span>Member Directory</span></a><a href="#">▤<span>Submit Document</span></a><a href="/amplifi/workspace">A<span>Open Amplifi</span></a></div></div></section>
    </div>
  </section>
</main>}
