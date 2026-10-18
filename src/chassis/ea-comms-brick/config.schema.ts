import { z } from 'zod';

export const EmailTemplateSchema = z.object({
  subject: z.string().trim().min(1),
  html: z.string().trim().min(1),
}).strict();

export const CommsConfigSchema = z.object({
  fromAddress: z.string().trim().email(),
  replyTo: z.string().trim().email(),
  provider: z.literal('resend'),
  eventType: z.enum(['class', 'golf_tourney', 'gala', 'workshop']),
  templates: z.object({
    registration_confirmation: EmailTemplateSchema,
    payment_receipt: EmailTemplateSchema,
    event_reminder: EmailTemplateSchema,
    waitlist_update: EmailTemplateSchema,
    sponsor_or_guest_thankyou: EmailTemplateSchema,
    support_reply_approved: EmailTemplateSchema,
  }).strict(),
}).strict();

export const VerifiedContactSchema = z.object({
  email: z.string().trim().email(),
  verified: z.literal(true),
}).passthrough();

export type CommsConfig = z.infer<typeof CommsConfigSchema>;
export type VerifiedContact = z.infer<typeof VerifiedContactSchema>;
