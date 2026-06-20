import Image from 'next/image';
import Link from 'next/link';
import './landing.css';

const possibilities = [
  {
    title: 'More Time',
    copy: 'Imagine what becomes possible when the hours you lose to chaos return to you.',
    image:
      'https://images.unsplash.com/photo-1511895426328-ac872781f227?auto=format&fit=crop&w=900&q=80',
    alt: 'Family spending meaningful time together outdoors',
  },
  {
    title: 'A Team That Just Gets It',
    copy: 'Everyone aligned. Everyone informed. Less repeating yourself.',
    image:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80',
    alt: 'Diverse team collaborating with calm confidence',
  },
  {
    title: 'More Growth',
    copy: 'More capacity means more room for the opportunities you have been waiting to pursue.',
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80',
    alt: 'Leader envisioning growth with their team',
  },
  {
    title: 'Greater Peace Of Mind',
    copy: 'Less stress. More confidence that what matters is actually happening.',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80',
    alt: 'Professional feeling calm and present at work',
  },
  {
    title: 'More Capacity',
    copy: 'Your organization gains room to grow without burning out the people who make it run.',
    image:
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80',
    alt: 'Multicultural team moving forward together',
  },
  {
    title: 'Better Experiences',
    copy: 'For your team, your customers, and the life you are building beyond the business.',
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
    alt: 'Friends sharing a joyful experience together',
  },
  {
    title: 'More Life',
    copy: 'Because every hour saved is a possibility waiting to be lived.',
    image:
      'https://images.unsplash.com/photo-1464226184743-18fd08086df7?auto=format&fit=crop&w=900&q=80',
    alt: 'Parent present with family at a meaningful moment',
  },
];

