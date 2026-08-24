import './portal.css';

export default function OtisPortal(){
  const activities=[
    ['Monica R.','Keeping It Real','Paid • Receipt sent'],
    ['New Hope Church','Speaking inquiry','Follow-up queued'],
    ['Derrick T.','Keeping It Real','Paid • Shipping confirmed'],
    ['Youth Clinic','Appearance request','Proposal drafted']
  ];
  return <main className="otis-portal">
    <div className="portal-shell">
      <aside className="portal-nav">
        <div className="brand">OTIS <span>NIXON</span></div>
        <div className="nav-group">
          <div className="nav-label">Business</div>
          <div className="nav-item active">Overview</div>
          <div className="nav-item">Book Sales</div>
          <div className="nav-item">Speaking</div>
          <div className="nav-item">Calendar</div>
          <div className="nav-item">Contacts</div>
          <div className="nav-label">Operations</div>
          <div className="nav-item">Automations</div>
          <div className="nav-item">Reports</div>
          <div className="nav-item">Documents</div>
        </div>
        <div className="eva-mini"><b>Eva is working</b><p>4 follow-ups queued, 2 confirmations sent, and today’s revenue note is ready.</p></div>
      </aside>
      <section className="portal-main">
        <header className="topbar">
          <div><div className="tiny">Business command center</div><h1>Good morning, Otis.</h1><p>Your business is moving. Here is what needs your attention today.</p></div>
          <div className="status-pill">● All systems operating</div>
        </header>
        <section className="grid metrics">
          <div className="card metric"><b>$2,840</b><span>Revenue this month</span></div>
          <div className="card metric"><b>38</b><span>Books sold</span></div>
          <div className="card metric"><b>6</b><span>Speaking inquiries</span></div>
          <div className="card metric"><b>4</b><span>Upcoming engagements</span></div>
        </section>
        <section className="grid work">
          <div className="card"><h2>Recent business activity</h2>{activities.map((r)=><div className="activity-row" key={r[0]}><b>{r[0]}</b><span>{r[1]}</span><span className={r[2].startsWith('Paid')?'paid':'pending'}>{r[2]}</span></div>)}</div>
          <div className="card eva-card"><div className="tiny">Eva • next best actions</div><h2>What I am handling for you</h2><div className="eva-task">Confirm Thursday speaking call with New Hope Church</div><div className="eva-task">Send two book-order shipping updates</div><div className="eva-task">Follow up on youth clinic proposal</div><div className="eva-task">Prepare Friday revenue summary</div></div>
        </section>
        <section className="grid bottom">
          <div className="card"><h2>Upcoming calendar</h2><div className="calendar-item"><b>Aug 27</b><br/>New Hope Church • Speaking call</div><div className="calendar-item"><b>Aug 29</b><br/>Braves alumni appearance</div><div className="calendar-item"><b>Sep 3</b><br/>Youth baseball clinic</div></div>
          <div className="card"><h2>Automation status</h2><div className="automation-item">✓ Purchase confirmations • Active</div><div className="automation-item">✓ Receipts • Active</div><div className="automation-item">✓ Speaking follow-ups • Active</div><div className="automation-item">✓ Weekly revenue note • Active</div></div>
          <div className="card"><h2>Book business</h2><div className="book-card"><img src="/otis-nixon/approved-book-cover-20260824.webp" alt="Keeping It Real by Otis Nixon"/><div><b>Keeping It Real</b><small>38 sold this month<br/>12 orders awaiting fulfillment<br/>Top source: website</small></div></div></div>
        </section>
      </section>
    </div>
  </main>
}
