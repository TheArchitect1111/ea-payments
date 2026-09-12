import { NextResponse } from 'next/server';
import { buildControlPlaneSnapshot, type ActualProjectState } from '@/lib/control-plane';

export const dynamic = 'force-dynamic';

function parseObservedState(): Record<string, ActualProjectState> {
  const raw = process.env.EA_CONTROL_PLANE_OBSERVED_STATE?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, ActualProjectState>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function GET() {
  const snapshot = buildControlPlaneSnapshot(parseObservedState());
  return NextResponse.json(snapshot, {
    headers: {
      'Cache-Control': 'no-store',
      'X-EA-Control-Plane': 'desired-vs-actual-v1',
    },
  });
}
