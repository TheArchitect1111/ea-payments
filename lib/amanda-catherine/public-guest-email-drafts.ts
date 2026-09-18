/** Drafts only. No scheduler, automatic sends or guest approval is enabled here.
 * Stages align with LIFELINE_GUEST_WORKFLOW in config.ts.
 * Source: guest application and LIFELINE MEDIA MINISTRY Partnership Kit.
 */
export const AMANDA_GUEST_EMAIL_DRAFTS = [
  {
    id: 'confirmation', workflowStage: 'guest-information',
    trigger: 'Application is durably received; not merely validated in preview.',
    subject: 'Your LIFELINE inquiry has been received',
    body: 'Hi [Guest First Name],\n\nThank you for sharing your story with LIFELINE MEDIA MINISTRY. Amanda will review your proposed theme, message and audience value, then contact you about the next step. This confirms receipt and does not confirm an interview booking.\n\nAmanda Catherine',
  },
  {
    id: 'preparation', workflowStage: 'interview-scheduled',
    trigger: 'Guest approved, consent completed and interview time confirmed.',
    subject: 'Preparing for your LIFELINE conversation',
    body: 'Hi [Guest First Name],\n\nYour confirmed interview details are [Confirmed Date, Time and Time Zone] and [Confirmed Location or Meeting Link]. We will focus on [Approved Theme] and [Approved Questions]. Please confirm your public name and links to your work, and let Amanda know any sensitive or off-limit topics before recording.\n\nAmanda Catherine',
  },
  {
    id: 'follow-up', workflowStage: 'production',
    trigger: 'Recording is complete; owner approves follow-up.',
    subject: 'Thank you for your LIFELINE conversation',
    body: 'Hi [Guest First Name],\n\nThank you for sharing your story. Please confirm the public links and next action you would like associated with your interview. Amanda will advise you when the feature is published.\n\nAmanda Catherine',
  },
  {
    id: 'interview-published', workflowStage: 'media-package-delivery',
    trigger: 'Owner approves publication and the public episode URL is verified.',
    subject: 'Your LIFELINE interview is live',
    body: 'Hi [Guest First Name],\n\nYour LIFELINE interview is now live: [Verified Episode URL]. Thank you for sharing your story and message. You can share the feature with your community using this link.\n\nAmanda Catherine',
  },
] as const;
