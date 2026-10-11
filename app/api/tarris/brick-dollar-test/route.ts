import {NextRequest} from 'next/server';
import {z} from 'zod';
import {registerTb3Event} from '@/lib/tb3/brick-events';
const Body=z.object({testId:z.string().regex(/^[a-zA-Z0-9_-]{8,48}$/),
 brick_type:z.enum(['booking','calendar','classes','checkout','payments']).default('payments'),
 email:z.string().email(),name:z.string().trim().min(1).max(150)}).strict();
export async function GET(){return Response.json({error:'Not found'},{status:404});}
export async function POST(req:NextRequest){
 if(process.env.VERCEL_ENV!=='preview'||!process.env.TB3_BRICK_TEST_KEY)
  return Response.json({error:'Not found'},{status:404});
 if(req.headers.get('x-tb3-test-key')!==process.env.TB3_BRICK_TEST_KEY)
  return Response.json({error:'Unauthorized'},{status:401});
 const parsed=Body.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:'Invalid test fixture'},{status:400});
 const {testId,brick_type,email,name}=parsed.data;
 const registration_id='tb3-preview-dollar-'+testId,brick_id='tb3-'+brick_type;
 const timestamp=new Date().toISOString();
 // This simulates a verified provider result. It never calls Stripe,
 // posts a live payment, sends a real confirmation letter, or grants access.
 const signup=await registerTb3Event({brick_type,brick_id,registration_id,name,email,status:'submitted',
  source:'tb3-preview-dollar',is_test:true,timestamp});
 if(!signup.ok)return Response.json({error:'Isolated signup failed'},{status:503});
 const payment_reference='pi_fixture_tb3_'+testId;
 const payment=await registerTb3Event({brick_type:'payments',brick_id,registration_id,name,email,
  status:'payment_confirmed',payment_status:'paid',payment_reference,source:'tb3-preview-dollar',
  is_test:true,timestamp},
  {event_type:'payment_confirmed',client_id:'tarris',registration_id,email:email.toLowerCase(),
  class_id:brick_id,payment_status:'paid',payment_reference,payment_provider:'stripe',timestamp,is_test:true});
 if(!payment.ok)return Response.json({error:'Isolated payment verification failed'},{status:503});
 return Response.json({ok:true,testOnly:true,liveCharge:false,amountCents:100,registration_id,
  payment_reference,tracking:'isolated',sameRecord:signup.id===payment.id,alreadyPaid:payment.alreadyPaid===true},
  {headers:{'Cache-Control':'no-store'}});
}
