import './twin-city.css';

const hero='https://static.wixstatic.com/media/422737_cced45343e894f14a03363c53bad71f2~mv2.jpg/v1/fill/w_1600,h_900,al_c,q_90/422737_cced45343e894f14a03363c53bad71f2~mv2.jpg';
const golf='https://static.wixstatic.com/media/422737_410fa7359edf4b6abff836c5d1dad2c6~mv2.jpg/v1/fill/w_900,h_1100,al_c,q_90/2025%20Kappa%20Golf%20Tournament%20Promo_20260128_125931_0000.jpg';
const service='https://static.wixstatic.com/media/422737_7648b1738736474ebb1298972c1814c1~mv2.jpg/v1/fill/w_1200,h_800,al_c,q_90/422737_7648b1738736474ebb1298972c1814c1~mv2.jpg';
const chapterLogo='https://static.wixstatic.com/media/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png/v1/fill/w_280,h_220,al_c,q_90/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png';
const foundationLogo='https://static.wixstatic.com/media/422737_9b9ee26842e7461f945314b3ede3d27f~mv2.png/v1/fill/w_300,h_250,al_c,q_90/Kappa%20Foundation%20logo.png';

const pillars=[
  ['Brotherhood','Stronger together.'],
  ['Service','Serving our community.'],
  ['Youth','Developing the next generation.'],
  ['Foundation','Building a legacy of support.'],
];

export default function TwinCityKappasPage(){return <main className="tc-site">
  <header className="tc-nav">
    <a className="tc-brand" href="#top"><img src={chapterLogo} alt="Twin City Kappas crest"/><span><b>KAPPA ALPHA PSI®</b><small>TWIN CITY (WINSTON-SALEM) ALUMNI CHAPTER</small></span></a>
    <nav><a href="#chapter">About</a><a href="#programs">Programs</a><a href="#foundation">Foundation</a><a href="#golf">Golf Tournament</a><a href="#impact">Impact</a><a href="#contact">Contact</a><a href="/twin-city-kappas/portal" className="portal-link">Member Portal</a></nav>
  </header>

  <section id="top" className="tc-hero">
    <img src={hero} alt="Twin City Kappas brothers in Winston-Salem"/>
    <div className="tc-hero-copy"><p className="tc-kicker light">WINSTON-SALEM · SINCE 1950</p><h1>Achievement.<br/>Brotherhood.<br/>Service.<br/><em>Since 1950.</em></h1><p>Dedicated to improving our community and developing the next generation of leaders.</p><div className="tc-actions"><a className="tc-wine-pill" href="#chapter">Explore our chapter</a><a className="tc-ghost" href="/twin-city-kappas/portal">Member Portal</a></div></div>
  </section>

  <section id="chapter" className="tc-section-title"><span>Achievement in Action</span></section>

  <section id="programs" className="tc-pillar-grid">
    {pillars.map(([title,copy],i)=><article key={title}><img src={i===0||i===3?hero:service} alt=""/><div className="tc-card-overlay"><span className="tc-icon">{i===0?'◉':i===1?'✦':i===2?'◎':'◇'}</span><h3>{title}</h3><p>{copy}</p></div></article>)}
  </section>

  <section id="golf" className="tc-golf-band">
    <div className="tc-golf-image"><img src={golf} alt="Twin City Kappas golf tournament"/></div>
    <div className="tc-golf-copy"><p className="tc-kicker light">REGIONAL MEETING</p><h2>Golf Tournament</h2><p>Proceeds support youth programs, scholarships and community initiatives that change lives.</p><div className="tc-golf-options"><span><b>Register</b><small>Individual or foursome</small></span><span><b>Build a Foursome</b><small>Gather your team</small></span><span><b>Sponsor</b><small>Promote your business</small></span><span><b>Tournament Info</b><small>Course, schedule, prizes</small></span></div><a className="tc-gold-pill" href="/twin-city-kappas/portal#golf">Learn more & register</a></div>
  </section>

  <section id="impact" className="tc-impact-row">
    <div className="tc-youth-block"><img src={hero} alt="Twin City Kappas youth mentoring"/><div><p className="tc-kicker">Developing the Next Generation</p><h2>Building tomorrow, together.</h2><p>Through Kappa League, mentoring, scholarship support and educational initiatives, we are preparing young men for success in life and leadership.</p><a href="#foundation">See our programs</a></div></div>
    <div className="tc-impact-block"><p className="tc-kicker">Our Impact</p><div className="tc-impact-metrics"><span><b>1,200+</b><small>Youth served</small></span><span><b>$150K+</b><small>Scholarships awarded</small></span><span><b>4,500+</b><small>Service hours</small></span><span><b>900+</b><small>Families supported</small></span><span><b>$250K+</b><small>Community investment</small></span></div><p className="tc-impact-note">Impact figures shown as presentation placeholders until chapter-verified data is connected through BrotherHub.</p></div>
  </section>

  <section id="foundation" className="tc-digital-home"><img src={chapterLogo} alt="Twin City Kappas"/><div><p className="tc-kicker">One Chapter. One Digital Home.</p><h2>Stay connected. Get involved. Make an impact.</h2><p>News, events, programs, service, Foundation support and member operations all connect through one digital ecosystem.</p></div><div className="tc-home-actions"><span><b>Stay informed</b><small>News and announcements</small></span><span><b>Get involved</b><small>Committees and events</small></span><span><b>Make an impact</b><small>Time, talent and resources</small></span></div></section>

  <section id="contact" className="tc-footer-band"><div><img src={chapterLogo} alt="Twin City Kappas"/><span><b>KAPPA ALPHA PSI®</b><small>Twin City Alumni Chapter</small></span></div><div><b>Quick Links</b><small>About · Programs · Foundation · Golf · Events</small></div><div><b>Foundation</b><img className="tc-foundation-mini" src={foundationLogo} alt="Kappa Foundation"/></div><div><b>Member Access</b><a href="/twin-city-kappas/portal">Enter BrotherHub</a></div></section>
  <footer>© 2026 Twin City Kappas · Winston-Salem (NC) Alumni Chapter</footer>
</main>}
