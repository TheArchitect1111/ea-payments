import Image from 'next/image';
import RealmLoginCard from '@/components/auth/RealmLoginCard';
import { getRealmLoginCopy, magicLinkErrorMessage } from '@/lib/auth/realm-login-copy';
import '../../portal/login/portal-login.css';

export const metadata = {
  title: 'Admin Sign In · Efficiency Architects',
  robots: { index: false, follow: false },
};

const copy = getRealmLoginCopy('admin');

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith('/admin') ? params.next : '/admin/master';
  const error = magicLinkErrorMessage('admin', params.error);

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/ea-logo.png" alt="Efficiency Architects" width={200} height={200} className="pl-logo" priority />
          <p className="pl-eyebrow">Master Portal</p>
          <h1 className="pl-title">{copy.pageTitle}</h1>
          <p className="pl-lede">{copy.pageSubtitle}</p>
        </header>

        <RealmLoginCard realm="admin" next={nextPath} error={error} showTitle={false} />
      </div>
    </div>
  );
}
