/**
 * Workflow-lite: Pulse events → Update Hub email adapters.
 * No general workflow engine — hooks only for high-signal OS act events.
 */
import type { PulseEvent } from '@/lib/pulse-bus';
import { notifyUpdateHubAudience } from '@/lib/update-hub-notify';
import type { UpdateHubChannel } from '@/lib/update-hub-channels';

const ACT_TYPES = new Set([
  'ctp.production.ready',
  'ctp.website.live',
  'portal.provisioned',
  'update.published',
]);

function channelForEvent(type: string): UpdateHubChannel {
  if (type.startsWith('ctp.') || type === 'portal.provisioned') return 'stakeholders';
  return 'organization';
}

export async function runPulseActHooks(
  event: PulseEvent & { at?: string },
): Promise<void> {
  if (!ACT_TYPES.has(event.type)) return;

  const emailMeta = event.metadata?.email;
  const recipientEmail = typeof emailMeta === 'string' ? emailMeta : undefined;

  await notifyUpdateHubAudience({
    channel: channelForEvent(event.type),
    organizationName: String(event.metadata?.organizationName ?? event.tenantId ?? 'EA Portal'),
    title: event.title,
    summary: event.detail,
    portalHref: event.href,
    recipientEmail,
  });
}
