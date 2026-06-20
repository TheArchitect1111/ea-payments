import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { getCaptures } from '@/lib/capture-records';
import { getProposalsWithAssessments } from '@/lib/airtable';
import {
  buildPlatformTwin,
  buildCaptureTwin,
  listTwinEntities,
} from '@/lib/digital-twin';
import AdminLogin from '../master/AdminLogin';
import DigitalTwinClient from './DigitalTwinClient';

export const dynamic = 'force-dynamic';

export default async function DigitalTwinPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  const [captures, proposals] = await Promise.all([
    getCaptures(30),
    getProposalsWithAssessments(),
  ]);

  const platformTwin = buildPlatformTwin(captures, proposals);
  const entities = listTwinEntities(captures, proposals);
  const captureTwins = captures.slice(0, 15).map(buildCaptureTwin);

  return (
    <DigitalTwinClient
      platformTwin={platformTwin}
      entities={entities}
      captureTwins={captureTwins}
    />
  );
}
