// Amanda storage mappings - preserves existing integrations
// Uses AIRTABLE_PAYMENTS_BASE_ID with fallback appv0YoLIMY45fmDA
// Does NOT assume field existence - schema check validates live

export const AMANDA_TABLES = {
  APPLICATIONS: process.env.AIRTABLE_PORTAL_FORMS_TABLE || 'Portal Form Submissions',
  WAITLIST: process.env.AIRTABLE_AMANDA_WAITLIST_TABLE || 'amanda_waitlist',
  CREATIVE_STUDIO: process.env.AIRTABLE_CREATIVE_STUDIO_TABLE || 'Creative Studio',
  CLIENT_RECORDS: process.env.AIRTABLE_CLIENT_RECORDS_TABLE_ID || 'Client Records',
} as const;

export const AMANDA_BASE_ID = process.env.AIRTABLE_AMANDA_BASE_ID || process.env.AIRTABLE_PAYMENTS_BASE_ID || 'appv0YoLIMY45fmDA';

export type AmandaSubmissionType = 'application' | 'waitlist' | 'payment' | 'client-access';

export function getTableForType(type: AmandaSubmissionType, formId?: string): string {
  switch(type) {
    case 'waitlist': return AMANDA_TABLES.WAITLIST;
    case 'payment': return AMANDA_TABLES.CREATIVE_STUDIO;
    case 'client-access': return AMANDA_TABLES.CLIENT_RECORDS;
    case 'application':
    default:
      // training-application, lifeline-media-guest, partner-vendor-application etc -> Portal Form Submissions
      return AMANDA_TABLES.APPLICATIONS;
  }
}
