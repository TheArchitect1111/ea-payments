import {createHmac,timingSafeEqual} from 'node:crypto';

/** Calendly v2: t=<Unix seconds>,v1=<HMAC-SHA256 of "t.rawBody">. */
export function verifyCigarCalendlySignature(
 rawBody:string,
 header:string|null,
 signingKey:string,
 nowMs=Date.now(),
):boolean {
 if(!signingKey||!header||rawBody.length>65536)return false;
 const fields=Object.fromEntries(header.split(',').map(s=>s.trim().split('=',2)));
 const stamp=fields.t, supplied=fields.v1;
 if(!stamp||!/^[0-9]{10,12}$/.test(stamp)||!supplied||!/^[a-f0-9]{64}$/i.test(supplied))return false;
 const diff=Math.abs(nowMs-Number(stamp)*1000);
 if(!Number.isFinite(diff)||diff>180000)return false;
 const expected=createHmac('sha256',signingKey).update(stamp+'.'+rawBody).digest();
 const provided=Buffer.from(supplied,'hex');
 return provided.length===expected.length&&timingSafeEqual(provided,expected);
}
