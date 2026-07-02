import { getConnectDeliveryStatus } from '@/lib/connect-delivery-log';
import { getConnectSystemStatus, listConnectRelationships } from '@/lib/connect-store';
import { isConnectMemoryConfigured } from '@/lib/connect-relationship-memory';

export type ConnectMatrixCheck = {
  id: string;
  label: string;
  target: number;
  current: number;
  ok: boolean;
  detail: string;
};

export async function buildConnectTestMatrix(orgSlug: string): Promise<{
  orgSlug: string;
  score: number;
  checks: ConnectMatrixCheck[];
}> {
  const relationships = await listConnectRelationships(orgSlug);
  const status = await getConnectSystemStatus();
  const delivery = await getConnectDeliveryStatus(orgSlug);

  const scans = relationships.reduce((sum, rel) => sum + rel.engagement.scans, 0);
  const redirects = relationships.reduce((sum, rel) => sum + rel.engagement.clicks, 0);
  const openAiConfigured = isConnectMemoryConfigured();
  const aiEvaluations = relationships.filter((rel) =>
    openAiConfigured
      ? rel.aiProfile.memorySource === 'openai'
      : rel.aiProfile.opportunityScore >= 0 && Boolean(rel.aiProfile.memoryRefreshedAt),
  ).length;
  const verifiedEmails = delivery.stats.email.sent;
  const verifiedSms = delivery.stats.sms.sent;
  const emailFailures = delivery.stats.email.failed;

  const resendOk = status.checks.some((check) => check.label === 'Resend Email' && check.ok);
  const twilioOk = status.checks.some((check) => check.label === 'Twilio SMS' && check.ok);

  const checks: ConnectMatrixCheck[] = [
    {
      id: 'captures',
      label: 'Captures recorded',
      target: 20,
      current: relationships.length,
      ok: relationships.length >= 20,
      detail: `${relationships.length} relationship records for ${orgSlug}.`,
    },
    {
      id: 'scans',
      label: 'Scans tracked',
      target: 20,
      current: scans,
      ok: scans >= 20,
      detail: `${scans} scan events from relationship engagement fields.`,
    },
    {
      id: 'emails',
      label: 'Verified email deliveries',
      target: 20,
      current: verifiedEmails,
      ok: verifiedEmails >= 20 && resendOk && emailFailures === 0,
      detail: resendOk
        ? `${verifiedEmails} verified email send(s) logged (${emailFailures} failed).`
        : 'Resend is not configured, so sends are not production-verifiable.',
    },
    {
      id: 'sms',
      label: 'Verified SMS deliveries',
      target: 20,
      current: verifiedSms,
      ok: twilioOk ? verifiedSms >= 20 && delivery.stats.sms.failed === 0 : false,
      detail: twilioOk
        ? `${verifiedSms} verified SMS send(s) logged (${delivery.stats.sms.failed} failed).`
        : 'Twilio not configured on production.',
    },
    {
      id: 'redirects',
      label: 'Redirect/link clicks tracked',
      target: 20,
      current: redirects,
      ok: redirects >= 20,
      detail: `${redirects} tracked redirect events.`,
    },
    {
      id: 'ai',
      label: 'AI/opportunity evaluations',
      target: 20,
      current: aiEvaluations,
      ok: aiEvaluations >= 20,
      detail: openAiConfigured
        ? `${aiEvaluations} relationships refreshed with OpenAI memory.`
        : `${aiEvaluations} relationships have rule-based opportunity scoring (set OPENAI_API_KEY for living profiles).`,
    },
  ];

  const passed = checks.filter((check) => check.ok).length;
  const score = Math.round((passed / checks.length) * 100);

  return { orgSlug, score, checks };
}
