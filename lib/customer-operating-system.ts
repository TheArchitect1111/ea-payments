import type { ClientRecordSummary } from '@/lib/airtable';
import { fromPulseEventRow } from '@ea/portal-chassis/platform-events';
import type { PlatformEvent } from '@ea/portal-chassis/platform-events';

export type CustomerLifecycleStage =
  | 'Lead'
  | 'Assessment'
  | 'Qualified'
  | 'Proposal'
  | 'Approved'
  | 'Paid'
  | 'Provisioned'
  | 'Onboarding'
  | 'First Value'
  | 'Adoption'
  | 'Active'
  | 'Healthy'
  | 'Expansion'
  | 'Renewal'
  | 'Advocate';

export type CustomerHealthStatus = 'Healthy' | 'Watch' | 'At Risk';
export type CustomerRiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type AutomationMaturity = 'Manual' | 'Semi-Automated' | 'Automated' | 'Autonomous';

export interface CustomerHealthModel {
  score: number;
  status: CustomerHealthStatus;
  confidence: 'High' | 'Medium' | 'Low';
  reasons: string[];
  risks: string[];
}

export interface SuccessMilestone {
  id: string;
  label: string;
  complete: boolean;
  status: 'Complete' | 'Current' | 'Upcoming' | 'At Risk';
  evidence: string;
}

export interface CommunicationRhythmItem {
  cadence: string;
  trigger: string;
  owner: string;
  purpose: string;
  automation: AutomationMaturity;
  successMetric: string;
  dueDate?: string;
  status: 'Complete' | 'Due' | 'Upcoming';
}

export interface CustomerOperatingRecord {
  client: ClientRecordSummary;
  lifecycleStage: CustomerLifecycleStage;
  owner: string;
  ownerSource: string;
  nextSuccessMilestone: string;
  health: CustomerHealthModel;
  milestones: SuccessMilestone[];
  nextCommunication: CommunicationRhythmItem;
  communicationRhythm: CommunicationRhythmItem[];
  learningProgress: number;
  supportStatus: 'Clear' | 'Needs Review' | 'Blocked';
  renewalStatus: 'Not Due' | 'Watch' | 'Due Soon' | 'At Risk';
  expansionOpportunity: 'None' | 'Review' | 'Recommended';
  referralOpportunity: 'None' | 'Eligible' | 'Ask Now';
  nextAction: string;
  dueDate?: string;
  risk: CustomerRiskLevel;
  ageDays: number | null;
  missionControlSummary: string;
}

const DAY_MS = 86_400_000;

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(value: string | undefined, days: number): string | undefined {
  const date = parseDate(value);
  if (!date) return undefined;
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function daysSince(value?: string): number | null {
  const date = parseDate(value);
  if (!date) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / DAY_MS));
}

function scoreToStatus(score: number): CustomerHealthStatus {
  if (score >= 80) return 'Healthy';
  if (score >= 55) return 'Watch';
  return 'At Risk';
}

function riskFromHealth(score: number, ageDays: number | null, onboardingComplete: boolean): CustomerRiskLevel {
  if (score < 45 || (ageDays !== null && ageDays > 14 && !onboardingComplete)) return 'critical';
  if (score < 60 || (ageDays !== null && ageDays > 7 && !onboardingComplete)) return 'high';
  if (score < 80) return 'medium';
  return 'low';
}

function resolveOwner(client: ClientRecordSummary): { owner: string; source: string } {
  const configured = process.env.CUSTOMER_SUCCESS_OWNER_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL;
  if (configured) return { owner: configured, source: 'Customer success owner environment' };
  if (client.email) return { owner: client.email, source: 'Client contact fallback' };
  return { owner: 'Unassigned', source: 'No owner source configured' };
}

function paid(client: ClientRecordSummary): boolean {
  return client.amountPaid > 0 || Boolean(client.paymentReceivedAt || client.paymentDate);
}

