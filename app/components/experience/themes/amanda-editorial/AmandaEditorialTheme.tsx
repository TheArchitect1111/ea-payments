import type { ReactNode } from 'react';
import './amanda-editorial.css';

export type EditorialLink = { label: string; href: string };
export type EditorialCard = {
  eyebrow?: string;
  title: string;
  body: string;
  imageUrl?: string;
  href: string;
};

export function AmandaEditorialTheme({ children }: { children: ReactNode }) {
  return <div className="amanda-editorial-theme">{children}</div>;
}

export function EditorialNavigation({
  brand,
  links,
  action,
}: {
  brand: ReactNode;
  links: EditorialLink[];
  action?: EditorialLink;
}) {
  return (
    <nav className="ae-nav" aria-label="Primary navigation">
      <div className="ae-nav__brand">{brand}</div>
      <div className="ae-nav__links">
        {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        {action ? <a className="ae-button ae-button--outline" href={action.href}>{action.label}</a> : null}
      </div>
    </nav>
  );
}

export function EditorialHero({
  eyebrow,
  title,
  accent,
  body,
  action,
  imageUrl,
  imageAlt = '',
  quote,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  body: string;
  action: EditorialLink;
  imageUrl?: string;
  imageAlt?: string;
  quote?: string;
}) {
  return (
    <section className="ae-hero">
      {imageUrl ? <img className="ae-hero__image" src={imageUrl} alt={imageAlt} /> : null}
      <div className="ae-hero__veil" aria-hidden="true" />
      <div className="ae-hero__copy">
        {eyebrow ? <p className="ae-eyebrow">{eyebrow}</p> : null}
        <h1>{title}{accent ? <> <em>{accent}</em></> : null}</h1>
        <p className="ae-body">{body}</p>
        <a className="ae-signature-link" href={action.href}>{action.label}<span aria-hidden="true">→</span></a>
      </div>
      {quote ? <blockquote className="ae-hero__quote">{quote}</blockquote> : null}
    </section>
  );
}

export function EditorialSection({
  eyebrow,
  title,
  body,
  children,
  className = '',
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`ae-section ${className}`}>
      <header className="ae-section__header">
        {eyebrow ? <p className="ae-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {body ? <p className="ae-body">{body}</p> : null}
      </header>
      {children}
    </section>
  );
}

export function EditorialCardRail({ cards }: { cards: EditorialCard[] }) {
  return (
    <div className="ae-card-rail">
      {cards.map((card) => (
        <a className="ae-card" href={card.href} key={`${card.href}-${card.title}`}>
          {card.imageUrl ? <img src={card.imageUrl} alt="" /> : <span className="ae-card__placeholder" />}
          <span className="ae-card__overlay" />
          <span className="ae-card__copy">
            {card.eyebrow ? <span className="ae-card__eyebrow">{card.eyebrow}</span> : null}
            <strong>{card.title}</strong>
            <span>{card.body}</span>
            <i aria-hidden="true">→</i>
          </span>
        </a>
      ))}
    </div>
  );
}

export function EditorialImageMosaic({
  images,
}: {
  images: Array<{ src: string; alt: string }>;
}) {
  return (
    <div className="ae-mosaic">
      {images.map((image, index) => <img key={`${image.src}-${index}`} src={image.src} alt={image.alt} />)}
    </div>
  );
}

export function EditorialQuote({ quote, attribution }: { quote: string; attribution?: string }) {
  return (
    <figure className="ae-quote">
      <blockquote>{quote}</blockquote>
      {attribution ? <figcaption>— {attribution}</figcaption> : null}
    </figure>
  );
}

export function EditorialCta({ title, body, primary, secondary }: {
  title: string;
  body: string;
  primary: EditorialLink;
  secondary?: EditorialLink;
}) {
  return (
    <section className="ae-cta">
      <div><h2>{title}</h2><p>{body}</p></div>
      <div className="ae-cta__actions">
        <a className="ae-button ae-button--dark" href={primary.href}>{primary.label}</a>
        {secondary ? <a className="ae-button ae-button--text" href={secondary.href}>{secondary.label}</a> : null}
      </div>
    </section>
  );
}

export function EditorialFooter({ brand, links }: { brand: ReactNode; links: EditorialLink[] }) {
  return (
    <footer className="ae-footer">
      <div>{brand}</div>
      <nav aria-label="Footer navigation">{links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}</nav>
    </footer>
  );
}
