import './twin-city.css';

const hero='https://static.wixstatic.com/media/422737_cced45343e894f14a03363c53bad71f2~mv2.jpg/v1/fill/w_1600,h_900,al_c,q_90/422737_cced45343e894f14a03363c53bad71f2~mv2.jpg';
const golf='https://static.wixstatic.com/media/422737_410fa7359edf4b6abff836c5d1dad2c6~mv2.jpg/v1/fill/w_900,h_1100,al_c,q_90/2025%20Kappa%20Golf%20Tournament%20Promo_20260128_125931_0000.jpg';
const service='https://static.wixstatic.com/media/422737_7648b1738736474ebb1298972c1814c1~mv2.jpg/v1/fill/w_1200,h_800,al_c,q_90/422737_7648b1738736474ebb1298972c1814c1~mv2.jpg';
const chapterLogo='https://static.wixstatic.com/media/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png/v1/fill/w_280,h_220,al_c,q_90/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png';
const foundationLogo='https://static.wixstatic.com/media/422737_9b9ee26842e7461f945314b3ede3d27f~mv2.png/v1/fill/w_300,h_250,al_c,q_90/Kappa%20Foundation%20logo.png';

const experiences=[
  ['Brotherhood','Connection that lasts beyond the meeting.'],
  ['Service','Visible work across Winston-Salem.'],
  ['Youth','Mentoring the next generation of leaders.'],
  ['Foundation','Scholarships and community investment.'],
  ['Golf','Competition connected to impact.'],
];

export default function TwinCityKappasPage(){return <main className="tc-site">
  <header className="tc-nav">
    <a className="tc-brand" href="#top"><img src={chapterLogo} alt="Twin City Kappas crest"/><span><b>KAPPA ALPHA PSI®</b><small>Winston-Salem (NC) Alumni Chapter</small></span></a>
    <nav><a href="#chapter">About</a><a href="#programs">Programs</a><a href="#foundation">Foundation</a><a href="#golf">Golf</a><a href="#impact">Impact</a><a href="/twin-city-kappas/portal" className="portal-link">BrotherHub</a></nav>
  </header>

  <section id="top" className="tc-hero">
    <img src={hero} alt="Twin City Kappas brothers in Winston-Salem"/>
    <div className="tc-hero-copy"><p className="tc-kicker light">WINSTON-SALEM · SINCE 1950</p><h1>Achievement<br/>in every field<br/><em>of endeavor.</em></h1><p>Brotherhood, service, youth development and community investment, brought together in one modern chapter experience.</p><div className="tc-actions"><a className="tc-gold-pill" href="#chapter">Explore the chapter</a><a className="tc-ghost" href="#impact">See our impact</a></div></div>
    <div className="tc-scroll">SCROLL <i>↓</i></div>
  </section>

  <section id="chapter" className="tc-intro"><p className="tc-kicker">THE TWIN CITY EXPERIENCE</p><h2>A historic chapter should feel <em>alive</em>, not archived.</h2><p>The new site keeps the substance of the current chapter story while presenting it with the clarity, restraint and visual confidence of a premium digital experience.</p></section>

  <section id="programs" className="tc-experience-grid">
    {experiences.map(([title,copy],i)=><article key={title} className={`exp exp-${i+1}`}><img src={i===4?golf:i===2?hero:service} alt=""/><div><span>0{i+1}</span><h3>{title}</h3><p>{copy}</p></div></article>)}
  </section>

  <section id="golf" className="tc-golf-feature">
    <div className="tc-golf-photo"><img src={golf} alt="Twin City Kappas golf tournament"/></div>
    <div className="tc-golf-copy"><p className="tc-kicker light">REGIONAL MEETING GOLF TOURNAMENT</p><h2>From first registration to final report.</h2><p>The tournament becomes a connected experience instead of a collection of forms. Registration, foursomes, sponsors, payments, confirmations, check-in, results and reporting all feed BrotherHub.</p><div className="tc-golf-steps"><span>Register</span><i>→</i><span>Pay</span><i>→</i><span>Confirm</span><i>→</i><span>Manage</span><i>→</i><span>Report</span></div><a className="tc-light-pill" href="/twin-city-kappas/portal#golf">Open tournament workspace</a></div>
  </section>

  <section id="impact" className="tc-impact">
    <div><p className="tc-kicker">IMPACT, MADE VISIBLE</p><h2>One chapter.<br/>One source of truth.</h2><p>BrotherHub will supply verified program, service, scholarship and event data so the public site can show current impact without inventing numbers.</p></div>
    <div className="tc-impact-metrics"><div><b>1950</b><span>Chapter legacy</span></div><div><b>Live</b><span>Program reporting</span></div><div><b>1</b><span>Connected digital home</span></div><div><b>24/7</b><span>Member access</span></div></div>
  </section>

  <section id="foundation" className="tc-foundation"><div className="tc-foundation-logo"><img src={foundationLogo} alt="Kappa Foundation of Winston-Salem"/></div><div><p className="tc-kicker">KAPPA FOUNDATION OF WINSTON-SALEM</p><h2>Make the mission easier to see. And easier to support.</h2><p>Scholarships, mentoring, charitable programs and community investment deserve a clear destination inside the chapter experience.</p><a className="tc-wine-pill" href="https://www.twincitykappas.com/the-foundation">Explore the Foundation</a></div></section>

  <section className="tc-digital-home"><img src={chapterLogo} alt=""/><div><p className="tc-kicker light">ONE CHAPTER. ONE DIGITAL HOME.</p><h2>The story outside.<br/>The operating system inside.</h2><p>Visitors experience the chapter. Brothers enter BrotherHub to run it.</p></div><a className="tc-light-pill" href="/twin-city-kappas/portal">Enter BrotherHub</a></section>

  <footer><div className="tc-footer-brand"><img src={chapterLogo} alt="Twin City Kappas"/><span><b>KAPPA ALPHA PSI®</b><small>Winston-Salem (NC) Alumni Chapter</small></span></div><div>About · Programs · Foundation · Golf · Impact · Contact</div><small>© 2026 Twin City Kappas</small></footer>
</main>}
