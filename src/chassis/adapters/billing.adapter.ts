import { sourceAdapter } from './sourceAdapter';
import type { PriceContract } from '../priceContract';
import type { BrickHealth } from '../BrickInterface';
export function createBillingAdapter(config:{price:()=>PriceContract;health:()=>Promise<BrickHealth>}) {return sourceAdapter({id:'billing',files:[{path:'lib/amanda-catherine/config.ts',contains:'AMANDA_OFFERS'}],price:config.price,verify:config.health});}
export const billingAdapter=createBillingAdapter({price:()=>({amountCad:0,contractId:'unconfigured-client'}),health:async()=>({status:503,evidence:'No billing client configured'})});
