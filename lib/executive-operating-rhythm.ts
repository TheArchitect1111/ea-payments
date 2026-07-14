import { fromPulseEventRow } from '@ea/portal-chassis/platform-events';
import type { PlatformEvent } from '@ea/portal-chassis/platform-events';
import {
  getAllClientRecords,
  getProposalsWithAssessments,
  type ClientRecordSummary,
  type ProposalWithAssessment,
} from '@/lib/airtable';
import {
  buildCustomerOperatingSystem,
  type CustomerOperatingRecord,
} from '@/lib/customer-operating-system';
import { listCanonicalPulseEvents, type StoredPulseEvent } from '@/lib/pulse-event-store';

export type HealthScoreName =
  | 'Revenue Health'
  | 'Customer Health'
  | 'Operational Health'
  | 'Automation Health'
  | 'Growth Health';

export type HealthScoreStatus = 'Strong' | 'Watch' | 'At Risk';
export type HealthTrend = 'Improving' | 'Stable' | 'Declining' | 'Unknown';
export type OperatingRhythmCadence = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';

export interface DailyBriefMetric {
  label: string;
  value: number;
  detail: string;
}

export interface DailyExecutiveBrief {
  generatedAt: string;
  yesterday: DailyBriefMetric[];
  needsAttention: DailyBriefMetric[];
  todaysPriorities: {
    highestPriorityCustomer: string;
    highestPriorityOpportunity: string;
    highestPriorityOperationalIssue: string;
    highestPriorityRevenueOpportunity: string;
    highestPriorityExecutiveDecision: string;
  };
}

export interface BusinessHealthScore {
  name: HealthScoreName;
  score: number;
  status: HealthScoreStatus;
  trend: HealthTrend;
  thresholds: string;
  factors: string[];
  recommendedAction: string;
  owner: string;
}

export interface EventIntelligenceDefinition {
  event: string;
  owner: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  businessImpact: string;
  nextAction: string;
  executiveVisibility: string;
}

export interface OwnerAccountabilityItem {
  workflow: string;
  owner: string;
  dueDate: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  currentStatus: string;
  nextAction: string;
  escalationPath: string;
}

export interface OperatingRhythmCalendarItem {
  cadence: OperatingRhythmCadence;
  rhythm: string;
  owner: string;
  purpose: string;
  source: string;
  output: string;
}

export interface FeatureCompletionStandardItem {
  item: string;
  requirement: string;
}

export interface ExecutiveOperatingRhythm {
  generatedAt: string;
  dailyBrief: DailyExecutiveBrief;
  healthScores: BusinessHealthScore[];
  eventIntelligence: EventIntelligenceDefinition[];
  ownerAccountability: OwnerAccountabilityItem[];
  operatingCalendar: OperatingRhythmCalendarItem[];
  founderDependencies: OwnerAccountabilityItem[];
  selfOperatingRoadmap: string[];
  featureCompletionStandard: FeatureCompletionStandardItem[];
  definitionOfDone: string[];
}

const DAY_MS = 86_400_000;

