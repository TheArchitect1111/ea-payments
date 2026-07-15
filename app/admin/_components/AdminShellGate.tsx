'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** Skip TailAdmin chrome on auth entry pages. */
export default function AdminShellGate({
  chrome,
  children,
}: {
  chrome: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() || '';
  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/login/') ||
    pathname === '/admin/forgot-password' ||
    pathname.startsWith('/admin/forgot-password')
  ) {
    return <>{children}</>;
  }
  return (
    <>
      {chrome}
    </>
  );
}
