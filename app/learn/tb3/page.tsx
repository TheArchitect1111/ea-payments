import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TB3_ACCESS_COOKIE, validateAccessToken, recordAccess } from '@/lib/tb3/paid-access';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your TB3 Access', robots: 'noindex, nofollow', referrer: 'no-referrer' as const };
export default async function Tb3PaidAccess({searchParams}:{searchParams:Promise<{entitlement?:string}>}) {
  const query = await searchParams;
  if (query.entitlement) redirect(`/api/tarris/access/enter?entitlement=${encodeURIComponent(query.entitlement)}`);
  const token = (await cookies()).get(TB3_ACCESS_COOKIE)?.value || '';
  let record;
  try { record = await validateAccessToken(token); }
  catch { return <main className="p-8"><h1>TB3 Access</h1><p>Access verification is temporarily unavailable.</p></main>; }
  if (!record) return <main className="p-8"><h1>TB3 Access</h1><p>A valid, unexpired paid access link is required.</p><Link href="/tarris">Return to TB3</Link></main>;
  try { await recordAccess(record,'learning-opened'); }
  catch { return <main className="p-8"><h1>TB3 Access</h1><p>Activity tracking is unavailable. Please try again.</p></main>; }
  return <main className="mx-auto max-w-4xl p-8"><h1 className="text-3xl font-bold">Your TB3 Access</h1><p className="mt-4">Access confirmed for {String(record.fields.Email)}.</p><p>Expires: {String(record.fields['Expires At'])}</p><p className="mt-4">Your visit has been saved to the TB3 activity ledger.</p><Link href="/tarris" className="mt-6 inline-block underline">Return to TB3</Link></main>;
}
