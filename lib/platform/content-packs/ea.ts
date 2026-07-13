import type { VerticalContentPack } from './types';

/** EA platform pack — light vertical for the Efficiency Architects preset. */
export const eaPlatformContentPack: VerticalContentPack = {
  id: 'ea-platform',
  platformClientId: 'ea',
  vertical: 'platform-reproduction',
  label: 'EA Platform Pack',
  summary:
    'Platform-operator language for reproducing portals and landings from ClientConfig — Efficiency Architects home surface.',
  apply(base, ctx) {
    const portal = `/portal/${ctx.portalSlug}`;
    return {
      ...base,
      brand: {
        ...base.brand,
        nameLine1: 'Efficiency',
        nameLine2: 'Architects',
        tagline: ctx.workspaceName,
        logo: ctx.logo || base.brand.logo,
      },
      links: {
        apply: '/admin/ea-factory/client-factory',
        video: '/admin/reproduce-preview',
        schedule: '/contact',
      },
      nav: [
        { label: 'Home', href: '#top' },
        { label: 'Engine', href: '#how-it-works' },
        { label: 'Command', href: portal },
        { label: 'Factory', href: '/admin/ea-factory' },
      ],
      possibility: {
        headline: 'Build the operating system your clients feel.',
        subheadline:
          'Portals, landings, and entitlements from one client configuration — the EA reproduction engine.',
        supporting: 'Theme, personality, capabilities, and vertical packs. No rebuilds.',
        image: base.possibility.image,
        applyLabel: 'New client factory',
        videoLabel: 'Open reproduce preview',
      },
      socialProof: {
        heading: 'One chassis. Many brands.',
        items: [
          {
            quote: 'CPR, ETFM, 3HC, Bob Rumball — same engine, distinct vertical packs.',
            name: 'Platform',
            role: 'Content packs',
            photo: ctx.logo,
          },
          {
            quote: 'Factory creates the org. Site and portal share the ClientConfig.',
            name: 'Builder',
            role: 'EA Factory',
            photo: ctx.logo,
          },
          {
            quote: 'Personality copy finally follows the brand into every module page.',
            name: 'Operator',
            role: 'Command Center',
            photo: ctx.logo,
          },
        ],
      },
      challenge: {
        heading: 'Custom builds don’t scale',
        intro: 'Every client deserves a brand. Not every client needs a new codebase.',
        painPoints: [
          'Portals and landings drift apart',
          'Hard-coded copy fights personality',
          'Verticals get rebuilt instead of packed',
          'No factory path from config → live org',
        ],
      },
      difference: {
        heading: 'Reproduce, don’t rebuild',
        subheading: 'Capability framework + workspace engine + website engine + content packs.',
        cards: [
          { title: 'ClientConfig', description: 'Theme, personality, modules, landing overrides.' },
          { title: 'Factory', description: 'Org + entitlements + workspace in one pass.' },
          { title: 'Public site', description: '/site/[slug] from preset or live portal slug.' },
          { title: 'Vertical packs', description: 'Athletics, coaching, readiness, learning.' },
        ],
      },
      process: {
        heading: 'How reproduction works',
        subheading: 'Config → assemble → publish.',
        steps: [
          { label: 'Preset', description: 'Pick EA, CPR, ETFM, 3HC, or Bob Rumball.', icon: 'apply' },
          { label: 'Assemble', description: 'Portal shell + landing chassis + pack copy.', icon: 'manage' },
          { label: 'Factory', description: 'Create org, workspace fields, entitlements.', icon: 'send' },
          { label: 'Publish', description: 'Live /portal and /site for the slug.', icon: 'opportunities' },
        ],
      },
      portal: {
        heading: ctx.workspaceName,
        subheading: 'Executive command surface for platform operators.',
        features: [
          { title: 'Command Center', description: 'Pulse, Simplifi, Amplifi, and delivery.', icon: 'manage' },
          { title: 'Capabilities', description: 'Marketplace, entitlements, foundation health.', icon: 'trackicon' },
          { title: 'Factory', description: 'Reproduce the next client without a rebuild.', icon: 'apply' },
        ],
        dashboardImage: base.portal.dashboardImage,
      },
      results: {
        heading: 'Engine metrics that matter',
        subheading: 'Presets with packs. Sites that resolve. Factories that ship.',
        stats: [
          { value: '5', label: 'Client presets' },
          { value: '5', label: 'Content packs' },
          { value: '2', label: 'Surfaces each' },
        ],
        proofs: [
          { image: base.possibility.image, caption: 'EA landing' },
          { image: ctx.logo, caption: ctx.workspaceName },
        ],
        profileCta: 'Open Command Center',
        profileHref: portal,
      },
      founder: {
        heading: 'Efficiency Architects',
        role: 'Platform · Reproduction engine',
        story:
          'EA builds the chassis once — then reproduces branded portals and landings from ClientConfig for every vertical.',
        image: ctx.logo,
      },
      finalCta: {
        heading: 'Ready to reproduce the next client?',
        subheading: 'Open the New Client Factory — or preview any preset.',
        applyLabel: 'New client factory',
        scheduleLabel: 'Talk with EA',
      },
      footer: {
        about: 'Efficiency Architects — the platform that reproduces portals and landings from configuration.',
        quickLinks: [
          { label: 'Command Center', href: portal },
          { label: 'Reproduce', href: '/admin/reproduce-preview' },
          { label: 'Factory', href: '/admin/ea-factory/client-factory' },
        ],
        resources: [
          { label: 'CPR site', href: '/site/cpr' },
          { label: 'Capabilities', href: '/admin/capability-marketplace' },
        ],
        email: 'hello@efficiencyarchitects.com',
        instagramLabel: 'Efficiency Architects',
        location: 'EA Platform',
        copyright: `© ${new Date().getFullYear()} Efficiency Architects. Platform pack on the EA chassis.`,
      },
    };
  },
};
