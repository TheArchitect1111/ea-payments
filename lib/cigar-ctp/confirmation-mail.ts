import {createHash} from 'node:crypto';
/** Cigar-only provider retry protection. Persist returned ID before claiming confirmation. */
export async function sendCigarConfirmation(inviteeUri:string,payload:{to:string;from?:string;subject:string;html:string},fetcher:typeof fetch=fetch):Promise<{id:string}>{
 const key=process.env.RESEND_API_KEY?.trim();
 if(!key||!payload.from)throw new Error('Cigar confirmation configuration unavailable.');
 const response=await fetcher('https://api.resend.com/emails',{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'cigar-confirmation/'+createHash('sha256').update(inviteeUri).digest('hex')},body:JSON.stringify(payload)});
 if(!response.ok)throw new Error('Cigar confirmation provider returned '+response.status+'.');
 const data=await response.json() as {id?:string};
 if(!data.id)throw new Error('Cigar confirmation provider did not return a message ID.');
 return {id:data.id};
}
