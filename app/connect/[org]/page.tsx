import { getConnectOrg } from '@/lib/connect-store';
import ConnectCapture from './ConnectCapture';
import './connect.css';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ org: string }>;
  searchParams: Promise<{
    event?: string;
    rep?: string;
    source?: string;
    campaign?: string;
  }>;
};

export default async function ConnectPage({ params, searchParams }: Props) {
  const { org: orgSlug } = await params;
  const query = await searchParams;
  const org = await getConnectOrg(orgSlug);

  return (
    <ConnectCapture
      org={org}
      event={query.event}
      representative={query.rep}
      source={query.source}
      campaignId={query.campaign}
    />
  );
}
