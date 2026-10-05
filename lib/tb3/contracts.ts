import { z } from 'zod';

export const TB3_PORTAL_SLUG = 'tarris';
// Verified from the EA Organizations record, not a client-provided label.
export const TB3_ORGANIZATION_ID = 'recxUohHc16hPk1T3';
export const TB3_PREVIEW_WORKSPACE = 'tb3-preview-20261005';

export const opportunityStages = ['Inbound', 'Discussion', 'Contracted', 'Completed'] as const;
export const opportunityTypes = ['Speaking', 'Appearance', 'Camp/Clinic', 'Brand Partnership', 'Community', 'Other'] as const;
export const budgetRanges = ['$0-1k', '$1k-5k', '$5k-10k', '$10k+', 'In-Kind Community'] as const;
export const calendarTypes = ['Academics', 'Training', 'Opportunity', 'Community'] as const;
export const activityLogTypes = ['Study Hall', 'Tutor', 'Workout', 'Film', 'Nutrition', 'Recovery', 'Community Clinic', 'Mentorship'] as const;

const shortText = z.string().trim().min(1).max(200);
const money = z.number().finite().nonnegative().max(100000000);
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Enter a valid calendar date.');

// Public callers cannot choose status, tenant, earnings, contract, source or outcome.
export const bookingSchema = z.object({
  contact_name: shortText,
  company_name: shortText,
  contact_email: z.string().trim().email().max(320),
  phone: z.string().trim().max(60).default(''),
  type: z.enum(opportunityTypes),
  budget_range: z.enum(budgetRanges),
  date_requested: dateOnly.nullable().default(null),
  vision_answer: z.string().trim().min(1).max(5000),
  message: z.string().trim().max(10000).default(''),
  request_id: z.string().uuid(),
}).strict();

export function valuesCheck(text: string): 'Pass' | 'Fail' | 'Review' {
  // Risk terms take priority even when positive terms are also present.
  if (/\b(gambling|betting|casino|alcohol|liquor|beer|wine|spirits|cannabis|marijuana|thc|cbd|vape|vaping)\b/i.test(text)) return 'Fail';
  if (/\b(youth|education|community|discipline|faith|family)\b/i.test(text)) return 'Pass';
  return 'Review';
}

export const statusSchema = z.object({
  status: z.enum(opportunityStages),
  earnings_amount: money.optional(),
}).strict().refine(value => !['Contracted', 'Completed'].includes(value.status) || value.earnings_amount !== undefined,
  'Enter the agreed earnings amount, including zero for in-kind agreements.');

export const calendarSchema = z.object({
  title: z.string().trim().min(1).max(300),
  type: z.enum(calendarTypes),
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }),
  description: z.string().trim().max(10000).default(''),
  linked_module: z.enum(['Academics', 'Training', 'NIL & Brand', 'Opportunities', 'Community']),
  linked_opportunity_id: z.string().uuid().nullable().default(null),
  earnings_amount: money.nullable().default(null),
  completed: z.boolean().default(false),
}).strict().refine(value => new Date(value.end_time) > new Date(value.start_time), 'End must follow start.');

export const activitySchema = z.object({
  type: z.enum(activityLogTypes),
  module: z.enum(['Academics', 'Training', 'Community']),
  title: z.string().trim().min(1).max(300),
  start_time: z.string().datetime({ offset: true }),
  duration_minutes: z.number().int().min(1).max(1440),
  notes: z.string().trim().max(10000).default(''),
  kids_impacted: z.number().int().min(0).max(100000).default(0),
  subtype: z.enum(['Strength', 'Conditioning', 'Recovery']).nullable().default(null),
  request_id: z.string().uuid(),
}).strict().superRefine((value, context) => {
  const expected = ['Study Hall', 'Tutor'].includes(value.type) ? 'Academics'
    : ['Community Clinic', 'Mentorship'].includes(value.type) ? 'Community' : 'Training';
  if (value.module !== expected) context.addIssue({code: z.ZodIssueCode.custom, message: 'Activity type and module do not match.', path: ['module']});
  if (value.module !== 'Community' && value.kids_impacted !== 0) context.addIssue({code: z.ZodIssueCode.custom, message: 'Kids impacted belongs to community activity.', path: ['kids_impacted']});
});

export function hasTb3Identity(session: { slug?: string; orgId?: string; email?: string; role?: string } | null) {
  return Boolean(session?.slug === TB3_PORTAL_SLUG && session.orgId === TB3_ORGANIZATION_ID && session.email
    && ['owner', 'admin', 'manager', 'staff', 'viewer'].includes(session.role ?? ''));
}
