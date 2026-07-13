/** EA Landing Page Chassis™ — configurable section types. Build once. Deploy everywhere. */

export type LandingBrand = {
  nameLine1: string;
  nameLine2: string;
  tagline: string;
  logo: string;
};

export type LandingLinks = {
  apply: string;
  video: string;
  agreement?: string;
  schedule?: string;
  instagram?: string;
  instagramSecondary?: string;
  facebook?: string;
};

export type NavItem = { label: string; href: string };

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  photo: string;
};

export type DifferenceCard = {
  title: string;
  description: string;
};

export type ProcessStep = {
  label: string;
  description: string;
  icon: string;
};

export type PortalFeature = {
  title: string;
  description: string;
  icon: string;
};

export type ProofItem = {
  image: string;
  caption: string;
};

export type StatItem = {
  value: string;
  label: string;
};

export type LandingPageConfig = {
  brand: LandingBrand;
  colors: {
    primary: string;
    primaryBright: string;
    black: string;
    dark: string;
    offWhite: string;
    white: string;
  };
  links: LandingLinks;
  nav: NavItem[];
  /** 1. POSSIBILITY — lead with the dream */
  possibility: {
    headline: string;
    subheadline: string;
    supporting: string;
    image: string;
    applyLabel?: string;
    videoLabel?: string;
  };
  /** 2. SOCIAL PROOF — max 3 testimonials */
  socialProof: {
    heading: string;
    items: Testimonial[];
  };
  /** Optional philosophy quote band (e.g. Coach Pop) */
  philosophy?: {
    label: string;
    quote: string;
    attribution: string;
    points?: string[];
  };
  /** 3. THE CHALLENGE */
  challenge: {
    heading: string;
    intro: string;
    painPoints: string[];
  };
  /** 4. THE DIFFERENCE — four solution cards */
  difference: {
    heading: string;
    subheading: string;
    cards: DifferenceCard[];
  };
  /** 5. HOW IT WORKS */
  process: {
    heading: string;
    subheading: string;
    steps: ProcessStep[];
  };
  /** 6. PORTAL DIFFERENTIATOR */
  portal: {
    heading: string;
    subheading: string;
    features: PortalFeature[];
    dashboardImage: string;
  };
  /** 7. RESULTS — combined proof */
  results: {
    heading: string;
    subheading: string;
    stats: StatItem[];
    proofs: ProofItem[];
    profileCta: string;
    profileHref: string;
  };
  /** 8. MEET FOUNDER */
  founder: {
    heading: string;
    role: string;
    story: string;
    image: string;
  };
  /** 9. FINAL CTA */
  finalCta: {
    heading: string;
    subheading: string;
    applyLabel: string;
    agreementLabel?: string;
    scheduleLabel?: string;
  };
  footer: {
    about: string;
    quickLinks: NavItem[];
    resources: { label: string; href: string }[];
    email: string;
    instagramLabel: string;
    prospectsInstagramLabel?: string;
    location: string;
    copyright: string;
  };
};