export function deriveCustomerLifecycleStage(client: ClientRecordSummary): CustomerLifecycleStage {
  const stage = client.lifecycleStage ?? '';
  const onboarding = client.onboardingStatus ?? '';
  const portal = client.portalAccessStatus ?? '';
  const build = client.buildStatus ?? '';
  const launch = client.launchStatus ?? '';
  const age = daysSince(client.paymentReceivedAt ?? client.createdTime);

  if (!paid(client)) {
    if (stage === 'Discovery') return 'Qualified';
    if (stage === 'Blueprint' || stage === 'Agreement') return 'Proposal';
    return 'Lead';
  }
  if (portal !== 'Active') return 'Paid';
  if (onboarding === 'Not Started') return 'Provisioned';
  if (onboarding !== 'Complete') return 'Onboarding';
  if (build === 'Not Started') return 'First Value';
  if (build === 'In Progress' || build === 'Awaiting Client' || build === 'Client Review') return 'Adoption';
  if (launch === 'Launched' || stage === 'Adoption') {
    if ((age ?? 0) >= 270) return 'Renewal';
    if ((age ?? 0) >= 90) return 'Expansion';
    if ((age ?? 0) >= 30) return 'Healthy';
    return 'Active';
  }
  return 'Active';
}

function milestoneStatus(complete: boolean, current: boolean, atRisk: boolean): SuccessMilestone['status'] {
  if (complete) return 'Complete';
  if (atRisk) return 'At Risk';
  if (current) return 'Current';
  return 'Upcoming';
}

export function buildSuccessMilestones(client: ClientRecordSummary): SuccessMilestone[] {
  const portalComplete = client.portalAccessStatus === 'Active';
  const onboardingComplete = client.onboardingStatus === 'Complete';
  const buildStarted = Boolean(client.buildStatus && client.buildStatus !== 'Not Started');
  const launched = client.launchStatus === 'Launched' || client.launchStatus === 'Adoption In Progress';
  const age = daysSince(client.paymentReceivedAt ?? client.createdTime);

  const firstLoginComplete = portalComplete && client.onboardingStatus !== 'Not Started';
  const firstValueComplete = onboardingComplete || buildStarted || launched;
  const learningStarted = onboardingComplete || buildStarted || launched;
  const learningComplete = launched && (age ?? 0) >= 14;
  const firstSuccess = launched || (client.lifecycleStage === 'Adoption' && onboardingComplete);
  const quarterlyReview = (age ?? 0) >= 90;
  const renewal = (age ?? 0) >= 300;
  const referral = firstSuccess && (age ?? 0) >= 30;

  return [
    {
      id: 'portal-created',
      label: 'Portal Created',
      complete: portalComplete,
      status: milestoneStatus(portalComplete, paid(client), paid(client) && !portalComplete),
      evidence: portalComplete ? 'Portal access is active.' : 'Portal access is not active yet.',
    },
    {
      id: 'first-login',
      label: 'First Login',
      complete: firstLoginComplete,
      status: milestoneStatus(firstLoginComplete, portalComplete, portalComplete && (age ?? 0) > 3),
      evidence: firstLoginComplete ? 'Onboarding has advanced after portal provisioning.' : 'First login is not proven by current records.',
    },
    {
      id: 'first-value',
      label: 'First Value',
      complete: firstValueComplete,
      status: milestoneStatus(firstValueComplete, onboardingComplete, onboardingComplete && !buildStarted),
      evidence: firstValueComplete ? 'Onboarding/build/launch has advanced.' : 'First-value milestone is still pending.',
    },
    {
      id: 'first-automation',
      label: 'First Automation',
      complete: buildStarted || launched,
      status: milestoneStatus(buildStarted || launched, onboardingComplete, onboardingComplete && (age ?? 0) > 14),
      evidence: buildStarted || launched ? `Build status: ${client.buildStatus || 'advanced'}.` : 'No automation/build milestone is recorded yet.',
    },
    {
      id: 'learning-started',
      label: 'Learning Started',
      complete: learningStarted,
      status: milestoneStatus(learningStarted, portalComplete, portalComplete && (age ?? 0) > 7),
      evidence: learningStarted ? 'Learning is available through onboarding/adoption.' : 'Learning start is not proven by current records.',
    },
    {
      id: 'learning-completed',
      label: 'Learning Completed',
      complete: learningComplete,
      status: milestoneStatus(learningComplete, learningStarted, learningStarted && (age ?? 0) > 30),
      evidence: learningComplete ? 'Learning completion inferred from launched adoption window.' : 'Completion needs learning telemetry.',
    },
    {
      id: 'first-success',
      label: 'First Success',
      complete: firstSuccess,
      status: milestoneStatus(firstSuccess, firstValueComplete, firstValueComplete && (age ?? 0) > 30),
      evidence: firstSuccess ? 'Client is in launch/adoption success window.' : 'First success has not been recorded yet.',
    },
    {
      id: 'quarterly-review',
      label: 'Quarterly Review',
      complete: quarterlyReview,
      status: milestoneStatus(quarterlyReview, firstSuccess, firstSuccess && (age ?? 0) > 100),
      evidence: quarterlyReview ? 'Customer is eligible for quarterly business review.' : 'Quarterly review is not due yet.',
    },
    {
      id: 'renewal',
      label: 'Renewal',
      complete: renewal,
      status: milestoneStatus(renewal, (age ?? 0) >= 270, (age ?? 0) >= 300),
      evidence: renewal ? 'Renewal window is active.' : 'Renewal is scheduled later in lifecycle.',
    },
    {
      id: 'referral',
      label: 'Referral',
      complete: referral,
      status: milestoneStatus(referral, firstSuccess, firstSuccess && (age ?? 0) > 60),
      evidence: referral ? 'Customer has reached advocacy eligibility.' : 'Referral ask should wait for first success.',
    },
  ];
}

