import 'server-only';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
type Payload={iss:string;aud:string;email:string;courseId:string;role:'student';iat:number;exp:number;jti:string};
const issuer='ea-amanda-preview';const audience='frappe-learning-mock';
const used=new Map<string,number>();
const enabled=()=>process.env.VERCEL_ENV==='preview'&&!!process.env.FRAPPE_BRIDGE_SECRET&&process.env.FRAPPE_BRIDGE_SECRET.length>=32;
const enc=(x:unknown)=>Buffer.from(JSON.stringify(x)).toString('base64url');
const sig=(data:string)=>createHmac('sha256',process.env.FRAPPE_BRIDGE_SECRET!).update(data).digest('base64url');
export function mockAllowed(email:string){return ['test@amandacatherine.ca','brickmail1@gmail.com'].includes(email.trim().toLowerCase());}
export function mockEnabled(){return enabled();}
export function mintMock(email:string,courseId:string){
 if(!enabled()||!mockAllowed(email)||courseId!=='wood-therapy-certification')throw new Error('bridge denied');
 const now=Math.floor(Date.now()/1000);
 const p:Payload={iss:issuer,aud:audience,email:email.toLowerCase(),courseId,role:'student',iat:now,exp:now+300,jti:randomUUID()};
 const data=enc({alg:'HS256',typ:'JWT'})+'.'+enc(p);return data+'.'+sig(data);
}
export function verifyMock(token:string){
 if(!enabled())return {email:null,courseAccess:false,reason:'disabled'};
 const parts=token.split('.');if(parts.length!==3)return {email:null,courseAccess:false,reason:'format'};
 const data=parts[0]+'.'+parts[1];
 const expected=Buffer.from(sig(data));const got=Buffer.from(parts[2]);
 if(got.length!==expected.length||!timingSafeEqual(got,expected))return {email:null,courseAccess:false,reason:'signature'};
 let p:Payload;
 try {p=JSON.parse(Buffer.from(parts[1],'base64url').toString())}catch{return {email:null,courseAccess:false,reason:'format'}}
 const now=Math.floor(Date.now()/1000);
 if(p.iss!==issuer||p.aud!==audience||p.role!=='student'||p.courseId!=='wood-therapy-certification'||!mockAllowed(p.email)||!p.jti||!Number.isFinite(p.iat)||!Number.isFinite(p.exp)||p.iat>now+5||p.exp>p.iat+300)return {email:null,courseAccess:false,reason:'claims'};
 if(p.exp<=now)return {email:null,courseAccess:false,reason:'expired'};
 for(const [id,exp] of used)if(exp<=now)used.delete(id);
 if(used.has(p.jti))return {email:null,courseAccess:false,reason:'replay'};
 used.set(p.jti,p.exp);return {email:p.email,courseAccess:true,reason:'ok'};
}
