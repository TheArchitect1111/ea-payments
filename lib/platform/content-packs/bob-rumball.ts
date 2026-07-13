import type { LandingPageConfig } from '@/lib/landing-chassis/types';
import type { ContentPackContext, VerticalContentPack } from './types';

function splitBrand(name: string): { line1: string; line2: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return { line1: name, line2: '' };
  return { line1: parts[0]!, line2: parts.slice(1).join(' ') };
}

/** Bob Rumball — accessible training / learning vertical. */
export const bobRumballLearningContentPack: VerticalContentPack = {
  id: 'bob-rumball-learning',
  platformClientId: 'bob-rumball',
  vertical: 'accessible-learning',
  label: 'Bob Rumball Learning Pack',
  summary:
    'Accessible learning language for learners, training modules, and inclusive outcomes — Bob Rumball on the EA chassis.',
  apply(base, ctx) {
    const brand = splitBrand(ctx.brandName);
    const portal = `/portal/${ctx.portalSlug}`;
    return {
      ...base,
      brand: {
        ...base.brand,
        nameLine1: brand.line1 || 'Bob',
        nameLine2: brand.line2 || 'Rumball',
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
        { label: 'Learning', href: '#difference' },
        { label: 'Learners', href: portal },
        { label: 'Contact', href: '/contact' },
      ],
      possibility: {
        headline: 'Learning that meets every learner where they are.',
        subheadline:
          'Bob Rumball’s learning workspace makes training accessible, clear, and ready for the next outcome.',
        supporting: 'Modules, updates, and inclusive pathways from one ClientConfig.',
        image: base.possibility.image,
        applyLabel: 'Start learning',
        videoLabel: 'See the learning path',
      },
      socialProof: {
        heading: 'Access first. Outcomes follow.',
        items: [
          {
            quote: 'I could find my module and know what “done” looked like.',
            name: 'Learner',
            role: 'Training path',
            photo: ctx.logo,
          },
          {
            quote: 'Staff updates and learning lived together — not in separate tools.',
            name: 'Program coordinator',
            role: 'Bob Rumball',
            photo: ctx.logo,
          },
          {
            quote: 'The tone respects learners. The system respects time.',
            name: 'Instructor',
            role: 'Learning workspace',
            photo: ctx.logo,
          },
        ],
      },
      challenge: {
        heading: 'Training fails when access fails',
        intro: 'Materials scatter. Progress hides. Learners get left behind.',
        painPoints: [
          'Modules hard to find or finish',
          'No shared language for learner progress',
          'Updates never reach the people who need them',
          'Accessibility treated as an afterthought',
        ],
      },
      difference: {
        heading: 'Built for inclusive learning',
        subheading: 'Training-learning personality + Bob Rumball theme + hub capabilities.',
        cards: [
          {
            title: 'Learning hub',
            description: 'Clear modules and pathways for every learner.',
          },
          {
            title: 'Accessible tone',
            description: 'Copy and density tuned for training — not corporate dashboards.',
          },
          {
            title: 'Evidence ready',
            description: 'Planned evidence library for completion and outcomes.',
          },
          {
            title: 'Human updates',
            description: 'Advisor activity that supports learners, not just admins.',
          },
        ],
      },
      process: {
        heading: 'How learning moves forward',
        subheading: 'Welcome → learn → practice → celebrate.',
        steps: [
          {
            label: 'Welcome',
            description: 'Learners land in a branded workspace that feels like home.',
            icon: 'apply',
          },
          {
            label: 'Learn',
            description: 'Assigned modules with clear next steps.',
            icon: 'school',
          },
          {
            label: 'Practice',
            description: 'Updates and support keep momentum between sessions.',
            icon: 'updates',
          },
          {
            label: 'Celebrate',
            description: 'Completion and outcomes stay visible.',
            icon: 'trackicon',
          },
        ],
      },
      portal: {
        heading: ctx.workspaceName,
        subheading: `A learning workspace for ${ctx.members.toLowerCase()}.`,
        features: [
          {
            title: 'Learning hub',
            description: 'Home surface for assigned training and progress.',
            icon: 'school',
          },
          {
            title: 'Updates',
            description: 'Support and announcements learners can trust.',
            icon: 'updates',
          },
          {
            title: 'Resources',
            description: 'Playbooks and tools curated for accessibility.',
            icon: 'manage',
          },
        ],
        dashboardImage: base.portal.dashboardImage,
      },
      results: {
        heading: 'Outcomes that include everyone',
        subheading: 'Reproduce Bob Rumball learning without a rebuild.',
        stats: [
          { value: '1', label: 'ClientConfig' },
          { value: '4', label: 'Learning steps' },
          { value: '2', label: 'Surfaces' },
        ],
        proofs: [
          { image: base.possibility.image, caption: 'Learning landing' },
          { image: ctx.logo, caption: ctx.workspaceName },
        ],
        profileCta: 'Start learning',
        profileHref: portal,
      },
      founder: {
        heading: ctx.brandName,
        role: 'Accessible learning · Training',
        story:
          'Bob Rumball runs on the EA reproduction engine — learning portal and landing from one configuration, built for every learner.',
        image: ctx.logo,
      },
      finalCta: {
        heading: 'Ready to start learning?',
        subheading: 'Enter the Bob Rumball Learning Workspace — or talk with the team.',
        applyLabel: 'Start learning',
        scheduleLabel: 'Talk with us',
      },
      footer: {
        about: 'Bob Rumball — accessible training and learning outcomes for every learner.',
        quickLinks: [
          { label: 'Learning workspace', href: portal },
          { label: 'Contact', href: '/contact' },
        ],
        resources: [{ label: 'Portal login', href: portal }],
        email: 'hello@efficiencyarchitects.com',
        instagramLabel: ctx.brandName,
        location: 'Bob Rumball Learning',
        copyright: `© ${new Date().getFullYear()} ${ctx.brandName}. Learning pack on the EA chassis.`,
      },
    };
  },
};