export function calculateCustomerHealth(client: ClientRecordSummary, milestones: SuccessMilestone[]): CustomerHealthModel {
  let score = 45;
  const reasons: string[] = [];
  const risks: string[] = [];

  if (paid(client)) {
    score += 12;
    reasons.push('Payment is recorded.');
  } else {
    risks.push('Customer has no payment record.');
  }

  if (client.portalAccessStatus === 'Active') {
    score += 14;
    reasons.push('Portal is active.');
  } else {
    risks.push('Portal access is not active.');
  }

  if (client.onboardingStatus === 'Complete') {
    score += 14;
    reasons.push('Onboarding is complete.');
  } else if (client.onboardingStatus === 'In Progress' || client.onboardingStatus === 'Docs Signed') {
    score += 7;
    reasons.push(`Onboarding is ${client.onboardingStatus}.`);
  } else {
    risks.push('Onboarding has not started.');
  }

  const completeMilestones = milestones.filter((item) => item.complete).length;
  score += Math.min(18, completeMilestones * 2);

  if (client.buildStatus === 'Awaiting Client') {
    score -= 12;
    risks.push('Build is awaiting client input.');
  }
  if (client.launchStatus === 'Launched' || client.launchStatus === 'Adoption In Progress') {
    score += 8;
    reasons.push(`Launch status is ${client.launchStatus}.`);
  }

  const age = daysSince(client.paymentReceivedAt ?? client.createdTime);
  if (age !== null && age > 7 && client.onboardingStatus !== 'Complete') {
    score -= 14;
    risks.push('First-week onboarding target is missed.');
  }
  if (age !== null && age > 30 && completeMilestones < 4) {
    score -= 10;
    risks.push('Customer has low milestone progress after 30 days.');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score,
    status: scoreToStatus(score),
    confidence: client.portalAccessStatus || client.onboardingStatus ? 'Medium' : 'Low',
    reasons: reasons.length ? reasons : ['Limited customer telemetry is available.'],
    risks,
  };
}

