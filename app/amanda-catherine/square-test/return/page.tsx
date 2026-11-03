import { Suspense } from 'react';
import SquareTestReturn from './SquareTestReturn';
export const metadata = { title: 'Confirm Wood Therapy test enrollment', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function Page() { return <Suspense fallback={<p>Checking your test payment…</p>}><SquareTestReturn /></Suspense>; }
