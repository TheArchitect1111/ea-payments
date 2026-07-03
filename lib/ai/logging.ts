import type { AIRequestContext, AIUsage } from '@/lib/ai/types';

export function logAIEvent(
  event: string,
  context: AIRequestContext,
  data: Record<string, unknown> = {},
) {
  console.log(JSON.stringify({
    event,
    requestId: context.requestId,
    actorType: context.actor.type,
    actorId: context.actor.id,
    route: context.route,
    createdAt: new Date().toISOString(),
    ...data,
  }));
}

export function trackAIUsage(context: AIRequestContext, model: string, usage: AIUsage) {
  logAIEvent('ai.usage', context, { model, usage });
}