function nextIncompleteMilestone(milestones: SuccessMilestone[]): SuccessMilestone {
  return milestones.find((item) => !item.complete) ?? milestones[milestones.length - 1];
}

function buildCommunicationRhythm(
  client: ClientRecordSummary,
  owner: string,
  anchorDate?: string,
): CommunicationRhythmItem[] {
  const paidAt = anchorDate ?? client.paymentReceivedAt ?? client.createdTime;
  const cadence = [
    ['Immediately after payment', 0, 'Confirm purchase, portal path, and what happens next.', 'Payment confirmation delivered'],
    ['Day 1', 1, 'Confirm portal access and owner assignment.', 'Portal active or access issue logged'],
    ['Day 3', 3, 'Check onboarding progress and remove blockers.', 'Onboarding advanced'],
    ['Day 7', 7, 'Confirm first-value milestone.', 'First-value target recorded'],
    ['Day 14', 14, 'Review learning and adoption.', 'Learning started or support opened'],
    ['Day 30', 30, 'Run first success review.', 'First success documented'],
    ['Monthly', 45, 'Maintain momentum and identify expansion signals.', 'Monthly touch logged'],
    ['Quarterly', 90, 'Review outcomes, health, and next operating cycle.', 'Quarterly review completed'],
    ['Renewal', 270, 'Confirm renewal path before risk window.', 'Renewal task complete'],
    ['Referral', 120, 'Ask healthy customers for introduction or testimonial.', 'Referral or testimonial requested'],
  ] as const;

  const age = daysSince(paidAt) ?? 0;
  return cadence.map(([label, offset, purpose, metric]) => ({
    cadence: label,
    trigger: offset === 0 ? 'Payment received' : `${offset} day(s) after payment`,
    owner,
    purpose,
    automation: offset === 0 ? 'Automated' : offset <= 14 ? 'Semi-Automated' : 'Manual',
    successMetric: metric,
    dueDate: addDays(paidAt, offset),
    status: age >= offset ? 'Due' : 'Upcoming',
  }));
}

function chooseNextCommunication(rhythm: CommunicationRhythmItem[]): CommunicationRhythmItem {
  return rhythm.find((item) => item.status === 'Due') ?? rhythm[0];
}

function learningProgressFrom(milestones: SuccessMilestone[]): number {
  const learning = milestones.filter((item) => item.id.startsWith('learning'));
  if (learning.length === 0) return 0;
  return Math.round((learning.filter((item) => item.complete).length / learning.length) * 100);
}

export function buildCustomerOperatingRecord(client: ClientRecordSummary): CustomerOperatingRecord {
  const owner = resolveOwner(client);
  const milestones = buildSuccessMilestones(client);
  const health = calculateCustomerHealth(client, milestones);
  const nextMilestone = nextIncompleteMilestone(milestones);
  const age = daysSince(client.paymentReceivedAt ?? client.createdTime);
  const risk = riskFromHealth(health.score, age, client.onboardingStatus === 'Complete');
  const rhythm = buildCommunicationRhythm(client, owner.owner, client.paymentReceivedAt ?? client.createdTime);
  const nextCommunication = chooseNextCommunication(rhythm);
  const lifecycleStage = deriveCustomerLifecycleStage(client);
  const renewalStatus =
    age !== null && age >= 300 ? 'At Risk' : age !== null && age >= 270 ? 'Due Soon' : health.score < 60 ? 'Watch' : 'Not Due';
  const expansionOpportunity =
    health.score >= 85 && lifecycleStage === 'Healthy'
      ? 'Recommended'
      : health.score >= 75 && ['Active', 'Healthy', 'Expansion'].includes(lifecycleStage)
        ? 'Review'
        : 'None';
  const referralOpportunity =
    health.score >= 85 && milestones.some((item) => item.id === 'first-success' && item.complete)
      ? 'Ask Now'
      : health.score >= 75
        ? 'Eligible'
        : 'None';
  const supportStatus =
    client.buildStatus === 'Awaiting Client'
      ? 'Needs Review'
      : risk === 'critical'
        ? 'Blocked'
        : 'Clear';
  const nextAction =
    risk === 'critical'
      ? `Call customer today: ${health.risks[0] ?? 'critical health risk'}`
      : nextMilestone.complete
        ? 'Run customer success review and identify expansion/referral path'
        : `Advance milestone: ${nextMilestone.label}`;

  return {
    client,
    lifecycleStage,
    owner: owner.owner,
    ownerSource: owner.source,
    nextSuccessMilestone: nextMilestone.label,
    health,
    milestones,
    nextCommunication,
    communicationRhythm: rhythm,
    learningProgress: learningProgressFrom(milestones),
    supportStatus,
    renewalStatus,
    expansionOpportunity,
    referralOpportunity,
    nextAction,
    dueDate: nextCommunication.dueDate,
    risk,
    ageDays: age,
    missionControlSummary: `${health.status} - ${nextAction}`,
  };
}

