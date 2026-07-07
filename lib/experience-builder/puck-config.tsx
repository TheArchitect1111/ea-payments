import type { Config } from '@measured/puck';
import './experience-builder.css';

export type ExperienceBuilderProps = {
  EAHero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
  };
  EATextSection: {
    label: string;
    title: string;
    body: string;
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
    layout: { title: 'Layout', components: ['EAHero', 'EACtaBand'] },
    content: { title: 'Content', components: ['EATextSection', 'EAFeatures', 'EAMetrics'] },
  },
  components: {
    EAHero: {
      label: 'EA Hero',
      fields: {
        eyebrow: { type: 'text', label: 'Eyebrow' },
        title: { type: 'text', label: 'Headline' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        ctaLabel: { type: 'text', label: 'CTA label' },
        ctaHref: { type: 'text', label: 'CTA link' },
      },
      defaultProps: {
        eyebrow: 'Efficiency Architects',
        title: 'Discover what becomes possible',
        subtitle: 'A premium experience aligned with your mission, audience, and next step.',
        ctaLabel: 'Begin discovery',
        ctaHref: '/assessment',
      },
      render: ({ eyebrow, title, subtitle, ctaLabel, ctaHref }) => (
        <section className="eb-block eb-hero">
          <p className="eb-hero-eyebrow">{eyebrow}</p>
          <h1 className="eb-hero-title">{title}</h1>
          <p className="eb-hero-subtitle">{subtitle}</p>
          <div className="eb-cta-row">
            <a className="eb-btn eb-btn-primary" href={ctaHref}>
              {ctaLabel}
            </a>
          </div>
        </section>
      ),
    },
    EATextSection: {
      label: 'EA Text Section',
      fields: {
        label: { type: 'text', label: 'Section label' },
        title: { type: 'text', label: 'Title' },
        body: { type: 'textarea', label: 'Body' },
      },
      defaultProps: {
        label: 'Situation',
        title: 'Why this matters now',
        body: 'Use plain language to explain the opportunity, the audience, and the outcome you are guiding people toward.',
      },
      render: ({ label, title, body }) => (
        <section className="eb-block eb-section">
          <div className="eb-section-inner">
            <p className="eb-section-label">{label}</p>
            <h2 className="eb-section-title">{title}</h2>
            <p className="eb-section-body">{body}</p>
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
        label,
        title,
        metricOneValue,
        metricOneLabel,
        metricTwoValue,
        metricTwoLabel,
        metricThreeValue,
        metricThreeLabel,
      }) => (
        <section className="eb-block eb-section">
          <div className="eb-section-inner">
            <p className="eb-section-label">{label}</p>
            <h2 className="eb-section-title">{title}</h2>
            <div className="eb-metrics">
              <div className="eb-metric">
                <p className="eb-metric-value">{metricOneValue}</p>
                <p className="eb-metric-label">{metricOneLabel}</p>
              </div>
              <div className="eb-metric">
                <p className="eb-metric-value">{metricTwoValue}</p>
                <p className="eb-metric-label">{metricTwoLabel}</p>
              </div>
              <div className="eb-metric">
                <p className="eb-metric-value">{metricThreeValue}</p>
                <p className="eb-metric-label">{metricThreeLabel}</p>
              </div>
            </div>
          </div>
        </section>
      ),
    },
    EACtaBand: {
      label: 'EA CTA Band',
      fields: {
        title: { type: 'text', label: 'Title' },
        body: { type: 'textarea', label: 'Body' },
        primaryLabel: { type: 'text', label: 'Primary label' },
        primaryHref: { type: 'text', label: 'Primary link' },
        secondaryLabel: { type: 'text', label: 'Secondary label' },
        secondaryHref: { type: 'text', label: 'Secondary link' },
      },
      defaultProps: {
        title: 'Ready for the next step?',
        body: 'Start with one clear action. The platform will guide the rest.',
        primaryLabel: 'Get started',
        primaryHref: '/assessment',
        secondaryLabel: 'Contact EA',
        secondaryHref: '/contact',
      },
      render: ({ title, body, primaryLabel, primaryHref, secondaryLabel, secondaryHref }) => (
        <section className="eb-block eb-cta-band">
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
