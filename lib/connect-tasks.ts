import { emitPulseEvent } from '@/lib/pulse-bus';
import {
  completeConnectRelationshipFollowUp,
  listConnectRelationshipsForSequence,
  refreshConnectRelationshipMemoryById,
  type ConnectRelationship,
} from '@/lib/connect-store';

export type ConnectFollowUpTask = {
  id: string;
  orgSlug: string;
  relationshipId: string;
  title: string;
  subtitle: string;
  priority: ConnectRelationship['aiProfile']['followUpPriority'];
  status: 'open' | 'completed';
  recommendedAction: string;
  contact: {
    name: string;
    email: string;
    phone?: string;
  };
  routedTeam: string;
  event?: string;
  representative?: string;
  opportunityScore: number;
  reasons: string[];
  completedAt?: string;
  completedBy?: string;
  completionNote?: string;
};

type TaskCompletionRecord = {
  completedAt: string;
  completedBy: string;
  note?: string;
};

const completions = new Map<string, TaskCompletionRecord>();

function taskKey(orgSlug: string, relationshipId: string): string {
  return `${orgSlug}:${relationshipId}`;
}

function needsFollowUpTask(relationship: ConnectRelationship): boolean {
  const priority = relationship.aiProfile.followUpPriority;
  const status = relationship.status;
  return (
    priority === 'Immediate' ||
    priority === 'High' ||
    status === 'Needs Follow-Up' ||
    (status === 'Hot' && relationship.engagement.followUpsCompleted === 0)
  );
}

function toOpenTask(relationship: ConnectRelationship): ConnectFollowUpTask {
  return {
    id: relationship.id,
    orgSlug: relationship.orgSlug,
    relationshipId: relationship.id,
    title: relationship.name,
    subtitle: relationship.aiProfile.summary,
    priority: relationship.aiProfile.followUpPriority,
    status: 'open',
    recommendedAction: relationship.aiProfile.recommendedAction,
    contact: {
      name: relationship.name,
      email: relationship.email,
      phone: relationship.phone,
    },
    routedTeam: relationship.routedTeam,
    event: relationship.event,
    representative: relationship.representative,
    opportunityScore: relationship.aiProfile.opportunityScore,
    reasons: relationship.aiProfile.reasons,
  };
}

function toCompletedTask(
  relationship: ConnectRelationship,
  completion: TaskCompletionRecord,
): ConnectFollowUpTask {
  return {
    ...toOpenTask(relationship),
    status: 'completed',
    completedAt: completion.completedAt,
    completedBy: completion.completedBy,
    completionNote: completion.note,
  };
}

export async function listConnectFollowUpTasks(orgSlug: string): Promise<{
  open: ConnectFollowUpTask[];
  completed: ConnectFollowUpTask[];
  stats: { open: number; completed: number; immediate: number };
}> {
  const slug = orgSlug.trim().toLowerCase();
  const relationships = (await listConnectRelationshipsForSequence()).filter((item) => item.orgSlug === slug);
  const open: ConnectFollowUpTask[] = [];
  const completed: ConnectFollowUpTask[] = [];

  for (const relationship of relationships) {
    const key = taskKey(slug, relationship.id);
    const completion = completions.get(key);
    if (completion) {
      completed.push(toCompletedTask(relationship, completion));
      continue;
    }
    if (needsFollowUpTask(relationship)) {
      open.push(toOpenTask(relationship));
    }
  }

  open.sort((a, b) => {
    const rank = { Immediate: 0, High: 1, Medium: 2, Low: 3 };
    const delta = rank[a.priority] - rank[b.priority];
    if (delta !== 0) return delta;
    return b.opportunityScore - a.opportunityScore;
  });

  completed.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  return {
    open,
    completed: completed.slice(0, 25),
    stats: {
      open: open.length,
      completed: completed.length,
      immediate: open.filter((task) => task.priority === 'Immediate').length,
    },
  };
}

export async function completeConnectFollowUpTask(input: {
  orgSlug: string;
  relationshipId: string;
  completedBy: string;
  note?: string;
}): Promise<{ task: ConnectFollowUpTask; relationship: ConnectRelationship | null }> {
  const slug = input.orgSlug.trim().toLowerCase();
  const relationshipId = input.relationshipId.trim();
  const completion: TaskCompletionRecord = {
    completedAt: new Date().toISOString(),
    completedBy: input.completedBy.trim() || 'staff',
    note: input.note?.trim() || undefined,
  };

  const relationship = await completeConnectRelationshipFollowUp({
    orgSlug: slug,
    relationshipId,
    completedBy: completion.completedBy,
    note: completion.note,
  });
  if (!relationship) {
    throw new Error('Relationship not found for this tenant.');
  }

  completions.set(taskKey(slug, relationshipId), completion);

  await refreshConnectRelationshipMemoryById(relationshipId, {
    trigger: 'engagement',
    engagementType: 'follow_up_completed',
    voiceNote: completion.note,
  });

  await emitPulseEvent({
    product: 'simplifi',
    type: 'capture.completed',
    title: 'Connect follow-up completed',
    detail: `${relationship.name} · ${slug}`,
    tenantId: slug,
    objectId: relationshipId,
    priority: 'low',
    metadata: {
      completedBy: completion.completedBy,
      opportunityScore: relationship.aiProfile.opportunityScore,
    },
  });

  return {
    task: toCompletedTask(relationship, completion),
    relationship,
  };
}

export function seedConnectTaskCompletion(orgSlug: string, relationshipId: string, completedBy = 'matrix'): void {
  completions.set(taskKey(orgSlug, relationshipId), {
    completedAt: new Date().toISOString(),
    completedBy,
    note: 'Seeded by test matrix.',
  });
}

export function resetConnectTaskCompletions(): void {
  completions.clear();
}
