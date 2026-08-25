export type CrmEntityId = string;

export interface CrmContact {
  id?: CrmEntityId;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  organizationId?: CrmEntityId;
  metadata?: Record<string, unknown>;
}

export interface CrmOrganization {
  id?: CrmEntityId;
  name: string;
  domain?: string;
  metadata?: Record<string, unknown>;
}

export interface CrmOpportunity {
  id?: CrmEntityId;
  name: string;
  stage?: string;
  value?: number;
  contactId?: CrmEntityId;
  organizationId?: CrmEntityId;
  metadata?: Record<string, unknown>;
}

export interface CrmTask {
  id?: CrmEntityId;
  title: string;
  status?: string;
  dueAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: CrmEntityId;
}

export type EvaSignal = {
  severity: 'info' | 'attention' | 'urgent';
  title: string;
  message: string;
  recommendedAction: string;
  opportunityId?: string;
  taskId?: string;
};

export type PortalCrmHomeModel = {
  metrics: {
    contacts: number;
    openOpportunities: number;
    pipelineValue: number;
    overdueTasks: number;
  };
  pipeline: Array<{
    stage: string;
    value: number;
    cards: Array<{
      id: string;
      title: string;
      value: number;
      stage: string;
      needsAttention: boolean;
    }>;
  }>;
  taskQueue: Array<{
    id: string;
    title: string;
    dueAt?: string;
    status: string;
    overdue: boolean;
    relatedEntityId?: string;
  }>;
  eva: EvaSignal[];
};

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Decision', 'Won', 'Lost'] as const;

export function buildCrmPilotModel(now = new Date()): PortalCrmHomeModel {
  const contacts: CrmContact[] = [
    { id: 'c-1', firstName: 'Jordan', lastName: 'Lee', email: 'jordan@example.com' },
    { id: 'c-2', firstName: 'Maya', lastName: 'Brooks', email: 'maya@example.com' },
    { id: 'c-3', firstName: 'Chris', lastName: 'Taylor', email: 'chris@example.com' },
    { id: 'c-4', firstName: 'Dana', lastName: 'Reed', email: 'dana@example.com' },
  ];

  const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
  const daysFromNow = (days: number) => new Date(now.getTime() + days * 86_400_000).toISOString();

  const opportunities: CrmOpportunity[] = [
    { id: 'o-1', name: 'Website + Portal', stage: 'Proposal', value: 7495, metadata: { lastActivityAt: daysAgo(9) } },
    { id: 'o-2', name: 'Operations Automation', stage: 'Qualified', value: 3495, metadata: { lastActivityAt: daysAgo(2) } },
    { id: 'o-3', name: 'Digital Assistant Upgrade', stage: 'Decision', value: 9995, metadata: { lastActivityAt: daysAgo(8) } },
    { id: 'o-4', name: 'CRM + Follow-up System', stage: 'Contacted', value: 2995, metadata: { lastActivityAt: daysAgo(1) } },
  ];

  const tasks: CrmTask[] = [
    { id: 't-1', title: 'Follow up on Website + Portal proposal', status: 'Open', dueAt: daysAgo(2), relatedEntityId: 'o-1' },
    { id: 't-2', title: 'Send automation workflow outline', status: 'Open', dueAt: daysFromNow(1), relatedEntityId: 'o-2' },
    { id: 't-3', title: 'Decision-stage check-in', status: 'Open', dueAt: daysAgo(1), relatedEntityId: 'o-3' },
  ];

  const eva: EvaSignal[] = [];
  for (const task of tasks) {
    if (!task.id || !task.dueAt || (task.status ?? '').toLowerCase() === 'completed') continue;
    if (new Date(task.dueAt).getTime() < now.getTime()) {
      eva.push({
        severity: 'urgent',
        title: `Overdue: ${task.title}`,
        message: 'This follow-up is past due.',
        taskId: task.id,
        recommendedAction: 'Complete, reschedule, or reassign this task today.',
      });
    }
  }

  for (const opportunity of opportunities) {
    if (!opportunity.id || ['Won', 'Lost'].includes(opportunity.stage ?? '')) continue;
    const touched = typeof opportunity.metadata?.lastActivityAt === 'string' ? new Date(opportunity.metadata.lastActivityAt) : null;
    const days = touched ? Math.floor((now.getTime() - touched.getTime()) / 86_400_000) : 0;
    if (days >= 7) {
      eva.push({
        severity: opportunity.stage === 'Proposal' || opportunity.stage === 'Decision' ? 'urgent' : 'attention',
        title: `Stalled opportunity: ${opportunity.name}`,
        message: `No recorded movement for ${days} days.`,
        opportunityId: opportunity.id,
        recommendedAction: 'Create the next follow-up and move the opportunity forward or close it.',
      });
    }
    const hasTask = tasks.some((task) => task.relatedEntityId === opportunity.id && (task.status ?? '').toLowerCase() !== 'completed');
    if ((opportunity.value ?? 0) >= 5000 && !hasTask) {
      eva.push({
        severity: 'urgent',
        title: `No next action: ${opportunity.name}`,
        message: 'This high-value opportunity has no open follow-up task.',
        opportunityId: opportunity.id,
        recommendedAction: 'Create a dated next action before this opportunity goes cold.',
      });
    }
  }

  const open = opportunities.filter((item) => !['Won', 'Lost'].includes(item.stage ?? ''));
  const urgentIds = new Set(eva.filter((signal) => signal.severity === 'urgent' && signal.opportunityId).map((signal) => signal.opportunityId));
  const overdueTasks = tasks.filter((task) => task.dueAt && new Date(task.dueAt).getTime() < now.getTime() && (task.status ?? '').toLowerCase() !== 'completed').length;

  return {
    metrics: {
      contacts: contacts.length,
      openOpportunities: open.length,
      pipelineValue: open.reduce((sum, item) => sum + (item.value ?? 0), 0),
      overdueTasks,
    },
    pipeline: STAGES.map((stage) => {
      const cards = opportunities
        .filter((item) => (item.stage ?? 'New') === stage)
        .map((item) => ({
          id: item.id ?? '',
          title: item.name,
          value: item.value ?? 0,
          stage,
          needsAttention: Boolean(item.id && urgentIds.has(item.id)),
        }));
      return { stage, value: cards.reduce((sum, item) => sum + item.value, 0), cards };
    }),
    taskQueue: tasks
      .filter((task) => (task.status ?? '').toLowerCase() !== 'completed')
      .map((task) => ({
        id: task.id ?? '',
        title: task.title,
        dueAt: task.dueAt,
        status: task.status ?? 'Open',
        overdue: Boolean(task.dueAt && new Date(task.dueAt).getTime() < now.getTime()),
        relatedEntityId: task.relatedEntityId,
      }))
      .sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.dueAt ?? '').localeCompare(b.dueAt ?? '')),
    eva,
  };
}
