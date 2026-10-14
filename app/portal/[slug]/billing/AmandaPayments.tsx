'use client';

import KitFulfillmentFields, { pickupSelection } from '@/app/components/amanda/KitFulfillmentFields';
import type { AmandaKitSelection } from '@/lib/amanda-catherine/kit-fulfillment';
import { useEffect, useState } from 'react';
import { amandaCourseReady, AMANDA_SUPPORT_WORDING } from '@/lib/amanda-catherine/lms-policy';
import { AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
import type { AmandaPaymentRecord } from '@/lib/amanda-catherine/payment-fulfillment';

export default function AmandaPayments({ email }: { email: string }) {
  const [kit, setKit] = useState<AmandaKitSelection>(pickupSelection);
  const [testName, setTestName] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifiedPayment, setVerifiedPayment] = useState<AmandaPaymentRecord | null>(null);
  const [options, setOptions] = useState<{
    deposits: Record<string, number>;
    memberships: Array<{ id: string; name: string; available: boolean }>;
    testCheckoutAllowed?: boolean;
    financingUrl?: string | null;
    payments?: AmandaPaymentRecord[];
  }>({ deposits: {}, memberships: [], payments: [] });

  async function loadOptions() {
    const res = await fetch('/api/portal/amanda/checkout');
    const data = await res.json();
    if (data.deposits) setOptions(data);
  }

  useEffect(() => {
    void (async () => {
      setError('');
      const sessionId = new URLSearchParams(window.location.search).get('session_id');
      if (sessionId) {
        try {
          const res = await fetch('/api/portal/amanda/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          const data = await res.json() as { ok?: boolean; error?: string; payment?: AmandaPaymentRecord };
          if (!res.ok || !data.ok) setError(data.error || 'Payment could not be verified.');
          else { setVerified(true); setVerifiedPayment(data.payment || null); }
        } catch {
          setError('Payment verification network error.');
        }
      }
      await loadOptions();
    })();
  }, []);

  async function checkout(offerId: string, paymentOption: 'full' | 'deposit' | 'test') {
    setBusy(`${offerId}:${paymentOption}`);
    setError('');
    try {
      const res = await fetch('/api/portal/amanda/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, paymentOption, testName: paymentOption === 'test' ? testName : undefined, ...kit }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || 'Checkout could not be opened.');
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError('Checkout network error.');
    } finally {
      setBusy('');
    }
  }

  async function membershipCheckout(membershipId: string) {
    setBusy(membershipId);
    setError('');
    try {
      const res = await fetch('/api/portal/amanda/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) setError(data.error || 'Membership checkout could not be opened.');
      else window.location.assign(data.url);
    } catch {
      setError('Membership checkout network error.');
    } finally {
      setBusy('');
    }
  }

  return (
    <section>
      <p className="ep-module-card-note" style={{ marginBottom: 16 }}>Receipts are sent to {email} after successful payment.</p>
      {options.testCheckoutAllowed ? (
        <div className="ep-module-card" style={{ marginBottom: 18, border: '1px solid #d9b76d' }}>
          <p className="ep-module-card-title">Private workflow testing</p>
          <p className="ep-module-card-note">Owner/admin-only. CAD $1 tests signup, Stripe payment, isolated tracking, confirmation email and 72-hour access. The charge is real and does not renew.</p>
          <label htmlFor="amanda-tracking-test-name">Test signup name</label>
          <input id="amanda-tracking-test-name" type="text" required minLength={2} maxLength={120}
            value={testName} onChange={event=>setTestName(event.target.value)}
            placeholder="Name for test registration"
            style={{display:'block',padding:12,width:'100%',border:'1px solid #777',borderRadius:8,marginTop:8}} />
        </div>
      ) : null}
      {verified ? <div className="ep-module-card" role="status" style={{ marginBottom: 18, border: '1px solid #8aa58f' }}>
        <h2>Welcome — You're In! ✨</h2>
        <p><strong>Step 1 of 3 Complete — Access Granted</strong></p>
        <p>Your verified enrollment is ready. Follow these steps to begin learning.</p>
        {verifiedPayment ? <section aria-label="Payment receipt">
          <h3>Receipt details</h3>
          <p>Amount paid: CAD ${verifiedPayment.amountPaidCad.toFixed(2)}</p>
          <p>Stripe reference: {verifiedPayment.stripeSessionId}</p>
          <p>Paid on: {new Date(verifiedPayment.recordedAt).toLocaleDateString('en-CA')}</p>
          {verifiedPayment.isTestAccess ? <><p>Private owner test · no automatic renewal.</p><p>Expires: {verifiedPayment.expiresAt ? new Date(verifiedPayment.expiresAt).toLocaleString('en-CA') : '72 hours after verified payment'}</p></> : <p>Full-price access, subject to program terms.</p>}
        </section> : null}
        <h3>Your next steps</h3>
        <ol><li>Open Learning and select your enrolled class.</li><li>Start Module 1 and explore the available workbooks, protocols, and resources.</li><li>Visit Support if you need assistance.</li></ol>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <a className="ep-btn" href="/portal/amanda-catherine/learning">Access My Class Now</a>
          <a className="ep-btn ep-btn-secondary" href="/portal/amanda-catherine/learning">View Materials</a>
          {verifiedPayment ? <a className="ep-btn ep-btn-secondary" href={`/api/portal/amanda/receipt?sessionId=${encodeURIComponent(verifiedPayment.stripeSessionId)}`} download>Download Receipt PDF</a> : null}
          <a className="ep-btn ep-btn-secondary" href="/portal/amanda-catherine/support">Support &amp; Help</a>
        </div>
        <p className="ep-module-card-title">Payment verified with Stripe</p><p className="ep-module-card-note">The payment is recorded and course access has been provisioned.</p>{verifiedPayment?.courseId ? <a data-cta-name="Preview the client learning dashboard" data-cta-key="preview-the-client-learning-dashboard" className="ep-btn" style={{ marginTop: 12 }} href={`/portal/amanda-catherine/owner/learner-preview?courseId=${encodeURIComponent(verifiedPayment.courseId)}`}>Preview the client learning dashboard</a> : null}{verifiedPayment?.isTestAccess && verifiedPayment.trackingRegistrationId ? <a data-cta-name="Verify isolated tracking event" data-cta-key="verify-isolated-tracking-event" className="ep-btn ep-btn-secondary" style={{ marginTop: 12, marginLeft: 8 }} href={`/api/portal/amanda/tracking-test?registration_id=${encodeURIComponent(verifiedPayment.trackingRegistrationId)}`} target="_blank" rel="noopener noreferrer">Verify isolated tracking event</a> : null}</div> : null}
      {error ? <p className="ep-module-card-note" style={{ color: '#b42318' }}>{error}</p> : null}
      <p>{AMANDA_SUPPORT_WORDING}</p>
      <KitFulfillmentFields value={kit} onChange={setKit} />
      <ul className="ep-module-list">
        {AMANDA_OFFERS.filter(offer => !('courseId' in offer) || amandaCourseReady(offer.courseId)).map((offer) => (
          <li key={offer.id} className="ep-module-card">
            <p className="ep-module-card-title">{offer.name}</p>
            <p className="ep-module-card-note">CAD ${offer.priceCad.toLocaleString()}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <button data-cta-name={"Pay in full: "+offer.name} data-cta-key={"pay-full-"+offer.id} className="ep-btn" disabled={Boolean(busy)} onClick={() => void checkout(offer.id, 'full')}>
                {busy === `${offer.id}:full` ? 'Opening…' : 'Pay in full'}
              </button>
              {options.deposits[offer.id] > 0 ? (
                <button data-cta-name={"Pay deposit: "+offer.name} data-cta-key={"pay-deposit-"+offer.id} className="ep-btn ep-btn-secondary" disabled={Boolean(busy)} onClick={() => void checkout(offer.id, 'deposit')}>
                  {busy === `${offer.id}:deposit` ? 'Opening…' : `Pay CAD $${options.deposits[offer.id].toLocaleString()} deposit`}
                </button>
              ) : null}
              {options.testCheckoutAllowed && 'courseId' in offer ? (
                <button data-cta-name={"Private test: "+offer.name} data-cta-key={"private-test-"+offer.id} className="ep-btn ep-btn-secondary" disabled={Boolean(busy) || testName.trim().length < 2} onClick={() => void checkout(offer.id, 'test')}>
                  {busy === `${offer.id}:test` ? 'Opening…' : 'CAD $1 — 3-day test, no auto-charge'}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {options.memberships.length ? (
        <div className="ep-module-card" style={{ marginTop: 18 }}>
          <p className="ep-module-card-title">Memberships</p>
          <p className="ep-module-card-note">Enrollment opens automatically for each membership after its Stripe price is configured.</p>
          {options.memberships.map((membership) => (
            <p key={membership.id} style={{ marginTop: 12 }}>
              {membership.available ? <button data-cta-name={"Join "+membership.name} data-cta-key={"join-"+membership.id} className="ep-btn" disabled={Boolean(busy)} onClick={() => void membershipCheckout(membership.id)}>
                {busy === membership.id ? 'Opening…' : `Join ${membership.name}`}
              </button> : <a data-cta-name={"Set up "+membership.name} data-cta-key={"setup-"+membership.id} className="ep-btn" href="/portal/amanda-catherine/billing/setup">Set up {membership.name}</a>}
            </p>
          ))}
        </div>
      ) : null}
      {options.payments?.length ? (
        <div className="ep-module-card" style={{ marginTop: 18 }}>
          <p className="ep-module-card-title">Payment history</p>
          <ul className="ep-module-list">
            {options.payments.map((payment) => (
              <li key={payment.id}>
                <strong>CAD ${payment.amountPaidCad.toFixed(2)}</strong>{' '}
                <span className="ep-module-card-note">
                  {payment.kind === 'membership' ? payment.membershipId : payment.offerId}
                  {payment.paymentOption === 'deposit' ? ' · deposit' : payment.paymentOption === 'test' ? ' · private test' : ''}
                  {payment.subscriptionStatus ? ` · ${payment.subscriptionStatus}` : ''}
                  {payment.isTestAccess && payment.expiresAt ? ` · expires ${new Date(payment.expiresAt).toLocaleString()}` : ''}
                  {' · '}{new Date(payment.recordedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {options.financingUrl ? (
        <p style={{ marginTop: 18 }}><a data-cta-name="View payment-plan options" data-cta-key="view-payment-plan-options" className="ep-btn ep-btn-secondary" href={options.financingUrl} target="_blank" rel="noreferrer">View payment-plan options</a></p>
      ) : (
        <div className="ep-module-card" style={{ marginTop: 18 }}>
          <p className="ep-module-card-title">Payment-plan options</p>
          <p className="ep-module-card-note">Financing details will be added after Amanda selects her preferred provider.</p>
          <a data-cta-name="Open billing setup" data-cta-key="open-billing-setup" className="ep-btn ep-btn-secondary" href="/portal/amanda-catherine/billing/setup" style={{ marginTop: 12 }}>Open billing setup</a>
        </div>
      )}
    </section>
  );
}
