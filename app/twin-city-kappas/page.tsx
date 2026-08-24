import './twin-city.css';

const hero='https://static.wixstatic.com/media/422737_cced45343e894f14a03363c53bad71f2~mv2.jpg/v1/fill/w_1600,h_900,al_c,q_90/422737_cced45343e894f14a03363c53bad71f2~mv2.jpg';
const golf='https://static.wixstatic.com/media/422737_410fa7359edf4b6abff836c5d1dad2c6~mv2.jpg/v1/fill/w_900,h_1100,al_c,q_90/2025%20Kappa%20Golf%20Tournament%20Promo_20260128_125931_0000.jpg';
const service='https://static.wixstatic.com/media/422737_7648b1738736474ebb1298972c1814c1~mv2.jpg/v1/fill/w_1200,h_800,al_c,q_90/422737_7648b1738736474ebb1298972c1814c1~mv2.jpg';
const chapterLogo='https://static.wixstatic.com/media/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png/v1/fill/w_280,h_220,al_c,q_90/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png';
const foundationLogo='https://static.wixstatic.com/media/422737_9b9ee26842e7461f945314b3ede3d27f~mv2.png/v1/fill/w_300,h_250,al_c,q_90/Kappa%20Foundation%20logo.png';

const pillars=[
  ['01','Brotherhood','A chapter built on connection, accountability and shared purpose.'],
  ['02','Service','Visible work that strengthens Winston-Salem and the people who call it home.'],
  ['03','Youth','Kappa League, mentoring and leadership development for the next generation.'],
  ['04','Foundation','Scholarships, charitable programs and long-term community investment.'],
];

export default function TwinCityKappasPage(){return <main className="tc-site">
  <header className="tc-nav">
    <a className="tc-brand" href="#top"><img src={chapterLogo} alt="Twin City Kappas crest"/><span><b>KAPPA ALPHA PSI®</b><small>Winston-Salem (NC) Alumni Chapter</small></span></a>
    <nav><a href="#legacy">About</a><a href="#programs">Programs</a><a href="#foundation">Foundation</a><a href="#golf">Golf Tournament</a><a href="#impact">Impact</a><a href="/twin-city-kappas/portal" className="portal-link">BrotherHub</a></nav>
  </header>

  <section id="top" className="tc-hero">
    <img src={hero} alt="Twin City Kappas brothers in Winston-Salem"/>
    <div className="tc-hero-rail"><span>TWIN CITY KAPPAS</span><i/><b>1950</b></div>
    <div className="tc-hero-copy"><p className="tc-kicker light">ACHIEVEMENT · BROTHERHOOD · SERVICE</p><h1>A legacy<br/>of impact.<br/><em>Still moving.</em></h1><p>Serving Winston-Salem since 1950 through leadership, mentoring, scholarship and community action.</p><div className="tc-actions"><a className="tc-gold-pill" href="#legacy">Explore the chapter</a><a className="tc-ghost" href="#impact">See our impact</a></div></div>
  </section>

  <section id="legacy" className="tc-purpose"><div className="tc-purpose-copy"><p className="tc-kicker">ROOTED IN VALUES. DRIVEN BY PURPOSE.</p><h2>More than a chapter.<br/>A force in the community.</h2><p>The Winston-Salem Alumni Chapter has spent generations turning achievement into action. The new digital experience brings the full story together so visitors can understand the work, support it, and connect to it quickly.</p></div><div className="tc-purpose-image"><img src={service} alt="Twin City Kappas serving the community"/><span>Service in motion</span></div></section>

  <section id="programs" className="tc-pillar-strip">{pillars.map(([n,title,copy])=><article key={title}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}</section>

  <section id="golf" className="tc-golf-feature">
    <div className="tc-golf-photo"><img src={golf} alt="Twin City Kappas golf tournament"/><div className="tc-golf-badge"><span>REGIONAL MEETING</span><b>Golf Tournament</b></div></div>
    <div className="tc-golf-copy"><p className="tc-kicker light">GOLF WITH PURPOSE</p><h2>One tournament.<br/>One connected system.</h2><p>Registration, foursomes, sponsors, payments, check-in, communications and reporting flow directly into BrotherHub. Final regional-meeting tournament details will replace the current placeholders when supplied.</p><div className="tc-golf-steps"><span>Register</span><i>→</i><span>Pay</span><i>→</i><span>Confirm</span><i>→</i><span>Manage</span></div><a className="tc-light-pill" href="/twin-city-kappas/portal#golf">Open tournament workspace</a></div>
  </section>

  <section id="impact" className="tc-impact">
    <div className="tc-impact-copy"><p className="tc-kicker">BUILDING TOMORROW, TOGETHER.</p><h2>Impact should be visible.</h2><p>BrotherHub will become the source for live chapter impact, replacing scattered updates with one trusted picture of service, scholarships, youth development and community investment.</p></div>
    <div className="tc-impact-stats"><div><b>1950</b><span>Chapter legacy begins</span></div><div><b>1</b><span>Connected digital home</span></div><div><b>Live</b><span>Program + service reporting</span></div><div><b>24/7</b><span>Member access through BrotherHub</span></div></div>
  </section>

  <section id="foundation" className="tc-foundation"><div className="tc-foundation-mark"><img src={foundationLogo} alt="Kappa Foundation of Winston-Salem"/></div><div><p className="tc-kicker">KAPPA FOUNDATION OF WINSTON-SALEM</p><h2>Community investment with a clear destination.</h2><p>Scholarships, charitable initiatives and local programs deserve more than a buried page. The Foundation becomes a visible part of the chapter story, with direct paths to support and measurable impact.</p><a className="tc-wine-pill" href="https://www.twincitykappas.com/the-foundation">Support the Foundation</a></div></section>

  <section className="tc-final"><div><p className="tc-kicker light">ONE CHAPTER. ONE DIGITAL HOME.</p><h2>The public story outside.<br/>The operating system inside.</h2></div><a className="tc-light-pill" href="/twin-city-kappas/portal">Enter BrotherHub</a></section>

  <footer><div className="tc-footer-brand"><img src={chapterLogo} alt="Twin City Kappas"/><span><b>KAPPA ALPHA PSI®</b><small>Winston-Salem (NC) Alumni Chapter</small></span></div><div>About · Programs · Foundation · Golf · Impact · Contact</div><small>© 2026 Twin City Kappas</small></footer>
</main>}
