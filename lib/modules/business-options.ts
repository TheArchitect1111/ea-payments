import type { ModuleId } from '@/lib/modules/registry';

export const BUSINESS_OPTION_IDS = [
  'calendar-shared-scheduling',
  'forms-intake-applications',
  'approval-workflows',
  'reports-dashboards',
  'people-directory',
  'training-learning',
  'online-academy-student-portal',
  'resource-library',
  'event-registration-ticketing',
  'updates-change-requests',
  'website-page-editor',
  'member-directory',
  'opportunities-recommendations',
  'roles-permissions',
] as const;

export type BusinessOptionId = (typeof BUSINESS_OPTION_IDS)[number];

export type BusinessOptionDefinition = {
  id: BusinessOptionId;
  name: string;
  description: string;
  moduleIds: readonly ModuleId[];
};

/**
 * Universal, entitlement-backed business options. These bundles are tenant-neutral:
 * enabling one writes only the existing module entitlements for the selected org.
 */
export const BUSINESS_OPTION_CATALOG: readonly BusinessOptionDefinition[] = [
  {
    id: 'calendar-shared-scheduling',
    name: 'Calendar & shared scheduling',
    description: 'Shared appointments, advisor booking, events, and registrations in one hub.',
    moduleIds: ['calendar'],
  },
  {
    id: 'forms-intake-applications',
    name: 'Forms, intake & applications',
    description: 'Collect client information, receive applications, and track submissions.',
    moduleIds: ['intake', 'applications'],
  },
  {
    id: 'approval-workflows',
    name: 'Approval workflows',
    description: 'Move submissions and recommendations through review, approval, and follow-up.',
    moduleIds: ['applications', 'ctp', 'update-hub'],
  },
  {
    id: 'reports-dashboards',
    name: 'Reports & dashboards',
    description: 'Give clients curated reports, progress views, and operational insights.',
    moduleIds: ['reports', 'pulse'],
  },
  {
    id: 'people-directory',
    name: 'People & contact directory',
    description: 'Organize people, households, contacts, and relationships.',
    moduleIds: ['people'],
  },
  {
    id: 'training-learning',
    name: 'Training & learning center',
    description: 'Deliver guides, lessons, and client learning materials.',
    moduleIds: ['training'],
  },
  {
    id: 'online-academy-student-portal',
    name: 'Online Academy + Student Portal',
    description:
      'Sell courses, create student access after payment, protect course files, schedule lessons, collect assignments, track practical requirements, issue certificates, and manage students, practitioners, communication, and revenue.',
    moduleIds: ['landing', 'training', 'calendar', 'documents', 'resources', 'billing', 'people', 'intake', 'applications', 'reports', 'messaging', 'settings'],
  },
  {
    id: 'resource-library',
    name: 'Resource library',
    description: 'Share tools, templates, links, and curated resources.',
    moduleIds: ['resources'],
  },
  {
    id: 'event-registration-ticketing',
    name: 'Event registration & ticketing',
    description: 'Publish events, manage registrations, and connect ticketing through Event Hub.',
    moduleIds: ['events'],
  },
  {
    id: 'updates-change-requests',
    name: 'Updates & change requests',
    description: 'Collect content requests, enhancement requests, and advisor updates.',
    moduleIds: ['update-hub'],
  },
  {
    id: 'website-page-editor',
    name: 'Website & page editor',
    description: 'Manage public pages through the entitlement-protected Experience Builder.',
    moduleIds: ['landing'],
  },
  {
    id: 'member-directory',
    name: 'Member home & directory',
    description: 'Provide a personalized member home with an organization directory.',
    moduleIds: ['member', 'people'],
  },
  {
    id: 'opportunities-recommendations',
    name: 'Opportunities & recommendations',
    description: 'Present matched opportunities, recommendations, and review decisions.',
    moduleIds: ['ctp', 'pulse'],
  },
  {
    id: 'roles-permissions',
    name: 'Roles & permissions',
    description: 'Apply owner, admin, manager, staff, viewer, and guest access controls.',
    moduleIds: ['settings'],
  },
] as const;

const OPTION_BY_ID = new Map(BUSINESS_OPTION_CATALOG.map((option) => [option.id, option]));

export function getBusinessOption(id: string): BusinessOptionDefinition | undefined {
  return OPTION_BY_ID.get(id as BusinessOptionId);
}

export function businessOptionEnabled(
  option: BusinessOptionDefinition,
  enabledModuleIds: ReadonlySet<ModuleId>,
): boolean {
  return option.moduleIds.every((moduleId) => enabledModuleIds.has(moduleId));
}
