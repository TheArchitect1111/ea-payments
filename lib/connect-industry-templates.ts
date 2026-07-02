export type ConnectIndustry = 'sports' | 'nonprofit' | 'church' | 'business';

export type ConnectIndustryDefaults = {
  offerHeadline: string;
  resourceTitle: string;
  guideIntro: string;
  journeyTitle: string;
  journeyIntro: string;
  leadTypes: string[];
  teams: string[];
};

export const CONNECT_INDUSTRY_TEMPLATES: Record<ConnectIndustry, ConnectIndustryDefaults> = {
  sports: {
    offerHeadline: 'Get the Parent Recruiting Guide',
    resourceTitle: 'Parent Recruiting Guide',
    guideIntro: 'Understand the next step in the recruiting process before you leave the event.',
    journeyTitle: 'Your recruiting journey starts here',
    journeyIntro: 'Review the guide, book a consultation, and keep every conversation moving forward.',
    leadTypes: ['Athlete Parent', 'Athlete', 'Coach', 'Partner', 'Sponsor'],
    teams: ['Recruiting Team', 'Admissions Team', 'Partnership Team'],
  },
  nonprofit: {
    offerHeadline: 'Get the Community Impact Kit',
    resourceTitle: 'Community Impact Kit',
    guideIntro: 'See how we serve the community and what happens after you connect with us.',
    journeyTitle: 'Stay connected with our mission',
    journeyIntro: 'Explore volunteer paths, giving options, and ways to partner with us.',
    leadTypes: ['Donor', 'Volunteer', 'Partner', 'Member', 'Prospect'],
    teams: ['Development Team', 'Volunteer Team', 'Community Team'],
  },
  church: {
    offerHeadline: 'Get the Welcome & Next Steps Guide',
    resourceTitle: 'Welcome & Next Steps Guide',
    guideIntro: 'Learn what to expect and how to take your next step with us.',
    journeyTitle: 'Your next step is ready',
    journeyIntro: 'Find groups, serving opportunities, and ways to stay connected.',
    leadTypes: ['Member', 'Guest', 'Volunteer', 'Partner', 'Prospect'],
    teams: ['Pastoral Team', 'Connections Team', 'Ministry Team'],
  },
  business: {
    offerHeadline: 'Get the Relationship Activation Blueprint',
    resourceTitle: 'Relationship Activation Blueprint',
    guideIntro: 'Turn one conversation into a trackable relationship and a clear next step.',
    journeyTitle: 'Your next step is ready',
    journeyIntro: 'Review the blueprint and schedule a consultation when you are ready.',
    leadTypes: ['Prospect', 'Partner', 'Client', 'Referral', 'Team Member'],
    teams: ['Relationship Team', 'Growth Team', 'Support Team'],
  },
};

export function normalizeConnectIndustry(raw: string | undefined | null): ConnectIndustry {
  const value = (raw ?? '').trim().toLowerCase();
  if (value === 'sports' || value === 'athletics' || value === 'recruiting' || value === 'cpr') return 'sports';
  if (value === 'nonprofit' || value === 'non-profit' || value === 'charity') return 'nonprofit';
  if (value === 'church' || value === 'ministry' || value === 'faith') return 'church';
  return 'business';
}
