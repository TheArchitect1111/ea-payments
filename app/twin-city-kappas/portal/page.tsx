import './portal.css';

const nav=[
  ['home','Overview'],['actions','My Actions'],['calendar','Calendar'],['events','Events'],['golf','Golf Tournament'],['brothers','Brothers'],['committees','Committees'],['foundation','Foundation'],['programs','Programs'],['payments','Payments'],['documents','Documents'],['amplifi','Amplifi'],['reports','Reports']
];
const actions=[
  ['HIGH','Golf','Confirm registration fields','Waiting on updated tournament information'],
  ['TODAY','Foundation','Review sponsor follow-up list','2 conversations need an owner'],
  ['TOMORROW','Programs','Approve Kappa League announcement','Ready for Amplifi once approved']
];

export default function TwinCityBrotherHub(){return <main className="tc-portal">
  <aside className="tc-side">
    <div className="tc-side-brand"><span>ΚΑΨ</span><div><b>BROTHERHUB</b><small>Twin City Kappas</small></div></div>
    <nav>{nav.map(([id,label])=>label==='Amplifi'?<a key={id} className="amplifi" href="/amplifi/workspace"><span>◈</span>{label}</a>:<a key={id} className={id==='home'?'active':''} href={id==='golf'?'#golf':'#home'}><span className="nav-dot"/>{label}</a>)}</nav>
    <div className="tc-side-bottom"><span className="system-dot"/>All systems operating<small>Chapter workspace · responsive</small></div>
  </aside>

  <section className="tc-workspace" id="home">
    <header className="tc-commandbar"><div><p>TWIN CITY KAPPAS</p><strong>BrotherHub</strong></div><div className="tc-command-actions"><button aria-label="Search">⌕</button><button aria-label="Notifications">○</button><div className="tc-user">RB</div></div></header>

    <div className="tc-workarea">
      <section className="tc-overview-head"><div><p className="tc-kicker">MONDAY · CHAPTER OPERATIONS</p><h1>Good afternoon, Brother.</h1><p>Three things need your attention. Everything else is moving.</p></div><div className="tc-date"><span>Next meeting</span><b>MAY 18</b><small>3:00 PM · Winston-Salem</small></div></section>

      <section className="tc-attention"><div className="tc-attention-label"><span>01</span><p>NEXT BEST ACTION</p></div><div className="tc-attention-copy"><h2>Finalize the regional meeting golf tournament setup.</h2><p>The structure is ready. Updated dates, pricing, sponsorships and registration details are the only pieces still needed.</p></div><a href="#golf">Open Golf Workspace ↗</a></section>

      <section className="tc-kpis"><div><span>Open actions</span><b>3</b><small>2 due today</small></div><div><span>Dues</span><b className="good">Current</b><small>Through 2026</small></div><div><span>Unread updates</span><b>2</b><small>Chapter notices</small></div><div><span>Golf setup</span><b>80%</b><small>Details pending</small></div></section>

      <section className="tc-ops-grid">
        <div className="tc-queue" id="actions"><div className="tc-sectionbar"><div><p className="tc-kicker">ACTION QUEUE</p><h2>What needs a person.</h2></div><button>View all</button></div><div className="tc-table"><div className="tc-row tc-row-head"><span>Priority</span><span>Area</span><span>Action</span><span>Status</span></div>{actions.map(([priority,area,action,status])=><div className="tc-row" key={action}><span className={`priority ${priority.toLowerCase()}`}>{priority}</span><b>{area}</b><span>{action}</span><small>{status}</small></div>)}</div></div>

        <aside className="tc-rail"><div><p className="tc-kicker">TODAY</p><h3>Chapter pulse</h3><dl><div><dt>Foundation</dt><dd>2 sponsor follow-ups</dd></div><div><dt>Programs</dt><dd>1 approval ready</dd></div><div><dt>Documents</dt><dd>May agenda added</dd></div></dl></div><div className="tc-amplifi-mini"><p className="tc-kicker light">AMPLIFI</p><h3>Turn activity into content.</h3><p>Idea Box, campaigns, approvals and publishing live in the existing Amplifi workspace.</p><a href="/amplifi/workspace">Open Amplifi ↗</a></div></aside>
      </section>

      <section id="golf" className="tc-golf-ops">
        <header><div><p className="tc-kicker light">REGIONAL MEETING · GOLF OPERATIONS</p><h2>Tournament command center.</h2><p>One operating view from first registration through final report.</p></div><div className="tc-mode"><span>SETUP MODE</span><b>Details pending</b></div></header>
        <div className="tc-golf-toolbar"><button>Registrations</button><button>Foursomes</button><button>Sponsors</button><button>Payments</button><button>Check-in</button><button>Results</button></div>
        <div className="tc-golf-columns"><div><span>REGISTRATION</span><b>Individual + foursome</b><p>Capture player information once and keep it attached to payment and team status.</p></div><div><span>SPONSORS</span><b>Package + fulfillment</b><p>Track sponsor level, logo, payment, signage and outstanding deliverables.</p></div><div><span>EVENT DAY</span><b>Check-in + assignments</b><p>See who has arrived, where they belong and what still needs attention.</p></div><div><span>REPORTING</span><b>Revenue + outcomes</b><p>Close the tournament with clean financial, sponsor and participation reporting.</p></div></div>
        <div className="tc-golf-flow"><span>REGISTER</span><i>01</i><span>PAY</span><i>02</i><span>CONFIRM</span><i>03</i><span>ASSIGN</span><i>04</i><span>CHECK IN</span><i>05</i><span>REPORT</span></div>
      </section>

      <section className="tc-bottom-ops"><div><p className="tc-kicker">RECENT ACTIVITY</p><h2>The chapter leaves a trail.</h2></div><div className="tc-activity"><div><time>2:14 PM</time><b>Foundation sponsor follow-up assigned</b><span>BrotherHub</span></div><div><time>1:42 PM</time><b>May agenda uploaded</b><span>Documents</span></div><div><time>12:18 PM</time><b>Kappa League announcement prepared</b><span>Programs</span></div><div><time>10:03 AM</time><b>Golf workspace structure updated</b><span>Golf</span></div></div></section>
    </div>
  </section>
</main>}
