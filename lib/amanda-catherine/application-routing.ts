import type { PortalFormStatus } from '@/lib/portal-forms/types';

export type AmandaApplicationRoute = {
  queueHref: string;
  queueLabel: string;
  confirmation: string;
  reviewStep: string;
  acceptedHandoff: string;
};

const ROUTES: Record<string, AmandaApplicationRoute> = {
  'founder-advisory': {
    queueHref: '/portal/amanda-catherine/owner/advisory',
    queueLabel: 'Founder Advisory',
    confirmation: 'Your Founder Advisory application has been received.',
    reviewStep: 'Amanda will review your goals and contact you about the consultation or advisory pathway that best fits. No booking or payment is confirmed yet.',
    acceptedHandoff: 'Confirm the recommended consultation or package, then send the approved payment path.',
  },
  'speaking-media': {
    queueHref: '/portal/amanda-catherine/owner/speaking',
    queueLabel: 'Speaking & Media',
    confirmation: 'Your speaking and media inquiry has been received.',
    reviewStep: 'Amanda will review the event details, fit and availability before discussing a proposal, agreement or payment instructions.',
    acceptedHandoff: 'Confirm fit and availability, then send the proposal, agreement and payment instructions when applicable.',
  },
  'lifeline-media-guest': {
    queueHref: '/portal/amanda-catherine/owner/lifeline',
    queueLabel: 'LIFELINE',
    confirmation: 'Your LIFELINE interview application has been received.',
    reviewStep: 'Amanda will review the guest information and assets before confirming package selection, release requirements, payment when applicable and scheduling.',
    acceptedHandoff: 'Confirm package selection, release, payment when applicable, asset readiness and interview scheduling.',
  },
  'partner-vendor-application': {
    queueHref: '/portal/amanda-catherine/owner/lifeline',
    queueLabel: 'LIFELINE',
    confirmation: 'Your LIFELINE partnership inquiry has been received.',
    reviewStep: 'Amanda will review the proposed collaboration before confirming an agreement, sponsorship invoice or decision.',
    acceptedHandoff: 'Confirm the partnership terms, then send the agreement or sponsorship invoice when applicable.',
  },
};

const FALLBACK: AmandaApplicationRoute = {
  queueHref: '/portal/amanda-catherine/owner',
  queueLabel: 'Applications',
  confirmation: 'Your application has been received.',
  reviewStep: 'Amanda will review the information provided and contact you about the appropriate next step.',
  acceptedHandoff: 'Confirm the appropriate next step and contact the applicant.',
};

export function amandaApplicationRoute(formId: unknown, program?: unknown): AmandaApplicationRoute {
  if (formId === 'partner-vendor-application' && program !== 'lifeline') return FALLBACK;
  return typeof formId === 'string' ? ROUTES[formId] ?? FALLBACK : FALLBACK;
}

export function amandaApplicationHandoff(formId: unknown, status: PortalFormStatus, program?: unknown): string {
  const route = amandaApplicationRoute(formId, program);
  if (status === 'submitted') return 'Review the application details and mark it reviewed when assessment begins.';
  if (status === 'reviewed') return `Complete the review. If it is a fit, mark it accepted. ${route.acceptedHandoff}`;
  if (status === 'accepted') return route.acceptedHandoff;
  return 'Send a courteous decision message and retain the record for reference.';
}
