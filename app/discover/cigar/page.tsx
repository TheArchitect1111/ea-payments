import { notFound } from 'next/navigation';
import CigarJourney from './CigarJourney';
import Link from 'next/link';

/** Deliberately never available in production, even if its flag is mistakenly set. */
export default function CigarCtpPreviewPage() {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview') notFound();
  return <><CigarJourney /><div className="bg-[#F6F0E6] px-5 pb-10 text-center"><Link className="text-sm font-semibold underline" href="/discover/cigar/inbox">Explore the Vendor Inbox &amp; Reporting Tracker preview</Link></div></>;
}