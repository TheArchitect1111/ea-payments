'use client';

import { usePathname } from 'next/navigation';
import EAGuideOrb from '@/app/components/ea-guide/EAGuideOrb';

/** Keep the standard EA Guide on discovery pages, but exclude the focused cigar assessment. */
export default function DiscoverGuide() {
  const pathname = usePathname() ?? '';
  if (pathname === '/discover/cigar' || pathname.startsWith('/discover/cigar/')) return null;
  return <EAGuideOrb />;
}
