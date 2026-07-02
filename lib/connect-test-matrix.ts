import { getConnectSystemStatus, listConnectRelationships } from '@/lib/connect-store';

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

  const scans = relationships.reduce((sum, rel) => sum + rel.engagement.scans, 0);
  const redirects = relationships.reduce((sum, rel) => sum + rel.engagement.clicks, 0);
  const aiEvaluations = relationships.filter((rel) => rel.aiProfile.opportunityScore >= 0).length;
  const nurtureSends = relationships.reduce((sum, rel) => sum + rel.sequenceSent.length, 0);

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
      label: 'Nurture sends recorded',
      target: 20,
      current: nurtureSends,
      ok: nurtureSends >= 20 && resendOk,
      detail: resendOk
        ? `${nurtureSends} sequence steps marked sent.`
        : 'Resend is not configured, so sends are not production-verifiable.',
    },
    {
      id: 'sms',
      label: 'SMS capability',
      target: 20,
      current: twilioOk ? Math.min(relationships.length, 20) : 0,
      ok: twilioOk && relationships.length >= 20,
      detail: twilioOk
        ? 'Twilio configured; SMS can be verified during matrix run.'
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
      detail: `${aiEvaluations} relationships have opportunity scoring.`,
    },
  ];

  const passed = checks.filter((check) => check.ok).length;
  const score = Math.round((passed / checks.length) * 100);

  return { orgSlug, score, checks };
}
