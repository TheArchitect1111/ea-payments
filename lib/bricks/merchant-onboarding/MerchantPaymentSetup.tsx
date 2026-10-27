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
  sandbox?: boolean;
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
  onBeginProviderSetup, sandbox = false,
}: Props) {
  const [provider, setProvider] = useState<PaymentProvider | 'bank'>(initialProvider);
  const available = SUPPORTED_METHODS[provider === 'bank' ? 'stripe' : provider];
  const [status, setStatus] = useState<MerchantConnectionStatus>(connectionStatus);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [familyEmail, setFamilyEmail] = useState('');
  const [approvalCode, setApprovalCode] = useState('');
  const [accountId, setAccountId] = useState('');
  useEffect(() => {
    if (!tenantSlug) return;
    let active = true;
    fetch('/api/portal/' + encodeURIComponent(tenantSlug) + '/payments/stripe' + (sandbox ? '?sandbox=1' : ''),
      {credentials:'same-origin',cache:'no-store'})
      .then(async response => response.json())
      .then(data => { if (active && typeof data.status === 'string') setStatus(data.status); })
      .catch(() => { if (active) setStatus('setup_required'); });
    return () => { active = false; };
  }, [tenantSlug, sandbox]);
  async function begin() {
    if ((provider !== 'stripe' && provider !== 'bank') || !tenantSlug || working) return;
    if (tenantSlug === 'tarris' &&
        (!familyEmail || !approvalCode || !accountId)) {
      setError('Enter the approved family email, setup code, and Stripe account ID.');
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
          body:JSON.stringify(tenantSlug === 'tarris'
            ? {familyEmail, approvalCode, accountId, sandbox}
            : {familyEmail, approvalCode, sandbox})
        });
      const payload = await response.json();
      if (tenantSlug === 'tarris') {
        if (!response.ok || payload.ok !== true || payload.mode !== 'direct')
          throw new Error(payload.error || 'Stripe account verification is not available.');
        setStatus(payload.ready ? 'active' : 'pending');
        setWorking(false);
        return;
      }
      if (!response.ok || typeof payload.url !== 'string')
        throw new Error(payload.errorCode && sandbox ? 'Stripe setup failed (' + payload.errorType + ': ' + payload.errorCode + ').' : payload.error || 'Secure onboarding is not yet available.');
      const url = new URL(payload.url);
      if (url.protocol !== 'https:' || (url.hostname !== 'connect.stripe.com' && url.hostname !== 'dashboard.stripe.com'))
        throw new Error('Invalid payment provider destination.');
      window.location.assign(url.toString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Secure Stripe onboarding is not yet available.');
      setWorking(false);
    }
  }
  return <section aria-label="Payment setup" className="rounded-xl border border-black/20 p-5">
    <h2 className="text-xl font-bold">{sandbox ? 'Stripe sandbox test (no real money)' : 'Payment setup'}</h2>
    {sandbox ? <p className="mt-2 rounded bg-yellow-100 p-2 text-sm text-black">TEST ONLY: Use fictional merchant information and Stripe test data. This connects a separate tarris-sandbox merchant, never the family payout account.</p> : null}
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
          ? 'Configure bank payouts in the family’s existing Stripe Dashboard. Enter the family Stripe account ID below to verify its payment and payout capabilities. No bank details are collected here.'
          : provider === 'stripe'
            ? 'Verify the family-owned Stripe account ID below. This does not create an account, activate checkout, or configure bank payouts.'
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
          Stripe account ID (acct_...)
          <input
            type="text"
            autoComplete="off"
            className="mt-2 block w-full rounded border p-3"
            placeholder="acct_..."
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
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
        <button type="button" disabled={working} className="mt-4 min-h-11 rounded bg-black px-5 py-3 text-white disabled:opacity-50" onClick={begin}>{working ? 'Verifying…' : tenantSlug === 'tarris' ? 'Verify family Stripe account' : provider === 'bank' ? 'Add bank account through Stripe' : 'Connect Stripe securely'}</button>
      : <p className="mt-4 text-sm">Secure provider setup is not yet connected.
          No bank information is collected here and payments remain disabled.</p>}
  </section>;
}
