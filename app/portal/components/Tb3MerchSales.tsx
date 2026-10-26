'use client';
import { useEffect, useState } from 'react';
import tb3Catalog from '../../../public/tb3/merch/manifest.json';

type Order = {
  id: number;
  reference: string;
  status: string;
  products: { name: string; quantity: number }[];
  retailTotal: string | number | null;
  currency: string | null;
  fulfillmentCost: string | number | null;
  fulfillmentCurrency: string | null;
  shipments: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string | null;
  }[];
};

export default function Tb3MerchSales({ report = false, canAudit = false }: { report?: boolean; canAudit?: boolean }) {
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
    attributedInstagramOrders: number;
    attributedInstagramGrossCents: number;
    attributionNote: string;
    grossCollectedCents: number;
    feeDetailsComplete: boolean;
    recentStripeFeeCents: number;
    recentStripeNetCents: number | null;
    hasMore: boolean;
    note: string;
  } | null>(null);
  const [paymentsMessage, setPaymentsMessage] = useState('');
  const [catalogAudit, setCatalogAudit] = useState<{ verified: boolean; matchedProductCount: number; configuredProductCount: number; products: {id:string;status:string}[] } | null>(null);
  const [catalogAuditError, setCatalogAuditError] = useState('');
  const [auditing, setAuditing] = useState(false);
  const [launchCheck, setLaunchCheck] = useState<{merchantReady:boolean;printfulProductsMatched:number;printfulCatalogVerified:boolean;readyForRealOrderTest:boolean;nextGate:string}|null>(null);
  const [launchCheckError, setLaunchCheckError] = useState('');
  const [checkingLaunch, setCheckingLaunch] = useState(false);

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
      <p>Fulfillment status, tracking, and available manufacturing costs from Printful. These figures are not proof of an actual charge. Retail totals and fulfillment costs alone do not establish settled revenue, net profit, refunds, or payouts.</p>
      {report && <>
        {payments ? <div role="status">
          <p>Verified paid checkouts (most recent 100 sessions): {payments.verifiedPaidOrderCount}</p>
          <p>Gross collected: ${(payments.grossCollectedCents / 100).toFixed(2)} USD</p>
          <p>Instagram-attributed paid orders: {payments.attributedInstagramOrders} · Gross ${(payments.attributedInstagramGrossCents / 100).toFixed(2)} USD</p>
          <p className="text-sm">{payments.attributionNote}</p>
          <p>Stripe fees (recent verified sessions): ${(payments.recentStripeFeeCents / 100).toFixed(2)} USD</p>
          <p>Stripe net (verified session subset): {payments.feeDetailsComplete && payments.recentStripeNetCents !== null
            ? (payments.recentStripeNetCents / 100).toFixed(2) + ' USD'
            : 'Reconciliation incomplete'}</p>
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
      {report && canAudit && <div className="mt-4 rounded-lg border border-black/15 p-4">
        <h3 className="text-lg font-bold">TB3 live commerce readiness</h3>
        <button type="button" className="ep-pulse-cta" disabled={checkingLaunch}
          onClick={async()=>{
            setCheckingLaunch(true);setLaunchCheck(null);setLaunchCheckError('');
            try{
              const response=await fetch('/api/tb3/merch/readiness',{cache:'no-store'});
              if(!response.ok)throw new Error('Provider readiness check unavailable.');
              setLaunchCheck(await response.json());
            }catch(error){
              setLaunchCheckError(error instanceof Error?error.message:'Unable to check readiness.');
            }finally{setCheckingLaunch(false);}
          }}>
          {checkingLaunch?'Checking Stripe and Printful...':'Run private launch-readiness check'}
        </button>
        {launchCheckError && <p role="alert">{launchCheckError}</p>}
        {launchCheck && <div role="status" className="mt-3 text-sm">
          <p>Stripe merchant charges/payouts ready: {launchCheck.merchantReady?'Yes':'No'}</p>
          <p>Printful products verified: {launchCheck.printfulProductsMatched}/14
            {launchCheck.printfulCatalogVerified?' (verified)':' (incomplete)'}</p>
          <p>Ready for separately approved live test order: {launchCheck.readyForRealOrderTest?'Yes':'No'}</p>
          <p>{launchCheck.nextGate}</p>
          <p>Live sale and repayment are never certified by this check.</p>
        </div>}
      </div>}
      {report && canAudit && <div className="mt-4">
        <button type="button" className="ep-pulse-cta" disabled={auditing}
          onClick={async () => {
            setAuditing(true); setCatalogAuditError(''); setCatalogAudit(null);
            try {
              const response = await fetch('/api/tb3/printful/catalog-audit', {cache:'no-store'});
              if (!response.ok) throw new Error('Live Printful catalog verification unavailable.');
              setCatalogAudit(await response.json());
            } catch (error) {
              setCatalogAuditError(error instanceof Error ? error.message : 'Catalog unavailable.');
            } finally { setAuditing(false); }
          }}>
          {auditing ? 'Checking Printful catalog...' : 'Verify 14 products against Printful'}
        </button>
        {catalogAuditError && <p role="alert">{catalogAuditError}</p>}
        {catalogAudit && <div role="status">
          <p>Live Printful match: {catalogAudit.matchedProductCount}/{catalogAudit.configuredProductCount}
            {catalogAudit.verified ? ' · All configured product variants matched' : ' · Attention required'}</p>
          {!catalogAudit.verified && <ul>{catalogAudit.products.filter(item => item.status !== 'matched')
            .map(item => <li key={item.id}>{item.id}: {item.status}</li>)}</ul>}
          <p>Product existence and variant IDs only. Print artwork, shipping, costs and funding require separate confirmation.</p>
        </div>}
      </div>}
      {report && <details className="mt-5 rounded-lg border border-black/15 p-4">
        <summary className="cursor-pointer font-semibold">TB3 merchandise catalog · {tb3Catalog.length} products</summary>
        <p className="mt-2 text-sm">The storefront and this portal read the same configured product manifest. Provider publication and current stock require separate Printful verification.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tb3Catalog.map(product => <div key={product.id} className="min-w-0 border border-black/10 p-2">
            <img src={product.image} alt={product.name} loading="lazy" className="aspect-square w-full object-contain" />
            <p className="mt-2 text-xs font-semibold">{product.name}</p>
            <p className="text-xs">${product.price.toFixed(2)} {product.currency}</p>
            <p className="text-xs">{product.variants.length} size/variant options</p>
          </div>)}
        </div>
        <a href="/tarris#merch" className="mt-3 inline-block underline">View the public TB3 merchandise page</a>
      </details>}
      {loading && <p role="status">Loading private orders...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && <>
        <p>{source}. Orders on this page: {orders.length}</p>
        <div className="overflow-x-auto">
          <table className="ep-data-table">
            <thead><tr>
              <th>Order</th><th>Products</th><th>Status</th>
              <th>Tracking</th><th>Retail total</th><th>Printful cost</th>
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
              <td>{order.fulfillmentCost === null
                ? 'Not provided'
                : String(order.fulfillmentCost) + ' ' + (order.fulfillmentCurrency || '')}</td>
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
