import { NextResponse } from 'next/server';
import { listEACPLaunches, statusLabel } from '@/lib/eacp-launch';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const launches = await listEACPLaunches();
  const active = launches.find((launch) => !['archived', 'deployed', 'rejected'].includes(launch.status));

  if (!active) {
    return NextResponse.json({ active: null });
  }

  const messageByStatus: Record<string, string> = {
    'under-review': 'Approval needed.',
    'revision-requested': 'Revision requested.',
    approved: 'Approved.',
    building: 'Build in progress.',
    'build-failed': 'Build failed.',
    'ready-for-deployment': 'Build package ready.',
    deployed: 'Deployment complete.',
    generated: 'Package ready.',
    draft: 'Draft launch ready.',
  };

  return NextResponse.json({
    active: {
      launchId: active.id,
      client: active.client,
      status: active.status,
      statusLabel: statusLabel(active.status),
      message: messageByStatus[active.status] ?? 'Package ready.',
      links: active.links,
      updatedAt: active.updatedAt,
    },
  });
}
