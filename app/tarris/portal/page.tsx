import Link from 'next/link';
import { redirect } from 'next/navigation';
import { canTrackPaidAccess } from '@/lib/tb3/access-owner';
import { ownerAccessRows } from '@/lib/tb3/paid-access';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'TB3 Access Tracking', robots: 'noindex, nofollow', referrer: 'no-referrer' as const };
export default async function PaidAccessTracking() {
  if (!(await canTrackPaidAccess())) redirect('/portal/login?next=%2Ftarris%2Fportal');
  let records;
  try { records = await ownerAccessRows(); }
  catch { return <main className="mx-auto max-w-6xl p-8"><h1>TB3 Access Tracking</h1><p>Live access tracking is temporarily unavailable. No empty ledger is being reported.</p></main>; }
  return <main className="mx-auto max-w-6xl p-8"><Link href="/tarris/future">← TB3 HQ</Link><h1 className="my-6 text-3xl font-bold">TB3 Access Tracking</h1><p className="mb-4">Latest 100 paid access records and latest 100 access events. Expiry and status are shown with each entitlement.</p><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Email','Date','Entitlement','Last Access','Activity'].map(label=><th key={label} className="border-b p-3">{label}</th>)}</tr></thead><tbody>{records.map(record=><tr key={record.id}>{[record.fields.Email,record.fields.Timestamp,`${record.fields.Entitlement} · ${record.fields.Status} · expires ${record.fields['Expires At']}`,record.fields['Last Access'] || 'Not accessed',record.fields.Activity].map((value,index)=><td key={index} className="border-b p-3 align-top whitespace-pre-wrap">{String(value || '')}</td>)}</tr>)}</tbody></table></div>{records.length===0 && <p className="mt-5">No completed live TB3 purchases have been recorded.</p>}</main>;
}
