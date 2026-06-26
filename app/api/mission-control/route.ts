import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE, parseAdminSession } from '@/lib/ea-admin-auth';
import { buildAttentionItems } from '@/lib/pulse-attention';
import { listRecentPulseEvents } from '@/lib/pulse-bus';
import { buildEAMissionControl, parseMissionControlRole } from '@/lib/mission-control-data';
import { listEAActivityEvents } from '@/lib/ea-activity-events';
import {
  getProposalsWithAssessments,
  getAllClientRecords,
  getAllContentRequests,
} from '@/lib/airtable';
import { getCaptures } from '@/lib/capture-records';
import { isCaptureApiKeyConfigured } from '@/lib/capture-api-key';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = parseMissionControlRole(searchParams.get('mode'));

  const user = parseAdminSession(token);
  const [proposals, clientRecords, contentRequests, captures, activityEvents] = await Promise.all([
    getProposalsWithAssessments(),
    getAllClientRecords(),
    getAllContentRequests(),
    getCaptures(20),
    listEAActivityEvents(40),
  ]);

  const proposalsPendingReview = proposals.filter((p) => p.status === 'Pending Review').length;
  const clientsStuckOnboarding = clientRecords.filter(
    (c) => c.onboardingStatus === 'In Progress' && c.createdTime,
  ).length;

  const attentionItems = buildAttentionItems({
    captures,
    contentRequests,
    proposalsPendingReview,
    onboardingWebhooksMissing:
      !process.env.ONBOARDING_WEBHOOK_URL?.trim() || !process.env.ESIGN_WEBHOOK_URL?.trim(),
    captureApiKeyMissing: !isCaptureApiKeyConfigured(),
    cprAthleteCount: 0,
    cprActiveCount: 0,
    brotherHubMembers: 0,
    sisterHubMembers: 0,
    clientsStuckOnboarding,
  });

  const mission = buildEAMissionControl({
    attentionItems,
    pulseEvents: listRecentPulseEvents(30),
    activityEvents,
    userName: user?.name?.split(' ')[0] ?? user?.email?.split('@')[0],
    role,
  });

  return Response.json(mission);
}
