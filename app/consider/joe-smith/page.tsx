import './joe-smith.css'

const HOME = 'https://www.joesmithbasketballacademy.com/'
const ABOUT = 'https://www.joesmithbasketballacademy.com/about'
const CLASSES = 'https://www.joesmithbasketballacademy.com/blank'
const EVENTS = 'https://www.joesmithbasketballacademy.com/events'
const CONTACT = 'https://www.joesmithbasketballacademy.com/contact'
const BOOK = 'https://calendly.com/tdavidson72/15min'

const IMG = {
  joeMaryland: 'https://static.wixstatic.com/media/05e74b_f74ece719e9d452e9f338bf304c24893~mv2.jpg/v1/crop/x_0%2Cy_0%2Cw_487%2Ch_643/fill/w_487%2Ch_643%2Cal_c%2Cq_80%2Cenc_avif%2Cquality_auto/Joe%20Smith%20UMD%20%281%29_JPG.jpg',
  kids: 'https://static.wixstatic.com/media/05e74b_eed83ab8d53143b5b13dd00bbfeb3f95~mv2.png/v1/fill/w_980%2Ch_1320%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/IMG_9286%20%281%29_heic.png',
  training: 'https://static.wixstatic.com/media/05e74b_2993a7db0f7d45479a8d4ec7310378ea~mv2.jpeg/v1/fill/w_980%2Ch_735%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/IMG_5964.jpeg',
  community: 'https://static.wixstatic.com/media/05e74b_c2b87ce307e5445db02a91c884b3ee6a~mv2.png/v1/fill/w_980%2Ch_1307%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/IMG_7506_HEIC.png',
  joeEvent: 'https://static.wixstatic.com/media/05e74b_69c2755d722a4219aca57dbf33a57109~mv2.png/v1/fill/w_980%2Ch_1307%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/IMG_1005_heic.png',
  jr: 'https://static.wixstatic.com/media/05e74b_a4a3bd429ebe4e4a81bf6676e5835ddc~mv2.png/v1/fill/w_200%2Ch_50%2Cal_c%2Cq_85%2Cenc_avif%2Cquality_auto/JR%20NBA%20and%20WNBA.png',
}

export const metadata = {
  title: 'Joe Smith Basketball Academy — Connected Website Preview',
  description: 'A source-driven connected website concept for Joe Smith Basketball Academy.',
}

