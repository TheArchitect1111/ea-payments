import type { Config } from '@measured/puck';
import './experience-builder.css';

export type ExperienceBuilderProps = {
  EAHero: {
    variant: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    imageUrl: string;
  };
  EATextSection: {
    variant: string;
    label: string;
    title: string;
    body: string;
    accentValue: string;
    accentCaption: string;
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
  };
};

export const puckConfig: Config<ExperienceBuilderProps> = {
  categories: {
    layout: { title: 'Layout', components: ['EAHero', 'EACtaBand', 'EASplitNarrative'] },
    content: {
      title: 'Content',
      components: ['EATextSection', 'EAMetrics', 'EAFeatures'],
    },
  },
  components: {
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
      },
      defaultProps: {
        variant: 'companion',
        eyebrow: 'Efficiency Architects',
        title: 'Discover what becomes possible',
        subtitle: 'A premium experience aligned with your mission, audience, and next step.',
        ctaLabel: 'Begin discovery',
        ctaHref: '/assessment',
        imageUrl: '',
      },
      render: ({ variant, eyebrow, title, subtitle, ctaLabel, ctaHref, imageUrl }) => (
        <section className={`eb-block eb-hero eb-hero--${variant || 'companion'}`}>
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
      },
      defaultProps: {
        variant: 'default',
        label: 'Situation',
        title: 'Why this matters now',
        body: 'Use plain language to explain the opportunity, the audience, and the outcome you are guiding people toward.',
        accentValue: '',
        accentCaption: '',
      },
      render: ({ variant, label, title, body, accentValue, accentCaption }) => (
        <section className={`eb-block eb-section eb-section--${variant || 'default'}`}>
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
      },
      defaultProps: {
        variant: 'belonging',
        title: 'Ready for the next step?',
        body: 'Start with one clear action. The platform will guide the rest.',
        primaryLabel: 'Get started',
        primaryHref: '/assessment',
        secondaryLabel: 'Contact EA',
        secondaryHref: '/contact',
      },
      render: ({
        variant,
        title,
        body,
        primaryLabel,
        primaryHref,
        secondaryLabel,
        secondaryHref,
      }) => (
        <section className={`eb-block eb-cta-band eb-cta-band--${variant || 'belonging'}`} id="invite">
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
  },
};
