import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

export type AmandaKitSelection = { kitFulfillment?: 'pickup' | 'ship'; shippingAddress?: { line1: string; line2?: string; city: string; state: string; postal_code: string; country: string } };
export async function amandaKitCheckout(selection: AmandaKitSelection): Promise<{ metadata: Record<string, string>; shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] }> {
  if (selection.kitFulfillment !== 'pickup' && selection.kitFulfillment !== 'ship') throw new Error('Choose Free Pickup (Class / Shop) or Ship to me.');
  if (selection.kitFulfillment === 'pickup') return { metadata: { kitFulfillment: 'pickup', kitShippingCents: '0' }, shippingOptions: [] as Stripe.Checkout.SessionCreateParams.ShippingOption[] };
  const address = selection.shippingAddress;
  if (!address || ['line1', 'city', 'state', 'postal_code', 'country'].some((key) => !String(address[key as keyof typeof address] || '').trim())) throw new Error('A complete shipping address is required.');
  const clean = Object.fromEntries(Object.entries(address).map(([key, value]) => [key, String(value).trim().slice(0, 100)])) as NonNullable<AmandaKitSelection['shippingAddress']>;
  clean.country = clean.country.toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean.country)) throw new Error('Enter the two-letter country code.');
  // Approved Stripe rate IDs must be supplied by Amanda, never guessed.
  const rates = JSON.parse(process.env.AMANDA_KIT_SHIPPING_RATE_IDS_JSON || '{}') as Record<string, string>;
  const rateId = rates[clean.country];
  if (!rateId) throw new Error('Shipping is not configured for this destination. Please contact Amanda.');
  const rate = await getStripe().shippingRates.retrieve(rateId);
  if (!rate.active || rate.type !== 'fixed_amount' || rate.fixed_amount?.currency !== 'cad' || !Number.isSafeInteger(rate.fixed_amount.amount) || rate.fixed_amount.amount <= 0) throw new Error('The approved shipping rate is unavailable.');
  return { metadata: { kitFulfillment: 'ship', kitShippingCents: String(rate.fixed_amount.amount), kitShippingRateId: rate.id, kitShippingAddress: JSON.stringify(clean) }, shippingOptions: [{ shipping_rate: rate.id }] as Stripe.Checkout.SessionCreateParams.ShippingOption[] };
}
