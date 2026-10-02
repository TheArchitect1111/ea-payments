import type Stripe from 'stripe';

export type AmandaKitSelection = { kitFulfillment?: 'pickup' | 'ship'; shippingAddress?: { line1: string; line2?: string; city: string; state: string; postal_code: string; country: string } };
export async function amandaKitCheckout(selection: AmandaKitSelection): Promise<{ metadata: Record<string, string>; shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] }> {
  if (selection.kitFulfillment !== 'pickup' && selection.kitFulfillment !== 'ship') throw new Error('Choose Free Pickup (Class / Shop) or Ship to me - FREE.');
  // TODO: Enable paid shipping when Amanda approves rates - currently FREE per 20261002
  if (selection.kitFulfillment === 'pickup') return { metadata: { kitFulfillment: 'pickup', kitShippingCents: '0' }, shippingOptions: [] };
  const address = selection.shippingAddress;
  if (!address || ['line1', 'city', 'state', 'postal_code', 'country'].some((key) => !String(address[key as keyof typeof address] || '').trim())) throw new Error('A complete shipping address is required.');
  const clean = Object.fromEntries(Object.entries(address).map(([key, value]) => [key, String(value).trim().slice(0, 100)])) as NonNullable<AmandaKitSelection['shippingAddress']>;
  clean.country = clean.country.toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean.country)) throw new Error('Enter the two-letter country code.');
  return {
    metadata: { kitFulfillment: 'ship', kitShippingCents: '0', kitShippingAddress: JSON.stringify(clean) },
    shippingOptions: [],
  };
}
