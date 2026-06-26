import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { listConnections } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const rows = await listConnections(1000);
  const headers = [
    'created_at',
    'name',
    'email',
    'phone',
    'company',
    'role',
    'location',
    'campaign',
    'referral_source',
    'connection_method',
    'ai_priority',
    'ai_connection_type',
    'ai_opportunity_type',
    'ai_recommended_follow_up',
    'destination_url',
    'automation_status',
  ];

  const csv = [
    headers.join(','),
    ...rows.map((row) => [
      row.createdAt,
      row.name,
      row.email,
      row.phone,
      row.company,
      row.role,
      row.location,
      row.campaign,
      row.referralSource,
      row.connectionMethod,
      row.aiPriority,
      row.aiConnectionType,
      row.aiOpportunityType,
      row.aiRecommendedFollowUp,
      row.destinationUrl,
      row.automationStatus,
    ].map(csvCell).join(',')),
  ].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ea-connect-connections-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
