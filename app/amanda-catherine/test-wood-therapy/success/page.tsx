import { Suspense } from 'react';
import AmandaEnrollmentSuccess from '@/app/portal/amanda-catherine/enroll/success/AmandaEnrollmentSuccess';
export const metadata = { title: 'Wood Therapy test enrollment', robots: { index: false, follow: false } };
export default function Page() { return <Suspense fallback={<p>Confirming your test enrollment…</p>}><AmandaEnrollmentSuccess testCheckout /></Suspense>; }
