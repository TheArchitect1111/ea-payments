import type { LandingPageConfig } from '@/lib/landing-chassis/types';
import type { ContentPackContext, VerticalContentPack } from './types';

/** 3HC — compliance / readiness vertical. */
export const threeHcReadinessContentPack: VerticalContentPack = {
  id: '3hc-readiness',
  platformClientId: '3hc',
  vertical: 'compliance-readiness',
  label: '3HC Readiness Pack',
  summary:
    'Staff training, evidence, and demonstrable readiness language for 3HC — compliance personality on the EA chassis.',
  apply(base, ctx) {
    const portal = `/portal/${ctx.portalSlug}`;
    return {
      ...base,
      brand: {
        ...base.brand,
        nameLine1: '3HC',
        nameLine2: 'Readiness',
        tagline: ctx.workspaceName,
        logo: ctx.logo || base.brand.logo,
      },
      links: {
        apply: portal,
        video: '#how-it-works',
        schedule: '/contact',
      },
      nav: [
        { label: 'Home', href: '#top' },
        { label: 'Readiness', href: '#difference' },
        { label: 'Staff', href: portal },
        { label: 'Contact', href: '/contact' },
      ],
      possibility: {
        headline: 'Readiness you can demonstrate.',
        subheadline:
          '3HC helps staff complete training, keep evidence close, and prove compliance without the scramble.',
        supporting: 'Training hub, updates, and evidence workflows from one ClientConfig.',
        image: base.possibility.image,
        applyLabel: 'Enter readiness center',
        videoLabel: 'See the readiness path',
      },
      socialProof: {
        heading: 'When auditors ask, you’re ready',
        items: [
          {
            quote: 'Training completion and evidence finally lived in the same place.',
            name: 'Compliance lead',
            role: '3HC staff',
            photo: ctx.logo,
          },
          {
            quote: 'Staff knew exactly which process to improve next.',
            name: 'Operations',
            role: 'Readiness center',
            photo: ctx.logo,
          },
          {
            quote: 'The portal speaks compliance — clear, accountable, calm.',
            name: 'Program manager',
            role: '3HC',
            photo: ctx.logo,
          },
        ],
      },
      challenge: {
        heading: 'Compliance without a system is theater',
        intro: 'Policies in drives. Training in email. Evidence somewhere else.',
        painPoints: [
          'Staff can’t find the current procedure',
          'Training completion is hard to prove',
          'Evidence gathering starts the week before review',
          'No single readiness surface for the team',
        ],
      },
      difference: {
        heading: 'Built for demonstrable readiness',
        subheading: 'Compliance personality + 3HC theme + training capabilities — reproducible.',
        cards: [
          {
            title: 'Training hub',
            description: 'Assigned modules with a clear path to completion.',
          },
          {
            title: 'Evidence library',
            description: 'Planned capability for artifacts that prove the work.',
          },
          {
            title: 'Staff updates',
            description: 'Advisor activity and process changes in one feed.',
          },
          {
            title: 'Accountable tone',
            description: 'Language that expects proof — without panic.',
          },
        ],
      },
      process: {
        heading: 'How readiness compounds',
        subheading: 'Train → document → review → improve.',
        steps: [
          {
            label: 'Train',
            description: 'Staff complete required modules in the Readiness Center.',
            icon: 'school',
          },
          {
            label: 'Document',
            description: 'Evidence stays attached to the process it supports.',
            icon: 'agreement',
          },
          {
            label: 'Review',
            description: 'Updates and alerts surface gaps before they become findings.',
            icon: 'lock',
          },
          {
            label: 'Improve',
            description: 'Close the loop on the next compliance process.',
            icon: 'trackicon',
          },
        ],
      },
      portal: {
        heading: ctx.workspaceName,
        subheading: `A readiness workspace for ${ctx.members.toLowerCase()}.`,
        features: [
          {
            title: 'Readiness center',
            description: 'Home surface tuned for compliance density and clarity.',
            icon: 'manage',
          },
          {
            title: 'Training',
            description: 'Modules and completion tracking for staff.',
            icon: 'school',
          },
          {
            title: 'Updates',
            description: 'Process changes and advisor follow-through.',
            icon: 'updates',
          },
        ],
        dashboardImage: base.portal.dashboardImage,
      },
      results: {
        heading: 'Proof over promises',
        subheading: 'Reproduce 3HC readiness without rebuilding the chassis.',
        stats: [
          { value: '1', label: 'ClientConfig' },
          { value: '4', label: 'Readiness steps' },
          { value: '2', label: 'Surfaces' },
        ],
        proofs: [
          { image: base.possibility.image, caption: 'Readiness landing' },
          { image: ctx.logo, caption: ctx.workspaceName },
        ],
        profileCta: 'Enter readiness center',
        profileHref: portal,
      },
      founder: {
        heading: '3HC',
        role: 'Compliance · Training · Evidence',
        story:
          '3HC runs on the EA reproduction engine — readiness portal and landing from configuration, ready for the next audit conversation.',
        image: ctx.logo,
      },
      finalCta: {
        heading: 'Ready to demonstrate readiness?',
        subheading: 'Enter the 3HC Readiness Center — or talk with the team.',
        applyLabel: 'Enter readiness center',
        scheduleLabel: 'Talk with 3HC',
      },
      footer: {
        about: '3HC — staff training, evidence, and demonstrable compliance readiness.',
        quickLinks: [
          { label: 'Readiness center', href: portal },
          { label: 'Contact', href: '/contact' },
        ],
        resources: [{ label: 'Portal login', href: portal }],
        email: 'hello@efficiencyarchitects.com',
        instagramLabel: '3HC',
        location: '3HC Readiness',
        copyright: `© ${new Date().getFullYear()} 3HC. Readiness pack on the EA chassis.`,
      },
    };
  },
};
