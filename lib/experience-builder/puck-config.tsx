import type { Config } from '@measured/puck';
import './experience-builder.css';

export type ExperienceBuilderProps = {
  EASiteNav: {
    brand: string;
    brandNote: string;
    links: Array<{ label: string; href: string }>;
    ctaLabel: string;
    ctaHref: string;
  };
  EAHero: {
    variant: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    imageUrl: string;
    focal: string;
  };
  EAImageBand: {
    imageUrl: string;
    caption: string;
    objectPosition: string;
    focal: string;
  };
  EATextSection: {
    variant: string;
    label: string;
    title: string;
    body: string;
    accentValue: string;
    accentCaption: string;
    anchorId: string;
    scale: string;
  };
  EASplitNarrative: {
    label: string;
    title: string;
    leftLabel: string;
    leftTitle: string;
    leftBody: string;
    rightLabel: string;
    rightTitle: string;
    rightBody: string;
  };
  EAOverlapScene: {
    label: string;
    title: string;
    body: string;
    note: string;
    imageUrl: string;
    focal: string;
    anchorId: string;
  };
  EAPathwayStrip: {
    label: string;
    title: string;
    oneTitle: string;
    oneBody: string;
    twoTitle: string;
    twoBody: string;
    threeTitle: string;
    threeBody: string;
  };
  EAFeatures: {
    label: string;
    title: string;
    featureOneTitle: string;
    featureOneBody: string;
    featureTwoTitle: string;
    featureTwoBody: string;
    featureThreeTitle: string;
    featureThreeBody: string;
  };
  EAMetrics: {
    variant: string;
    label: string;
    title: string;
    metricOneValue: string;
    metricOneLabel: string;
    metricTwoValue: string;
    metricTwoLabel: string;
    metricThreeValue: string;
    metricThreeLabel: string;
  };
  EACtaBand: {
    variant: string;
    title: string;
    body: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    anchorId: string;
  };
  EASiteFooter: {
    brand: string;
    tagline: string;
    columns: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
    address: string;
    note: string;
    returnLabel: string;
    returnHref: string;
  };
};

