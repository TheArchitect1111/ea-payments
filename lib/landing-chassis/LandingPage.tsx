import type { LandingPageConfig } from './types';
import { LandingIcon, landingIcons } from './icons';

type Props = { config: LandingPageConfig };

export function LandingPage({ config: c }: Props) {
  return (
    <>
      <header className="lc-nav">
        <div className="lc-nav-inner">
          <img src={c.brand.logo} alt={c.brand.nameLine1} className="lc-nav-logo" />
          <div className="lc-nav-brand display">
            <div className="b1">{c.brand.nameLine1}</div>
            <div className="b2">{c.brand.nameLine2}</div>
            <div className="b3">{c.brand.tagline}</div>
          </div>
          <nav className="lc-nav-links" aria-label="Main">
            {c.nav.map((item, i) => (
              <a key={item.href} href={item.href} className={i === 0 ? 'active' : ''}>
                {item.label}
              </a>
            ))}
            <a className="lc-btn" href={c.links.apply}>
              APPLY NOW
            </a>
          </nav>
          <div className="lc-nav-mobile-cta">
            <a className="lc-btn lc-btn-sm" href={c.links.apply}>
              APPLY NOW
            </a>
          </div>
        </div>
      </header>

      {/* 1. POSSIBILITY */}
      <section className="lc-hero" id="top">
        <div className="lc-hero-grid">
          <div className="lc-hero-copy">
            <p className="lc-hero-eyebrow display">{c.brand.tagline}</p>
            <h1 className="display lc-hero-headline">{c.possibility.headline}</h1>
            <p className="lc-hero-sub">{c.possibility.subheadline}</p>
            <p className="lc-hero-support">{c.possibility.supporting}</p>
            <div className="lc-hero-btns">
              <a className="lc-btn" href={c.links.apply}>
                {c.possibility.applyLabel ?? 'APPLY NOW'}
              </a>
              <a className="lc-btn lc-btn-outline" href={c.links.video}>
                &#9654;&nbsp; {c.possibility.videoLabel ?? 'WATCH VIDEO'}
              </a>
            </div>
          </div>
          <div className="lc-hero-img" style={{ backgroundImage: `url('${c.possibility.image}')` }} />
        </div>
      </section>

      {/* 2. SOCIAL PROOF */}
      <section className="lc-section" id="testimonials">
        <div className="lc-container">
          <div className="lc-sec-head">
            <h2 className="display">{c.socialProof.heading}</h2>
          </div>
          <div className="lc-testimonials">
            {c.socialProof.items.map((t) => (
              <div className="lc-testimonial" key={t.name}>
                <div className="lc-qm">&ldquo;</div>
                <p>{t.quote}</p>
                <div className="lc-testimonial-by">
                  <img src={t.photo} alt={t.name} />
                  <div>
                    <div className="n">{t.name}</div>
                    <div className="s">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaching philosophy + Coach Pop */}
      {c.philosophy ? (
        <section className="lc-section lc-philosophy" id="philosophy">
          <div className="lc-container lc-philosophy-grid">
            <div>
              <p className="lc-philosophy-label display">{c.philosophy.label}</p>
              <blockquote className="lc-philosophy-quote">
                &ldquo;{c.philosophy.quote}&rdquo;
              </blockquote>
              <p className="lc-philosophy-attr display">{c.philosophy.attribution}</p>
            </div>
            {c.philosophy.points?.length ? (
              <ul className="lc-philosophy-points">
                {c.philosophy.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 3. THE CHALLENGE */}
      <section className="lc-section lc-challenge" id="challenge">
        <div className="lc-container lc-challenge-inner">
          <h2 className="display lc-challenge-head">{c.challenge.heading}</h2>
          <p className="lc-challenge-intro">{c.challenge.intro}</p>
          <ul className="lc-challenge-list">
            {c.challenge.painPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. THE DIFFERENCE */}
      <section className="lc-section" id="difference">
        <div className="lc-container">
          <div className="lc-sec-head">
            <h2 className="display">{c.difference.heading}</h2>
            <p>{c.difference.subheading}</p>
          </div>
          <div className="lc-cards">
            {c.difference.cards.map((card) => (
              <div className="lc-card" key={card.title}>
                <h3 className="display">{card.title}</h3>
                <p>{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="lc-section lc-off" id="how-it-works">
        <div className="lc-container">
          <div className="lc-sec-head">
            <h2 className="display">{c.process.heading}</h2>
            <p>{c.process.subheading}</p>
          </div>
          <div className="lc-process">
            {c.process.steps.map((step, i) => (
              <div className="lc-process-step" key={step.label}>
                <LandingIcon d={landingIcons[step.icon] || landingIcons.apply} />
                <h3 className="display">{step.label}</h3>
                <p>{step.description}</p>
                {i < c.process.steps.length - 1 ? <span className="lc-arrow">&#10140;</span> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAMILY PORTAL */}
      <section className="lc-section lc-portal" id="portal">
        <div className="lc-container lc-portal-grid">
          <div>
            <h2 className="display">{c.portal.heading}</h2>
            <p className="lc-lead">{c.portal.subheading}</p>
            <div className="lc-feat-grid">
              {c.portal.features.map((f) => (
                <div className="lc-feat" key={f.title}>
                  <LandingIcon d={landingIcons[f.icon]} />
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <img src={c.portal.dashboardImage} alt="Family portal dashboard" className="lc-portal-shot" />
        </div>
      </section>

      {/* 7. RESULTS */}
      <section className="lc-section" id="results">
        <div className="lc-container">
          <div className="lc-sec-head">
            <h2 className="display">{c.results.heading}</h2>
            <p>{c.results.subheading}</p>
          </div>
          <div className="lc-stats">
            {c.results.stats.map((st) => (
              <div className="lc-stat" key={st.label}>
                <div className="v display">{st.value}</div>
                <div className="l">{st.label}</div>
              </div>
            ))}
          </div>
          <div className="lc-proofs">
            {c.results.proofs.map((proof) => (
              <div className="lc-proof" key={proof.image}>
                <img src={proof.image} alt={proof.caption} />
                <p>{proof.caption}</p>
              </div>
            ))}
          </div>
          <div className="lc-cta-row">
            <a className="lc-btn" href={c.results.profileHref}>
              {c.results.profileCta}
            </a>
          </div>
        </div>
      </section>

      {/* 8. MEET FOUNDER */}
      <section className="lc-section lc-founder" id="founder">
        <div className="lc-container lc-founder-grid">
          <img src={c.founder.image} alt={c.founder.heading} className="lc-founder-img" />
          <div>
            <h2 className="display">{c.founder.heading}</h2>
            <p className="lc-founder-role">{c.founder.role}</p>
            <p className="lc-founder-story">{c.founder.story}</p>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="lc-section lc-final" id="apply">
        <div className="lc-container">
          <div className="lc-final-band">
            <div>
              <h2 className="display">{c.finalCta.heading}</h2>
              <p>{c.finalCta.subheading}</p>
            </div>
            <div className="lc-final-actions">
              <a className="lc-btn lc-btn-white" href={c.links.apply}>
                {c.finalCta.applyLabel} &#10140;
              </a>
              {c.finalCta.agreementLabel && c.links.agreement ? (
                <a className="lc-btn lc-btn-white-outline" href={c.links.agreement}>
                  {c.finalCta.agreementLabel}
                </a>
              ) : null}
              {c.finalCta.scheduleLabel && c.links.schedule ? (
                <a className="lc-btn lc-btn-white-outline" href={c.links.schedule}>
                  {c.finalCta.scheduleLabel}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <footer className="lc-footer" id="contact">
        <div className="lc-container">
          <div className="lc-footer-grid">
            <div className="lc-footer-brand">
              <img src={c.brand.logo} alt="" />
              <div>
                <div className="t display">
                  {c.brand.nameLine1} {c.brand.nameLine2}
                </div>
                <p>{c.footer.about}</p>
              </div>
            </div>
            <div>
              <h5 className="display">QUICK LINKS</h5>
              <ul>
                {c.footer.quickLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="display">RESOURCES</h5>
              <ul>
                {c.footer.resources.map((l) => (
                  <li key={l.href}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="display">CONTACT</h5>
              <div className="lc-contact-row">
                <LandingIcon d={landingIcons.mail} />
                <a href={`mailto:${c.footer.email}`}>{c.footer.email}</a>
              </div>
              {c.links.instagram ? (
                <div className="lc-contact-row">
                  <LandingIcon d={landingIcons.insta} />
                  <a href={c.links.instagram}>{c.footer.instagramLabel}</a>
                </div>
              ) : null}
              {c.links.instagramSecondary ? (
                <div className="lc-contact-row">
                  <LandingIcon d={landingIcons.insta} />
                  <a href={c.links.instagramSecondary}>{c.footer.prospectsInstagramLabel}</a>
                </div>
              ) : null}
              <div className="lc-contact-row">
                <LandingIcon d={landingIcons.pin} />
                <span>{c.footer.location}</span>
              </div>
            </div>
          </div>
          <div className="lc-copyright">
            <span>{c.footer.copyright}</span>
          </div>
        </div>
      </footer>
    </>
  );
}

export type { LandingPageConfig } from './types';
