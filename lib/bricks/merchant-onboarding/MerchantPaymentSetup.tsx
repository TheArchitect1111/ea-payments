'use client';
import {useState, useEffect} from 'react';
import {
  CUSTOMER_PAYMENT_METHODS, SUPPORTED_METHODS,
  type PaymentProvider, type MerchantConnectionStatus,
} from './contract';

type Props = {
  tenantLabel: string;
  tenantSlug?: string;
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
  tenantLabel, tenantSlug, initialProvider = 'paypal', connectionStatus = 'not_connected',
  onBeginProviderSetup,
}: Props) {
  const [provider, setProvider] = useState<PaymentProvider | 'bank'>(initialProvider);
  const available = SUPPORTED_METHODS[provider === 'bank' ? 'stripe' : provider];
  const [status, setStatus] = useState<MerchantConnectionStatus>(connectionStatus);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [familyEmail, setFamilyEmail] = useState('');
  const [approvalCode, setApprovalCode] = useState('');
  useEffect(() => {
    if (!tenantSlug) return;
    let active = true;
    fetch('/api/portal/' + encodeURIComponent(tenantSlug) + '/payments/stripe',
      {credentials:'same-origin',cache:'no-store'})
      .then(async response => response.json())
      .then(data => { if (active && typeof data.status === 'string') setStatus(data.status); })
      .catch(() => { if (active) setStatus('setup_required'); });
    return () => { active = false; };
  }, [tenantSlug]);
  async function begin() {
    if ((provider !== 'stripe' && provider !== 'bank') || !tenantSlug || working) return;
    if (tenantSlug === 'tarris' &&
        (!familyEmail || !approvalCode)) {
      setError('Enter the approved family email and setup code.');
      return;
    }
    setWorking(true);
    setError('');
    try {
      const response = await fetch('/api/portal/' + encodeURIComponent(tenantSlug) + '/payments/stripe',
        {
          method:'POST',
          credentials:'same-origin',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            familyEmail,
            approvalCode
          })
        });
      const payload = await response.json();
      if (!response.ok || typeof payload.url !== 'string')
        throw new Error('Secure onboarding is not yet available.');
      const url = new URL(payload.url);
      if (url.protocol !== 'https:' || (url.hostname !== 'connect.stripe.com' && url.hostname !== 'dashboard.stripe.com'))
        throw new Error('Invalid payment provider destination.');
      window.location.assign(url.toString());
    } catch {
      setError('Secure Stripe onboarding is not yet available. No changes were made.');
      setWorking(false);
    }
  }
  return <section aria-label="Payment setup" className="rounded-xl border border-black/20 p-5">
    <h2 className="text-xl font-bold">Payment setup</h2>
    <p className="mt-2 text-sm">Connect a payment provider for {tenantLabel}. Your bank details
      and account verification stay with the provider, not Efficiency Architects.</p>
    <label className="mt-4 block text-sm font-semibold">Payment processor
      <select className="mt-2 block min-h-11 w-full rounded border p-2"
        value={provider} onChange={event => { setProvider(event.target.value as PaymentProvider | 'bank'); setError(''); }}>
        {tenantSlug === 'tarris' ? <option value="bank">Bank account (payouts via Stripe)</option> : null}
        <option value="stripe">Stripe</option>
        <option value="paypal">{tenantSlug === 'tarris' ? 'PayPal Business (setup unavailable)' : 'PayPal Business'}</option>
      </select>
    </label>
    {tenantSlug === 'tarris' ? (
      <p className="mt-4 text-sm">
        {provider === 'bank'
          ? 'Add an eligible checking or savings account to receive TB3 merchandise payouts. Stripe securely collects and verifies your bank details. This is not a separate direct-bank processor.'
          : provider === 'stripe'
            ? 'Connect a Stripe account and configure an eligible bank account for payouts during setup.'
            : 'PayPal Business onboarding is not connected yet. You cannot add a PayPal payout account here today.'}
      </p>
    ) : (
      <>
        <p className="mt-4 text-sm font-semibold">Potential customer payment methods</p>
        <ul className="mt-2 list-disc pl-6 text-sm">
          {CUSTOMER_PAYMENT_METHODS.filter(method => available.includes(method))
            .map(method => <li key={method}>{labels[method]}</li>)}
        </ul>
      </>
    )}
    <p className="mt-2 text-xs">Availability depends on provider approval,
      country, account capabilities, and integration configuration.</p>
    <p role="status" className="mt-4 text-sm">Connection status: {status.replaceAll('_', ' ')}</p>
    {error ? <p role="alert" className="mt-2 text-sm">{error}</p> : null}

    {tenantSlug === 'tarris' && (provider === 'stripe' || provider === 'bank') ? (
      <div className="mt-4 grid gap-3">
        <label className="text-sm font-semibold">
          Family representative email
          <input
            type="email"
            autoComplete="email"
            className="mt-2 block w-full rounded border p-3"
            value={familyEmail}
            onChange={e => setFamilyEmail(e.target.value)}
          />
        </label>
        <label className="text-sm font-semibold">
          TB3 setup approval code
          <input
            type="password"
            autoComplete="off"
            className="mt-2 block w-full rounded border p-3"
            value={approvalCode}
            onChange={e => setApprovalCode(e.target.value)}
          />
        </label>
      </div>
    ) : null}
    {onBeginProviderSetup
      ? <button type="button" className="mt-4 min-h-11 rounded bg-black px-5 py-3 text-white"
          onClick={() => { if (provider !== 'bank') onBeginProviderSetup(provider); }}>Begin secure provider setup</button>
      : tenantSlug && (provider === 'stripe' || provider === 'bank') ?
        <button type="button" disabled={working} className="mt-4 min-h-11 rounded bg-black px-5 py-3 text-white disabled:opacity-50" onClick={begin}>{working ? 'Opening Stripe…' : provider === 'bank' ? 'Add bank account through Stripe' : 'Connect Stripe securely'}</button>
      : <p className="mt-4 text-sm">Secure provider setup is not yet connected.
          No bank information is collected here and payments remain disabled.</p>}
  </section>;
}
