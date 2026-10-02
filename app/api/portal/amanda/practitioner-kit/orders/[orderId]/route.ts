import { NextRequest, NextResponse } from 'next/server';
import { guardAmandaAdmin } from '@/lib/amanda-catherine/admin-access';
import { updateAmandaKitOrderTracking } from '@/lib/amanda-catherine/practitioner-kit-orders';
import { validateAmandaKitTrackingInput } from '@/lib/amanda-catherine/kit-shipping';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await guardAmandaAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { orderId } = await params;
  if (!/^amanda-kit-order-[a-f0-9]{24}$/.test(orderId)) return NextResponse.json({ error: 'Practitioner Kit order not found.' }, { status: 404 });
  const input = validateAmandaKitTrackingInput(await req.json().catch(() => null));
  if (!input) return NextResponse.json({ error: 'Enter a carrier, tracking number and secure tracking link.' }, { status: 400 });
  try {
    const result = await updateAmandaKitOrderTracking({ orderId, ...input });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error.includes('not found') ? 404 : 409 });
    return NextResponse.json({ ok: true, order: result.order });
  } catch (error) {
    console.error('[amanda-kit-shipping] Tracking update failed', { orderId, error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Tracking could not be recorded. The order remains in the shipping queue.' }, { status: 503 });
  }
}