export function buildCustomerOperatingSystem(clients: ClientRecordSummary[]): CustomerOperatingRecord[] {
  return clients
    .filter((client) => paid(client) || Boolean(client.lifecycleStage || client.email))
    .map(buildCustomerOperatingRecord)
    .sort((a, b) => {
      const order: Record<CustomerRiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      if (order[a.risk] !== order[b.risk]) return order[a.risk] - order[b.risk];
      return a.health.score - b.health.score;
    });
}

function priorityFor(record: CustomerOperatingRecord): number {
  if (record.risk === 'critical') return 92;
  if (record.risk === 'high') return 78;
  if (record.renewalStatus === 'Due Soon' || record.renewalStatus === 'At Risk') return 74;
  if (record.expansionOpportunity !== 'None' || record.referralOpportunity !== 'None') return 58;
  return 38;
}

function eventTypeFor(record: CustomerOperatingRecord): string {
  if (record.risk === 'critical' || record.risk === 'high') return 'customer.health.changed';
  if (record.renewalStatus === 'Due Soon' || record.renewalStatus === 'At Risk') return 'customer.renewal_due';
  if (record.referralOpportunity === 'Ask Now') return 'customer.referral_requested';
  if (record.expansionOpportunity !== 'None') return 'expansion.opportunity';
  return 'customer.success.review';
}

export function customerOperatingEvents(records: CustomerOperatingRecord[]): PlatformEvent[] {
  const organizationId = process.env.EA_INTERNAL_ORG_ID ?? 'ea';
  const now = new Date().toISOString();

  return records
    .filter((record) => record.risk !== 'low' || record.renewalStatus !== 'Not Due' || record.expansionOpportunity !== 'None')
    .slice(0, 20)
    .map((record, index) =>
      fromPulseEventRow(
        {
          id: `customer-os-${record.client.id}-${index}`,
          organizationId,
          clientSlug: record.client.portalSlug,
          eventType: eventTypeFor(record),
          title: `${record.client.clientName || record.client.organization || 'Customer'}: ${record.nextAction}`,
          summary: record.missionControlSummary,
          priority: priorityFor(record),
          module: 'customer-success',
          actionLabel: 'Open Customer',
          actionUrl: record.client.id ? `/admin/organizations/${record.client.id}` : '/admin/delivery',
          personId: record.client.portalSlug,
          createdAt: now,
          metadata: {
            whyRecommended: record.health.risks[0] || record.nextSuccessMilestone,
            customerHealth: record.health.status,
            healthScore: record.health.score,
            lifecycleStage: record.lifecycleStage,
            owner: record.owner,
          },
        },
        `customer-os-${record.client.id}-${index}`,
      ),
    );
}
