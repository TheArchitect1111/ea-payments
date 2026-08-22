import './otis-nixon.css';

const officialImages = {
  hero: 'https://lh3.googleusercontent.com/GptkqzEl2u47GbTsbcmLEJZn4IYq8OA8VSoYlZ3D6RGy4t9VcnxAgZmE07oHTc6N2nkkG5RwxWjcLjkYOB8obsTjP6Kir1shLkU',
  autograph: 'https://lh3.googleusercontent.com/bNq66xF5UsnNj_w1NxEajBWqwSIKgKDVvo4cGBCVu0MpSn9CqVkqNB31GVkNmScBYy7xFi1OPRumzVfFKMnNBBvGnMolFbcJJFY',
  story: 'https://lh3.googleusercontent.com/mJPi956c2tSHH0HdbnEjX4-IgXYn66uXpLWvkCf23Ca93xheO-KkxbGBBsvX6echg-YvF_3AnZiDLBmjJaqe54xKpChdYHt5OSAM',
};

const bookCover = 'https://images-na.ssl-images-amazon.com/images/P/0615338844.01.LZZZZZZZ.jpg';

export default function OtisNixonPage() {
  return (
    <main className="otis-site">
      <header className="otis-nav">
        <div className="brand"><span className="monogram">ON</span><div><strong>OTIS NIXON</strong><small>LEGEND. LEADER. MENTOR.</small></div></div>
        <nav><a href="#home">HOME</a><a href="#story">ABOUT OTIS</a><a href="#youth">BASEBALL & YOUTH</a><a href="#speaking">SPEAKING</a><a href="#book">BOOK</a></nav>
        <a className="cta" href="https://www.otisnixonbaseball.com/contact-us/">BOOK OTIS</a>
      </header>

      <section id="home" className="hero">
        <div className="stats">
          <div><b>620</b><span>CAREER STOLEN BASES</span></div>
          <div><b>6</b><span>STOLEN BASES IN ONE GAME</span></div>
          <div><b>72</b><span>STOLEN BASES, 1991</span></div>
          <div><b>1991</b><span>WORST TO FIRST BRAVES</span></div>
        </div>
        <div className="hero-photo"><img src={officialImages.hero} alt="Otis Nixon in an Atlanta Braves uniform" /></div>
        <div className="hero-copy"><p className="script">Otis Nixon</p><h1>BASEBALL GAVE ME A PLATFORM.<br/><em>PURPOSE GAVE ME A MISSION.</em></h1><p className="pillars">FAITH • FAMILY • YOUTH • COMMUNITY</p><div className="hero-actions"><a className="cta" href="https://www.otisnixonbaseball.com/contact-us/">BOOK OTIS</a><a className="secondary" href="#book">BUY THE BOOK</a></div></div>
      </section>

      <section className="quick-grid">
        <a href="https://www.otisnixonbaseball.com/contact-us/"><b>BOOK OTIS</b><span>Speaking, appearances, clinics & more</span></a>
        <a href="#youth"><b>BASEBALL & YOUTH</b><span>Clinics, camps & youth programs</span></a>
        <a href="#speaking"><b>SPEAKING</b><span>Motivational speaking & testimony</span></a>
        <a href="https://www.otisnixonbaseball.com/sponsors/"><b>SUPPORT THE MISSION</b><span>Partner, give & make an impact</span></a>
        <a href="#book"><b>BUY THE BOOK</b><span>Keeping It Real</span></a>
      </section>

      <section id="speaking" className="speaking-book">
        <div className="speaking-card">
          <img src={officialImages.story} alt="Real photo of Otis Nixon speaking" />
          <div className="overlay"><span>SPEAKING & APPEARANCES</span><h2>BRING OTIS NIXON TO YOUR NEXT EVENT</h2><p>Faith, redemption, baseball, perseverance and second chances, delivered through the voice of someone who lived the story.</p><ul><li>Keynotes & conferences</li><li>Churches & faith events</li><li>Schools & youth programs</li><li>Corporate & leadership events</li><li>Panels, interviews & appearances</li></ul><a className="cta" href="https://www.otisnixonbaseball.com/contact-us/">BOOK OTIS NOW</a></div>
        </div>

        <div id="book" className="book-card">
          <div className="book-copy"><span>MY BOOK</span><h2>KEEPING IT REAL</h2><h3>A STORY ABOUT RESTORING LIVES</h3><p>Otis Nixon's own account of baseball, adversity, faith and rebuilding. Make the book a direct revenue path from the website instead of burying it inside a general merchandise section.</p><div className="book-actions"><a className="cta" href="https://www.amazon.com/Keeping-Real-Otis-Nixon/dp/0615338844">BUY THE BOOK</a><a className="secondary dark" href="https://www.otisnixonbaseball.com/contact-us/">SIGNED / BULK ORDERS</a></div></div>
          <img src={bookCover} alt="Keeping It Real by Otis Nixon book cover" />
        </div>
      </section>

      <section id="youth" className="impact">
        <div className="impact-photo"><img src={officialImages.autograph} alt="Real photo of Otis Nixon meeting fans at an event" /></div>
        <div className="impact-copy"><span>MAKING AN IMPACT</span><h2>THE LEGACY CONTINUES OFF THE FIELD</h2><div className="impact-list"><div><b>YOUTH CLINICS</b><p>Baseball fundamentals, mentorship and life lessons.</p></div><div><b>PUBLIC SPEAKING</b><p>A story of purpose, faith, recovery and perseverance.</p></div><div><b>COMMUNITY OUTREACH</b><p>Partnerships that turn a baseball platform into community impact.</p></div></div><a className="secondary dark" href="https://www.otisnixonbaseball.com/event-calendar/">VIEW EVENTS</a></div>
      </section>

      <section id="story" className="quote-band"><blockquote>“You can’t change your past, but you can change someone’s future.”</blockquote><span>— OTIS NIXON</span></section>

      <section className="conversion-band"><div><strong>READY TO BRING OTIS TO YOUR EVENT?</strong><span>Speaking, appearances, clinics, media and special events.</span></div><div className="conversion-actions"><a className="cta" href="https://www.otisnixonbaseball.com/contact-us/">BOOK OTIS NOW</a><a className="secondary" href="https://www.amazon.com/Keeping-Real-Otis-Nixon/dp/0615338844">BUY KEEPING IT REAL</a></div></section>

      <footer><div className="brand"><span className="monogram">ON</span><div><strong>OTIS NIXON</strong><small>LEGEND. LEADER. MENTOR.</small></div></div><div><b>OFFICIAL LINKS</b><a href="https://www.otisnixonbaseball.com/">Official Website</a><a href="https://www.otisnixonbaseball.com/contact-us/">Contact / Bookings</a><a href="https://www.otisnixonbaseball.com/event-calendar/">Events</a></div><div><b>BOOK</b><a href="https://www.amazon.com/Keeping-Real-Otis-Nixon/dp/0615338844">Keeping It Real</a><span>ISBN 9780615338842</span></div></footer>
    </main>
  );
}
