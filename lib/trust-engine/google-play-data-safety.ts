/**
 * Google Play Data Safety metadata for Simplifi / Simplifi Orb.
 * Reference during Play Console submission. Privacy Policy URL is public.
 */
import { SIMPLIFI_PRIVACY_POLICY_URL } from '@/lib/trust-engine/legal-pack';

export type GooglePlayDataSafetyDeclaration = {
  privacyPolicyUrl: string;
  appName: string;
  dataCollected: Array<{
    category: string;
    types: string[];
    purpose: string[];
    optional: boolean;
  }>;
  dataShared: Array<{
    category: string;
    types: string[];
    purpose: string[];
  }>;
  securityPractices: {
    dataEncryptedInTransit: boolean;
    usersCanRequestDeletion: boolean;
    committedToPlayFamiliesPolicy: boolean;
  };
  notes: string[];
};

/** Canonical Simplifi Data Safety object for Play Store. */
export const SIMPLIFI_GOOGLE_PLAY_DATA_SAFETY: GooglePlayDataSafetyDeclaration = {
  privacyPolicyUrl: SIMPLIFI_PRIVACY_POLICY_URL,
  appName: 'Simplifi / Simplifi Orb',
  dataCollected: [
    {
      category: 'Personal info',
      types: ['Name', 'Email address', 'User IDs'],
      purpose: ['App functionality', 'Account management'],
      optional: false,
    },
    {
      category: 'App activity',
      types: ['App interactions', 'In-app search history'],
      purpose: ['App functionality', 'Analytics'],
      optional: false,
    },
    {
      category: 'Photos and videos',
      types: ['Photos'],
      purpose: ['App functionality'],
      optional: true,
    },
    {
      category: 'Device or other IDs',
      types: ['Device or other IDs'],
      purpose: ['App functionality', 'Fraud prevention, security, and compliance'],
      optional: false,
    },
  ],
  dataShared: [
    {
      category: 'Personal info',
      types: ['Email address'],
      purpose: ['App functionality'],
    },
  ],
  securityPractices: {
    dataEncryptedInTransit: true,
    usersCanRequestDeletion: true,
    committedToPlayFamiliesPolicy: false,
  },
  notes: [
    'Photos are collected only when the user uses Capture / share-target features.',
    'Payment card data is processed by Stripe; not stored on Ascension Systems servers.',
    'Public privacy policy: ' + SIMPLIFI_PRIVACY_POLICY_URL,
    'Account deletion: in-app Settings → Delete account; web https://efficiencyarchitects.online/legal/account-deletion',
  ],
};

export function getSimplifiPlayPrivacyUrl(): string {
  return SIMPLIFI_PRIVACY_POLICY_URL;
}