export default function JoeSmithPage() {
  return (
    <main className="joeSite">
      <nav className="joeNav">
        <div className="joeWrap joeNavInner">
          <a className="joeBrand" href={HOME} target="_blank" rel="noreferrer">
            JOE SMITH
            <small>Basketball Academy</small>
          </a>
          <div className="joeLinks" aria-label="Primary navigation">
            <a href={ABOUT} target="_blank" rel="noreferrer">About</a>
            <a href={CLASSES} target="_blank" rel="noreferrer">Classes</a>
            <a href={EVENTS} target="_blank" rel="noreferrer">Events</a>
            <a href={CONTACT} target="_blank" rel="noreferrer">Contact</a>
          </div>
          <a className="joeNavCta" href={BOOK} target="_blank" rel="noreferrer">Find your class</a>
        </div>
      </nav>

      <section className="joeHero">
        <div className="joeWrap joeHeroGrid">
          <div className="joeHeroCopy">
            <span className="joeEyebrow">Joe Smith Basketball Academy</span>
            <h1>Build the player. <span>Grow the person.</span></h1>
            <p className="joeLead">
              Basketball is the door. Confidence, discipline, leadership and lifelong skills are what young athletes carry through it.
            </p>
            <div className="joeActions">
              <a className="joePrimary" href={BOOK} target="_blank" rel="noreferrer">Find your class</a>
              <a className="joeSecondary" href={EVENTS} target="_blank" rel="noreferrer">See upcoming events</a>
            </div>
          </div>
          <div className="joePhotoCard">
            <img src={IMG.kids} alt="Joe Smith smiling with young basketball players at the academy" />
            <div className="joePhotoOverlay">
              <div>
                <strong>Not just better players.</strong>
                <span>Better people and future leaders.</span>
              </div>
              <a className="joeSecondary" href={ABOUT} target="_blank" rel="noreferrer">Meet Joe</a>
            </div>
          </div>
        </div>
      </section>

      <section className="joeTrustStrip">
        <div className="joeWrap joeTrustInner">
          <div className="joeTrustCopy">
            <strong>Proud partner of Jr. NBA & Jr. WNBA</strong>
            <span>Part of a global movement focused on youth participation, skill development, teamwork and character.</span>
          </div>
          <div className="joeTrustLogo">
            <img src={IMG.jr} alt="Jr. NBA and Jr. WNBA" />
          </div>
        </div>
      </section>

      <section className="joeSection" id="start">
        <div className="joeWrap">
          <div className="joeSectionHead">
            <h2>Start with what your athlete needs.</h2>
            <p>
              The current academy already offers multiple ways to train. This version turns them into one clear family path, so a parent does not have to hunt for the next step.
            </p>
          </div>
          <div className="joeChoiceGrid">
            <a className="joeChoice" href={CLASSES} target="_blank" rel="noreferrer">
              <span className="joeNumber">01</span>
              <div>
                <h3>I want to improve my game.</h3>
                <p>Explore ball handling, shooting, passing, defense and other academy classes.</p>
                <b>See classes →</b>
              </div>
            </a>
            <a className="joeChoice" href={BOOK} target="_blank" rel="noreferrer">
              <span className="joeNumber">02</span>
              <div>
                <h3>I want one-on-one coaching.</h3>
                <p>Move directly from interest to the academy’s current booking path.</p>
                <b>Book a session →</b>
              </div>
            </a>
            <a className="joeChoice" href={EVENTS} target="_blank" rel="noreferrer">
              <span className="joeNumber">03</span>
              <div>
                <h3>I want camps, workshops & events.</h3>
                <p>See what is coming up and move directly into the appropriate registration experience.</p>
                <b>See events →</b>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section className="joeStory">
        <div className="joeWrap joeStoryGrid">
          <div className="joeStoryImage">
            <img src={IMG.joeMaryland} alt="Joe Smith playing basketball for the University of Maryland" />
          </div>
          <div className="joeStoryCopy">
            <span className="joeEyebrow">Why Joe</span>
            <h2>Experience that means more when it is passed forward.</h2>
            <p>
              Joe Smith was the No. 1 pick in the 1995 NBA Draft after becoming College Player of the Year at Maryland. His academy now uses basketball as a platform to help the next generation learn, compete and grow on and off the court.
            </p>
            <div className="joeFact">
              <strong>#1</strong>
              <span>1995 NBA Draft pick, after a standout collegiate career at Maryland.</span>
            </div>
            <div className="joeFact">
              <strong>16</strong>
              <span>Years in the NBA, now translated into development, mentorship and opportunity for young athletes.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="joeSection joeJourney">
        <div className="joeWrap">
          <div className="joeSectionHead">
            <h2>One connected family journey.</h2>
            <p>
              Every page should move a family forward. The website stops behaving like separate islands and starts acting like a guide from curiosity to the first workout.
            </p>
          </div>
          <div className="joeJourneyGrid">
            <div className="joeJourneyStep">
              <small>01 · Feel it</small>
              <h3>See Joe. See the kids.</h3>
              <p>Authentic academy imagery makes the experience human before asking for a click.</p>
            </div>
            <div className="joeJourneyStep">
              <small>02 · Choose</small>
              <h3>Start with the need.</h3>
              <p>Classes, one-on-one coaching and events are organized around what a family is trying to accomplish.</p>
            </div>
            <div className="joeJourneyStep">
              <small>03 · Act</small>
              <h3>Move straight to booking.</h3>
              <p>Clear calls to action send the parent into the academy’s current Calendly or event registration path.</p>
            </div>
            <div className="joeJourneyStep">
              <small>04 · Stay connected</small>
              <h3>Do not lose the relationship.</h3>
              <p>The site is structured for future interest capture and handoff into Joe’s business portal and Eva follow-up workflow.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="joeSection">
        <div className="joeWrap">
          <div className="joeSectionHead">
            <h2>The academy should feel alive.</h2>
            <p>
              Joe already has the emotional material. Real gyms, real athletes, real community. The redesign gives those moments room to carry the story instead of burying them inside generic site sections.
            </p>
          </div>
          <div className="joeGallery">
            <div className="joeGalleryMain"><img src={IMG.training} alt="Joe Smith working with a basketball player in a gym" /></div>
            <div className="joeGallerySide">
              <figure><img src={IMG.community} alt="Joe Smith at a community event" /></figure>
              <figure><img src={IMG.joeEvent} alt="Joe Smith at a live community event" /></figure>
            </div>
          </div>
        </div>
      </section>

      <section className="joeClosing">
        <div className="joeWrap joeClosingCard">
          <div>
            <span className="joeEyebrow">Your next step</span>
            <h2>Where does your athlete want to grow?</h2>
            <p>Choose a class, see what is happening next, or talk with the academy. One clear decision, then one clear next step.</p>
          </div>
          <div className="joeClosingActions">
            <a className="joePrimary" href={BOOK} target="_blank" rel="noreferrer">Find your class</a>
            <a className="joeSecondary" href={CONTACT} target="_blank" rel="noreferrer">Ask a question</a>
          </div>
        </div>
      </section>

      <footer className="joeFooter">
        <div className="joeWrap joeFooterInner">
          <div><strong>Joe Smith Basketball Academy</strong><br />Connected website concept built from the academy’s current public content and imagery.</div>
          <a href={HOME} target="_blank" rel="noreferrer">View current academy site ↗</a>
        </div>
      </footer>
    </main>
  )
}
