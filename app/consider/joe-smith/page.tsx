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
  hero: 'https://static.wixstatic.com/media/05e74b_eed83ab8d53143b5b13dd00bbfeb3f95~mv2.png/v1/fill/w_980%2Ch_1320%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/IMG_9286%20%281%29_heic.png',
  coaching: 'https://static.wixstatic.com/media/05e74b_81b2e63768404aa19a849bcf2995bcf4~mv2.jpeg/v1/fill/w_1450%2Ch_1088%2Cq_90%2Cenc_avif%2Cquality_auto/05e74b_81b2e63768404aa19a849bcf2995bcf4~mv2.jpeg',
  huddle: 'https://static.wixstatic.com/media/05e74b_16e89fd800ae4df68dab6531fdf18ab9~mv2.jpeg/v1/fill/w_1450%2Ch_1088%2Cq_90%2Cenc_avif%2Cquality_auto/05e74b_16e89fd800ae4df68dab6531fdf18ab9~mv2.jpeg',
  jr: 'https://static.wixstatic.com/media/05e74b_a4a3bd429ebe4e4a81bf6676e5835ddc~mv2.png/v1/fill/w_200%2Ch_50%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/JR%20NBA%20and%20WNBA.png',
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
          <span className="joeMark"><i>J</i><b>S</b></span>
          <span><strong>JOE SMITH</strong><small>BASKETBALL ACADEMY</small></span>
        </a>
        <div className="joeNavActions">
          <a className="joePortal" href={URLS.portal}>Family Portal</a>
          <a className="joeButton dark" href={URLS.book} target="_blank" rel="noreferrer">Book a class</a>
        </div>
      </nav>

      <section className="joeHero" id="top">
        <div className="joeHeroImage"><img src={IMG.hero} alt="Joe Smith connecting with young basketball players" /></div>
        <div className="joeHeroCopy">
          <p className="eyebrow">JOE SMITH BASKETBALL ACADEMY</p>
          <h1>Every player needs someone who sees what they can become.</h1>
          <p className="lead">Skills matter. So do confidence, discipline, leadership and the belief that another good rep can change what comes next.</p>
          <div className="heroActions">
            <a className="joeButton dark" href={URLS.book} target="_blank" rel="noreferrer">Book a class</a>
            <a className="textLink" href="#classes">See every class</a>
          </div>
        </div>
      </section>

      <section className="joePromise">
        <p className="eyebrow">PLAYER + COACH</p>
        <h2>Getting better is personal.</h2>
        <p>A coach notices the detail a player misses, asks for one more rep, and stays close enough for confidence to catch up with ability.</p>
        <div className="joePromiseImage"><img src={IMG.coaching} alt="Joe Smith coaching a young player through a basketball drill" /></div>
      </section>

      <section className="joeClasses" id="classes">
        <div className="sectionIntro">
          <p className="eyebrow">PRACTICE WITH US</p>
          <h2>Choose what you want to get better at.</h2>
          <p>No extra click. The academy's training options are right here.</p>
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
        <div className="connectionImage"><img src={IMG.huddle} alt="Joe Smith with young players gathered together on the court" /></div>
        <div className="connectionCopy">
          <p className="eyebrow">MORE THAN A WORKOUT</p>
          <h2>Players remember who believed in them.</h2>
          <p>Joe's experience matters because he can pass it forward. The academy connects instruction, encouragement, standards and belonging so young players can grow on and off the court.</p>
          <a className="textLink" href={URLS.about} target="_blank" rel="noreferrer">Joe's story →</a>
        </div>
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

      <section className="joeLogoWall" aria-label="Joe Smith Basketball Academy logo">
        <div className="joeLogoLarge"><span className="joeMark large"><i>J</i><b>S</b></span><strong>JOE SMITH</strong><small>BASKETBALL ACADEMY</small></div>
      </section>

      <footer><strong>Joe Smith Basketball Academy</strong><span>Player development. Coaching. Connection.</span></footer>
    </main>
  )
}
