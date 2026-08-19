export const BUSINESS_PRESENCE_PROVIDER_IDS = ['apple-business'] as const;

export type BusinessPresenceProviderId = (typeof BUSINESS_PRESENCE_PROVIDER_IDS)[number];
export type BusinessPresenceStatus =
  | 'not-started'
  | 'verification-pending'
  | 'information-needed'
  | 'active'
  | 'update-required';

export type SharedBusinessProfile = {
  legalName: string;
  displayName: string;
  description: string;
  address: string;
  serviceArea: string;
  phone: string;
  email: string;
  websiteUrl: string;
  bookingUrl: string;
  purchaseUrl: string;
  registrationUrl: string;
  logoUrl: string;
  coverImageUrl: string;
  hours: string;
  categories: string[];
};

export type BusinessPresenceProvider = {
  id: BusinessPresenceProviderId;
  name: string;
  category: 'Digital Presence';
  status: 'guided-setup';
  setupMode: 'external-guided';
  setupUrl: string;
  partnerApplicationUrl: string;
  summary: string;
  value: string[];
  setupChecklist: string[];
  supportedActions: string[];
  evaReadinessChecks: string[];
  automationNote: string;
};

export const BUSINESS_PRESENCE_PROVIDERS: readonly BusinessPresenceProvider[] = [
  {
    id: 'apple-business',
    name: 'Apple Business',
    category: 'Digital Presence',
    status: 'guided-setup',
    setupMode: 'external-guided',
    setupUrl: 'https://business.apple.com/',
    partnerApplicationUrl: 'https://businessconnect.apple.com/partners',
    summary:
      'Manage how the organization appears across Apple Maps, Mail, Wallet, Siri, Spotlight, and other Apple services.',
    value: [
      'Verified brand and location presence across Apple services',
      'Direct customer actions for booking, purchasing, registering, calling, and visiting',
      'Promotions and Showcases connected to the organization’s EA destinations',
      'Visibility into how Apple customers discover and engage with the business',
    ],
    setupChecklist: [
      'Sign in with a business-owned Apple Account',
      'Enter and verify the legal business information',
      'Add the physical location or service-area details',
      'Add the logo, cover image, description, categories, and hours',
      'Confirm the phone number, email address, and website',
      'Connect booking, purchasing, registration, or intake actions',
      'Review how the business appears across Apple services',
      'Record the verification result in the EA portal',
    ],
    supportedActions: ['Schedule', 'Buy', 'Register', 'Learn More', 'Get Started'],
    evaReadinessChecks: [
      'Missing or inconsistent business information',
      'Outdated hours, images, offers, or destination links',
      'Verification and setup follow-up',
      'Apple partner/API readiness',
    ],
    automationNote:
      'Guided setup is available now. Automated synchronization remains disabled until Efficiency Architects receives Apple third-party partner and API approval.',
  },
] as const;

export function getBusinessPresenceProvider(id: BusinessPresenceProviderId) {
  return BUSINESS_PRESENCE_PROVIDERS.find((provider) => provider.id === id);
}
