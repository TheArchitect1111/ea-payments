import './joe-smith.css'

const CLASSES = [
  'Ball Handling Fundamentals and Drills',
  'Shooting Fundamentals and Drills',
  'Passing Drills',
  'Half Court Passing Drills',
  'Full Court Drills',
  'Team Shooting',
  'Defense',
  'Low Post Drills',
  'Pick (Screen) Drills',
  'One-on-One Training',
]

const URLS = {
  book: 'https://calendly.com/tdavidson72/15min',
  events: 'https://www.joesmithbasketballacademy.com/events',
  about: 'https://www.joesmithbasketballacademy.com/about',
  portal: '/portal/joe-smith',
}

const IMG = {
  logo: '/joe-smith-logo.jpg',
  hero: 'https://static.wixstatic.com/media/05e74b_81b2e63768404aa19a849bcf2995bcf4~mv2.jpeg/v1/fill/w_1450%2Ch_1088%2Cq_90%2Cenc_avif%2Cquality_auto/05e74b_81b2e63768404aa19a849bcf2995bcf4~mv2.jpeg',
  kids: 'https://static.wixstatic.com/media/05e74b_eed83ab8d53143b5b13dd00bbfeb3f95~mv2.png/v1/fill/w_980%2Ch_1320%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/IMG_9286%20%281%29_heic.png',
  huddle: 'https://static.wixstatic.com/media/05e74b_16e89fd800ae4df68dab6531fdf18ab9~mv2.jpeg/v1/fill/w_1450%2Ch_1088%2Cq_90%2Cenc_avif%2Cquality_auto/05e74b_16e89fd800ae4df68dab6531fdf18ab9~mv2.jpeg',
  jr: 'https://static.wixstatic.com/media/05e74b_a4a3bd429ebe4e4a81bf6676e5835ddc~mv2.png/v1/fill/w_200%2Ch_50%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/JR%20NBA%20and%20WNBA.png',
}

function JoeLogo({ large = false }) {
  return (
    <span className={large ? 'joeLogoImageWrap large' : 'joeLogoImageWrap'}>
      <img src={IMG.logo} alt="Joe Smith Basketball Academy logo" />
    </span>
  )
}

export const metadata = {
  title: 'Joe Smith Basketball Academy',
  description: 'Player development, coaching, confidence and connection.',
}

export default function JoeSmithPage() {
  return (
    <main className="joeSite">
      <nav className="joeNav">
        <a className="joeBrand" href="#top" aria-label="Joe Smith Basketball Academy home">
          <JoeLogo />
        </a>
        <div className="joeNavActions">
          <a className="joePortal" href={URLS.portal}>Family Portal</a>
          <a className="joeButton dark" href={URLS.book} target="_blank" rel="noreferrer">Book a class</a>
        </div>
      </nav>

      <section className="joeHero" id="top">
        <div className="joeHeroImage"><img src={IMG.hero} alt="Joe Smith coaching a young basketball player one-on-one" /></div>
        <div className="joeHeroCopy">
          <p className="eyebrow">JOE SMITH BASKETBALL ACADEMY</p>
          <h1>Every player needs someone who sees what they can become.</h1>
          <p className="lead">Skills matter. So do confidence, discipline, leadership and the belief that another good rep can change what comes next.</p>
          <div className="heroActions">
            <a className="joeButton dark" href={URLS.book} target="_blank" rel="noreferrer">Book a class</a>
          </div>
        </div>
      </section>

      <section className="joeClasses" id="classes">
        <div className="sectionIntro">
          <p className="eyebrow">PRACTICE WITH US</p>
          <h2>Choose what you want to get better at.</h2>
          <p>The academy's training options are right here. No extra page and no extra click.</p>
        </div>
        <div className="classList">
          {CLASSES.map((name, index) => (
            <div className="classRow" key={name}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{name}</h3>
              <a href={URLS.book} target="_blank" rel="noreferrer">Book →</a>
            </div>
          ))}
        </div>
      </section>

      <section className="joeConnection">
        <div className="connectionImage"><img src={IMG.kids} alt="Joe Smith connecting with young players at the academy" /></div>
        <div className="connectionCopy">
          <p className="eyebrow">PLAYER + COACH</p>
          <h2>Players remember who believed in them.</h2>
          <p>The work is personal. Joe sees the player, asks for another rep, celebrates progress and helps young athletes build confidence alongside skill.</p>
          <a className="textLink" href={URLS.about} target="_blank" rel="noreferrer">Joe's story →</a>
        </div>
      </section>

      <section className="joePromise">
        <p className="eyebrow">GETTING BETTER TOGETHER</p>
        <h2>One rep. One correction. One connection at a time.</h2>
        <p>A coach notices the detail a player misses, stays close enough to teach it, and gives the player room to own the improvement.</p>
        <div className="joePromiseImage"><img src={IMG.huddle} alt="Joe Smith with young players gathered together on the court" /></div>
      </section>

      <section className="joePartner">
        <img src={IMG.jr} alt="Jr. NBA and Jr. WNBA" />
        <div><p className="eyebrow">PROUD PARTNER</p><h2>Jr. NBA & Jr. WNBA</h2><p>Part of a global movement focused on youth participation, skill development, teamwork and character.</p></div>
      </section>

      <section className="joeConnected">
        <p className="eyebrow">ONE CONNECTED FAMILY EXPERIENCE</p>
        <h2>The relationship should not disappear after registration.</h2>
        <p>Families can move from discovering the academy to booking, confirmation, updates and their next step without getting lost across disconnected pages and messages.</p>
        <div className="connectedActions">
          <a className="joeButton light" href={URLS.portal}>Open Family Portal</a>
          <a className="joeButton outline" href={URLS.book} target="_blank" rel="noreferrer">Book a class</a>
        </div>
      </section>

      <section className="joeLogoWall" aria-label="Joe Smith Basketball Academy brand mark">
        <JoeLogo large />
      </section>

      <footer><strong>Joe Smith Basketball Academy</strong><span>Player development. Coaching. Connection.</span></footer>
    </main>
  )
}
