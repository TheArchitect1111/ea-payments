import { getAmandaSiteContent } from '@/lib/amanda-catherine/site-content';

export const dynamic = 'force-dynamic';

function Media({ imageUrl, videoUrl, alt }: { imageUrl?: string; videoUrl?: string; alt: string }) {
  if (videoUrl) {
    return <video className="ac-media" src={videoUrl} poster={imageUrl || undefined} controls playsInline preload="metadata" />;
  }
  return imageUrl ? <img className="ac-media" src={imageUrl} alt={alt} /> : null;
}

export default async function AmandaCatherinePublicPage() {
  const site = await getAmandaSiteContent();
  return (
    <div className="ac-site" id="top">
      <style dangerouslySetInnerHTML={{ __html: `
        :root{--ac-ink:#17221c;--ac-sage:#556a5c;--ac-cream:#f4f0e8;--ac-gold:#b18b49;--ac-line:#ded8cd;--ac-muted:#606a62}.ac-site{margin:-8px;background:#fff;color:var(--ac-ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.55}.ac-wrap{width:min(1180px,calc(100% - 40px));margin:0 auto}.ac-nav{position:sticky;top:0;z-index:20;border-bottom:1px solid rgba(222,216,205,.8);background:rgba(255,255,255,.94);backdrop-filter:blur(16px)}.ac-nav-in{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:72px}.ac-brand{font-family:Georgia,serif;font-size:22px}.ac-links{display:flex;gap:22px}.ac-links a,.ac-btn{text-decoration:none;color:inherit}.ac-links a{font-size:13px;font-weight:750}.ac-btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 18px;border:1px solid var(--ac-ink);font-size:13px;font-weight:800}.ac-btn-fill{background:var(--ac-ink);color:#fff}.ac-hero{position:relative;min-height:720px;display:grid;align-items:end;overflow:hidden;background:#17221c;color:#fff}.ac-hero-media{position:absolute;inset:0}.ac-hero-media .ac-media{width:100%;height:100%;object-fit:cover;filter:saturate(.8) brightness(.56)}.ac-hero-media:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,17,12,.86),rgba(9,17,12,.25) 62%,rgba(9,17,12,.3))}.ac-hero-copy{position:relative;z-index:2;padding:170px 0 86px;max-width:760px}.ac-eyebrow{margin:0 0 16px;color:var(--ac-gold);font-size:12px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.ac-hero h1,.ac-section h2{font-family:Georgia,serif;font-weight:500;line-height:1.02}.ac-hero h1{margin:0;font-size:clamp(54px,8vw,100px);letter-spacing:-.045em}.ac-hero p{max-width:680px;font-size:19px;color:rgba(255,255,255,.86)}.ac-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:30px}.ac-hero .ac-btn:not(.ac-btn-fill){border-color:rgba(255,255,255,.6);color:#fff}.ac-section{padding:100px 0}.ac-section h2{margin:0 0 22px;font-size:clamp(42px,6vw,72px);letter-spacing:-.035em}.ac-section p{color:var(--ac-muted);font-size:17px}.ac-intro{text-align:center;background:var(--ac-cream)}.ac-intro .ac-wrap{max-width:900px}.ac-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}.ac-media{display:block;width:100%;max-height:680px;object-fit:cover}.ac-copy{max-width:650px}.ac-facts{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:28px}.ac-fact{padding:20px;background:var(--ac-cream)}.ac-fact strong{display:block;font-family:Georgia,serif;font-size:28px;color:var(--ac-gold)}.ac-pathways{background:#fff}.ac-path-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:40px}.ac-path{min-height:320px;padding:34px;background:var(--ac-cream);display:flex;flex-direction:column;justify-content:flex-end}.ac-path h3{font-family:Georgia,serif;font-size:38px;margin:0 0 12px}.ac-path p{margin:0}.ac-band{background:var(--ac-sage);color:#fff}.ac-band p{color:rgba(255,255,255,.82)}.ac-band .ac-eyebrow{color:#e1cfa8}.ac-alt{background:var(--ac-cream)}.ac-contact{background:var(--ac-ink);color:#fff}.ac-contact p{color:rgba(255,255,255,.75)}.ac-contact-grid{display:grid;grid-template-columns:1.4fr .6fr;gap:60px}.ac-contact-list{display:grid;gap:14px}.ac-contact-list a{color:#fff}.ac-footer{padding:32px 0;background:#101713;color:rgba(255,255,255,.7);font-size:13px}.ac-footer-in{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap}.ac-footer strong{color:#fff}.ac-note{max-width:760px}.ac-updated{font-size:11px;opacity:.7}@media(max-width:850px){.ac-links{display:none}.ac-grid,.ac-contact-grid{grid-template-columns:1fr}.ac-path-grid{grid-template-columns:1fr}.ac-facts{grid-template-columns:1fr}.ac-section{padding:72px 0}.ac-hero{min-height:650px}.ac-hero-copy{padding:130px 0 60px}.ac-nav-in{min-height:64px}.ac-brand{font-size:19px}}
      ` }} />

      <nav className="ac-nav">
        <div className="ac-wrap ac-nav-in">
          <a href="#top" className="ac-brand">Amanda Catherine</a>
          <div className="ac-links">
            <a href="#about">Meet Amanda</a><a href="#restore">Restore</a><a href="#learn">Learn</a><a href="#create">Create</a><a href="#contact">Contact</a>
          </div>
          <a className="ac-btn ac-btn-fill" href={site.contact.bookingUrl} target="_blank" rel="noreferrer">Begin</a>
        </div>
      </nav>

      <header className="ac-hero">
        <div className="ac-hero-media"><Media imageUrl={site.hero.imageUrl} videoUrl={site.hero.videoUrl} alt="Amanda Catherine" /></div>
        <div className="ac-wrap ac-hero-copy">
          <p className="ac-eyebrow">{site.hero.eyebrow}</p>
          <h1>{site.hero.title}</h1>
          <p>{site.hero.subtitle}</p>
          <div className="ac-actions">
            <a className="ac-btn ac-btn-fill" href={site.hero.primaryHref}>{site.hero.primaryLabel}</a>
            <a className="ac-btn" href={site.hero.secondaryHref}>{site.hero.secondaryLabel}</a>
          </div>
        </div>
      </header>

      <section className="ac-section ac-intro">
        <div className="ac-wrap">
          <p className="ac-eyebrow">{site.intro.eyebrow}</p><h2>{site.intro.title}</h2><p>{site.intro.body}</p>
        </div>
      </section>

      <section className="ac-section" id="about">
        <div className="ac-wrap ac-grid">
          <Media imageUrl={site.about.imageUrl} alt="Amanda Catherine" />
          <div className="ac-copy">
            <p className="ac-eyebrow">Meet Amanda</p><h2>{site.about.title}</h2><p>{site.about.body}</p><p>{site.about.secondaryBody}</p>
            <div className="ac-facts">{site.about.facts.map((fact) => <div className="ac-fact" key={fact.value}><strong>{fact.value}</strong><span>{fact.label}</span></div>)}</div>
          </div>
        </div>
      </section>

      <section className="ac-section ac-pathways" id="pathways">
        <div className="ac-wrap"><p className="ac-eyebrow">Restore · Learn · Create</p><h2>{site.pathways.title}</h2><p>{site.pathways.body}</p>
          <div className="ac-path-grid">
            <article className="ac-path"><h3>Restore</h3><p>{site.pathways.restoreBody}</p></article>
            <article className="ac-path"><h3>Learn</h3><p>{site.pathways.learnBody}</p></article>
            <article className="ac-path"><h3>Create</h3><p>{site.pathways.createBody}</p></article>
          </div>
        </div>
      </section>

      <section className="ac-section ac-band" id="restore"><div className="ac-wrap ac-grid"><div className="ac-copy"><p className="ac-eyebrow">Restore</p><h2>{site.restore.title}</h2><p>{site.restore.body}</p><a className="ac-btn" href={site.contact.bookingUrl} target="_blank" rel="noreferrer">Book care</a></div><Media imageUrl={site.restore.imageUrl} alt="AesthetiKine care" /></div></section>
      <section className="ac-section ac-alt" id="learn"><div className="ac-wrap ac-grid"><Media imageUrl={site.learn.imageUrl} alt="Amanda Catherine training" /><div className="ac-copy"><p className="ac-eyebrow">Learn</p><h2>{site.learn.title}</h2><p>{site.learn.body}</p></div></div></section>
      <section className="ac-section" id="create"><div className="ac-wrap ac-grid"><div className="ac-copy"><p className="ac-eyebrow">Create</p><h2>{site.create.title}</h2><p>{site.create.body}</p></div><Media imageUrl={site.create.imageUrl} alt="Amanda Catherine creative leadership" /></div></section>
      <section className="ac-section ac-alt"><div className="ac-wrap ac-grid"><Media imageUrl={site.impact.imageUrl} alt="Amanda Catherine speaking and media" /><div className="ac-copy"><p className="ac-eyebrow">Speaking · Media · Community</p><h2>{site.impact.title}</h2><p>{site.impact.body}</p></div></div></section>

      <section className="ac-section ac-contact" id="contact">
        <div className="ac-wrap ac-contact-grid"><div><p className="ac-eyebrow">Contact</p><h2>{site.contact.title}</h2><p>{site.contact.body}</p></div><div className="ac-contact-list"><a href={`mailto:${site.contact.email}`}>{site.contact.email}</a><a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a><a href={site.contact.bookingUrl} target="_blank" rel="noreferrer">Book online ↗</a></div></div>
      </section>

      <footer className="ac-footer"><div className="ac-wrap ac-footer-in"><div><strong>Amanda Catherine</strong><div>{site.footer.tagline}</div><div className="ac-updated">Updated {new Date(site.updatedAt).toLocaleDateString('en-CA')}</div></div><div className="ac-note">{site.footer.note}</div></div></footer>
    </div>
  );
}
