/** Cigar-industry CTP preview pack. No persistence, finance estimates or vendor messages. */
import bank from './questions.json';

export type Role = 'brand' | 'lounge' | 'distributor' | 'unsure' | 'other';
export type CigarAnswer = { selected: string[]; detail: string };
export type CigarAnswers = Record<string, CigarAnswer>;
export type CigarQuestion = {
  id: string;
  section: string;
  path: string;
  question: string;
  helper: string;
  type: 'single' | 'multi';
  options: { id: string; label: string }[];
  detailsPrompt: string;
  exclusiveOptionIds: string[];
};

export const CIGAR_QUESTIONS: CigarQuestion[] = bank.questions as CigarQuestion[];
export const CIGAR_PACK_VERSION = bank.version;

export function primaryRole(answers: CigarAnswers): Role {
  const candidate = answers.C01?.selected?.[0];
  return candidate === 'brand' || candidate === 'lounge' || candidate === 'distributor' || candidate === 'other'
    ? candidate
    : 'unsure';
}

export function visibleCigarQuestions(answers: CigarAnswers): CigarQuestion[] {
  const role = primaryRole(answers);
  return CIGAR_QUESTIONS.filter(q => q.path === 'all' || q.path === role);
}

export function updateCigarChoice(
  question: CigarQuestion,
  before: CigarAnswer | undefined,
  optionId: string,
): CigarAnswer {
  if (!question.options.some(option => option.id === optionId)) throw new Error('Unknown answer choice');
  const current = before ?? { selected: [], detail: '' };
  if (question.type === 'single') return { ...current, selected: [optionId] };
  // Other is additive. A note never changes selected answers.
  const exclusive = question.exclusiveOptionIds.filter(id => id !== 'other');
  if (exclusive.includes(optionId)) return { ...current, selected: [optionId] };
  const selected = current.selected.includes(optionId)
    ? current.selected.filter(id => id !== optionId)
    : [...current.selected.filter(id => !exclusive.includes(id)), optionId];
  return { ...current, selected: question.id === 'C02' ? selected.slice(0, 3) : selected };
}

export type Finding = { title: string; explanation: string; questions: string[]; proposedCapability: string; status: 'existing-candidate' | 'new-development' };

export function buildCigarPreview(answers: CigarAnswers): { role: Role; findings: Finding[]; financialStatus: 'not-quantified'; caution: string } {
  const chosen = (id: string, ...values: string[]) => values.some(value => answers[id]?.selected.includes(value));
  const findings: Finding[] = [];
  const add = (condition: boolean, title: string, explanation: string, questions: string[], proposedCapability: string, status: Finding['status']) => {
    if (condition) findings.push({ title, explanation, questions, proposedCapability, status });
  };
  add(
    chosen('C02', 'reporting') || chosen('C03', 'monthly', 'on_request', 'fragmented') || chosen('C04', 'report_requests') || chosen('C07', 'irregular_email', 'no_regular') || chosen('B03', 'late', 'asked', 'incomplete', 'none') || chosen('D04', 'requested', 'delayed', 'no_reports'),
    'Make reporting predictable',
    'Report timing or visibility deserves closer review. EA can explore report tracking, overdue reminders, and reconciliation.',
    ['C02', 'C03', 'C04', 'C07', 'B03', 'D04'],
    'Report Accountability & Reconciliation', 'new-development',
  );
  add(
    chosen('C02', 'stock') || chosen('C05', 'stock_problems') || chosen('B04', 'unexplained', 'damaged', 'free_goods') || chosen('L02', 'single_box', 'unexplained', 'damage') || chosen('D05', 'unexplained', 'count', 'receiving'),
    'Make inventory movements traceable',
    'We should verify stock ownership, package conversions and dated non-sale movements before proposing adjustments.',
    ['C02', 'C05', 'B04', 'L02', 'D05'],
    'Inventory Intelligence', 'new-development',
  );
  add(
    chosen('C04', 'data_entry', 'orders', 'collections', 'inventory_count', 'customers', 'scheduling') || chosen('C05', 'staff_time') || chosen('L05', 'closing', 'inventory', 'suppliers') || chosen('D01', 'manual'),
    'Recover owner and team attention',
    'Repeated work may be a capacity opportunity. We would establish a time baseline together before estimating value.',
    ['C04', 'C05', 'L05', 'D01'],
    'Capacity Workflow Design', 'new-development',
  );
  add(
    chosen('C02', 'cash', 'sales') || chosen('C05', 'cash_delayed', 'overspending', 'missed_sales') || chosen('B06', 'unpaid', 'settlement', 'charges') || chosen('L06', 'sku_profit', 'cash') || chosen('D06', 'invoices', 'settlements'),
    'Clarify financial performance',
    'Separate invoices, deposits, deductions, profit and inventory working capital. These are not interchangeable.',
    ['C02', 'C05', 'B06', 'L06', 'D06'],
    'Dashboard + Reports (integration review required)', 'existing-candidate',
  );
  add(
    chosen('C04', 'report_requests', 'customers') || chosen('C07', 'irregular_email', 'phone_text', 'no_regular') || chosen('L07', 'late', 'unclear') || chosen('D07', 'communications'),
    'Organize partner communications',
    'A dedicated, authorized vendor inbox could manage routine report acknowledgments and capped follow-ups. Sending remains disabled until separately approved.',
    ['C04', 'C07', 'L07', 'D07'],
    'Vendor Inbox & Limited Replies', 'new-development',
  );
  add(
    chosen('L04', 'manual', 'locker', 'inactive') || chosen('L05', 'events'),
    'Simplify lounge relationships and events',
    'We can review memberships, lockers, events and owner visibility without requiring you to replace a working POS.',
    ['L04', 'L05'],
    'People / Calendar / Events (review integration)', 'existing-candidate',
  );
  add(
    chosen('D01', 'email', 'mixed', 'manual') || chosen('D03', 'backorders', 'incorrect', 'manual_updates') || chosen('B07', 'retailer_portal'),
    'Strengthen wholesale order handoffs',
    'A retailer-order intake and fulfillment exception workflow may reduce manual reconciliation after scope and permissions are confirmed.',
    ['D01', 'D03', 'B07'],
    'Wholesale Orders & Fulfillment Exceptions', 'new-development',
  );
  return {
    role: primaryRole(answers),
    findings: findings.slice(0, 3),
    financialStatus: 'not-quantified',
    caution: 'No annual dollar value has been calculated. Qualitative answers and unverified notes are not evidence of revenue, profit or savings.',
  };
}