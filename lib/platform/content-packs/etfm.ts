import type { LandingPageConfig } from '@/lib/landing-chassis/types';
import type { ContentPackContext, VerticalContentPack } from './types';

function splitBrand(name: string): { line1: string; line2: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return { line1: name, line2: '' };
  return { line1: parts[0]!, line2: parts.slice(1).join(' ') };
}

/** ETFM — financial coaching vertical. */
export const etfmCoachingContentPack: VerticalContentPack = {
  id: 'etfm-coaching',
  platformClientId: 'etfm',
  vertical: 'financial-coaching',
  label: 'ETFM Coaching Pack',
  summary:
    'Calm coaching language for assessments, action plans, sessions, and client progress — ETFM on the EA chassis.',
  apply(base, ctx) {
    const brand = splitBrand(ctx.brandName);
    const portal = `/portal/${ctx.portalSlug}`;
    return {
      ...base,
      brand: {
        ...base.brand,
        nameLine1: brand.line1 || 'ETFM',
        nameLine2: brand.line2 || 'Financial Coaching',
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
        { label: 'Approach', href: '#difference' },
        { label: 'Clients', href: portal },
        { label: 'Contact', href: '/contact' },
      ],
      possibility: {
        headline: 'Coaching that clarifies the next financial move.',
        subheadline:
          'ETFM helps clients see the plan, the session, and the next milestone — without noise.',
        supporting: 'Assessments, action plans, and progress in one coaching portal.',
        image: base.possibility.image,
        applyLabel: 'Enter coaching portal',
        videoLabel: 'See how coaching works',
      },
      socialProof: {
        heading: 'Clarity clients can feel',
        items: [
          {
            quote: 'I finally knew which money decision mattered this week — not fifty.',
            name: 'Client',
            role: 'Action-plan milestone',
            photo: ctx.logo,
          },
          {
            quote: 'Sessions, homework, and progress live in one calm place.',
            name: 'Coach',
            role: 'ETFM practice',
            photo: ctx.logo,
          },
          {
            quote: 'The portal speaks coaching — not software.',
            name: 'Operations',
            role: 'Practice lead',
            photo: ctx.logo,
          },
        ],
      },
      challenge: {
        heading: 'When advice scatters, progress stalls',
        intro: 'Spreadsheets, email threads, and session notes rarely become a single client journey.',
        painPoints: [
          'Clients lose the thread between sessions',
          'Action plans live in documents nobody reopens',
          'Coaches chase status instead of coaching',
          'No branded home that feels like ETFM',
        ],
      },
      difference: {
        heading: 'Built for coaching outcomes',
        subheading: 'Financial-coaching personality + ETFM theme + training capabilities — one ClientConfig.',
        cards: [
          {
            title: 'Client focus',
            description: 'Surface the next milestone and the conversation that unlocks it.',
          },
          {
            title: 'Action plans',
            description: 'Plans stay visible beside sessions — not buried in attachments.',
          },
          {
            title: 'Training hub',
            description: 'Guides and modules reinforce what happens in the room.',
          },
          {
            title: 'Calm tone',
            description: 'Low-density coaching language — clear, never frantic.',
          },
        ],
      },
      process: {
        heading: 'How ETFM coaching moves',
        subheading: 'Assess → plan → session → progress.',
        steps: [
          {
            label: 'Assess',
            description: 'Understand the client’s starting point and capacity.',
            icon: 'apply',
          },
          {
            label: 'Plan',
            description: 'Translate insight into a visible action plan.',
            icon: 'manage',
          },
          {
            label: 'Coach',
            description: 'Sessions and updates stay connected to the plan.',
            icon: 'updates',
          },
          {
            label: 'Advance',
            description: 'Celebrate milestones and set the next financial move.',
            icon: 'trackicon',
          },
        ],
      },
      portal: {
        heading: ctx.workspaceName,
        subheading: `A coaching workspace for ${ctx.members.toLowerCase()}.`,
        features: [
          {
            title: 'Client focus',
            description: 'Who needs attention before the next session.',
            icon: 'manage',
          },
          {
            title: 'Action plan alerts',
            description: 'Milestones and blockers without inbox archaeology.',
            icon: 'trackicon',
          },
          {
            title: 'Training',
            description: 'Reinforce coaching with assigned learning.',
            icon: 'school',
          },
        ],
        dashboardImage: base.portal.dashboardImage,
      },
      results: {
        heading: 'Progress you can show',
        subheading: 'Same chassis. Coaching personality. ETFM brand.',
        stats: [
          { value: '1', label: 'ClientConfig' },
          { value: '4', label: 'Pathway steps' },
          { value: '2', label: 'Surfaces' },
        ],
        proofs: [
          { image: base.possibility.image, caption: 'Coaching landing' },
          { image: ctx.logo, caption: ctx.workspaceName },
        ],
        profileCta: 'Enter coaching portal',
        profileHref: portal,
      },
      founder: {
        heading: ctx.brandName,
        role: 'Financial coaching',
        story:
          'ETFM runs on the EA reproduction engine — a coaching portal and landing from one configuration, not a rebuild.',
        image: ctx.logo,
      },
      finalCta: {
        heading: 'Ready for the next financial move?',
        subheading: 'Enter the ETFM Coaching Portal — or talk with the team.',
        applyLabel: 'Enter coaching portal',
        scheduleLabel: 'Talk with ETFM',
      },
      footer: {
        about: 'ETFM — financial coaching with clarity, sessions, and measurable progress.',
        quickLinks: [
          { label: 'Coaching portal', href: portal },
          { label: 'Contact', href: '/contact' },
        ],
        resources: [{ label: 'Portal login', href: portal }],
        email: 'hello@efficiencyarchitects.com',
        instagramLabel: ctx.brandName,
        location: 'ETFM Coaching',
        copyright: `© ${new Date().getFullYear()} ${ctx.brandName}. Coaching pack on the EA chassis.`,
      },
    };
  },
};
