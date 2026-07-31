/**
 * Organizations workspace columns expected by lib/organizations.ts.
 * Live base currently has only Name / Slug / Status / Owner Email / Organization Id.
 */
export const ORGANIZATION_WORKSPACE_FIELDS = [
  'Theme Id',
  'Personality Id',
  'Workspace Name',
  'Brand Colors',
  'Logo',
  'Platform Client Id',
  'Industry Pack Id',
  'Portal Slug',
  'Client Record Id',
  'Mission',
  'Industry',
  'Booking Url',
  'Nylas Grant Id',
  'Nylas Calendar Id',
] as const;

export type OrganizationWorkspaceField = (typeof ORGANIZATION_WORKSPACE_FIELDS)[number];

export const ORGANIZATION_WORKSPACE_FIELD_SET = new Set<string>(ORGANIZATION_WORKSPACE_FIELDS);
