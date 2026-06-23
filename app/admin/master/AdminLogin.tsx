'use client';

import { usePathname } from 'next/navigation';
import AdminSignInForm from '@/components/auth/AdminSignInForm';
import '../../portal/login/portal-login.css';

const NAVY = '#1B2B4D';

export default function AdminLogin() {
  const pathname = usePathname();
  const nextPath = pathname?.startsWith('/admin') ? pathname : '/admin/master';

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header style={{ backgroundColor: NAVY }} className="px-6 py-4">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Efficiency Architects</p>
          <h1 className="text-xl font-extrabold uppercase tracking-widest text-white">Admin Access</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-neutral-200 p-8">
            <div className="mb-5">
              <h2 className="text-base font-bold uppercase tracking-wider text-neutral-800">Master Control</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Sign in, register, or reset your password. Two-factor verification is required when email is configured.
              </p>
            </div>
            <AdminSignInForm nextPath={nextPath} />
          </div>
        </div>
      </main>
    </div>
  );
}
