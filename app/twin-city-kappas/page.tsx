import './twin-city.css';

const hero='https://static.wixstatic.com/media/422737_cced45343e894f14a03363c53bad71f2~mv2.jpg/v1/fill/w_1600,h_900,al_c,q_90/422737_cced45343e894f14a03363c53bad71f2~mv2.jpg';
const golf='https://static.wixstatic.com/media/422737_410fa7359edf4b6abff836c5d1dad2c6~mv2.jpg/v1/fill/w_900,h_1100,al_c,q_90/2025%20Kappa%20Golf%20Tournament%20Promo_20260128_125931_0000.jpg';
const chapterLogo='https://static.wixstatic.com/media/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png/v1/fill/w_280,h_220,al_c,q_90/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png';

export default function TwinCityKappasPage(){return <main className="tc-site">
<header className="tc-nav"><a className="tc-brand" href="#top"><img src={chapterLogo} alt="Twin City Kappas crest"/><span><b>KAPPA ALPHA PSI®</b><small>TWIN CITY (WINSTON-SALEM) ALUMNI CHAPTER</small></span></a><nav><a href="#chapter">About</a><a href="#golf">Golf Tournament</a><a href="/twin-city-kappas/portal" className="portal-link">Member Portal</a></nav></header>
<section id="top" className="tc-hero"><img src={hero} alt="Twin City Kappas brothers in Winston-Salem"/><div className="tc-hero-copy"><p className="tc-kicker light">WINSTON-SALEM · SINCE 1950</p><h1>Achievement.<br/>Brotherhood.<br/>Service.</h1><p>Dedicated to improving our community and developing the next generation of leaders.</p><a className="tc-wine-pill" href="#chapter">Explore our chapter</a></div></section>
<section id="chapter" className="tc-intro"><p className="tc-kicker">Twin City Alumni Chapter</p><h2>One chapter. One digital home.</h2><p>The chapter website and BrotherHub connect public information, member operations and event management in one experience.</p></section>
<section id="golf" className="tc-golf-band"><div className="tc-golf-image"><img src={golf} alt="Twin City Kappas golf tournament"/></div><div className="tc-golf-copy"><p className="tc-kicker light">JOSEPH BRADSHAW & WILLIAM BRYANT MEMORIAL</p><h2>Golf Tournament</h2><p>The 2026 tournament workspace is being prepared. Registration details will be published only after the chapter verifies the event date, course, pricing and payment setup.</p><a className="tc-gold-pill" href="/twin-city-kappas/portal/golf">Tournament Manager</a></div></section>
<footer>© 2026 Twin City Kappas · Winston-Salem (NC) Alumni Chapter</footer>
</main>}
