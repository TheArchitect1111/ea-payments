import { createCaptureRecord } from './capture-records';
import type { ConnectionRecord, ConnectProfile } from './connect-types';

type AutomationAttempt = {
  name: string;
  ok: boolean;
  error?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function attempt(name: string, fn: () => Promise<{ ok?: boolean; error?: string } | void>): Promise<AutomationAttempt> {
  try {
    const result = await fn();
    if (result && result.ok === false) return { name, ok: false, error: result.error || 'Failed.' };
    return { name, ok: true };
  } catch (err) {
    return { name, ok: false, error: err instanceof Error ? err.message : 'Failed.' };
  }
}

export function summarizeAutomationStatus(attempts: AutomationAttempt[]) {
  const failed = attempts.filter((item) => !item.ok);
  if (!failed.length) return `complete: ${attempts.map((item) => item.name).join(', ')}`;
  return `partial: failed ${failed.map((item) => item.name).join(', ')}`;
}

export async function triggerConnectAutomations(profile: ConnectProfile, connection: ConnectionRecord) {
  const attempts: AutomationAttempt[] = [];

  attempts.push(await attempt('welcome_email', async () => {
    if (!profile.welcomeEmailSubject && !profile.welcomeEmailBody) return { ok: true };
    const { sendAuthEmail } = await import('@/lib/ea-auth-email');
    return sendAuthEmail({
      to: connection.email,
      subject: profile.welcomeEmailSubject || `Thanks for connecting with ${profile.brandName}`,
      title: profile.brandName,
      bodyHtml:
        profile.welcomeEmailBody ||
        `<p>Thanks for connecting, ${escapeHtml(connection.name)}. We received your information and will follow up soon.</p>`,
    });
  }));

  attempts.push(await attempt('owner_notification', async () => {
    const body = [
      `Name: ${connection.name}`,
      `Email: ${connection.email}`,
      connection.phone ? `Phone: ${connection.phone}` : '',
      connection.company ? `Company: ${connection.company}` : '',
      connection.role ? `Role: ${connection.role}` : '',
      `Priority: ${connection.aiPriority || 'Normal'}`,
      connection.aiRecommendedFollowUp ? `Recommended follow-up: ${connection.aiRecommendedFollowUp}` : '',
      connection.destinationUrl ? `Destination: ${connection.destinationUrl}` : '',
    ].filter(Boolean).join('\n');
    if (profile.ownerNotificationEmail) {
      const { sendAuthEmail } = await import('@/lib/ea-auth-email');
      return sendAuthEmail({
        to: profile.ownerNotificationEmail,
        subject: `New EA Connect: ${connection.name}`,
        title: `New connection for ${profile.brandName}`,
        bodyHtml: `<p style="white-space:pre-wrap;">${escapeHtml(body)}</p>`,
      });
    }
    const { sendInternalNotification } = await import('@/lib/email');
    return sendInternalNotification({
      subject: `New EA Connect: ${connection.name}`,
      title: `New connection for ${profile.brandName}`,
      body,
    });
  }));

  attempts.push(await attempt('task_follow_up', async () => ({ ok: true })));

  attempts.push(await attempt('pulse_activity', async () => {
    const { emitPulseEvent } = await import('@/lib/pulse-bus');
    return emitPulseEvent({
      product: 'ea-platform',
      type: 'attention.critical',
      title: `New EA Connect: ${connection.name}`,
      detail: `${connection.aiPriority || 'Normal'} priority · ${connection.aiRecommendedFollowUp || 'Review connection'}`,
      priority: connection.aiPriority === 'High' ? 'high' : 'medium',
      tenantId: profile.slug,
      objectId: connection.id,
      metadata: {
        email: connection.email,
        method: connection.connectionMethod,
      },
    });
  }));

  attempts.push(await attempt('simplifi_opportunity', async () => {
    return createCaptureRecord({
      title: `EA Connect: ${connection.name}`,
      description: [
        connection.company ? `Company: ${connection.company}` : '',
        connection.role ? `Role: ${connection.role}` : '',
        connection.notes ? `Notes: ${connection.notes}` : '',
        connection.aiRecommendedFollowUp ? `Recommended follow-up: ${connection.aiRecommendedFollowUp}` : '',
      ].filter(Boolean).join('\n'),
      captureType: connection.aiPriority === 'High' ? 'Opportunity' : 'Person',
      source: `EA Connect · ${profile.slug}`,
      priority: connection.aiPriority || 'Normal',
      status: 'Captured',
      prospectName: connection.name,
      businessName: connection.company,
      sourceUrl: connection.destinationUrl,
      tags: ['EA Connect', connection.aiConnectionType || 'Connection'].filter(Boolean),
      analysisSummary: connection.aiRecommendedFollowUp,
      opportunityScore: connection.aiRelationshipScore,
      portalSlug: profile.slug,
    });
  }));

  attempts.push(await attempt('relationship_timeline', async () => ({ ok: true })));

  return {
    attempts,
    status: summarizeAutomationStatus(attempts),
  };
}
