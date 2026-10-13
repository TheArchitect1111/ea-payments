import {notFound} from 'next/navigation';
import CigarJourney from '@/app/discover/cigar/CigarJourney';

/** Dedicated Cigar CTP route. The existing /ctp route remains unchanged. */
export default function CigarCtpLiveRoute() {
  const live = process.env.VERCEL_ENV === 'production' &&
    process.env.CIGAR_CTP_LIVE_SUBMISSIONS_ENABLED === 'true';
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview' && !live) {
    notFound();
  }
  return <CigarJourney live={live} />;
}
