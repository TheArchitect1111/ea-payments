import { PortalLayout } from '@/lib/chassis/PortalLayout';
import type { ClientExperienceNavItem } from '@/lib/ctp-client-nav';
import { AmandaEditorialTheme } from './AmandaEditorialTheme';
import './amanda-experiences.css';

type Link = { label: string; href: string };
type Path = Link & { number: string; script: string; body: string; image: string };

export type AmandaWebsiteProps = {
  brand: { first: string; last: string };
  navigation: Link[];
  hero: { eyebrow: string; title: string; accent: string; body: string; image: string; quote: string; action: Link };
  paths: Path[];
  mission: { eyebrow: string; title: string; body: string; signature: string };
  identities: string[];
};

export function AmandaEditorialWebsite({ brand, navigation, hero, paths, mission, identities }: AmandaWebsiteProps) {
  return (
    <AmandaEditorialTheme>
      <main className="aex-site">
        <header className="aex-site-nav">
          <a className="aex-wordmark" href="#top"><span>{brand.first}</span><small>{brand.last}</small></a>
          <nav aria-label="Primary">
            {navigation.map((item) => <a href={item.href} key={item.label}>{item.label}</a>)}
            <a className="aex-outline-action" href="#portal">Portal <span aria-hidden>♙</span></a>
          </nav>
        </header>

        <section className="aex-site-hero" id="top">
          <div className="aex-site-hero-copy">
            <p className="aex-kicker">{hero.eyebrow}</p>
            <h1>{hero.title}<em>{hero.accent}</em></h1>
            <p>{hero.body}</p>
            <a className="aex-script-link" href={hero.action.href}>{hero.action.label}<i aria-hidden>⟶</i></a>
          </div>
          <div className="aex-site-hero-image" style={{ backgroundImage: `url(${hero.image})` }} role="img" aria-label="Amanda Catherine in a creative studio">
            <blockquote>“{hero.quote}”</blockquote>
          </div>
        </section>

        <section className="aex-journeys" id="experiences">
          <div className="aex-journey-intro">
            <p className="aex-kicker">What brings you here today?</p>
            <h2>Every<br />Journey<br />Matters.</h2>
            <span className="aex-brush" />
            <p>Choose the path that resonates with you most.</p>
          </div>
          <div className="aex-path-rail">
            {paths.map((path) => (
              <a className="aex-path" href={path.href} key={path.script} style={{ backgroundImage: `url(${path.image})` }}>
                <span className="aex-path-shade" />
                <span className="aex-path-copy"><small>{path.number}</small><strong>{path.script}</strong><b>{path.label}</b><span>{path.body}</span><i aria-hidden>→</i></span>
              </a>
            ))}
          </div>
        </section>

        <section className="aex-mission" id="about">
          <div className="aex-mission-copy">
            <p className="aex-kicker">{mission.eyebrow}</p>
            <h2>{mission.title}</h2><span className="aex-brush" />
            <p>{mission.body}</p><span className="aex-signature">{mission.signature}</span>
          </div>
          <div className="aex-mission-grid" aria-label="Creative life collage">
            <img src="/home/he-creator-filming.jpg" alt="Creator at work" />
            <img src="/home/scene-creator.jpg" alt="Creative studio" />
            <img src="/images/ctp-editorial/05-calm-morning-owner.png" alt="A calm morning ritual" />
            <img src="/home/he-hero-live.jpg" alt="Speaker on stage" />
          </div>
        </section>

        <footer className="aex-identity-rail">
          {identities.map((identity) => <span key={identity}>{identity}</span>)}
          <strong>Let’s build something that lasts.</strong>
        </footer>
      </main>
    </AmandaEditorialTheme>
  );
}

export type AmandaPortalProps = {
  firstName: string;
  brandName: string;
  navItems: ClientExperienceNavItem[];
};

export function AmandaEditorialPortal({ firstName, brandName, navItems }: AmandaPortalProps) {
  return (
    <PortalLayout slug="amanda-preview" presentation="client" themeId="amanda-editorial" brandName={brandName} clientNavItems={navItems} clientNavActive="journey" shellNavGroups={[]} logoutHref="#">
      <AmandaEditorialTheme>
        <main className="aex-portal">
          <section className="aex-portal-hero">
            <div className="aex-portal-welcome">
              <p className="aex-kicker">Your creative journey</p>
              <h1>Welcome back,<br /><em>{firstName}.</em></h1>
              <p>Your ideas are becoming a body of work. Here is the clearest next step.</p>
              <a className="aex-dark-action" href="#next">Continue your journey <span>→</span></a>
            </div>
            <div className="aex-portal-portrait">
              <img src="/images/ctp-editorial/05-calm-morning-owner.png" alt="Creative entrepreneur reflecting beside her journal" />
              <span>Purpose in motion.</span>
            </div>
          </section>

          <section className="aex-portal-next" id="next">
            <div className="aex-portal-heading"><p className="aex-kicker">Your next chapter</p><h2>Turn clarity<br />into momentum.</h2></div>
            <article className="aex-feature-card">
              <div><small>01 / Your priority</small><h3>Shape the story only you can tell.</h3><p>Refine your purpose, audience, and offer into one clear editorial direction.</p><a href="#">Open your direction brief <span>→</span></a></div>
              <img src="/images/ctp-editorial/10-clarity-blueprint-planning.png" alt="Notebook and creative planning" />
            </article>
          </section>

          <section className="aex-portal-grid">
            <article><span>02</span><p className="aex-kicker">Progress</p><h3>Your foundation is taking shape.</h3><div className="aex-progress"><i /></div><small>3 of 5 milestones complete</small></article>
            <article className="aex-portal-note"><span>03</span><p className="aex-kicker">From your guide</p><blockquote>“The strongest brands don’t invent a voice. They uncover the one that was already there.”</blockquote><a href="#">Read the latest note →</a></article>
            <article className="aex-portal-library"><span>04</span><p className="aex-kicker">Your library</p><h3>Everything we’re creating, beautifully organized.</h3><a href="#">Explore documents →</a></article>
          </section>

          <footer className="aex-portal-footer"><span className="aex-signature">Amanda Catherine</span><p>Your gifts. Your purpose. Your next chapter.</p></footer>
        </main>
      </AmandaEditorialTheme>
    </PortalLayout>
  );
}
