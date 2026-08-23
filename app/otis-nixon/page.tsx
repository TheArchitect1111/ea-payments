import './otis-nixon.css';

const images = {
  hero: 'https://lh3.googleusercontent.com/GptkqzEl2u47GbTsbcmLEJZn4IYq8OA8VSoYlZ3D6RGy4t9VcnxAgZmE07oHTc6N2nkkG5RwxWjcLjkYOB8obsTjP6Kir1shLkU',
  autograph: 'https://lh3.googleusercontent.com/bNq66xF5UsnNj_w1NxEajBWqwSIKgKDVvo4cGBCVu0MpSn9CqVkqNB31GVkNmScBYy7xFi1OPRumzVfFKMnNBBvGnMolFbcJJFY',
};

const opportunities = [
  ['BOOK', 'Keeping It Real', 'A candid story of baseball, adversity, recovery, faith and purpose.', 'Explore the book', 'https://www.amazon.com/Keeping-Real-Otis-Nixon/dp/0615338844'],
  ['SPEAKING', 'Bring Otis to your audience', 'Schools, teams, churches, recovery communities, corporations and special events.', 'Request Otis', 'https://www.otisnixonbaseball.com/contact-us/'],
  ['MINISTRY', 'Trials became testimony', 'Faith-centered messages about restoration, accountability and choosing the next right step.', 'Invite Otis', 'https://www.otisnixonbaseball.com/contact-us/'],
  ['BASEBALL', 'Clinics, teams & youth', 'Use a 17-season Major League career to teach preparation, resilience and leadership.', 'Plan an experience', 'https://www.otisnixonbaseball.com/contact-us/'],
  ['APPEARANCES', 'Signings, media & events', 'Autographs, fan experiences, interviews, podcasts, alumni events and special appearances.', 'Start a conversation', 'https://www.otisnixonbaseball.com/contact-us/'],
  ['PARTNERSHIPS', 'Sponsors & community impact', 'Connect brands and organizations with youth, recovery, faith and baseball initiatives.', 'Partner with Otis', 'https://www.otisnixonbaseball.com/sponsors/'],
  ['MERCH', 'Memorabilia & merchandise', 'Give fans a direct path to the legacy through official merchandise and collectibles.', 'Visit the store', 'https://www.otisnixonbaseball.com/merchandise/'],
];

export default function OtisNixonPage(){
  return <main className="otis-site">
    <div className="shell">
      <header className="nav">
        <a className="wordmark" href="#top">Otis <span>Nixon</span></a>
        <nav><a href="#story">Story</a><a href="#work">Book & Speaking</a><a href="#legacy">Legacy</a><a href="https://www.otisnixonbaseball.com/merchandise/">Store</a></nav>
        <a className="black-pill" href="https://www.otisnixonbaseball.com/contact-us/">Book Otis</a>
      </header>

      <section id="top" className="hero">
        <p className="eyebrow">PLAYER · SPEAKER · MINISTER · AUTHOR</p>
        <h1>A LEGEND.<br/>A TESTIMONY.<br/>A LIFE IN MOTION.</h1>
        <p className="hero-intro">Otis Nixon changed games with speed. Today, he uses the whole story, the victories, the falls, the faith and the comeback, to move people forward.</p>
        <div className="hero-grid">
          <figure className="hero-photo"><img src={images.hero} alt="Otis Nixon in an Atlanta Braves uniform"/><figcaption><strong>17 seasons. 620 stolen bases.</strong><span>And a story bigger than baseball.</span></figcaption></figure>
          <aside>
            <article className="quiet-card"><p className="eyebrow">THE BOOK</p><h2>Keeping It Real</h2><p>His story of baseball, addiction, recovery, redemption, faith and learning how to live on purpose.</p><a href="https://www.amazon.com/Keeping-Real-Otis-Nixon/dp/0615338844">Explore the book →</a></article>
            <article className="quiet-card"><p className="eyebrow">SPEAKING</p><h2>A story people remember.</h2><p>For schools, teams, churches, recovery communities, companies and events where the message needs to land.</p><a href="https://www.otisnixonbaseball.com/contact-us/">Invite Otis →</a></article>
          </aside>
        </div>
      </section>

      <section id="story" className="statement"><p>He once made a living <em>stealing bases.</em> Now he gives away the lessons that helped him <em>reclaim his life.</em></p></section>

      <section className="image-band"><img src={images.autograph} alt="Otis Nixon signing memorabilia"/><div><p className="eyebrow light">BEYOND THE GAME</p><h2>Turn the legacy into connection.</h2><p>Speaking engagements, baseball experiences, appearances, signed memorabilia, sponsorships, youth programs, ministry events and media.</p></div></section>

      <section id="work" className="work">
        <div className="section-head"><h2>WAYS TO<br/>WORK WITH OTIS</h2><p>One story. Multiple doors. Clear next steps without making the experience feel like a catalog.</p></div>
        <div className="opportunity-list">{opportunities.map(([label,title,text,cta,href]) => <article className="opportunity" key={title}><span>{label}</span><h3>{title}</h3><p>{text}</p><a href={href}>{cta} ↗</a></article>)}</div>
      </section>

      <section id="legacy" className="legacy">
        <div><p className="eyebrow">THE BASEBALL LEGACY</p><h2>Speed made him famous. Resilience made the story matter.</h2></div>
        <div className="stats"><div><b>17</b><span>Major League seasons</span></div><div><b>620</b><span>Career stolen bases</span></div><div><b>6</b><span>Stolen bases in one game</span></div><div><b>72</b><span>Braves steals in 1991</span></div></div>
      </section>

      <section className="final-cta"><h2>Bring the whole Otis Nixon story to your audience.</h2><a href="https://www.otisnixonbaseball.com/contact-us/">Request Otis</a></section>
      <footer><span>Concept experience for Otis Nixon</span><span>Player · Speaker · Minister · Author</span></footer>
    </div>
  </main>
}