import { NextRequest, NextResponse } from 'next/server';
import {
  isCheckoutOfferPurchasable,
  listCommerceOffers,
  resolveCheckoutOffer,
} from '@/lib/platform/payments-bridge';

export const dynamic = 'force-dynamic';

/** Unified commerce offers for checkout UI (one-time + subscription). */
export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get('kind') as 'one_time' | 'subscription' | null;
  const purchasableOnly = req.nextUrl.searchParams.get('purchasable') !== '0';

  const offers = listCommerceOffers(kind ?? undefined)
    .map((o) => resolveCheckoutOffer(o.id))
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .map((o) => {
      const purchasable = isCheckoutOfferPurchasable(o);
      return {
        id: o.id,
        kind: o.kind,
        displayName: o.displayName,
        description: o.description,
        priceCents: o.priceCents,
        interval: o.interval ?? null,
        trialDays: o.trialDays ?? 0,
        airtablePackageName: o.airtablePackageName,
        moduleCount: o.moduleIds.length,
        capabilityCount: o.capabilityIds.length,
        includesBilling: o.moduleIds.includes('billing'),
        includesConnect: o.moduleIds.includes('connect'),
        purchasable,
      };
    })
    .filter((o) => (purchasableOnly ? o.purchasable : true));

  return NextResponse.json({ offers });
}
