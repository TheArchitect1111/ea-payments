import type { Brick, BrickHealth, CheckoutRequest, CheckoutResult, WelcomeRequest, WelcomeResult } from '../BrickInterface';
import { PRICE_CONTRACT } from '../priceContract';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export type AdapterRequirements={id:string;files:readonly {path:string;contains:string}[]; verify?:()=>Promise<string>};
/** Source evidence is not equivalent to runtime certification. Never fabricate a payment or mail ID. */
export function sourceAdapter(req:AdapterRequirements):Brick {
 let healthy=false;
 return {
  id:req.id,
  async health():Promise<BrickHealth>{
   try{for(const file of req.files){const body=await readFile(resolve(process.cwd(),file.path),'utf8');if(!body.includes(file.contains))throw Error(file.path+' missing '+file.contains);}
    const evidence=req.verify?await req.verify():'Source contracts found, runtime certification absent';
    healthy=false;
    return {status:503,evidence};
   }catch(e){healthy=false;return {status:503,evidence:e instanceof Error?e.message:String(e)}}
  },
  price(){return {amountCad:0,contractId:PRICE_CONTRACT.id}},
  async checkout(_opts:CheckoutRequest):Promise<CheckoutResult>{throw Error(req.id+' has no verified payment and entitlement socket')},
  async welcome(_payment:WelcomeRequest):Promise<WelcomeResult>{throw Error(req.id+' has no verified email and receipt delivery socket')},
  attach(){return healthy},
 };
}
