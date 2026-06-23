'use client';

import Link from 'next/link';

type AuthRealm = 'admin' | 'portal' | 'partner' | 'simplifi';

const PATHS: Record<AuthRealm, { signIn: string; register: string; forgot: string }> = {
  admin: {
    signIn: '/admin/login',
    register: '/admin/register',
    forgot: '/admin/forgot-password',
  },
  portal: {
    signIn: '/portal/login',
    register: '/portal/register',
    forgot: '/portal/forgot-password',
  },
  partner: {
    signIn: '/partners/login',
    register: '/partners/register',
    forgot: '/partners/forgot-password',
  },
  simplifi: {
    signIn: '/simplifi/login',
    register: '/simplifi/register',
    forgot: '/simplifi/forgot-password',
  },
};

export default function AuthNav({
  realm,
  active,
}: {
  realm: AuthRealm;
  active: 'sign-in' | 'register' | 'forgot-password';
}) {
  const paths = PATHS[realm];

  return (
    <nav className="pl-auth-nav" aria-label="Account options">
      <Link href={paths.signIn} className={active === 'sign-in' ? 'is-active' : undefined} prefetch={false}>
        Sign in
      </Link>
      <Link href={paths.register} className={active === 'register' ? 'is-active' : undefined} prefetch={false}>
        Register
      </Link>
      <Link
        href={paths.forgot}
        className={active === 'forgot-password' ? 'is-active' : undefined}
        prefetch={false}
      >
        Password reset
      </Link>
    </nav>
  );
}
