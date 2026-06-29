import { Suspense } from 'react';
import PortalClerkCompleteClient from './PortalClerkCompleteClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Portal Sign In · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default function PortalClerkCompletePage() {
  return (
    <Suspense fallback={<div className="pl-page"><div className="pl-card">Loading…</div></div>}>
      <PortalClerkCompleteClient />
    </Suspense>
  );
}
