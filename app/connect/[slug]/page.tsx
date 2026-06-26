import { notFound } from 'next/navigation';
import { getConnectProfileBySlug } from '@/lib/connect-store';
import ConnectPageClient from './ConnectPageClient';
import './connect.css';

export const dynamic = 'force-dynamic';

export default async function ConnectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const profile = await getConnectProfileBySlug(slug);

  if (!profile || !profile.isActive) notFound();

  return <ConnectPageClient profile={profile} initialQuery={query} />;
}
