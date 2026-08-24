import './twin-city.css';

const hero='https://static.wixstatic.com/media/422737_cced45343e894f14a03363c53bad71f2~mv2.jpg/v1/fill/w_1600,h_900,al_c,q_90/422737_cced45343e894f14a03363c53bad71f2~mv2.jpg';
const golf='https://static.wixstatic.com/media/422737_410fa7359edf4b6abff836c5d1dad2c6~mv2.jpg/v1/fill/w_1200,h_900,al_c,q_90/2025%20Kappa%20Golf%20Tournament%20Promo_20260128_125931_0000.jpg';
const service='https://static.wixstatic.com/media/422737_7648b1738736474ebb1298972c1814c1~mv2.jpg/v1/fill/w_1600,h_1100,al_c,q_90/422737_7648b1738736474ebb1298972c1814c1~mv2.jpg';
const chapterLogo='https://static.wixstatic.com/media/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png/v1/fill/w_280,h_220,al_c,q_90/422737_1deb9fb5ddcc41f696905e21582a40ee~mv2.png';
const foundationLogo='https://static.wixstatic.com/media/422737_9b9ee26842e7461f945314b3ede3d27f~mv2.png/v1/fill/w_300,h_250,al_c,q_90/Kappa%20Foundation%20logo.png';

export default function TwinCityKappasPage(){return <main className="tc-site">
  <header className="tc-nav"><a className="tc-brand" href="#top"><img src={chapterLogo} alt="Twin City Kappas logo"/><span><b>TWIN CITY KAPPAS</b><small>Winston-Salem (NC) Alumni Chapter</small></span></a><nav><a href="#legacy">Legacy</a><a href="#service">Service</a><a href="#youth">Youth</a><a href="#foundation">Foundation</a><a href="#golf">Golf</a><a className="tc-member" href="/twin-city-kappas/portal">Member Portal</a></nav></header>

  <section id="top" className="tc-hero">
    <img src={hero} alt="Winston-Salem Alumni Chapter brothers"/>
    <div className="tc-hero-shade"/>
    <div className="tc-hero-copy"><p className="tc-kicker light">WINSTON-SALEM (NC) ALUMNI CHAPTER · SINCE 1950</p><h1>Achievement<br/>doesn’t sit still.</h1><p className="tc-dek">Brotherhood in motion. Service with consequence. A legacy still being written across Winston-Salem.</p><div className="tc-actions"><a className="tc-cta light" href="#legacy">Experience the chapter</a><a className="tc-ghost" href="/twin-city-kappas/portal">Enter BrotherHub ↗</a></div></div>
    <div className="tc-hero-foot"><span>ΚΑΨ</span><p>Achievement · Brotherhood · Service</p><p>Winston-Salem, North Carolina</p></div>
  </section>

  <section className="tc-marquee" aria-label="Chapter focus"><span>BROTHERHOOD</span><i>◆</i><span>GUIDE RIGHT</span><i>◆</i><span>SCHOLARSHIP</span><i>◆</i><span>SERVICE</span><i>◆</i><span>RECLAMATION</span></section>

  <section id="legacy" className="tc-editorial-intro"><p className="tc-kicker">THE LEGACY</p><h2>More than seventy years of men showing up for each other and for the city.</h2><div className="tc-editorial-copy"><p>The Winston-Salem Alumni Chapter has served the community since 1950. Its story lives in the brothers, the programs, the young men mentored, the scholarships awarded, the families supported and the institutions strengthened along the way.</p><a href="https://www.twincitykappas.com/about">Explore chapter history ↗</a></div></section>

  <section id="service" className="tc-photo-break"><img src={service} alt="Twin City Kappas serving the community"/><div><p className="tc-kicker light">ACHIEVEMENT IN ACTION</p><h2>Service is where the story becomes visible.</h2><p>Community programs, mentoring, scholarships and partnerships are not side notes. They are the chapter in motion.</p></div></section>

  <section id="youth" className="tc-pathways"><div className="tc-pathways-head"><p className="tc-kicker">THE WORK</p><h2>Four ways Twin City keeps moving forward.</h2></div><div className="tc-pathway-list">
    <article><span>01</span><h3>Brotherhood</h3><p>Connection, reclamation, leadership and a stronger Bond across generations.</p></article>
    <article><span>02</span><h3>Youth</h3><p>Kappa League, Guide Right, mentoring and a clear path for the next generation.</p></article>
    <article><span>03</span><h3>Community</h3><p>Service that is visible, measurable and rooted in Winston-Salem.</p></article>
    <article><span>04</span><h3>Achievement</h3><p>Scholarship, professional growth, undergraduate connection and continued development.</p></article>
  </div></section>

  <section id="foundation" className="tc-foundation-band"><div className="tc-foundation-mark"><img src={foundationLogo} alt="Kappa Foundation of Winston-Salem logo"/></div><div className="tc-foundation-copy"><p className="tc-kicker">KAPPA FOUNDATION OF WINSTON-SALEM</p><h2>Give where the impact lives.</h2><p>The Foundation supports charitable work, scholarships, youth development and community initiatives. The new digital experience will connect support directly to the programs and outcomes it makes possible.</p><a className="tc-cta dark" href="https://www.twincitykappas.com/the-foundation">Support the Foundation</a></div></section>

  <section id="golf" className="tc-golf-story"><div className="tc-golf-photo"><img src={golf} alt="Twin City Kappas golf tournament"/></div><div className="tc-golf-copy"><p className="tc-kicker light">REGIONAL MEETING GOLF TOURNAMENT</p><h2>One tournament.<br/>One connected system.</h2><p>Twin City will manage the golf tournament connected to the regional meeting. Registration, payment, foursomes, sponsors, check-in, results and reporting will all flow into BrotherHub.</p><div className="tc-flowline"><span>Register</span><i>→</i><span>Pay</span><i>→</i><span>Confirm</span><i>→</i><span>Play</span><i>→</i><span>Report</span></div><a className="tc-cta light" href="/twin-city-kappas/portal#golf">Open Golf Workspace</a><small>Final event details will replace the current placeholder information when provided.</small></div></section>

  <section className="tc-impact-strip"><div><p className="tc-kicker">IMPACT</p><h2>The next version of the site should show what the chapter is accomplishing now.</h2></div><p>BrotherHub will become the source for live service hours, youth served, scholarships, event participation and chapter activity. No invented numbers. No stale annual updates.</p></section>

  <section className="tc-digital-home"><div><p className="tc-kicker light">ONE CHAPTER · ONE DIGITAL HOME</p><h2>The story outside.<br/>The work inside.</h2></div><div><p>The public site tells the Twin City story. BrotherHub helps brothers and leaders operate the chapter, manage the golf tournament, communicate, organize documents, track payments and open Amplifi.</p><a className="tc-cta light" href="/twin-city-kappas/portal">Enter BrotherHub</a></div></section>

  <footer><div className="tc-footer-brand"><img src={chapterLogo} alt="Twin City Kappas"/><span><b>TWIN CITY KAPPAS</b><small>Winston-Salem (NC) Alumni Chapter</small></span></div><div className="tc-footer-links"><a href="#legacy">Legacy</a><a href="#service">Service</a><a href="#youth">Youth</a><a href="#foundation">Foundation</a><a href="#golf">Golf</a></div><span>© 2026 Twin City Kappas</span></footer>
</main>}
