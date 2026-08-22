import './joe-smith.css'

const HOME = 'https://www.joesmithbasketballacademy.com/'
const ABOUT = 'https://www.joesmithbasketballacademy.com/about'
const CLASSES = 'https://www.joesmithbasketballacademy.com/blank'
const EVENTS = 'https://www.joesmithbasketballacademy.com/events'
const CONTACT = 'https://www.joesmithbasketballacademy.com/contact'
const BOOK = 'https://calendly.com/tdavidson72/15min'
const PORTAL = '/portal/login'

const IMG = {
  joeMaryland: 'https://static.wixstatic.com/media/05e74b_f74ece719e9d452e9f338bf304c24893~mv2.jpg/v1/crop/x_0%2Cy_0%2Cw_487%2Ch_643/fill/w_487%2Ch_643%2Cal_c%2Cq_80%2Cenc_avif%2Cquality_auto/Joe%20Smith%20UMD%20%281%29_JPG.jpg',
  kids: 'https://static.wixstatic.com/media/05e74b_eed83ab8d53143b5b13dd00bbfeb3f95~mv2.png/v1/fill/w_980%2Ch_1320%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/IMG_9286%20%281%29_heic.png',
  training: 'https://static.wixstatic.com/media/05e74b_2993a7db0f7d45479a8d4ec7310378ea~mv2.jpeg/v1/fill/w_980%2Ch_735%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/IMG_5964.jpeg',
  joeEvent: 'https://static.wixstatic.com/media/05e74b_69c2755d722a4219aca57dbf33a57109~mv2.png/v1/fill/w_980%2Ch_1307%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/IMG_1005_heic.png',
  jr: 'https://static.wixstatic.com/media/05e74b_a4a3bd429ebe4e4a81bf6676e5835ddc~mv2.png/v1/fill/w_200%2Ch_50%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/JR%20NBA%20and%20WNBA.png',
}

export const metadata = {
  title: 'Joe Smith Basketball Academy',
  description: 'Basketball development, mentorship, classes, workshops and events with Joe Smith Basketball Academy.',
}

