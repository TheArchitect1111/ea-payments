import './portal.css';

const nav=['Home','Chapter','Calendar','Events','Golf Tournament','Brothers','Committees','Foundation','Programs','Payments','Documents','Amplifi','Reports'];
const tasks=[['Golf','Confirm tournament registration fields','Today'],['Foundation','Review sponsor follow-up list','Today'],['Programs','Approve Kappa League announcement','Tomorrow']];

export default function TwinCityBrotherHub(){return <main className="tc-portal">
  <aside className="tc-side"><div className="tc-side-brand"><span>ΚΑΨ</span><div><b>BROTHERHUB</b><small>Twin City Kappas</small></div></div><nav>{nav.map(item=>item==='Amplifi'?<a key={item} href="/amplifi/workspace" className="amp-link">◈ {item}</a>:<a key={item} href={item==='Home'?'#home':item==='Golf Tournament'?'#golf':'#'} className={item==='Home'?'active':''}>{item}</a>)}</nav><div className="tc-side-note"><b>One chapter.</b><span>One place to know what matters and what happens next.</span></div></aside>

  <section className="tc-main" id="home">
    <header className="tc-top"><div><p className="tc-kicker">MONDAY · TWIN CITY KAPPAS</p><h1>Good afternoon, Brother.</h1><p>Three things need attention. Everything else is moving.</p></div><div className="tc-profile"><span>RB</span><div><b>Chapter Leadership</b><small>Winston-Salem Alumni</small></div></div></header>

    <section className="tc-next"><div><p className="tc-kicker">NEXT BEST ACTION</p><h2>Finalize the regional meeting golf tournament setup.</h2><p>Registration, sponsorship, foursomes and payment flow are ready to be configured when the updated tournament information arrives.</p></div><a href="#golf">Open Golf Workspace ↗</a></section>

    <section className="tc-status"><div><span>Next chapter event</span><b>May 18</b><small>Chapter Meeting · 3:00 PM</small></div><div><span>My open actions</span><b>3</b><small>2 due today</small></div><div><span>Dues status</span><b className="good">Current</b><small>Through 2026</small></div><div><span>Unread updates</span><b>2</b><small>Latest chapter notices</small></div></section>

    <section className="tc-flow"><div className="tc-flow-head"><p className="tc-kicker">TODAY</p><h2>Work moving through the chapter.</h2></div><div className="tc-task-list">{tasks.map(([area,task,due])=><div key={task}><span>{area}</span><b>{task}</b><small>{due}</small></div>)}</div></section>

    <section id="golf" className="tc-golf-workspace"><div className="tc-golf-title"><div><p className="tc-kicker light">REGIONAL MEETING</p><h2>Golf Tournament</h2><p>A single operating view from first registration through final report.</p></div><span className="tc-ready">STRUCTURE READY · DETAILS PENDING</span></div><div className="tc-golf-metrics"><div><b>Registration</b><span>Individual + foursome</span></div><div><b>Payments</b><span>Paid / pending / refunded</span></div><div><b>Sponsors</b><span>Packages + fulfillment</span></div><div><b>Event Day</b><span>Check-in + teams + results</span></div></div><div className="tc-golf-journey"><span>Register</span><i>→</i><span>Pay</span><i>→</i><span>Confirm</span><i>→</i><span>Assign</span><i>→</i><span>Check In</span><i>→</i><span>Report</span></div></section>

    <section className="tc-two-col"><div><p className="tc-kicker">CHAPTER PULSE</p><h2>What changed recently.</h2><div className="tc-lines"><div><b>Foundation</b><span>Two sponsor conversations need follow-up.</span></div><div><b>Programs</b><span>Kappa League announcement ready for approval.</span></div><div><b>Documents</b><span>May agenda uploaded.</span></div></div></div><div className="tc-amplifi"><p className="tc-kicker light">AMPLIFI</p><h2>Turn chapter activity into content.</h2><p>Open the existing Amplifi workspace for Idea Box, campaign creation, approvals and publishing workflows.</p><a href="/amplifi/workspace">Open Amplifi ↗</a></div></section>

    <section className="tc-footer-note"><p>BrotherHub should answer three questions quickly:</p><h2>What changed? What needs me? What happens next?</h2></section>
  </section>
</main>}
