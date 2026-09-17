import { AMANDA_CANONICAL_ACADEMY_COURSES } from './canonical-courses';

/**
 * Amanda Catherine V2 page <-> portal connection contract.
 *
 * This is the canonical public/owner boundary for operational data that must not
 * drift between the public website and Amanda's owner portal. The public site may
 * present this data differently, but it must not maintain independent course,
 * pricing, enrollment or scheduling values.
 */
export const AMANDA_BUSINESS_CONTRACT_VERSION = '2026-09-17.0';

export const AMANDA_BUSINESS_CONTRACT = {
  id: 'amanda-catherine',
  version: AMANDA_BUSINESS_CONTRACT_VERSION,
  brand: {
    publicName: 'Amanda Catherine',
    studioName: 'AesthetiKine Studio Lab',
    academyName: 'AesthetiKine Academy',
    creativeBusinessName: 'LIFELINE',
  },
  destinations: {
    enrollmentPath: '/portal/amanda-catherine/enroll',
    learningPath: '/portal/amanda-catherine/learning',
    ownerPortalPath: '/portal/amanda-catherine/owner',
    janeBookingUrl: process.env.AMANDA_JANE_BOOKING_URL || 'https://aesthetikine.janeapp.com/',
  },
  academy: AMANDA_CANONICAL_ACADEMY_COURSES.map((course) => ({
    id: course.id,
    offerId: course.offerId,
    title: course.title,
    priceCad: course.priceCad,
    compareAtPriceCad: 'compareAtPriceCad' in course ? course.compareAtPriceCad : undefined,
    saleLabel: 'saleLabel' in course ? course.saleLabel : undefined,
    enrollmentPath: '/portal/amanda-catherine/enroll',
    delivery: course.delivery,
  })),
  ownership: {
    courses: 'canonical-business-layer',
    pricing: 'canonical-business-layer',
    enrollment: 'ea-payments',
    payments: 'ea-payments-stripe',
    entitlements: 'ea-client-access',
    appointments: 'jane',
    learning: 'ea-learning-adapter',
    websiteChanges: 'eva-update-hub',
  },
  mutationPolicy: {
    publicWebsiteMayWriteOperationalData: false,
    portalMayMutateProductionDirectly: false,
    approvedChangesMustUpdateCanonicalSourceFirst: true,
    deploymentVerificationRequired: true,
  },
} as const;

export type AmandaBusinessContract = typeof AMANDA_BUSINESS_CONTRACT;
