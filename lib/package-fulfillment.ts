import type { CatalogItem } from '@/lib/catalog';

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

const DEFAULT_ADMIN_HREF = '/admin/master';

export function buildPackageFulfillmentPlan(item: CatalogItem): PackageFulfillmentPlan {
  const intakePath = item.intakePath ?? '/discover';
  const base = {
    packageId: item.id,
    displayName: item.displayName,
    fulfillmentType: item.fulfillmentType,
    fulfillmentLabel: item.fulfillmentLabel,
    reviewRequired: item.reviewRequired ?? false,
    intakePath,
  };

  switch (item.fulfillmentType) {
    case 'connect-profile':
      return {
        ...base,
        adminHref: '/admin/connect/profiles',
        clientExpectation: 'Your Connect profile direction is being prepared. We will confirm the offer, audience, proof, and next action before anything goes live.',
        firstMilestone: 'Confirm profile audience and primary action.',
      };
    case 'landing-page':
      return {
        ...base,
        adminHref: '/admin/ea-factory/new-experience',
        clientExpectation: 'Your landing page blueprint is being prepared. We will confirm the offer, audience, trust builders, and primary action before launch.',
        firstMilestone: 'Confirm offer, audience, proof, and call to action.',
      };
    case 'client-portal':
      return {
        ...base,
        adminHref: '/admin/ea-factory/new-experience',
        clientExpectation: 'Your portal workspace is being prepared. We will confirm users, resources, training needs, and communication flow before launch.',
        firstMilestone: 'Confirm portal users, resources, training, and update flow.',
      };
    case 'simplifi':
      return {
        ...base,
        adminHref: '/admin/simplifi',
        clientExpectation: 'Your Simplifi access is being prepared so you can begin capturing and acting on opportunities.',
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
        clientExpectation: 'Your project workspace is being prepared. We will confirm the recommended path before anything goes live.',
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
