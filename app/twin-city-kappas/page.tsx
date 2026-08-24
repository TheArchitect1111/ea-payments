import './twin-city.css';

const hero='https://static.wixstatic.com/media/422737_cced45343e894f14a03363c53bad71f2~mv2.jpg/v1/fill/w_1600,h_900,al_c,q_90/422737_cced45343e894f14a03363c53bad71f2~mv2.jpg';
const golf='https://static.wixstatic.com/media/422737_410fa7359edf4b6abff836c5d1dad2c6~mv2.jpg/v1/fill/w_900,h_1100,al_c,q_90/2025%20Kappa%20Golf%20Tournament%20Promo_20260128_125931_0000.jpg';
const service='https://static.wixstatic.com/media/422737_7648b1738736474ebb1298972c1814c1~mv2.jpg/v1/fill/w_1200,h_800,al_c,q_90/422737_7648b1738736474ebb1298972c1814c1~mv2.jpg';
const chapterLogo='https://static.wixstatic.com/media/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png/v1/fill/w_280,h_220,al_c,q_90/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png';
const foundationLogo='https://static.wixstatic.com/media/422737_9b9ee26842e7461f945314b3ede3d27f~mv2.png/v1/fill/w_300,h_250,al_c,q_90/Kappa%20Foundation%20logo.png';

const journeys=[
  ['Brotherhood','Stay connected to the Bond and the chapter.'],
  ['Service','See where Twin City is serving Winston-Salem.'],
  ['Youth','Kappa League, mentoring and the next generation.'],
  ['Community','Foundation, scholarships and local impact.']
];

export default function TwinCityKappasPage(){return <main className="tc-site">
  <header className="tc-nav"><a className="tc-brand" href="#top"><img src={chapterLogo} alt="Twin City Kappas logo"/><span><b>TWIN CITY KAPPAS</b><small>Winston-Salem (NC) Alumni Chapter</small></span></a><nav><a href="#chapter">About</a><a href="#programs">Programs</a><a href="#foundation">Foundation</a><a href="#golf">Golf</a><a href="#events">Events</a><a href="/twin-city-kappas/portal">Member Portal</a></nav></header>

  <section id="top" className="tc-hero"><img src={hero} alt="Winston-Salem Alumni Chapter brothers"/><div className="tc-hero-overlay"><p className="tc-kicker">SERVING WINSTON-SALEM SINCE 1950</p><h1>Achievement.<br/>Brotherhood.<br/><em>Service.</em></h1><p>One chapter. Generations of leadership, mentoring and community impact.</p><div><a className="tc-pill" href="#chapter">Explore the chapter</a><a className="tc-text" href="/twin-city-kappas/portal">Member Portal ↗</a></div></div></section>

  <section className="tc-statement"><p>The chapter story should feel like the people who created it: <em>historic, active, connected and still moving.</em></p></section>

  <section id="chapter" className="tc-story"><div><p className="tc-kicker">ACHIEVEMENT IN ACTION</p><h2>A legacy that lives in the work.</h2><p>Kappa Alpha Psi Fraternity, Inc. was founded in 1911. The Winston-Salem Alumni Chapter has served Winston-Salem and surrounding communities since 1950, advancing achievement through brotherhood, youth development and service.</p><a className="tc-text" href="https://www.twincitykappas.com/about">Explore chapter history ↗</a></div><img src={service} alt="Twin City Kappas community service"/></section>

  <section className="tc-journeys">{journeys.map(([title,copy],i)=><article key={title}><span>0{i+1}</span><h3>{title}</h3><p>{copy}</p></article>)}</section>

  <section id="golf" className="tc-golf"><div className="tc-golf-copy"><p className="tc-kicker light">REGIONAL MEETING GOLF TOURNAMENT</p><h2>Golf with purpose.</h2><p>Twin City is responsible for the golf tournament connected to the regional meeting. The new tournament experience will connect registration, payment, foursomes, sponsors, communications, check-in and reporting directly to BrotherHub.</p><div className="tc-golf-actions"><a className="tc-light-pill" href="/twin-city-kappas/portal#golf">Open tournament hub</a><span>Final tournament details will replace current placeholders when provided.</span></div></div><div className="tc-golf-image"><img src={golf} alt="Twin City Kappas golf tournament"/></div></section>

  <section id="programs" className="tc-programs"><div className="tc-section-head"><div><p className="tc-kicker">DEVELOPING THE NEXT GENERATION</p><h2>Programs built around people.</h2></div><p>Kappa League, mentoring, undergraduate relationships, scholarships, community service and chapter initiatives should be experienced as one connected story, not scattered pages.</p></div><div className="tc-program-list"><div><b>Kappa League</b><span>Mentoring young men through achievement and leadership.</span></div><div><b>Undergraduate Chapters</b><span>Delta Chi at Winston-Salem State and Omicron Sigma at Wake Forest.</span></div><div><b>Beyond the Bond</b><span>Brotherhood, development and continued engagement.</span></div><div><b>Silhouettes</b><span>Family, support and chapter community.</span></div></div></section>

  <section id="foundation" className="tc-foundation"><img src={foundationLogo} alt="Kappa Foundation of Winston-Salem logo"/><div><p className="tc-kicker">KAPPA FOUNDATION OF WINSTON-SALEM</p><h2>Community impact deserves a clear home.</h2><p>The Foundation supports charitable work, mentoring, scholarships and community initiatives. The new site connects support and donations directly to the work they enable.</p><a className="tc-pill" href="https://www.twincitykappas.com/the-foundation">Support the Foundation</a></div></section>

  <section className="tc-impact"><p className="tc-kicker">MEASURE WHAT THE CHAPTER MAKES POSSIBLE</p><div><span><b>1950</b>Chapter legacy</span><span><b>100%</b>Connected story</span><span><b>1</b>Digital home</span></div><small>Live service, scholarship and program impact metrics will be driven by BrotherHub rather than invented on the website.</small></section>

  <section id="events" className="tc-closing"><div><p className="tc-kicker light">ONE CHAPTER. ONE DIGITAL HOME.</p><h2>The public story outside.<br/>The chapter operating system inside.</h2></div><a className="tc-light-pill" href="/twin-city-kappas/portal">Enter BrotherHub</a></section>

  <footer><div><img src={chapterLogo} alt="Twin City Kappas"/><b>Winston-Salem (NC) Alumni Chapter</b></div><span>About · Programs · Foundation · Golf · Events · News · Contact</span><span>© 2026 Twin City Kappas</span></footer>
</main>}
