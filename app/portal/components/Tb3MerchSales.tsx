'use client';
import { useEffect,useState } from 'react';
type Sale={order_id:string;product:string;amount_cents:number;customer:string;customer_email:string;
 payment_reference:string;payment_status:string;tracking:string};
export default function Tb3MerchSales({report=false}:{report?:boolean}){
 const [visible,setVisible]=useState(false),[sales,setSales]=useState<Sale[]>([]);
 const [error,setError]=useState(''),[loading,setLoading]=useState(false);
 useEffect(()=>{if(!visible)return;let active=true;setLoading(true);
 fetch('/api/tb3/bonfire/sales',{cache:'no-store'}).then(async r=>{
  if(!r.ok)throw Error('Private merch sales unavailable');
  const result=await r.json();if(active)setSales(result.sales||[]);
 }).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
 return()=>{active=false};},[visible]);
 const total=sales.reduce((sum,item)=>sum+item.amount_cents,0);
 return <section className="ep-panel" aria-label="TB3 merchandise sales">
  <div className="ep-panel-head">
   <h2 className="ep-panel-title">TB3 merch sales</h2>
   <button type="button" className="ep-pulse-cta" onClick={()=>setVisible(x=>!x)}>
    {visible?'Close sales':'Merch sales tab'}
   </button>
  </div>
  {visible?<div>
   {loading?<p>Loading private sales...</p>:null}
   {error?<p role="alert">{error}</p>:null}
   {!loading&&!error?<><p>Recorded orders: {sales.length} · Gross recorded: {(total/100).toLocaleString('en-US',{style:'currency',currency:'USD'})}</p>
    {report?<a href="/api/tb3/bonfire/sales?format=csv" className="ep-pulse-cta">Download protected Bonfire report</a>:null}
    <table className="ep-data-table"><thead><tr>
      <th>Order</th><th>Product</th><th>Customer</th><th>Status</th><th>Tracking</th><th>Amount</th>
     </tr></thead><tbody>
     {sales.map(x=><tr key={x.order_id}>
      <td>{x.payment_reference}</td><td>{x.product}</td>
      <td>{x.customer} ({x.customer_email})</td><td>{x.payment_status}</td>
      <td>{x.tracking}</td><td>{(x.amount_cents/100).toFixed(2)} USD</td>
     </tr>)}</tbody></table>
    {sales.length===0?<p>No authenticated Bonfire orders have been imported.</p>:null}
   </>:null}
  </div>:null}
 </section>;
}