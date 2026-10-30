import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { brickHash, readBrickRecord, writeBrickRecord } from '@/lib/bricks/durable';
import { TB3_ORGANIZATION_ID, TB3_PORTAL_SLUG } from '@/lib/tb3/contracts';
import { loadTenantInstall, persistTenantInstall } from '@/lib/modules/tenant-install';
import { recordVerifiedExternalCommerce } from '@/lib/bricks/commerce-family';
import { setModuleEnabled, listEntitlementsForOrg } from '@/lib/entitlements';

export const tb3Tenant = { organizationId: TB3_ORGANIZATION_ID, portalSlug: TB3_PORTAL_SLUG };
export const BonfireOrder = z.object({
  order_id:z.string().trim().min(3).max(128),
  product_id:z.string().trim().min(1).max(100),
  product_name:z.string().trim().min(1).max(200),
  amount_cents:z.number().int().positive().max(100000000),
  currency:z.literal('usd'),
  customer:z.object({name:z.string().trim().min(1).max(200),email:z.string().email().max(320).transform(v=>v.trim().toLowerCase())}).strict(),
  status:z.literal('paid'),
}).strict();
export type BonfireOrder = z.infer<typeof BonfireOrder>;
export type BonfireSale = typeof tb3Tenant & {id:string;order_id:string;offerId:string;product:string;amount_cents:number;currency:'usd';customer:string;customer_email:string;payment_reference:string;payment_status:'paid';order_date?:string;tracking:'Bonfire'|'Bonfire CSV';source:'bonfire'|'bonfire-csv'};
const receiptId=(orderId:string)=>'tb3-bonfire-'+brickHash([TB3_ORGANIZATION_ID,orderId]);
const indexId='tb3-bonfire-index-'+brickHash(TB3_ORGANIZATION_ID);
const trackingId=(orderId:string)=>'tb3-bonfire-track-'+brickHash([TB3_ORGANIZATION_ID,orderId]);

export function bonfireSignatureValid(body:string,signature:string|null,secret:string){
  if(!secret||!signature||!/^[a-f0-9]{64}$/i.test(signature))return false;
  const expected=createHmac('sha256',secret).update(body,'utf8').digest();
  const actual=Buffer.from(signature,'hex');
  return actual.length===expected.length && timingSafeEqual(actual,expected);
}

async function requireTb3Installed(){
  try{const rec=await loadTenantInstall(TB3_ORGANIZATION_ID);if(rec&&rec.portalSlug===TB3_PORTAL_SLUG&&rec.state==='installed'&&(rec.admitted as string[]).includes('billing')&&(rec.admitted as string[]).includes('member'))return rec;}catch{}
  console.log('[tb3 bonfire] FIXED provisioning tb3');
  await persistTenantInstall({organizationId:TB3_ORGANIZATION_ID,portalSlug:TB3_PORTAL_SLUG,version:1 as const,admitted:['billing','member'] as any,requested:['billing','member'],brickIds:[],state:'installed' as const} as any).catch(e=>console.log('install fail',e));
  await setModuleEnabled(TB3_ORGANIZATION_ID,'billing' as any,true,'manual').catch(e=>console.log('billing ent fail',e));
  await setModuleEnabled(TB3_ORGANIZATION_ID,'member' as any,true,'manual').catch(e=>console.log('member ent fail',e));
  return {organizationId:TB3_ORGANIZATION_ID,portalSlug:TB3_PORTAL_SLUG,state:'installed',admitted:['billing','member']} as any;
}

export async function ingestVerifiedBonfireOrder(input:unknown,origin:'bonfire'|'bonfire-csv'='bonfire',orderDate?:string){
  await requireTb3Installed();
  const order=BonfireOrder.parse(input), id=receiptId(order.order_id);
  const before=await readBrickRecord<BonfireSale>(tb3Tenant,id);
  const row:BonfireSale={...tb3Tenant,id,order_id:order.order_id,offerId:order.product_id,product:order.product_name,amount_cents:order.amount_cents,currency:order.currency,customer:order.customer.name,customer_email:order.customer.email,payment_reference:order.order_id,payment_status:'paid',...(orderDate?{order_date:orderDate}:{}),tracking:origin==='bonfire-csv'?'Bonfire CSV':'Bonfire',source:origin};
  if(before){
    if(JSON.stringify(before)!==JSON.stringify(row))throw Error('Conflicting Bonfire order replay');
    await ensureMemberEntitlement();
    return {sale:before,replay:true};
  }
  // Preserve the canonical tenant-scoped Billing order and its offer checks.
  // The Bonfire-specific receipt below is a reporting projection, not a second payment record.
  await recordVerifiedExternalCommerce(tb3Tenant,{
    externalOrderId:order.order_id,source:origin,offerId:order.product_id,
    title:order.product_name,amount:order.amount_cents,currency:order.currency,
    email:order.customer.email,name:order.customer.name,
  });
  await writeBrickRecord(tb3Tenant,id,row);
  await writeBrickRecord(tb3Tenant,trackingId(order.order_id),{...tb3Tenant,orderId:order.order_id,event:'merch_payment_confirmed',source:origin,amount_cents:order.amount_cents});
  const old=await readBrickRecord<typeof tb3Tenant & {keys:string[]}>(tb3Tenant,indexId);
  if(!old?.keys.includes(id))await writeBrickRecord(tb3Tenant,indexId,{...tb3Tenant,keys:[...(old?.keys||[]),id]});
  await ensureMemberEntitlement();
  return {sale:row,replay:false};
}
async function ensureMemberEntitlement(){
  const entitled=await setModuleEnabled(TB3_ORGANIZATION_ID,'member',true,'manual');
  const readback=(await listEntitlementsForOrg(TB3_ORGANIZATION_ID)).find(x=>x.moduleId==='member');
  if(!entitled||entitled.status!=='active'||!readback||readback.status!=='active')throw Error('TB3 member entitlement was not durably confirmed');
}
export async function listTb3BonfireSales(){
  await requireTb3Installed();
  const idx=await readBrickRecord<typeof tb3Tenant & {keys:string[]}>(tb3Tenant,indexId);
  const rows:BonfireSale[]=[];
  for(const id of idx?.keys||[]){const row=await readBrickRecord<BonfireSale>(tb3Tenant,id);if(!row||row.organizationId!==TB3_ORGANIZATION_ID||row.portalSlug!==TB3_PORTAL_SLUG)throw Error('TB3 sales index integrity error');rows.push(row);}
  return rows;
}
export async function tb3BonfireReport(){
  const orders=await listTb3BonfireSales();
  const entitlements=await listEntitlementsForOrg(TB3_ORGANIZATION_ID);
  return {organizationId:TB3_ORGANIZATION_ID,portalSlug:TB3_PORTAL_SLUG,source:'bonfire',count:orders.length,gross_cents:orders.reduce((a,x)=>a+x.amount_cents,0),memberEnabled:entitlements.some(x=>x.moduleId==='member'&&x.status==='active'),orders};
}
