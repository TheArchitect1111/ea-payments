/** This registry contains IDs and data requirements only. All customer wording lives in portal config. */
export const TEMPLATE_REQUIREMENTS = {
  registration_confirmation: ['eventDate', 'eventLink'],
  payment_receipt: ['price', 'receiptLink'],
  event_reminder: ['eventDate', 'eventLink'],
  waitlist_update: ['eventLink'],
  sponsor_or_guest_thankyou: [],
  support_reply_approved: ['approved'],
} as const;

export type CommsTemplateId = keyof typeof TEMPLATE_REQUIREMENTS;

export function isCommsTemplateId(value: string): value is CommsTemplateId {
  return Object.prototype.hasOwnProperty.call(TEMPLATE_REQUIREMENTS, value);
}
