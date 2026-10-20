import { NextResponse } from 'next/server';
import { stagingAdapter } from '@/src/chassis/adapters/staging.adapter';
import { BRICK_IDS, type Brick } from '@/src/chassis/BrickInterface';
import type { ClientConfig } from '@/src/chassis/runClickTest';

export async function GET(_request: Request, context: { params: Promise<{ client: string }> }) {
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  const { client } = await context.params;
  if (client !== 'tarris') return NextResponse.json({ error: 'Unknown client' }, { status: 404 });
  const { tarrisConfig } = await import('@/src/clients/tarris/chassis.config');
  const config: ClientConfig = tarrisConfig;
  const sockets = BRICK_IDS.map(id => ({ id, health: async () => ({ status: 503, evidence: 'Not provisioned' }) } as Brick));
  // stagingAdapter is a single adapter, not a factory
  const checkout = stagingAdapter as any;
  const health = await checkout.health();
  if (health.status !== 'healthy' && health.status !== 200) return NextResponse.json({ error: health.evidence || 'Not provisioned' }, { status: 422 });
  const courseId = Object.keys(config.prices)[0];
  const payment = await checkout.checkout({ type: 'stripe-test', courseId });
  const delivery = await checkout.welcome(payment);
  return NextResponse.json({ verificationType: 'CONTRACT ONLY', productionEligible: false, client, cents: config.prices[courseId], portal: '/tarris/future', payment, delivery }, { headers: { 'Cache-Control': 'no-store' } });
}
