'use client';
import type { AmandaKitSelection } from '@/lib/amanda-catherine/kit-fulfillment';
export const pickupSelection: AmandaKitSelection = { kitFulfillment: 'pickup' };
export default function KitFulfillmentFields({ value, onChange, included = true }: { value: AmandaKitSelection; onChange: (value: AmandaKitSelection) => void; included?: boolean }) {
  return <fieldset style={{ marginTop: 20 }}><legend>Practitioner kit {included ? 'included in tuition' : 'fulfillment'}</legend>
    <label style={{ display: 'block' }}><input type="radio" name="kitFulfillment" checked={value.kitFulfillment === 'pickup'} onChange={() => onChange({ kitFulfillment: 'pickup' })} /> Free Pickup (Class / Shop)</label>
    <label style={{ display: 'block' }}><input type="radio" name="kitFulfillment" checked={value.kitFulfillment === 'ship'} onChange={() => onChange({ ...value, kitFulfillment: 'ship' })} /> Ship to me - FREE</label>
    {value.kitFulfillment === 'ship' ? <><p>Shipping charge: $0 CAD. Shipping is free for now. Enter your address for delivery.</p>{(['line1', 'line2', 'city', 'state', 'postal_code', 'country'] as const).map((key) => <label key={key} style={{ display: 'block', marginTop: 8 }}>{({ line1: 'Street address', line2: 'Apartment / unit (optional)', city: 'City', state: 'Province / state', postal_code: 'Postal / ZIP code', country: 'Country (two-letter code)' })[key]}<input style={{ display: 'block', color: '#17130f', background: '#fff', padding: 8, width: '100%' }} required={key !== 'line2'} maxLength={key === 'country' ? 2 : 100} value={value.shippingAddress?.[key] || ''} onChange={(event) => onChange({ ...value, shippingAddress: { line1: '', city: '', state: '', postal_code: '', country: '', ...value.shippingAddress, [key]: event.target.value } })} /></label>)}</> : <p>Shipping charge: $0 CAD.</p>}
  </fieldset>;
}
