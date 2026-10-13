import {notFound} from 'next/navigation';
import Link from 'next/link';
import VendorInboxPreview from '../VendorInboxPreview';
export default function VendorSimulator(){
 if(process.env.NODE_ENV==='production'&&process.env.VERCEL_ENV!=='preview')notFound();
 return <main className="min-h-screen bg-[#F6F0E6] px-5 py-12 text-[#1C211B]">
   <div className="mx-auto max-w-3xl">
    <Link className="text-sm underline" href="/discover/cigar">← Back to Cigar CTP</Link>
    <div className="mt-8 text-xs font-bold uppercase tracking-widest text-amber-700">Efficiency Architects · Cigar Industry OS</div>
    <h1 className="mt-4 text-4xl font-bold">Vendor Communications &amp; Report Accountability</h1>
    <p className="mt-5 leading-7 text-stone-600">Explore how a dedicated business inbox could request overdue reports, acknowledge receipt and route substantive questions for owner review. This is a simulated workflow. No address has been provisioned or mail sent.</p>
    <VendorInboxPreview businessName="Sample Cigar Business" />
    <p className="mt-8 text-sm text-stone-600">Production prerequisites: owner-approved tenant domain, DNS verification, SPF/DKIM/DMARC, mailbox provider, verified vendor list, audit log, sending limits and retention policy.</p>
   </div>
 </main>;
}
