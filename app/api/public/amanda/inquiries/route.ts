import { z } from 'zod';
import { sendEmail } from '@ea/portal-chassis/email';
import { checkRateLimit } from '@/lib/ai/rate-limit';

const schema = z.object({
  intent: z.enum(['speaking','advisory','interview','partnership','mentorship','kit']),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(4000),
  organization: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  event: z.string().trim().max(200).optional(),
  date: z.string().max(20).optional(),
  audience: z.string().trim().max(400).optional(),
  websiteCheck: z.string().max(200).optional(),
});
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({error:'Please submit from Amanda’s page.'},{status:403});
  if (Number(request.headers.get('content-length') || 0) > 20_000) return Response.json({error:'Please shorten your inquiry.'},{status:413});
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(`amanda-public-inquiry:${ip}`,6,60_000).ok) return Response.json({error:'Please wait one minute before trying again.'},{status:429});
  const raw = await request.text();
  if (raw.length > 20_000) return Response.json({error:'Please shorten your inquiry.'},{status:413});
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return Response.json({error:'Please enter a valid inquiry.'},{status:400}); }
  const parsed = schema.safeParse(body);
  if (!parsed.success || parsed.data.websiteCheck) return Response.json({error:'Please check your name, email and message.'},{status:400});
  // Preview verification must never transmit an inquiry or send an email.
  if (process.env.VERCEL_ENV !== 'production') return Response.json({ok:true,preview:true});
  if (process.env.AMANDA_PUBLIC_INQUIRIES_ENABLED !== '1' || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return Response.json({error:'Please email Amanda directly to complete your inquiry.'},{status:503});
  const fields = Object.entries(parsed.data).filter(([key,value])=>key!=='websiteCheck' && value);
  try {
    await sendEmail({to:'Amanda@aesthetikine.com',subject:`Amanda Catherine inquiry: ${parsed.data.intent}`,html:`<h1>New Amanda Catherine inquiry</h1>${fields.map(([key,value])=>`<p><strong>${escape(key)}</strong><br/>${escape(value).replace(/\n/g,'<br/>')}</p>`).join('')}`});
    return Response.json({ok:true,preview:false});
  } catch { return Response.json({error:'Unable to send. Please email Amanda directly.'},{status:502}); }
}