function nowIso(): string {
  return new Date().toISOString();
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isYesterday(value?: string): boolean {
  const date = parseDate(value);
  if (!date) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return date >= start && date < end;
}

function scoreStatus(score: number): HealthScoreStatus {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Watch';
  return 'At Risk';
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function revenueAmount(proposals: ProposalWithAssessment[]): number {
  return proposals.reduce((sum, proposal) => {
    const paid = /paid|approved/i.test(`${proposal.paymentStatus ?? ''} ${proposal.status}`);
    return sum + (paid ? proposal.recommendedFee || 0 : 0);
  }, 0);
}

function proposalWaiting(proposal: ProposalWithAssessment): boolean {
  return /pending|review|draft|waiting/i.test(proposal.status);
}

function paymentIssue(event: StoredPulseEvent): boolean {
  return /payment\.failed|invoice\.failed|past_due|unpaid|canceled|cancelled/i.test(event.type);
}

function automationIssue(event: StoredPulseEvent): boolean {
  return /failed|blocked|critical|webhook|automation/i.test(`${event.type} ${event.title} ${event.detail ?? ''}`);
}

function metric(label: string, value: number, detail: string): DailyBriefMetric {
  return { label, value, detail };
}

function firstOrNone<T>(items: T[], map: (item: T) => string, fallback = 'No current signal.'): string {
  return items[0] ? map(items[0]) : fallback;
}

function buildDailyBrief(input: {
  generatedAt: string;
  clients: ClientRecordSummary[];
  proposals: ProposalWithAssessment[];
  pulse: StoredPulseEvent[];
  customers: CustomerOperatingRecord[];
}): DailyExecutiveBrief {
  const { generatedAt, clients, proposals, pulse, customers } = input;
  const yesterdayPulse = pulse.filter((event) => isYesterday(event.at));
  const yesterdayClients = clients.filter((client) => isYesterday(client.createdTime || client.paymentReceivedAt));
  const yesterdayProposals = proposals.filter((proposal) => isYesterday(proposal.createdTime || proposal.dateApproved));
  const yesterdayPayments = clients.filter((client) => isYesterday(client.paymentReceivedAt || client.paymentDate));
  const atRisk = customers.filter((customer) => customer.health.status === 'At Risk');
  const renewal = customers.filter((customer) => customer.renewalStatus === 'Due Soon' || customer.renewalStatus === 'At Risk');
  const expansion = customers.filter((customer) => customer.expansionOpportunity !== 'None');
  const stalled = customers.filter((customer) => customer.ageDays !== null && customer.ageDays > 7 && customer.client.onboardingStatus !== 'Complete');
  const failedPayments = pulse.filter(paymentIssue);
  const automationFailures = pulse.filter(automationIssue);
  const delayedProposals = proposals.filter(proposalWaiting);

  return {
    generatedAt,
    yesterday: [
      metric('New Leads', yesterdayClients.filter((client) => !client.amountPaid).length, 'Client Records created yesterday without payment.'),
      metric('Assessments', yesterdayPulse.filter((event) => event.type === 'assessment.submitted').length, 'Pulse assessment submissions recorded yesterday.'),
      metric('Proposals', yesterdayProposals.length, 'Proposal records created or approved yesterday.'),
      metric('Payments', yesterdayPayments.length, 'Client Records with payment timestamps yesterday.'),
      metric('Revenue', Math.round(yesterdayPayments.reduce((sum, client) => sum + (client.amountPaid || 0), 0)), 'Revenue from Client Records payment amounts yesterday.'),
      metric('Portal Provisioning', yesterdayPulse.filter((event) => event.type === 'portal.provisioned').length, 'Portal provisioning events recorded yesterday.'),
      metric('First Value Achieved', yesterdayPulse.filter((event) => /first.value|learning.completed|customer.success/i.test(event.type)).length, 'First value or success events recorded yesterday.'),
      metric('Learning Completed', yesterdayPulse.filter((event) => event.type === 'learning.completed').length, 'Learning completion events recorded yesterday.'),
      metric('Renewals', yesterdayPulse.filter((event) => event.type === 'customer.renewal_due').length, 'Renewal events recorded yesterday.'),
      metric('Referrals', yesterdayPulse.filter((event) => event.type === 'customer.referral_requested').length, 'Referral events recorded yesterday.'),
    ],
    needsAttention: [
      metric('Stalled onboarding', stalled.length, 'Customers past first-week target without onboarding complete.'),
      metric('Failed automations', automationFailures.length, 'Pulse events that indicate blocked, failed, or critical automation.'),
      metric('Failed payments', failedPayments.length, 'Payment or subscription failure signals.'),
      metric('Proposal delays', delayedProposals.length, 'Proposals still pending, draft, waiting, or in review.'),
      metric('At-risk customers', atRisk.length, 'Customer Operating System health below threshold.'),
      metric('Expiring renewals', renewal.length, 'Customers in renewal watch or renewal risk.'),
      metric('Support escalations', pulse.filter((event) => /support|guide\.escalated|enhancement/i.test(event.type)).length, 'Support and escalation Pulse events.'),
    ],
    todaysPriorities: {
      highestPriorityCustomer: firstOrNone(customers, (customer) => `${customer.client.clientName || customer.client.organization || customer.client.email}: ${customer.nextAction}`),
      highestPriorityOpportunity: firstOrNone(expansion, (customer) => `${customer.client.clientName || customer.client.organization}: ${customer.expansionOpportunity}`),
      highestPriorityOperationalIssue: firstOrNone(automationFailures, (event) => event.title),
      highestPriorityRevenueOpportunity: delayedProposals[0]
        ? `${delayedProposals[0].businessName || delayedProposals[0].contactName}: ${delayedProposals[0].status}`
        : 'No delayed proposal revenue is currently surfaced.',
      highestPriorityExecutiveDecision: firstOrNone(
        pulse.filter((event) => event.priority === 'critical' || event.priority === 'high'),
        (event) => event.title,
      ),
    },
  };
}

function buildHealthScores(input: {
  customers: CustomerOperatingRecord[];
  proposals: ProposalWithAssessment[];
  pulse: StoredPulseEvent[];
}): BusinessHealthScore[] {
  const { customers, proposals, pulse } = input;
  const paidRevenue = revenueAmount(proposals);
  const pendingRevenue = proposals.filter(proposalWaiting).reduce((sum, proposal) => sum + (proposal.recommendedFee || 0), 0);
  const failedPayments = pulse.filter(paymentIssue).length;
  const atRiskCustomers = customers.filter((customer) => customer.health.status === 'At Risk').length;
  const avgCustomerHealth = customers.length
    ? customers.reduce((sum, customer) => sum + customer.health.score, 0) / customers.length
    : 70;
  const stalledOnboarding = customers.filter((customer) => customer.ageDays !== null && customer.ageDays > 7 && customer.client.onboardingStatus !== 'Complete').length;
  const automationFailures = pulse.filter(automationIssue).length;
  const expansion = customers.filter((customer) => customer.expansionOpportunity !== 'None').length;
  const referrals = customers.filter((customer) => customer.referralOpportunity !== 'None').length;

  const revenueScore = clampScore(78 + Math.min(12, paidRevenue / 1000) - failedPayments * 12 - Math.min(18, pendingRevenue / 5000));
  const customerScore = clampScore(avgCustomerHealth - atRiskCustomers * 8);
  const operationalScore = clampScore(82 - stalledOnboarding * 12 - pulse.filter((event) => event.type === 'onboarding.blocked').length * 15);
  const automationScore = clampScore(88 - automationFailures * 10);
  const growthScore = clampScore(62 + expansion * 7 + referrals * 7 + proposals.filter((proposal) => /approved/i.test(proposal.status)).length * 2);

  return [
    {
      name: 'Revenue Health',
      score: revenueScore,
      status: scoreStatus(revenueScore),
      trend: pendingRevenue > 0 ? 'Stable' : 'Unknown',
      thresholds: 'Strong 80+, Watch 60-79, At Risk below 60.',
      factors: [`Paid revenue signal: $${Math.round(paidRevenue).toLocaleString()}`, `Pending revenue signal: $${Math.round(pendingRevenue).toLocaleString()}`, `Failed payment signals: ${failedPayments}`],
      recommendedAction: pendingRevenue > 0 ? 'Resolve delayed proposals and protect checkout flow.' : 'Keep payment and proposal flow monitored.',
      owner: process.env.ADMIN_NOTIFICATION_EMAIL ?? 'Revenue owner not configured',
    },
    {
      name: 'Customer Health',
      score: customerScore,
      status: scoreStatus(customerScore),
      trend: atRiskCustomers > 0 ? 'Declining' : 'Stable',
      thresholds: 'Strong 80+, Watch 60-79, At Risk below 60.',
      factors: [`Average customer health: ${Math.round(avgCustomerHealth)}`, `At-risk customers: ${atRiskCustomers}`, `Customers measured: ${customers.length}`],
      recommendedAction: atRiskCustomers > 0 ? 'Open Customer Success Dashboard and resolve the highest-risk customer first.' : 'Continue customer health review rhythm.',
      owner: process.env.CUSTOMER_SUCCESS_OWNER_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? 'Customer success owner not configured',
    },
    {
      name: 'Operational Health',
      score: operationalScore,
      status: scoreStatus(operationalScore),
      trend: stalledOnboarding > 0 ? 'Declining' : 'Stable',
      thresholds: 'Strong 80+, Watch 60-79, At Risk below 60.',
      factors: [`Stalled onboarding: ${stalledOnboarding}`, `Blocked onboarding events: ${pulse.filter((event) => event.type === 'onboarding.blocked').length}`],
      recommendedAction: stalledOnboarding > 0 ? 'Assign owner and next communication for every stalled onboarding record.' : 'Keep daily operating review cadence.',
      owner: process.env.OPERATIONS_OWNER_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? 'Operations owner not configured',
    },
    {
      name: 'Automation Health',
      score: automationScore,
      status: scoreStatus(automationScore),
      trend: automationFailures > 0 ? 'Declining' : 'Stable',
      thresholds: 'Strong 80+, Watch 60-79, At Risk below 60.',
      factors: [`Automation failure signals: ${automationFailures}`, `Pulse events reviewed: ${pulse.length}`],
      recommendedAction: automationFailures > 0 ? 'Review failed automation events and confirm retry/recovery owner.' : 'Continue automation review rhythm.',
      owner: process.env.OPERATIONS_OWNER_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? 'Automation owner not configured',
    },
    {
      name: 'Growth Health',
      score: growthScore,
      status: scoreStatus(growthScore),
      trend: expansion + referrals > 0 ? 'Improving' : 'Stable',
      thresholds: 'Strong 80+, Watch 60-79, At Risk below 60.',
      factors: [`Expansion opportunities: ${expansion}`, `Referral opportunities: ${referrals}`, `Approved proposals: ${proposals.filter((proposal) => /approved/i.test(proposal.status)).length}`],
      recommendedAction: expansion + referrals > 0 ? 'Review healthy customers for expansion/referral next steps.' : 'Create more qualified opportunities through assessment and follow-up rhythm.',
      owner: process.env.GROWTH_OWNER_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? 'Growth owner not configured',
    },
  ];
}

export const EVENT_INTELLIGENCE_MATRIX: EventIntelligenceDefinition[] = [
  ['Lead Created', 'Sales', 'Medium', 'New pipeline entered the system.', 'Qualify or route to assessment.', 'Visible when Pulse or Client Records create a lead signal.'],
  ['Assessment Completed', 'Sales', 'High', 'A prospect has declared operational need.', 'Review score and proposal recommendation.', 'Visible through assessment.submitted.'],
  ['Proposal Approved', 'Sales', 'High', 'Revenue can move to commitment.', 'Send proposal and monitor checkout.', 'Visible through proposal.approved.'],
  ['Proposal Waiting', 'Sales', 'High', 'Revenue is delayed.', 'Approve, reject, or request discovery.', 'Visible through pending proposal status.'],
  ['Payment Received', 'Finance', 'High', 'Customer is ready for delivery.', 'Confirm provisioning and onboarding.', 'Visible through payment.received.'],
  ['Payment Failed', 'Finance', 'Critical', 'Revenue and service continuity are at risk.', 'Send recovery path and monitor retry.', 'Visible through payment failure signals.'],
  ['Portal Provisioned', 'Operations', 'High', 'Customer can access value.', 'Confirm first login.', 'Visible through portal.provisioned.'],
  ['First Login', 'Customer Success', 'High', 'Customer has entered the experience.', 'Guide first-value milestone.', 'Visible through portal.login.'],
  ['First Value', 'Customer Success', 'High', 'Customer has received measurable value.', 'Record success and start adoption rhythm.', 'Visible through customer success milestones.'],
  ['Learning Started', 'Training', 'Medium', 'Customer is adopting system knowledge.', 'Nudge completion.', 'Visible through learning events.'],
  ['Learning Completed', 'Training', 'Medium', 'Customer has completed training milestone.', 'Celebrate and unlock next milestone.', 'Visible through learning.completed.'],
  ['Support Issue', 'Support', 'High', 'Customer trust may be at risk.', 'Assign owner and due date.', 'Visible through support/enhancement events.'],
  ['Customer At Risk', 'Customer Success', 'Critical', 'Retention or trust is at risk.', 'Call customer and remove blocker.', 'Visible through customer.health.changed.'],
  ['Renewal Due', 'Customer Success', 'High', 'Recurring revenue requires action.', 'Schedule renewal review.', 'Visible through customer.renewal_due.'],
  ['Expansion Opportunity', 'Growth', 'Medium', 'Healthy customer may buy more.', 'Review fit and propose next outcome.', 'Visible through expansion.opportunity.'],
  ['Referral Opportunity', 'Growth', 'Medium', 'Advocate can start another revenue cycle.', 'Ask for referral or testimonial.', 'Visible through customer.referral_requested.'],
  ['Automation Failed', 'Operations', 'Critical', 'Manual rescue may be required.', 'Review retry/recovery and notify owner.', 'Visible through failed/blocked Pulse events.'],
  ['Deployment Failed', 'Operations', 'Critical', 'Production reliability may be at risk.', 'Stabilize deployment and communicate impact.', 'Visible through Operations Center/Pulse.'],
].map(([event, owner, priority, businessImpact, nextAction, executiveVisibility]) => ({
  event,
  owner,
  priority: priority as EventIntelligenceDefinition['priority'],
  businessImpact,
  nextAction,
  executiveVisibility,
}));

function buildOwnerAccountability(input: {
  customers: CustomerOperatingRecord[];
  proposals: ProposalWithAssessment[];
  pulse: StoredPulseEvent[];
}): OwnerAccountabilityItem[] {
  const { customers, proposals, pulse } = input;
  const items: OwnerAccountabilityItem[] = [];

  for (const customer of customers.slice(0, 10)) {
    if (customer.risk === 'low' && customer.renewalStatus === 'Not Due' && customer.expansionOpportunity === 'None') continue;
    items.push({
      workflow: `${customer.client.clientName || customer.client.organization || customer.client.email} customer rhythm`,
      owner: customer.owner,
      dueDate: customer.dueDate || 'Due date not set',
      priority: customer.risk === 'critical' ? 'Critical' : customer.risk === 'high' ? 'High' : 'Medium',
      currentStatus: `${customer.lifecycleStage} - ${customer.health.status}`,
      nextAction: customer.nextAction,
      escalationPath: 'Escalate to executive if owner or due date is missing.',
    });
  }

  for (const proposal of proposals.filter(proposalWaiting).slice(0, 6)) {
    items.push({
      workflow: `${proposal.businessName || proposal.contactName || proposal.proposalId} proposal`,
      owner: process.env.SALES_OWNER_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? 'Sales owner not configured',
      dueDate: proposal.createdTime || 'Due date not set',
      priority: 'High',
      currentStatus: proposal.status,
      nextAction: 'Approve, reject, or request discovery.',
      escalationPath: 'Escalate to executive if proposal waits more than one business day.',
    });
  }

  for (const event of pulse.filter(automationIssue).slice(0, 5)) {
    items.push({
      workflow: event.title,
      owner: process.env.OPERATIONS_OWNER_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? 'Operations owner not configured',
      dueDate: event.at,
      priority: event.priority === 'critical' ? 'Critical' : event.priority === 'high' ? 'High' : 'Medium',
      currentStatus: event.type,
      nextAction: event.detail || 'Review automation recovery path.',
      escalationPath: 'Escalate to executive if recovery is not confirmed today.',
    });
  }

  return items.slice(0, 18);
}

export const BUSINESS_OPERATING_CALENDAR: OperatingRhythmCalendarItem[] = [
  { cadence: 'Daily', rhythm: 'Executive Brief', owner: 'CEO', purpose: 'What happened, what matters, what should happen next.', source: 'Pulse + Mission Control', output: 'Daily Executive Brief' },
  { cadence: 'Daily', rhythm: 'Customer Health Review', owner: 'Customer Success', purpose: 'Identify who needs help and who is thriving.', source: 'Customer Operating System', output: 'Customer next actions' },
  { cadence: 'Daily', rhythm: 'Automation Review', owner: 'Operations', purpose: 'Catch failures, retries, and manual rescue needs.', source: 'Pulse + webhook logs', output: 'Automation recovery list' },
  { cadence: 'Daily', rhythm: 'Revenue Review', owner: 'Sales/Finance', purpose: 'Protect proposals, payment, failed payment, and pending revenue.', source: 'Proposals + Stripe signals', output: 'Revenue action list' },
  { cadence: 'Weekly', rhythm: 'Pipeline Review', owner: 'Sales', purpose: 'Move leads, assessments, and proposals forward.', source: 'Assessments + Proposals', output: 'Pipeline decisions' },
  { cadence: 'Weekly', rhythm: 'Customer Success Review', owner: 'Customer Success', purpose: 'Confirm first value, adoption, support, and health.', source: 'Customer Operating System', output: 'Success plan updates' },
  { cadence: 'Weekly', rhythm: 'Operational Review', owner: 'Operations', purpose: 'Confirm provisioning, integrations, domains, and automations.', source: 'Operations Center', output: 'Operational fixes' },
  { cadence: 'Monthly', rhythm: 'Business Performance Review', owner: 'CEO', purpose: 'Review revenue, customer health, automation confidence, and growth.', source: 'Executive Operating Rhythm', output: 'Monthly priorities' },
  { cadence: 'Monthly', rhythm: 'Renewal Review', owner: 'Customer Success', purpose: 'Identify upcoming renewals and retention risk.', source: 'Customer Operating System', output: 'Renewal tasks' },
  { cadence: 'Monthly', rhythm: 'Expansion Review', owner: 'Growth', purpose: 'Identify healthy customers ready for more value.', source: 'Customer Operating System', output: 'Expansion opportunities' },
  { cadence: 'Quarterly', rhythm: 'Strategic Review', owner: 'CEO', purpose: 'Confirm business direction and operating constraints.', source: 'Executive Intelligence', output: 'Strategic decisions' },
  { cadence: 'Quarterly', rhythm: 'Platform Health Review', owner: 'Operations', purpose: 'Review resilience, monitoring, recovery, and scale readiness.', source: 'Operations Center', output: 'Platform hardening plan' },
];

export const FEATURE_COMPLETION_STANDARD: FeatureCompletionStandardItem[] = [
  ['Entry Point', 'The feature has one clear user-facing or system-facing entry point.'],
  ['Business Purpose', 'The feature states the business answer it supports.'],
  ['Workflow', 'The feature maps to an approved EA workflow.'],
  ['Lifecycle Stage', 'The feature identifies which customer/business lifecycle stage it affects.'],
  ['Owner', 'The feature has a primary owner and escalation owner.'],
  ['Automation Trigger', 'The feature defines what starts automation and what happens if it fails.'],
  ['Emails', 'Required customer/admin communications are defined.'],
  ['Mission Control Events', 'Executive-visible events are defined.'],
  ['Pulse Events', 'Canonical Pulse event types are defined.'],
  ['Customer Success Milestones', 'Customer value milestones are defined.'],
  ['Health Indicators', 'Health, risk, or confidence signals are defined.'],
  ['Renewal Impact', 'Retention or renewal impact is defined.'],
  ['Expansion Impact', 'Expansion/referral impact is defined.'],
  ['Executive Visibility', 'The feature explains how leadership will see status, risk, and next action.'],
  ['Operational Runbook', 'The recovery/operation steps are documented.'],
  ['Monitoring', 'Success/failure monitoring is defined.'],
  ['Recovery Strategy', 'Manual and automated recovery paths are defined.'],
].map(([item, requirement]) => ({ item, requirement }));

export const DEFINITION_OF_DONE = FEATURE_COMPLETION_STANDARD.map(
  (item) => `${item.item}: ${item.requirement}`,
);

function buildRoadmap(scores: BusinessHealthScore[], ownerItems: OwnerAccountabilityItem[]): string[] {
  const roadmap: string[] = [];
  for (const score of scores.filter((item) => item.status !== 'Strong')) {
    roadmap.push(`${score.name}: ${score.recommendedAction}`);
  }
  if (ownerItems.some((item) => /not configured|Unassigned/i.test(item.owner))) {
    roadmap.push('Configure named owners for Sales, Customer Success, Operations, Finance, and Growth.');
  }
  roadmap.push('Convert scheduled communication rhythm into cron/queue-driven automation once telemetry is complete.');
  roadmap.push('Add learning completion, support status, renewal date, and testimonial/referral source fields as authoritative telemetry.');
  roadmap.push('Route every failed automation into Pulse with owner, due date, retry status, and recovery path.');
  return [...new Set(roadmap)].slice(0, 10);
}

export function buildExecutiveOperatingRhythm(input: {
  clients: ClientRecordSummary[];
  proposals: ProposalWithAssessment[];
  pulse: StoredPulseEvent[];
}): ExecutiveOperatingRhythm {
  const generatedAt = nowIso();
  const customers = buildCustomerOperatingSystem(input.clients);
  const dailyBrief = buildDailyBrief({ generatedAt, ...input, customers });
  const healthScores = buildHealthScores({ customers, proposals: input.proposals, pulse: input.pulse });
  const ownerAccountability = buildOwnerAccountability({ customers, proposals: input.proposals, pulse: input.pulse });
  const founderDependencies = ownerAccountability.filter((item) => /not configured|Unassigned|missing/i.test(`${item.owner} ${item.dueDate}`));

  return {
    generatedAt,
    dailyBrief,
    healthScores,
    eventIntelligence: EVENT_INTELLIGENCE_MATRIX,
    ownerAccountability,
    operatingCalendar: BUSINESS_OPERATING_CALENDAR,
    founderDependencies,
    selfOperatingRoadmap: buildRoadmap(healthScores, ownerAccountability),
    featureCompletionStandard: FEATURE_COMPLETION_STANDARD,
    definitionOfDone: DEFINITION_OF_DONE,
  };
}

export async function getExecutiveOperatingRhythm(): Promise<ExecutiveOperatingRhythm> {
  const [clients, proposals, pulse] = await Promise.all([
    getAllClientRecords(),
    getProposalsWithAssessments(),
    listCanonicalPulseEvents(150),
  ]);
  return buildExecutiveOperatingRhythm({ clients, proposals, pulse });
}

export function operatingRhythmEvents(rhythm: ExecutiveOperatingRhythm): PlatformEvent[] {
  const organizationId = process.env.EA_INTERNAL_ORG_ID ?? 'ea';
  const events = rhythm.healthScores
    .filter((score) => score.status !== 'Strong')
    .map((score, index) =>
      fromPulseEventRow(
        {
          id: `rhythm-health-${index}-${rhythm.generatedAt}`,
          organizationId,
          eventType: 'business.health.changed',
          title: `${score.name}: ${score.status}`,
          summary: `${score.score}/100 - ${score.recommendedAction}`,
          priority: score.status === 'At Risk' ? 88 : 66,
          module: 'executive-rhythm',
          actionLabel: 'Open Morning Brief',
          actionUrl: '/admin/master#operating-rhythm',
          createdAt: rhythm.generatedAt,
          metadata: {
            whyRecommended: score.factors.join(' '),
            owner: score.owner,
            healthScore: score.score,
          },
        },
        `rhythm-health-${index}-${rhythm.generatedAt}`,
      ),
    );

  const attention = rhythm.ownerAccountability.slice(0, 6).map((item, index) =>
    fromPulseEventRow(
      {
        id: `rhythm-owner-${index}-${rhythm.generatedAt}`,
        organizationId,
        eventType: 'executive.action_required',
        title: `${item.workflow}: ${item.nextAction}`,
        summary: `Owner: ${item.owner}. Due: ${item.dueDate}. Status: ${item.currentStatus}.`,
        priority: item.priority === 'Critical' ? 94 : item.priority === 'High' ? 80 : 58,
        module: 'executive-rhythm',
        actionLabel: 'Open Morning Brief',
        actionUrl: '/admin/master#next-move',
        createdAt: rhythm.generatedAt,
        metadata: {
          whyRecommended: item.nextAction,
          owner: item.owner,
          escalationPath: item.escalationPath,
        },
      },
      `rhythm-owner-${index}-${rhythm.generatedAt}`,
    ),
  );

  return [...events, ...attention];
}
