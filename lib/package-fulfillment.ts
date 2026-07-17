import type { CatalogItem } from '@/lib/catalog';
import type { ResolvedCheckoutOffer } from '@/lib/platform/payments-bridge';

export interface PackageFulfillmentPlan {
  packageId: string;
  displayName: string;
  fulfillmentType: string;
  fulfillmentLabel: string;
  reviewRequired: boolean;
  intakePath: string;
  adminHref: string;
  clientExpectation: string;
  firstMilestone: string;
}

/** Minimal fulfillment input ? CatalogItem or contract-resolved offer. */
export type FulfillmentSource = {
  id: string;
  displayName: string;
  fulfillmentType?: string;
  fulfillmentLabel?: string;
  reviewRequired?: boolean;
  intakePath?: string;
};

const DEFAULT_ADMIN_HREF = '/admin/master';

export function fulfillmentSourceFromOffer(offer: ResolvedCheckoutOffer): FulfillmentSource {
  return {
    id: offer.id,
    displayName: offer.displayName,
    fulfillmentType: offer.fulfillmentType,
    fulfillmentLabel: offer.fulfillmentLabel,
    reviewRequired: offer.reviewRequired,
    intakePath: offer.intakePath,
  };
}

export function buildPackageFulfillmentPlan(
  item: CatalogItem | FulfillmentSource | ResolvedCheckoutOffer,
): PackageFulfillmentPlan {
  const source: FulfillmentSource =
    'kind' in item
      ? fulfillmentSourceFromOffer(item)
      : {
          id: item.id,
          displayName: item.displayName,
          fulfillmentType: item.fulfillmentType,
          fulfillmentLabel: 'fulfillmentLabel' in item ? item.fulfillmentLabel : undefined,
          reviewRequired: 'reviewRequired' in item ? item.reviewRequired : undefined,
          intakePath: 'intakePath' in item ? item.intakePath : undefined,
        };

  const intakePath = source.intakePath ?? '/discover';
  const fulfillmentType = source.fulfillmentType ?? 'implementation';
  const base = {
    packageId: source.id,
    displayName: source.displayName,
    fulfillmentType,
    fulfillmentLabel: source.fulfillmentLabel ?? 'Review payment and begin onboarding.',
    reviewRequired: source.reviewRequired ?? false,
    intakePath,
  };

  switch (fulfillmentType) {
    case 'connect-profile':
      return {
        ...base,
        adminHref: '/admin/connect/tenants',
        clientExpectation:
          'Your Connect profile direction is being prepared. We will confirm the offer, audience, proof, and next action before anything goes live.',
        firstMilestone: 'Confirm profile audience and primary action.',
      };
    case 'landing-page':
      return {
        ...base,
        adminHref: '/admin/ea-factory/new-experience',
        clientExpectation:
          'Your landing page blueprint is being prepared. We will confirm the offer, audience, trust builders, and primary action before launch.',
        firstMilestone: 'Confirm offer, audience, proof, and call to action.',
      };
    case 'client-portal':
      return {
        ...base,
        adminHref: '/admin/ea-factory/new-experience',
        clientExpectation:
          'Your portal workspace is being prepared. We will confirm users, resources, training needs, and communication flow before launch.',
        firstMilestone: 'Confirm portal users, resources, training, and update flow.',
      };
    case 'website-portal-auto':
      return {
        ...base,
        adminHref: '/admin/master',
        clientExpectation:
          'Your website and client portal are live. Open your site link and sign in to your portal with the credentials in this email.',
        firstMilestone: 'Open your live website and complete first portal login.',
      };
    case 'simplifi':
      return {
        ...base,
        adminHref: '/admin/simplifi',
        clientExpectation:
          'Your Simplifi access is being prepared so you can begin capturing and acting on opportunities.',
        firstMilestone: 'Confirm portal login and first capture path.',
      };
    case 'launch-verification':
      return {
        ...base,
        adminHref: '/admin/master',
        clientExpectation: 'Launch verification is queued for review.',
        firstMilestone: 'Confirm checkout, Airtable, email, webhook, and portal access history.',
      };
    default:
      return {
        ...base,
        adminHref: DEFAULT_ADMIN_HREF,
        clientExpectation:
          'Your project workspace is being prepared. We will confirm the recommended path before anything goes live.',
        firstMilestone: 'Confirm project direction and first implementation milestone.',
      };
  }
}

export function fulfillmentMetadata(plan: PackageFulfillmentPlan): Record<string, string> {
  return {
    packageDisplayName: plan.displayName,
    fulfillmentType: plan.fulfillmentType,
    fulfillmentLabel: plan.fulfillmentLabel,
    reviewRequired: String(plan.reviewRequired),
    intakePath: plan.intakePath,
    adminHref: plan.adminHref,
    firstMilestone: plan.firstMilestone,
  };
}
