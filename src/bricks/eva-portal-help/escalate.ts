export type Escalation = { required: boolean; reason: string | null };
const HUMAN = /\b(refund|chargeback|failed payment|personal data|account compromised|security|delete account|legal|complaint)\b/i;
export function escalationFor(question: string, unanswered: boolean): Escalation {
  if (HUMAN.test(question)) return { required: true, reason: 'Requires a person to review an account or consequential action.' };
  if (unanswered) return { required: true, reason: 'No verified, role-authorized instructions in this portal knowledge manifest.' };
  return { required: false, reason: null };
}
