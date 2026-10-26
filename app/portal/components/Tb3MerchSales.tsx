'use client';
import { useEffect, useState } from 'react';

type Order = {
  id: number;
  reference: string;
  status: string;
  products: { name: string; quantity: number }[];
  retailTotal: string | number | null;
  currency: string | null;
  shipments: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string | null;
  }[];
};

export default function Tb3MerchSales({ report = false }: { report?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [source, setSource] = useState('');
  const [payments, setPayments] = useState<{
    verifiedPaidOrderCount: number;
    grossCollectedCents: number;
    hasMore: boolean;
    note: string;
  } | null>(null);
  const [paymentsMessage, setPaymentsMessage] = useState('');

  function prepareLoad() {
    setLoading(true);
    setError('');
    setOrders([]);
    setNextOffset(null);
  }

  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    fetch('/api/tb3/printful/orders?offset=' + offset, {
      cache: 'no-store', signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw Error('Private Printful orders are unavailable.');
      const data = await response.json();
      if (!controller.signal.aborted) {
        setOrders(data.orders || []);
        setSource(data.source === 'printful' ? 'Printful fulfillment records' : 'Unverified order source');
        setNextOffset(data.nextOffset ?? null);
      }
    }).catch(error => {
      if (!controller.signal.aborted)
        setError(error instanceof Error ? error.message : 'Unable to load orders.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [visible, offset, refresh]);

  useEffect(() => {
    if (!visible || !report) return;
    const controller = new AbortController();
    fetch('/api/tb3/merch/payments', {cache: 'no-store', signal: controller.signal})
      .then(async response => {
        if (!response.ok) throw Error('Verified payment report is not available yet.');
        return response.json();
      })
      .then(value => { if (!controller.signal.aborted) {
        setPayments(value);
        setPaymentsMessage('');
      }})
      .catch(() => { if (!controller.signal.aborted) {
        setPayments(null);
        setPaymentsMessage('Verified payment report is not available yet.');
      }});
    return () => controller.abort();
  }, [visible, report, refresh]);

  return <section className="ep-panel" aria-label="TB3 merchandise orders">
    <div className="ep-panel-head">
      <h2 className="ep-panel-title">TB3 Printful orders</h2>
      <button type="button" className="ep-pulse-cta"
        aria-expanded={visible} onClick={() => { if (!visible) prepareLoad(); setVisible(value => !value); }}>
        {visible ? 'Close orders' : 'View merch orders'}
      </button>
    </div>
    {visible && <div>
      <button type="button" className="ep-pulse-cta" disabled={loading}
        onClick={() => { prepareLoad(); setRefresh(value => value + 1); }}>Refresh orders</button>
      <p>Fulfillment status and tracking from Printful. Retail totals do not confirm payment, revenue, profits, refunds, or payouts.</p>
      {report && <>
        {payments ? <div role="status">
          <p>Verified paid checkouts (most recent 100 sessions): {payments.verifiedPaidOrderCount}</p>
          <p>Gross collected: ${(payments.grossCollectedCents / 100).toFixed(2)} USD</p>
          <p>{payments.note}</p>
          {payments.hasMore && <p>Older checkout sessions are not included.</p>}
        </div> : <p role="status">{paymentsMessage || 'Loading verified payment report...'}</p>}
      </>}
      {report && <aside className="mt-5 rounded-lg border border-black/15 p-4" aria-label="TB3 fulfillment reserve plan">
        <h3 className="text-lg font-bold">Fulfillment reserve · funding plan</h3>
        <p className="mt-2">Target operating reserve: <strong>$500.00</strong></p>
        <p>Parent loan: <strong>Not yet recorded or verified</strong></p>
        <p>TB3-owned reserve: <strong>Not yet reconciled</strong></p>
        <p>Amount available for repayment: <strong>Not yet determined</strong></p>
        <p className="mt-3 text-sm">The $500 is a proposed working-capital target, not a verified balance or required Printful fee. Only reconciled net cash after manufacturing, shipping, Stripe fees, taxes, refunds and commitments can fund reserve growth or loan repayment. This panel does not automatically transfer or allocate money.</p>
      </aside>}
      {loading && <p role="status">Loading private orders...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && <>
        <p>{source}. Orders on this page: {orders.length}</p>
        <div className="overflow-x-auto">
          <table className="ep-data-table">
            <thead><tr>
              <th>Order</th><th>Products</th><th>Status</th>
              <th>Tracking</th><th>Retail total</th>
            </tr></thead>
            <tbody>{orders.map(order => <tr key={order.id}>
              <td>{order.reference}</td>
              <td>{order.products.map((item, i) =>
                <div key={i}>{item.name} × {item.quantity}</div>)}</td>
              <td>{order.status}</td>
              <td>{order.shipments.length ? order.shipments.map((shipment, i) =>
                <div key={i}>{shipment.carrier}{' '}
                  {shipment.trackingUrl
                    ? <a href={shipment.trackingUrl} target="_blank"
                        rel="noopener noreferrer">{shipment.trackingNumber || 'Track shipment'}</a>
                    : shipment.trackingNumber || 'Tracking pending'}
                </div>) : 'Not shipped'}</td>
              <td>{order.retailTotal === null
                ? 'Not provided'
                : String(order.retailTotal) + ' ' + (order.currency || '')}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {!orders.length && <p>No Printful orders found on this page.</p>}
        <div className="flex gap-3">
          {offset > 0 && <button type="button" className="ep-pulse-cta"
            onClick={() => { prepareLoad(); setOffset(Math.max(0, offset - 100)); }}>Previous</button>}
          {nextOffset !== null && <button type="button" className="ep-pulse-cta"
            onClick={() => { prepareLoad(); setOffset(nextOffset); }}>Next</button>}
        </div>
      </>}
    </div>}
  </section>;
}
