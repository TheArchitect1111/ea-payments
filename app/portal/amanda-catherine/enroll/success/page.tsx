import { Suspense } from 'react';
import AmandaEnrollmentSuccess from './AmandaEnrollmentSuccess';

export const metadata = { title: 'Enrollment confirmed | Amanda Catherine' };

export default function AmandaEnrollmentSuccessPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#102018] text-white">Confirming your enrollment…</main>}>
      <AmandaEnrollmentSuccess />
    </Suspense>
  );
}