export default function JoeSmithPage() {
  return (
    <main className="joeSite">
      <nav className="joeNav">
        <div className="joeNavInner">
          <a className="joeBrand" href={HOME} target="_blank" rel="noreferrer">
            <span>JOE SMITH</span>
            <small>Basketball Academy</small>
          </a>
          <div className="joeLinks" aria-label="Primary navigation">
            <a href={ABOUT} target="_blank" rel="noreferrer">About</a>
            <a href={CLASSES} target="_blank" rel="noreferrer">Classes</a>
            <a href={EVENTS} target="_blank" rel="noreferrer">Events</a>
            <a href={CONTACT} target="_blank" rel="noreferrer">Contact</a>
          </div>
          <div className="joeNavActions">
            <a className="joePortalLink" href={PORTAL}>Family Portal</a>
            <a className="joeNavCta" href={BOOK} target="_blank" rel="noreferrer">Book a class</a>
          </div>
        </div>
      </nav>

      <section className="joeHero">
        <img className="joeHeroImage" src={IMG.kids} alt="Joe Smith surrounded by young players at the basketball academy" />
        <div className="joeHeroShade" />
        <div className="joeHeroContent">
          <p className="joeKicker">Joe Smith Basketball Academy</p>
          <h1>Every player needs someone who sees what they can become.</h1>
          <p className="joeHeroLead">
            Skills matter. So do confidence, discipline, leadership and the relationship between a player and the people helping them grow.
          </p>
          <div className="joeActions">
            <a className="joePrimary" href={CLASSES} target="_blank" rel="noreferrer">Explore classes</a>
            <a className="joeGhost" href={ABOUT} target="_blank" rel="noreferrer">Meet Joe</a>
          </div>
        </div>
      </section>

      <section className="joeManifesto">
        <div className="joeWrap joeManifestoInner">
          <p className="joeKicker blue">More than basketball</p>
          <h2>Getting better is personal.</h2>
          <p className="joeBigCopy">
            A player learns faster when coaching becomes a connection. When someone notices the footwork, corrects the habit, celebrates the progress and keeps asking for one more good rep.
          </p>
        </div>
      </section>

      <section className="joeConnection">
        <div className="joeConnectionMedia">
          <img src={IMG.training} alt="Joe Smith coaching a player during a basketball workout" />
        </div>
        <div className="joeConnectionCopy">
          <p className="joeKicker blue">Player + coach</p>
          <h2>One correction can change a possession. The right relationship can change a player.</h2>
          <p>
            Joe Smith Basketball Academy offers team drills and one-on-one coaching built around the fundamentals players use every possession: ball handling, shooting, passing, defense, post play and decision making.
          </p>
          <a className="joeTextLink" href={CLASSES} target="_blank" rel="noreferrer">See all classes</a>
        </div>
      </section>

      <section className="joePrograms">
        <div className="joeWrap">
          <div className="joeProgramsHead">
            <div>
              <p className="joeKicker blue">Practice with us</p>
              <h2>Start where your game needs work.</h2>
            </div>
            <p>Choose the skill. Choose the setting. Then get to work.</p>
          </div>
          <div className="joeProgramRows">
            {[
              ['Ball Handling', 'Fundamentals and drills that make the ball feel more secure under pressure.'],
              ['Shooting', 'Repetition, mechanics and game-ready shooting work.'],
              ['Passing', 'Half-court and full-court reads that help players see the floor.'],
              ['Defense', 'Individual habits, positioning and competitive defensive work.'],
              ['One-on-One Training', 'Focused individual coaching with direct feedback and repetition.'],
            ].map(([name, copy], index) => (
              <a className="joeProgramRow" href={index === 4 ? BOOK : CLASSES} target="_blank" rel="noreferrer" key={name}>
                <span className="joeProgramIndex">0{index + 1}</span>
                <div>
                  <h3>{name}</h3>
                  <p>{copy}</p>
                </div>
                <span className="joeArrow">↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="joeStory">
        <div className="joeStoryMedia">
          <img src={IMG.joeMaryland} alt="Joe Smith during his University of Maryland basketball career" />
        </div>
        <div className="joeStoryCopy">
          <p className="joeKicker">From Norfolk to No. 1</p>
          <h2>Joe knows what development can unlock.</h2>
          <p>
            Raised in Norfolk, Joe Smith became the 1995 College Player of the Year at Maryland and the No. 1 pick in the 1995 NBA Draft. He spent 16 years in the NBA. Today, that experience comes back to the next generation through teaching, repetition, standards and mentorship.
          </p>
          <a className="joeTextLink light" href={ABOUT} target="_blank" rel="noreferrer">Read Joe’s story</a>
        </div>
      </section>

      <section className="joePartnership">
        <div className="joeWrap joePartnershipInner">
          <div>
            <p className="joeKicker blue">Proud partner</p>
            <h2>Jr. NBA & Jr. WNBA</h2>
            <p>
              The academy is part of a global youth basketball movement centered on participation, skill development, teamwork and character. The goal is bigger than a better jump shot. It is helping young athletes learn, play, compete and grow.
            </p>
          </div>
          <img src={IMG.jr} alt="Jr. NBA and Jr. WNBA" />
        </div>
      </section>

      <section className="joeEvents">
        <div className="joeEventsMedia">
          <img src={IMG.joeEvent} alt="Joe Smith connecting with the local community at an event" />
        </div>
        <div className="joeEventsCopy">
          <p className="joeKicker blue">Beyond the workout</p>
          <h2>Camps, workshops, special events and community.</h2>
          <p>
            Training is part of the academy experience. Events create another place for players and families to connect, compete, learn and be part of something larger than a single session.
          </p>
          <a className="joeTextLink" href={EVENTS} target="_blank" rel="noreferrer">Explore upcoming events</a>
        </div>
      </section>

      <section className="joePortalSection">
        <div className="joeWrap joePortalCard">
          <div>
            <p className="joeKicker">Stay connected after the workout</p>
            <h2>The relationship does not end when practice does.</h2>
            <p>
              Families can move from the website into one connected place for their academy relationship. Registration, confirmations, updates and the next step stay together instead of getting lost across separate messages and pages.
            </p>
          </div>
          <div className="joePortalActions">
            <a className="joePortalPrimary" href={PORTAL}>Open Family Portal</a>
            <a className="joePortalSecondary" href={BOOK} target="_blank" rel="noreferrer">Book a class</a>
          </div>
        </div>
      </section>

      <section className="joeClosing">
        <div className="joeWrap joeClosingInner">
          <p className="joeKicker blue">Begin your journey</p>
          <h2>Come ready to work. Leave better than you arrived.</h2>
          <div className="joeActions center">
            <a className="joePrimary dark" href={BOOK} target="_blank" rel="noreferrer">Book a class</a>
            <a className="joeSecondary" href={CONTACT} target="_blank" rel="noreferrer">Contact the academy</a>
          </div>
        </div>
      </section>

      <footer className="joeFooter">
        <div className="joeWrap joeFooterInner">
          <div>
            <strong>JOE SMITH</strong>
            <small>Basketball Academy</small>
          </div>
          <div className="joeFooterLinks">
            <a href={ABOUT} target="_blank" rel="noreferrer">About</a>
            <a href={CLASSES} target="_blank" rel="noreferrer">Classes</a>
            <a href={EVENTS} target="_blank" rel="noreferrer">Events</a>
            <a href={PORTAL}>Family Portal</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
