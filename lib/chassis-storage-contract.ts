export type ChassisStorageField = {
  name: string;
  type: 'text' | 'number' | 'checkbox' | 'longText' | 'dateTime' | 'select' | 'json';
  required: boolean;
};

export type ChassisStorageTable = {
  key: string;
  defaultName: string;
  envVar?: string;
  purpose: string;
  fields: ChassisStorageField[];
};

export const CHASSIS_STORAGE_ENV_VARS = [
  {
    name: 'AIRTABLE_API_KEY',
    required: true,
    purpose: 'Airtable personal access token with schema read and record read/write access.',
  },
  {
    name: 'AIRTABLE_PAYMENTS_BASE_ID',
    required: true,
    purpose: 'Base id used by the EA platform identity and Chassis tables.',
  },
  {
    name: 'AIRTABLE_CHASSIS_FORMS_TABLE',
    required: false,
    purpose: 'Override table name for configurable form schemas.',
  },
  {
    name: 'AIRTABLE_CHASSIS_SUBMISSIONS_TABLE',
    required: false,
    purpose: 'Override table name for submitted form responses.',
  },
  {
    name: 'AIRTABLE_CHASSIS_OBJECTS_TABLE',
    required: false,
    purpose: 'Override table name for generic Chassis objects.',
  },
  {
    name: 'AIRTABLE_CHASSIS_THEMES_TABLE',
    required: false,
    purpose: 'Override table name for tenant theme records.',
  },
  {
    name: 'AIRTABLE_CHASSIS_AUDIT_LOG_TABLE',
    required: false,
    purpose: 'Override table name for tenant audit trail records.',
  },
  {
    name: 'AIRTABLE_CHASSIS_AI_PROMPTS_TABLE',
    required: false,
    purpose: 'Override table name for tenant AI prompt records.',
  },
  {
    name: 'AIRTABLE_CHASSIS_NAVIGATION_TABLE',
    required: false,
    purpose: 'Override table name for tenant navigation records.',
  },
  {
    name: 'AIRTABLE_ENTITLEMENTS_TABLE',
    required: false,
    purpose: 'Override table name for module access entitlements.',
  },
] as const;

export const CHASSIS_STORAGE_TABLES: ChassisStorageTable[] = [
  {
    key: 'forms',
    defaultName: 'Chassis Forms',
    envVar: 'AIRTABLE_CHASSIS_FORMS_TABLE',
    purpose: 'Owner-created form schemas rendered in the portal.',
    fields: [
      field('Form Id'),
      field('Organization Id'),
      field('Module Id'),
      field('Name'),
      field('Description', 'longText', false),
      field('Status', 'select'),
      field('Fields JSON', 'json'),
      field('Submit Label', 'text', false),
      field('Success Message', 'text', false),
      field('Created At', 'dateTime'),
      field('Updated At', 'dateTime'),
    ],
  },
  {
    key: 'submissions',
    defaultName: 'Chassis Submissions',
    envVar: 'AIRTABLE_CHASSIS_SUBMISSIONS_TABLE',
    purpose: 'Portal form submissions and review status.',
    fields: [
      field('Submission Id'),
      field('Organization Id'),
      field('Form Id'),
      field('Module Id'),
      field('Status', 'select'),
      field('Submitter Email', 'text', false),
      field('Data JSON', 'json'),
      field('Created At', 'dateTime'),
      field('Updated At', 'dateTime'),
    ],
  },
  {
    key: 'objects',
    defaultName: 'Chassis Objects',
    envVar: 'AIRTABLE_CHASSIS_OBJECTS_TABLE',
    purpose: 'Generic people, events, documents, opportunities, resources, and activity objects.',
    fields: [
      field('Object Id'),
      field('Organization Id'),
      field('Type'),
      field('Title'),
      field('Status', 'select'),
      field('Module Id', 'text', false),
      field('Person Id', 'text', false),
      field('Data JSON', 'json'),
      field('Created At', 'dateTime'),
      field('Updated At', 'dateTime'),
    ],
  },
  {
    key: 'themes',
    defaultName: 'Chassis Themes',
    envVar: 'AIRTABLE_CHASSIS_THEMES_TABLE',
    purpose: 'Tenant brand, colors, logo, and portal hero copy.',
    fields: [
      field('Organization Id'),
      field('Organization Name'),
      field('Short Name'),
      field('Logo URL', 'text', false),
      field('Primary Color'),
      field('Accent Color'),
      field('Background Color'),
      field('Portal Kicker'),
      field('Portal Title'),
      field('Portal Description', 'longText'),
      field('Updated At', 'dateTime'),
    ],
  },
  {
    key: 'audit-log',
    defaultName: 'Chassis Audit Log',
    envVar: 'AIRTABLE_CHASSIS_AUDIT_LOG_TABLE',
    purpose: 'Tenant-scoped owner/admin change history for security and support.',
    fields: [
      field('Audit Id'),
      field('Organization Id'),
      field('Actor Email'),
      field('Action'),
      field('Target Type'),
      field('Target Id'),
      field('Summary'),
      field('Metadata JSON', 'json', false),
      field('Created At', 'dateTime'),
    ],
  },
  {
    key: 'ai-prompts',
    defaultName: 'Chassis AI Prompts',
    envVar: 'AIRTABLE_CHASSIS_AI_PROMPTS_TABLE',
    purpose: 'Tenant-configurable prompts, tone, and guardrails for AI-assisted features.',
    fields: [
      field('Prompt Id'),
      field('Organization Id'),
      field('Key'),
      field('Name'),
      field('Purpose', 'longText', false),
      field('System Prompt', 'longText'),
      field('Tone', 'text', false),
      field('Guardrails JSON', 'json', false),
      field('Status', 'select'),
      field('Updated At', 'dateTime'),
    ],
  },
  {
    key: 'navigation',
    defaultName: 'Chassis Navigation',
    envVar: 'AIRTABLE_CHASSIS_NAVIGATION_TABLE',
    purpose: 'Tenant portal navigation labels, groups, order, and visibility.',
    fields: [
      field('Nav Id'),
      field('Organization Id'),
      field('Module Id'),
      field('Label'),
      field('Nav Group', 'select'),
      field('Order', 'number'),
      field('Hidden', 'checkbox'),
      field('Updated At', 'dateTime'),
    ],
  },
  {
    key: 'entitlements',
    defaultName: 'Entitlements',
    envVar: 'AIRTABLE_ENTITLEMENTS_TABLE',
    purpose: 'Module access toggles by organization.',
    fields: [
      field('Organization Id'),
      field('Module Id'),
      field('Status', 'select'),
      field('Source', 'select'),
    ],
  },
  {
    key: 'organizations',
    defaultName: 'Organizations',
    envVar: 'AIRTABLE_ORGANIZATIONS_TABLE',
    purpose: 'Canonical organization identity records.',
    fields: [
      field('Organization Id'),
      field('Name'),
      field('Slug'),
      field('Owner Email'),
      field('Status', 'select'),
    ],
  },
  {
    key: 'memberships',
    defaultName: 'Memberships',
    envVar: 'AIRTABLE_MEMBERSHIPS_TABLE',
    purpose: 'User-to-organization roles and access records.',
    fields: [
      field('Organization Id'),
      field('User Email'),
      field('Role', 'select'),
      field('Status', 'select'),
    ],
  },
];

function field(
  name: string,
  type: ChassisStorageField['type'] = 'text',
  required = true,
): ChassisStorageField {
  return { name, type, required };
}
