import type { Brick, BrickHealth, CheckoutRequest, CheckoutResult, WelcomeRequest, WelcomeResult } from '../BrickInterface';
import type { PriceContract } from '../priceContract';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
export type AdapterRequirements={id:string;files:readonly {path:string;contains:string}[];price?:()=>PriceContract;verify?:()=>Promise<string>};
/** Fail closed until runtime checks and actual side-effect-safe proof are connected. */
export function sourceAdapter(req:AdapterRequirements):Brick {
 let healthy=false;
 return {
  id:req.id,
  async health():Promise<BrickHealth>{try{
   for(const file of req.files){const body=await readFile(resolve(process.cwd(),file.path),'utf8');if(!body.includes(file.contains))throw Error(file.path+' missing '+file.contains);}
   const evidence=req.verify?await req.verify():'Source contracts found; runtime certification absent';healthy=false;return {status:503,evidence};
  }catch(e){healthy=false;return {status:503,evidence:e instanceof Error?e.message:String(e)}}},
  price(){return req.price?req.price():{amountCad:0,contractId:'unconfigured-client'}},
  async checkout(_opts:CheckoutRequest):Promise<CheckoutResult>{throw Error(req.id+' has no verified payment and entitlement socket')},
  async welcome(_payment:WelcomeRequest):Promise<WelcomeResult>{throw Error(req.id+' has no verified email and receipt delivery socket')},
  attach(){return healthy},
 };
}