export const puckConfig: Config<ExperienceBuilderProps> = {
  categories: {
    chrome: { title: 'Chrome', components: ['EASiteNav', 'EASiteFooter', 'EAImageBand'] },
    layout: {
      title: 'Layout',
      components: ['EAHero', 'EACtaBand', 'EASplitNarrative', 'EAOverlapScene', 'EAPathwayStrip'],
    },
    content: {
      title: 'Content',
      components: ['EATextSection', 'EAMetrics', 'EAFeatures'],
    },
  },
  components: {
    EASiteNav: {
      label: 'EA Site Nav',
      fields: {
        brand: { type: 'text', label: 'Brand' },
        brandNote: { type: 'text', label: 'Brand note' },
        links: { type: 'textarea', label: 'Links JSON' },
        ctaLabel: { type: 'text', label: 'CTA label' },
        ctaHref: { type: 'text', label: 'CTA href' },
      },
      defaultProps: {
        brand: 'Brand',
        brandNote: '',
        links: [
          { label: 'About', href: '#about' },
          { label: 'Services', href: '#services' },
        ],
        ctaLabel: 'Contact',
        ctaHref: '#refer',
      },
      render: ({ brand, brandNote, links, ctaLabel, ctaHref }) => {
        const items = Array.isArray(links) ? links : [];
        return (
          <header className="eb-site-nav">
            <div className="eb-site-nav-inner">
              <div className="eb-site-nav-brand">
                <a href="#top" className="eb-site-nav-name">
                  {brand}
                </a>
                {brandNote ? <p className="eb-site-nav-note">{brandNote}</p> : null}
              </div>
              <nav className="eb-site-nav-links" aria-label="Primary">
                {items.map((link) => (
                  <a key={`${link.href}-${link.label}`} href={link.href}>
                    {link.label}
                  </a>
                ))}
              </nav>
              <a className="eb-btn eb-btn-primary eb-site-nav-cta" href={ctaHref}>
                {ctaLabel}
              </a>
            </div>
          </header>
        );
      },
    },
    EAImageBand: {
      label: 'EA Image Band',
      fields: {
        imageUrl: { type: 'text', label: 'Image URL' },
        caption: { type: 'text', label: 'Caption' },
        objectPosition: { type: 'text', label: 'Object position' },
        focal: { type: 'text', label: 'Focal hint' },
      },
      defaultProps: {
        imageUrl: '',
        caption: '',
        objectPosition: 'center center',
        focal: 'center',
      },
      render: ({ imageUrl, caption, objectPosition, focal }) =>
        imageUrl ? (
          <figure className="eb-image-band" data-focal={focal || 'center'}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" style={{ objectPosition: objectPosition || 'center center' }} />
            {caption ? <figcaption>{caption}</figcaption> : null}
          </figure>
        ) : (
          <div className="eb-image-band eb-image-band--empty" aria-hidden />
        ),
    },
    EAHero: {
      label: 'EA Hero',
      fields: {
        variant: {
          type: 'select',
          label: 'Composition',
          options: [
            { label: 'Companion', value: 'companion' },
            { label: 'Threshold', value: 'threshold' },
            { label: 'Craft', value: 'craft' },
          ],
        },
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Headline' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        ctaLabel: { type: 'text', label: 'CTA label' },
        ctaHref: { type: 'text', label: 'CTA link' },
        imageUrl: { type: 'text', label: 'Image URL' },
        focal: { type: 'text', label: 'Focal hint' },
      },
      defaultProps: {
        variant: 'companion',
        eyebrow: 'Efficiency Architects',
        title: 'Discover what becomes possible',
        subtitle: 'A premium experience aligned with your mission, audience, and next step.',
        ctaLabel: 'Begin discovery',
        ctaHref: '/assessment',
        imageUrl: '',
        focal: 'face-right',
      },
      render: ({ variant, eyebrow, title, subtitle, ctaLabel, ctaHref, imageUrl, focal }) => (
        <section
          className={`eb-block eb-hero eb-hero--${variant || 'companion'}`}
          data-focal={focal || 'face-right'}
        >
          {imageUrl ? (
            <div className="eb-hero-media" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" />
            </div>
          ) : null}
          <div className="eb-hero-copy">
            {eyebrow ? <p className="eb-hero-eyebrow">{eyebrow}</p> : null}
            <h1 className="eb-hero-title">{title}</h1>
            <p className="eb-hero-subtitle">{subtitle}</p>
            <div className="eb-cta-row">
              <a className="eb-btn eb-btn-primary" href={ctaHref}>
                {ctaLabel}
              </a>
            </div>
          </div>
        </section>
      ),
    },
    EATextSection: {
      label: 'EA Text Section',
      fields: {
        variant: {
          type: 'select',
          label: 'Composition',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Documentary', value: 'documentary' },
            { label: 'Confrontational', value: 'confrontational' },
            { label: 'Mission plane', value: 'mission-plane' },
            { label: 'Legacy', value: 'legacy' },
            { label: 'Process', value: 'process' },
            { label: 'Proof', value: 'proof' },
          ],
        },
        label: { type: 'text', label: 'Section label' },
        title: { type: 'text', label: 'Title' },
        body: { type: 'textarea', label: 'Body' },
        accentValue: { type: 'text', label: 'Accent value' },
        accentCaption: { type: 'textarea', label: 'Accent caption' },
        anchorId: { type: 'text', label: 'Anchor id' },
        scale: { type: 'text', label: 'Scale' },
      },
      defaultProps: {
        variant: 'default',
        label: 'Situation',
        title: 'Why this matters now',
        body: 'Use plain language to explain the opportunity, the audience, and the outcome you are guiding people toward.',
        accentValue: '',
        accentCaption: '',
        anchorId: '',
        scale: 'md',
      },
      render: ({ variant, label, title, body, accentValue, accentCaption, anchorId, scale }) => (
        <section
          id={anchorId || undefined}
          className={`eb-block eb-section eb-section--${variant || 'default'} eb-section-scale--${scale || 'md'}`}
        >
          <div className="eb-section-inner">
            {label ? <p className="eb-section-label">{label}</p> : null}
            <h2 className="eb-section-title">{title}</h2>
            <p className="eb-section-body">{body}</p>
            {accentValue || accentCaption ? (
              <aside className="eb-accent-stat">
                {accentValue ? <p className="eb-accent-value">{accentValue}</p> : null}
                {accentCaption ? <p className="eb-accent-caption">{accentCaption}</p> : null}
              </aside>
            ) : null}
          </div>
        </section>
      ),
    },
    EASplitNarrative: {
      label: 'EA Split Narrative',
      fields: {
        label: { type: 'text', label: 'Section label' },
        title: { type: 'text', label: 'Title' },
        leftLabel: { type: 'text', label: 'Left label' },
        leftTitle: { type: 'text', label: 'Left title' },
        leftBody: { type: 'textarea', label: 'Left body' },
        rightLabel: { type: 'text', label: 'Right label' },
        rightTitle: { type: 'text', label: 'Right title' },
        rightBody: { type: 'textarea', label: 'Right body' },
      },
      defaultProps: {
        label: 'Change',
        title: 'From stuck to moving',
        leftLabel: 'Before',
        leftTitle: 'Unresolved',
        leftBody: 'The cost of waiting.',
        rightLabel: 'After',
        rightTitle: 'What becomes possible',
        rightBody: 'Clarity and a next step.',
      },
      render: ({
        label,
        title,
        leftLabel,
        leftTitle,
        leftBody,
        rightLabel,
        rightTitle,
        rightBody,
      }) => (
        <section className="eb-block eb-section eb-split">
          <div className="eb-section-inner">
            {label ? <p className="eb-section-label">{label}</p> : null}
            <h2 className="eb-section-title">{title}</h2>
            <div className="eb-split-grid">
              <article>
                <p className="eb-split-label">{leftLabel}</p>
                <h3 className="eb-split-title">{leftTitle}</h3>
                <p className="eb-split-body">{leftBody}</p>
              </article>
              <article>
                <p className="eb-split-label">{rightLabel}</p>
                <h3 className="eb-split-title">{rightTitle}</h3>
                <p className="eb-split-body">{rightBody}</p>
              </article>
            </div>
          </div>
        </section>
      ),
    },
    EAOverlapScene: {
      label: 'EA Overlap Scene',
      fields: {
        label: { type: 'text', label: 'Label' },
        title: { type: 'text', label: 'Title' },
        body: { type: 'textarea', label: 'Body' },
        note: { type: 'textarea', label: 'Note' },
        imageUrl: { type: 'text', label: 'Image URL' },
        focal: { type: 'text', label: 'Focal' },
        anchorId: { type: 'text', label: 'Anchor id' },
      },
      defaultProps: {
        label: 'Role',
        title: 'How care coordination helps',
        body: '',
        note: '',
        imageUrl: '',
        focal: 'center',
        anchorId: 'role',
      },
      render: ({ label, title, body, note, imageUrl, focal, anchorId }) => (
        <section
          id={anchorId || undefined}
          className="eb-block eb-overlap-scene"
          data-focal={focal || 'center'}
        >
          {imageUrl ? (
            <div className="eb-overlap-scene-media" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" />
            </div>
          ) : null}
          <div className="eb-overlap-scene-copy">
            {label ? <p className="eb-section-label">{label}</p> : null}
            <h2 className="eb-section-title">{title}</h2>
            <p className="eb-section-body">{body}</p>
            {note ? <p className="eb-overlap-scene-note">{note}</p> : null}
          </div>
        </section>
      ),
    },
    EAPathwayStrip: {
      label: 'EA Pathway Strip',
      fields: {
        label: { type: 'text', label: 'Label' },
        title: { type: 'text', label: 'Title' },
        oneTitle: { type: 'text', label: 'Pathway 1 title' },
        oneBody: { type: 'textarea', label: 'Pathway 1 body' },
        twoTitle: { type: 'text', label: 'Pathway 2 title' },
        twoBody: { type: 'textarea', label: 'Pathway 2 body' },
        threeTitle: { type: 'text', label: 'Pathway 3 title' },
        threeBody: { type: 'textarea', label: 'Pathway 3 body' },
      },
      defaultProps: {
        label: 'Pathways',
        title: 'Care pathways',
        oneTitle: '',
        oneBody: '',
        twoTitle: '',
        twoBody: '',
        threeTitle: '',
        threeBody: '',
      },
      render: ({ label, title, oneTitle, oneBody, twoTitle, twoBody, threeTitle, threeBody }) => (
        <section className="eb-block eb-section eb-pathway-strip">
          <div className="eb-section-inner">
            {label ? <p className="eb-section-label">{label}</p> : null}
            <h2 className="eb-section-title">{title}</h2>
            <div className="eb-pathway-strip-grid">
              <article className="eb-pathway-card eb-pathway-card--lead">
                <h3 className="eb-pathway-title">{oneTitle}</h3>
                <p className="eb-pathway-body">{oneBody}</p>
              </article>
              <article className="eb-pathway-card">
                <h3 className="eb-pathway-title">{twoTitle}</h3>
                <p className="eb-pathway-body">{twoBody}</p>
              </article>
              <article className="eb-pathway-card">
                <h3 className="eb-pathway-title">{threeTitle}</h3>
                <p className="eb-pathway-body">{threeBody}</p>
              </article>
            </div>
          </div>
        </section>
      ),
    },
    EAFeatures: {
      label: 'EA Features',
      fields: {
        label: { type: 'text', label: 'Section label' },
        title: { type: 'text', label: 'Title' },
        featureOneTitle: { type: 'text', label: 'Feature 1 title' },
        featureOneBody: { type: 'textarea', label: 'Feature 1 body' },
        featureTwoTitle: { type: 'text', label: 'Feature 2 title' },
        featureTwoBody: { type: 'textarea', label: 'Feature 2 body' },
        featureThreeTitle: { type: 'text', label: 'Feature 3 title' },
        featureThreeBody: { type: 'textarea', label: 'Feature 3 body' },
      },
      defaultProps: {
        label: 'Capabilities',
        title: 'What people can do here',
        featureOneTitle: 'Capture opportunity',
        featureOneBody: 'Save what matters before it disappears.',
        featureTwoTitle: 'Understand the story',
        featureTwoBody: 'Turn context into a clear recommendation.',
        featureThreeTitle: 'Take the next step',
        featureThreeBody: 'Move from insight to action with confidence.',
      },
      render: ({
        label,
        title,
        featureOneTitle,
        featureOneBody,
        featureTwoTitle,
        featureTwoBody,
        featureThreeTitle,
        featureThreeBody,
      }) => (
        <section className="eb-block eb-section">
          <div className="eb-section-inner">
            <p className="eb-section-label">{label}</p>
            <h2 className="eb-section-title">{title}</h2>
            <div className="eb-features">
              <article className="eb-feature-card">
                <h3 className="eb-feature-title">{featureOneTitle}</h3>
                <p className="eb-feature-body">{featureOneBody}</p>
              </article>
              <article className="eb-feature-card">
                <h3 className="eb-feature-title">{featureTwoTitle}</h3>
                <p className="eb-feature-body">{featureTwoBody}</p>
              </article>
              <article className="eb-feature-card">
                <h3 className="eb-feature-title">{featureThreeTitle}</h3>
                <p className="eb-feature-body">{featureThreeBody}</p>
              </article>
            </div>
          </div>
        </section>
      ),
    },
    EAMetrics: {
      label: 'EA Metrics',
      fields: {
        variant: {
          type: 'select',
          label: 'Composition',
          options: [
            { label: 'Cards', value: 'cards' },
            { label: 'Editorial', value: 'editorial' },
          ],
        },
        label: { type: 'text', label: 'Section label' },
        title: { type: 'text', label: 'Title' },
        metricOneValue: { type: 'text', label: 'Metric 1 value' },
        metricOneLabel: { type: 'text', label: 'Metric 1 label' },
        metricTwoValue: { type: 'text', label: 'Metric 2 value' },
        metricTwoLabel: { type: 'text', label: 'Metric 2 label' },
        metricThreeValue: { type: 'text', label: 'Metric 3 value' },
        metricThreeLabel: { type: 'text', label: 'Metric 3 label' },
      },
      defaultProps: {
        variant: 'editorial',
        label: 'Proof',
        title: 'Signals that build trust',
        metricOneValue: '10s',
        metricOneLabel: 'To understand the offer',
        metricTwoValue: '3',
        metricTwoLabel: 'Clear next steps',
        metricThreeValue: '1',
        metricThreeLabel: 'Recommended action',
      },
      render: ({
        variant,
        label,
        title,
        metricOneValue,
        metricOneLabel,
        metricTwoValue,
        metricTwoLabel,
        metricThreeValue,
        metricThreeLabel,
      }) => (
        <section className={`eb-block eb-section eb-metrics-wrap eb-metrics-wrap--${variant || 'editorial'}`}>
          <div className="eb-section-inner">
            <p className="eb-section-label">{label}</p>
            <h2 className="eb-section-title">{title}</h2>
            <div className="eb-metrics">
              {metricOneValue ? (
                <div className="eb-metric">
                  <p className="eb-metric-value">{metricOneValue}</p>
                  <p className="eb-metric-label">{metricOneLabel}</p>
                </div>
              ) : null}
              {metricTwoValue ? (
                <div className="eb-metric">
                  <p className="eb-metric-value">{metricTwoValue}</p>
                  <p className="eb-metric-label">{metricTwoLabel}</p>
                </div>
              ) : null}
              {metricThreeValue ? (
                <div className="eb-metric">
                  <p className="eb-metric-value">{metricThreeValue}</p>
                  <p className="eb-metric-label">{metricThreeLabel}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ),
    },
    EACtaBand: {
      label: 'EA CTA Band',
      fields: {
        variant: {
          type: 'select',
          label: 'Composition',
          options: [
            { label: 'Belonging', value: 'belonging' },
            { label: 'Commission', value: 'commission' },
            { label: 'Protect', value: 'protect' },
          ],
        },
        title: { type: 'text', label: 'Title' },
        body: { type: 'textarea', label: 'Body' },
        primaryLabel: { type: 'text', label: 'Primary label' },
        primaryHref: { type: 'text', label: 'Primary link' },
        secondaryLabel: { type: 'text', label: 'Secondary label' },
        secondaryHref: { type: 'text', label: 'Secondary link' },
        anchorId: { type: 'text', label: 'Anchor id' },
      },
      defaultProps: {
        variant: 'belonging',
        title: 'Ready for the next step?',
        body: 'Start with one clear action. The platform will guide the rest.',
        primaryLabel: 'Get started',
        primaryHref: '/assessment',
        secondaryLabel: 'Contact EA',
        secondaryHref: '/contact',
        anchorId: 'invite',
      },
      render: ({
        variant,
        title,
        body,
        primaryLabel,
        primaryHref,
        secondaryLabel,
        secondaryHref,
        anchorId,
      }) => (
        <section
          className={`eb-block eb-cta-band eb-cta-band--${variant || 'belonging'}`}
          id={anchorId || 'invite'}
        >
          <div className="eb-section-inner">
            <h2 className="eb-section-title">{title}</h2>
            <p className="eb-section-body">{body}</p>
            <div className="eb-cta-row" style={{ marginTop: '1.25rem' }}>
              <a className="eb-btn eb-btn-primary" href={primaryHref}>
                {primaryLabel}
              </a>
              <a className="eb-btn eb-btn-secondary" href={secondaryHref}>
                {secondaryLabel}
              </a>
            </div>
          </div>
        </section>
      ),
    },
    EASiteFooter: {
      label: 'EA Site Footer',
      fields: {
        brand: { type: 'text', label: 'Brand' },
        tagline: { type: 'textarea', label: 'Tagline' },
        columns: { type: 'textarea', label: 'Columns JSON' },
        address: { type: 'text', label: 'Address' },
        note: { type: 'textarea', label: 'Note' },
        returnLabel: { type: 'text', label: 'Return label' },
        returnHref: { type: 'text', label: 'Return href' },
      },
      defaultProps: {
        brand: 'Brand',
        tagline: '',
        columns: [],
        address: '',
        note: '',
        returnLabel: 'Return',
        returnHref: '/',
      },
      render: ({ brand, tagline, columns, address, note, returnLabel, returnHref }) => {
        const cols = Array.isArray(columns) ? columns : [];
        return (
          <footer className="eb-site-footer">
            <div className="eb-site-footer-inner">
              <div className="eb-site-footer-brand">
                <p className="eb-site-footer-name">{brand}</p>
                {tagline ? <p className="eb-site-footer-tagline">{tagline}</p> : null}
              </div>
              <div className="eb-site-footer-columns">
                {cols.map((col) => (
                  <div key={col.title} className="eb-site-footer-col">
                    <p className="eb-site-footer-col-title">{col.title}</p>
                    <ul>
                      {(col.links || []).map((link) => (
                        <li key={`${col.title}-${link.label}`}>
                          <a href={link.href}>{link.label}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {address ? <p className="eb-site-footer-address">{address}</p> : null}
              {note ? <p className="eb-site-footer-note">{note}</p> : null}
              {returnHref ? (
                <p className="eb-site-footer-return">
                  <a href={returnHref}>{returnLabel || 'Return'}</a>
                </p>
              ) : null}
            </div>
          </footer>
        );
      },
    },
  },
};
