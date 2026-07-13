import { NextResponse } from 'next/server';
import {
  getPaymentsContractHealth,
  listCommerceOffers,
  listEntitlementSnapshots,
} from '@/lib/platform/payments-bridge';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = getPaymentsContractHealth();
  return NextResponse.json({
    health,
    offers: listCommerceOffers().map((o) => ({
      id: o.id,
      kind: o.kind,
      displayName: o.displayName,
      airtablePackageName: o.airtablePackageName,
      priceCents: o.priceCents,
      interval: o.interval ?? null,
      moduleIds: o.moduleIds,
      stripePriceEnvKey: o.stripePriceEnvKey,
    })),
    snapshots: listEntitlementSnapshots(),
  });
}
