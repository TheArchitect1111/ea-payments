import './otis-nixon.css';

const images = {
  hero: '/otis-nixon/hero.jpg',
  legacyBar: '/otis-nixon/legacy-bar.jpg',
  speaker: 'https://lh3.googleusercontent.com/mJPi956c2tSHH0HdbnEjX4-IgXYn66uXpLWvkCf23Ca93xheO-KkxbGBBsvX6echg-YvF_3AnZiDLBmjJaqe54xKpChdYHt5OSAM',
  autograph: 'https://lh3.googleusercontent.com/bNq66xF5UsnNj_w1NxEajBWqwSIKgKDVvo4cGBCVu0MpSn9CqVkqNB31GVkNmScBYy7xFi1OPRumzVfFKMnNBBvGnMolFbcJJFY',
  book: 'https://images-na.ssl-images-amazon.com/images/P/0615338844.01.LZZZZZZZ.jpg',
};

const opportunities = [
  ['SPEAKING', 'Bring Otis to your audience', 'Keynotes, churches, schools, leadership events, media and special appearances.', 'Invite Otis', 'https://www.otisnixonbaseball.com/contact-us/'],
  ['BASEBALL & YOUTH', 'Pass the game forward', 'Clinics, camps and youth experiences built around fundamentals, character and mentorship.', 'Plan an experience', 'https://www.otisnixonbaseball.com/contact-us/'],
  ['MINISTRY', 'Faith in action', 'Testimony, restoration, recovery, perseverance and purpose for churches and faith communities.', 'Request ministry appearance', 'https://www.otisnixonbaseball.com/contact-us/'],
  ['APPEARANCES', 'Legacy in the room', 'Autographs, alumni events, fan experiences, interviews, podcasts and media.', 'Start a conversation', 'https://www.otisnixonbaseball.com/contact-us/'],
  ['PARTNERSHIPS', 'Build impact together', 'Sponsors, community activations, youth initiatives and fundraising opportunities.', 'Partner with Otis', 'https://www.otisnixonbaseball.com/sponsors/'],
  ['MERCHANDISE', 'Take the legacy home', 'Books, memorabilia and official merchandise for fans and organizations.', 'Visit the store', 'https://www.otisnixonbaseball.com/merchandise/'],
];

export default function OtisNixonPage(){
  return <main className="otis-site">
    <div className="shell">
      <header className="nav">
        <a className="wordmark" href="#top">Otis <span>Nixon</span></a>
        <nav><a href="#story">Story</a><a href="#book">Book</a><a href="#speaking">Speaking</a><a href="#work">Work with Otis</a><a href="#legacy">Legacy</a></nav>
        <a className="black-pill" href="https://www.otisnixonbaseball.com/contact-us/">Book Otis</a>
      </header>

      <section id="top" className="hero-image-first">
        <img src={images.hero} alt="Otis Nixon as player, speaker and minister"/>
      </section>

      <section className="hero-copy">
        <p className="eyebrow">PLAYER · SPEAKER · MINISTER · AUTHOR</p>
        <h1>A LEGACY<br/>STILL IN MOTION.</h1>
        <p>Baseball made Otis Nixon known. Purpose gave the platform somewhere to go. Today, the whole story creates ways to inspire, teach, serve and connect.</p>
        <div className="hero-actions"><a className="black-pill" href="https://www.otisnixonbaseball.com/contact-us/">Book Otis</a><a className="text-link" href="#book">Explore the book →</a></div>
      </section>

      <section id="story" className="statement"><p>He once made a living <em>stealing bases.</em> Now he gives away the lessons that helped him <em>reclaim his life.</em></p></section>

      <section id="book" className="book-feature">
        <div className="book-cover"><img src={images.book} alt="Keeping It Real by Otis Nixon book cover"/></div>
        <div className="book-copy"><p className="eyebrow">THE BOOK</p><h2>Keeping It Real</h2><h3>A story about restoring lives.</h3><p>Otis shares the baseball highs, personal battles, faith and rebuilding that shaped the man beyond the uniform.</p><div className="book-actions"><a className="black-pill" href="https://www.amazon.com/Keeping-Real-Otis-Nixon/dp/0615338844">Purchase the book</a><a className="text-link" href="https://www.otisnixonbaseball.com/contact-us/">Signed & bulk orders →</a></div></div>
      </section>

      <section id="speaking" className="photo-story">
        <div className="photo-story-image"><img src={images.speaker} alt="Otis Nixon speaking"/></div>
        <div className="photo-story-copy"><p className="eyebrow">SPEAKING & APPEARANCES</p><h2>He has lived the message.</h2><p>Faith. Recovery. Perseverance. Baseball. Second chances. Otis brings a story audiences remember because it was lived before it was spoken.</p><a className="text-link" href="https://www.otisnixonbaseball.com/contact-us/">Invite Otis to your event →</a></div>
      </section>

      <section className="legacy-bar"><img src={images.legacyBar} alt="Otis Nixon life and legacy collage"/></section>

      <section id="work" className="work">
        <div className="section-head"><h2>WAYS TO<br/>WORK WITH OTIS</h2><p>One story. Multiple doors. Clear next steps without turning the page into a catalog.</p></div>
        <div className="opportunity-list">{opportunities.map(([label,title,text,cta,href]) => <article className="opportunity" key={title}><span>{label}</span><h3>{title}</h3><p>{text}</p><a href={href}>{cta} ↗</a></article>)}</div>
      </section>

      <section className="community-photo"><img src={images.autograph} alt="Otis Nixon connecting with fans and community"/><div><p className="eyebrow light">COMMUNITY & CONNECTION</p><h2>The legacy is personal.</h2><p>From youth and baseball to faith, recovery, fans and community partnerships, the most valuable part of the platform is the people it reaches.</p></div></section>

      <section id="legacy" className="legacy">
        <div><p className="eyebrow">THE BASEBALL LEGACY</p><h2>Speed made him famous. Resilience made the story matter.</h2></div>
        <div className="stats"><div><b>17</b><span>Major League seasons</span></div><div><b>620</b><span>Career stolen bases</span></div><div><b>6</b><span>Stolen bases in one game</span></div><div><b>72</b><span>Braves steals in 1991</span></div></div>
      </section>

      <section className="final-cta"><div><p className="eyebrow light">NEXT CHAPTER</p><h2>Bring the whole Otis Nixon story to your audience.</h2></div><a href="https://www.otisnixonbaseball.com/contact-us/">Request Otis</a></section>
      <footer><span>Concept experience for Otis Nixon</span><span>Player · Speaker · Minister · Author</span></footer>
    </div>
  </main>
}