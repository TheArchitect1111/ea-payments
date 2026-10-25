'use client';
import {useState} from 'react';
import {
  CUSTOMER_PAYMENT_METHODS, SUPPORTED_METHODS,
  type PaymentProvider, type MerchantConnectionStatus,
} from './contract';

type Props = {
  tenantLabel: string;
  initialProvider?: PaymentProvider;
  connectionStatus?: MerchantConnectionStatus;
  onBeginProviderSetup?: (provider: PaymentProvider) => void;
};
const labels = {
  card: 'Credit and debit cards',
  paypal_wallet: 'PayPal',
  venmo: 'Venmo',
  cash_app_pay: 'Cash App Pay',
  ach_bank: 'Bank payments (ACH)',
};

export function MerchantPaymentSetup({
  tenantLabel, initialProvider = 'paypal', connectionStatus = 'not_connected',
  onBeginProviderSetup,
}: Props) {
  const [provider, setProvider] = useState<PaymentProvider>(initialProvider);
  const available = SUPPORTED_METHODS[provider];
  return <section aria-label="Payment setup" className="rounded-xl border border-black/20 p-5">
    <h2 className="text-xl font-bold">Payment setup</h2>
    <p className="mt-2 text-sm">Connect a payment provider for {tenantLabel}. Your bank details
      and account verification stay with the provider, not Efficiency Architects.</p>
    <label className="mt-4 block text-sm font-semibold">Payment processor
      <select className="mt-2 block min-h-11 w-full rounded border p-2"
        value={provider} onChange={event => setProvider(event.target.value as PaymentProvider)}>
        <option value="paypal">PayPal Business</option>
        <option value="stripe">Stripe</option>
      </select>
    </label>
    <p className="mt-4 text-sm font-semibold">Potential payment methods</p>
    <ul className="mt-2 list-disc pl-6 text-sm">
      {CUSTOMER_PAYMENT_METHODS.filter(method => available.includes(method))
        .map(method => <li key={method}>{labels[method]}</li>)}
    </ul>
    <p className="mt-2 text-xs">Availability depends on provider approval,
      country, account capabilities, and integration configuration.</p>
    <p role="status" className="mt-4 text-sm">Connection status: {connectionStatus.replaceAll('_', ' ')}</p>
    {onBeginProviderSetup
      ? <button type="button" className="mt-4 min-h-11 rounded bg-black px-5 py-3 text-white"
          onClick={() => onBeginProviderSetup(provider)}>Begin secure provider setup</button>
      : <p className="mt-4 text-sm">Secure provider setup is not yet connected.
          No bank information is collected here and payments remain disabled.</p>}
  </section>;
}