export default function HomePage() {
  return (
    <main className="ea-landing">
      <header className="ea-nav">
        <div className="ea-nav-inner">
          <Link href="/" className="ea-brand" aria-label="Efficiency Architects home">
            <Image src="/images/ea-logo.png" alt="" width={44} height={44} priority />
            <div className="ea-brand-text">
              <span>Efficiency</span>
              <strong>Architects</strong>
            </div>
          </Link>
          <Link href="/assessment" className="ea-nav-cta">
            Take The Assessment
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="ea-section ea-hero">
        <div className="ea-container ea-hero-grid ea-fade-in">
          <div>
            <h1 className="ea-display">
              What would become possible if more got done and more of your time belonged to you?
            </h1>
            <div className="ea-pill-list" aria-label="Outcomes">
              {['More family.', 'More growth.', 'More opportunities.', 'More experiences.', 'More freedom.', 'More life.'].map(
                (item) => (
                  <span key={item} className="ea-pill">
                    {item}
                  </span>
                ),
              )}
            </div>
            <div className="ea-actions">
              <a href="#possibilities" className="ea-btn ea-btn-primary">
                Discover What&apos;s Possible
              </a>
              <Link href="/assessment" className="ea-btn ea-btn-secondary">
                Take The Assessment
              </Link>
            </div>
          </div>
          <div className="ea-hero-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80"
              alt="Diverse business owner leaving work to be present with family at a meaningful experience"
            />
            <p className="ea-hero-caption">Presence. Freedom. Possibility — not luxury, but a life you can actually live.</p>
          </div>
        </div>
      </section>

      {/* SECTION 2 */}
      <section className="ea-section soft" id="possibilities">
        <div className="ea-container">
          <h2 className="ea-display-md">Imagine The Possibilities</h2>
          <p className="ea-lead">Every improvement creates capacity for the organization — and possibilities for the people inside it.</p>
          <div className="ea-cards">
            {possibilities.map((card) => (
              <article key={card.title} className="ea-card" tabIndex={0}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.image} alt={card.alt} loading="lazy" />
                <div className="ea-card-overlay">
                  <h3>{card.title}</h3>
                  <p>{card.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 */}
      <section className="ea-section" id="team">
        <div className="ea-container ea-split">
          <div className="ea-copy-stack">
            <h2 className="ea-display-md">A Team That Just Gets It</h2>
            <p>Clear communication.</p>
            <p>Less confusion.</p>
            <p>Less repeating yourself.</p>
            <p>More confidence.</p>
            <p>More alignment.</p>
          </div>
          <div className="ea-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=1200&q=80"
              alt="Diverse team working together with calm energy — everyone informed, no visible confusion"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* SECTION 4 — TEAM READINESS */}
      <section className="ea-section soft" id="team-readiness">
        <div className="ea-container ea-split">
          <div className="ea-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
              alt="Experienced team member mentoring a newer colleague while knowledge is shared and multiplied"
              loading="lazy"
            />
          </div>
          <div>
            <span className="ea-product-label">Team Readiness™</span>
            <h2 className="ea-display-md">Build Once. Teach Forever.</h2>
            <div className="ea-copy-stack">
              <p>The best organizations don&apos;t rely on memory.</p>
              <p>They capture knowledge, share experience, and help people grow.</p>
              <p>Current staff continue improving. New team members gain confidence faster.</p>
              <p>The lessons learned today continue creating value tomorrow.</p>
            </div>
            <div className="ea-actions">
              <a href="#whats-possible" className="ea-btn ea-btn-primary">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — WHAT'S POSSIBLE */}
      <section className="ea-section" id="whats-possible">
        <div className="ea-container ea-split">
          <div>
            <span className="ea-product-label">What&apos;s Possible?™</span>
            <h2 className="ea-display-md">What if you could see what&apos;s possible before investing time, money, and energy?</h2>
            <div className="ea-copy-stack">
              <p>Explore opportunities.</p>
              <p>Visualize the future.</p>
              <p>Create a roadmap.</p>
              <p>Move forward with confidence.</p>
            </div>
            <div className="ea-actions">
              <Link href="/assessment" className="ea-btn ea-btn-primary">
                Explore What&apos;s Possible
              </Link>
            </div>
          </div>
          <div className="ea-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80"
              alt="Diverse leader envisioning a hopeful future of growth, impact, and opportunity"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* SECTION 6 — PULSE */}
      <section className="ea-section soft" id="pulse">
        <div className="ea-container ea-split">
          <div className="ea-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
              alt="Clean, elegant view of organizational health — calm confidence, not complexity"
              loading="lazy"
            />
          </div>
          <div>
            <span className="ea-product-label">Pulse™</span>
            <h2 className="ea-display-md">One Place To See What Matters.</h2>
            <div className="ea-copy-stack">
              <p>Communication. Training. Participation. Growth. Capacity. Opportunities. Progress.</p>
              <p>Everything comes together here — so leaders can see what matters without the stress.</p>
            </div>
            <div className="ea-actions">
              <a href="#assessment" className="ea-btn ea-btn-primary">
                Explore Pulse
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — ASSESSMENT */}
      <section className="ea-section" id="assessment">
        <div className="ea-container ea-split">
          <div>
            <h2 className="ea-display-md">Start With What You Can See.</h2>
            <div className="ea-copy-stack">
              <p>Most people don&apos;t need another opinion. They need a clearer picture.</p>
              <p>
                The Capacity Assessment helps uncover opportunities, hidden costs, and areas for growth — so you can see what
                becomes possible before you invest time, money, and energy.
              </p>
            </div>
            <div className="ea-actions">
              <Link href="/assessment" className="ea-btn ea-btn-primary">
                Take The Assessment
              </Link>
            </div>
          </div>
          <div className="ea-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80"
              alt="Leader reviewing insights with clarity and confidence — discovery, not audit"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <footer className="ea-footer">
        <nav className="ea-footer-links" aria-label="Footer">
          <Link href="/assessment">Capacity Assessment</Link>
          <Link href="/portal/login">Client Portal</Link>
          <Link href="/scorecard">Visibility Scorecard</Link>
        </nav>
        <small>Efficiency Architects · Turn wasted time into possibilities.</small>
      </footer>
    </main>
  );
}
