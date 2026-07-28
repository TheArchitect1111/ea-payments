export const PORTAL_FORM_KINDS = ['intake', 'application'] as const;

export type PortalFormKind = (typeof PORTAL_FORM_KINDS)[number];

export const PORTAL_FORM_STATUSES = [
  'submitted',
  'reviewed',
  'accepted',
  'rejected',
] as const;

export type PortalFormStatus = (typeof PORTAL_FORM_STATUSES)[number];

export type PortalFormSubmission = {
  id: string;
  portalSlug: string;
  kind: PortalFormKind;
  status: PortalFormStatus;
  email: string;
  name: string;
  phone?: string;
  notes?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
