import { NextRequest, NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { createCampaign, listCampaigns } from '@/lib/creative-studio/campaign-store';
import type { CampaignGoalId } from '@/lib/creative-studio/types';

export const dynamic = 'force-dynamic';

const GOAL_IDS = new Set<CampaignGoalId>([
  'promote-event',
  'recruit-athletes',
  'enroll-students',
  'fill-camp',
  'raise-donations',
  'find-sponsors',
  'celebrate-success',
  'announcement',
  'launch-new',
  'custom',
]);

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return unauthorized();

  const campaigns = await listCampaigns();
  return NextResponse.json({ ok: true, campaigns });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return unauthorized();

  let body: { goalId?: string; story?: string };
  try {
    body = (await req.json()) as { goalId?: string; story?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const goalId = body.goalId as CampaignGoalId;
  const story = String(body.story ?? '').trim();

  if (!GOAL_IDS.has(goalId)) {
    return NextResponse.json({ ok: false, error: 'Invalid campaign goal.' }, { status: 400 });
  }
  if (story.length < 12) {
    return NextResponse.json({ ok: false, error: 'Tell us a bit more about what happened (at least 12 characters).' }, { status: 400 });
  }

  const campaign = await createCampaign({ goalId, story });
  return NextResponse.json({ ok: true, campaign });
}
