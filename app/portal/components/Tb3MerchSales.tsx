'use client';
import { useEffect, useState } from 'react';

type CommerceOrder = {
  orderReference: string;
  paymentStatus: string;
  capturedCents: number;
  refundStatus: string;
  refundedCents: number | null;
  fulfillmentStatus: string;
  fulfillmentSyncStatus: string;
  tracking: { status: string; trackingNumber: string; trackingUrl: string }[];
  items: { name: string; size: string; quantity: number; unitAmountCents: number }[];
  createdAt: string;
};
type Report = {
  orders: CommerceOrder[];
  summary: {
    orderCount: number;
    capturedOrderCount: number;
    grossCapturedCents: number;
    refundedCents: number | null;
    netAfterRefundsCents: number | null;
    reconciliation: string;
  };
};
const money = (cents: number | null) => cents == null
  ? 'Review required'
  : (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function Tb3MerchSales({ report = false }: { report?: boolean }) {
  const [visible, setVisible] = useState(report);
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    fetch('/api/tb3/paypal/report', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Private TB3 commerce report unavailable.');
        return response.json() as Promise<Report>;
      })
      .then(result => { if (active) { setData(result); setError(''); } })
      .catch(() => { if (active) setError('Private TB3 commerce report unavailable.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [visible]);
  return <section className="ep-panel" aria-label="TB3 PayPal merchandise orders">
    <div className="ep-panel-head">
      <h2 className="ep-panel-title">TB3 merchandise orders</h2>
      {!report ? <button type="button" className="ep-pulse-cta" onClick={() => setVisible(v => !v)}>
        {visible ? 'Close orders' : 'Merchandise orders'}
      </button> : null}
    </div>
    {visible ? <div>
      {loading || (visible && !data && !error) ? <p>Loading private merchandise records…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {data && !error ? <>
        <dl aria-label="Commerce reconciliation summary" className="ep-module-list">
          <div><dt>Orders</dt><dd>{data.summary.orderCount}</dd></div>
          <div><dt>Captured orders</dt><dd>{data.summary.capturedOrderCount}</dd></div>
          <div><dt>Gross captured</dt><dd>{money(data.summary.grossCapturedCents)}</dd></div>
          <div><dt>Refunded</dt><dd>{money(data.summary.refundedCents)}</dd></div>
          <div><dt>Net after refunds</dt><dd>{money(data.summary.netAfterRefundsCents)}</dd></div>
        </dl>
        {data.summary.reconciliation !== 'ledger totals reconciled' ? <p role="status">Refund amount requires review before net revenue can be reconciled.</p> : null}
        {data.orders.length ? <div style={{ overflowX: 'auto' }}><table className="ep-data-table">
          <thead><tr><th>PayPal order</th><th>Items</th><th>Payment</th><th>Refund</th><th>Fulfillment</th><th>Tracking</th><th>Captured</th></tr></thead>
          <tbody>{data.orders.map(order => <tr key={order.orderReference}>
            <td>{order.orderReference}<br /><small>{new Date(order.createdAt).toLocaleDateString()}</small></td>
            <td>{order.items.map((item, index) => <div key={`${item.name}-${item.size}-${index}`}>{item.quantity} × {item.name} ({item.size})</div>)}</td>
            <td>{order.paymentStatus}</td>
            <td>{order.refundStatus}{order.refundedCents == null ? '' : ` · ${money(order.refundedCents)}`}</td>
            <td>{order.fulfillmentStatus}{order.fulfillmentSyncStatus !== 'current' ? <small className="block">Printful sync: {order.fulfillmentSyncStatus.replaceAll('_', ' ')}</small> : null}</td>
            <td>{order.tracking.length ? order.tracking.map((shipment, index) => <div key={`${shipment.trackingNumber}-${index}`}>
              {shipment.trackingUrl ? <a href={shipment.trackingUrl} target="_blank" rel="noreferrer">{shipment.trackingNumber || 'Track shipment'}</a> : shipment.trackingNumber || 'Tracking available'} ({shipment.status})
            </div>) : 'Not shipped'}</td>
            <td>{money(order.capturedCents)}</td>
          </tr>)}</tbody>
        </table></div> : <p>No PayPal merchandise orders are recorded.</p>}
      </> : null}
    </div> : null}
  </section>;
}
