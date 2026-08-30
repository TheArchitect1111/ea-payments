import './portal.css';

const chapterLogo='https://static.wixstatic.com/media/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png/v1/fill/w_280,h_220,al_c,q_90/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png';
const nav=[['⌂','Home','#home'],['◈','Chapter','#'],['▣','Calendar','#'],['▤','Events','#'],['⚑','Golf Tournament','/twin-city-kappas/portal/golf'],['♟','Brothers','#'],['◉','Committees','#'],['⌂','Foundation','#'],['▥','Programs','#'],['▱','Payments','#'],['▧','Documents','#'],['◌','Communications','#'],['A','Amplifi','/amplifi/workspace'],['⌁','Reports','#'],['⚙','Settings','#']];

export default function TwinCityBrotherHub(){return <main className="tc-portal-shell">
  <aside className="tc-leftnav"><div className="tc-logo-row"><img src={chapterLogo} alt="Twin City Kappas crest"/><div><b>BROTHERHUB</b><small>TWIN CITY KAPPAS</small></div></div><nav>{nav.map(([icon,label,href])=><a key={label} href={href} className={label==='Home'?'active':label==='Amplifi'?'amp':''}><i>{icon}</i><span>{label}</span></a>)}</nav></aside>
  <section className="tc-app" id="home"><header className="tc-appbar"><div></div><div className="tc-person"><div className="avatar">TC</div><div><strong>Chapter Admin</strong><small>Twin City Kappas</small></div></div></header>
    <div className="tc-workspace"><section className="tc-greeting"><div><h1>Twin City BrotherHub</h1><p>One digital home for chapter operations, programs and the golf tournament.</p></div></section>
      <section className="tc-main-grid"><div className="tc-golf-card"><div className="tc-golf-hero"><div><p>JOSEPH BRADSHAW & WILLIAM BRYANT MEMORIAL</p><h2>GOLF TOURNAMENT</h2><span>2026 tournament operations</span></div></div><div className="tc-golf-numbers"><div><small>Registrations</small><b>0</b><span>verified</span></div><div><small>Foursomes</small><b>0</b><span>verified</span></div><div><small>Sponsors</small><b>0</b><span>verified</span></div><div><small>Revenue</small><b>$0</b><span>verified</span></div></div><div className="tc-golf-footer"><span>Event details are in draft until chapter verification.</span><a href="/twin-city-kappas/portal/golf">OPEN GOLF MANAGER</a></div></div>
        <div className="panel"><h3>Launch Status</h3><p>The production tournament record exists. Date, course, pricing and payment details remain intentionally unfilled until verified. This prevents presentation data from becoming operational data.</p><span className="empty-badge">VERIFICATION REQUIRED</span></div></section>
    </div>
  </section>
</main>}
