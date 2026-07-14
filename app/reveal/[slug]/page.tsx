import { notFound } from 'next/navigation';
import { getClientByPortalSlug } from '@/lib/airtable';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import { buildCtpRevealView } from '@/lib/ctp-reveal';
import RevealExperience from './RevealExperience';

export const dynamic = 'force-dynamic';

export default async function RevealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClientByPortalSlug(slug);
  if (!client) notFound();

  const ctp = await getCtpSubmissionForPortal({
    portalSlug: slug,
    email: client.email,
  });

  const view = buildCtpRevealView({
    slug,
    brandName: client.organization || client.clientName,
    contactName: client.clientName,
    amountPaid: client.amountPaid,
    ctp,
  });

  return <RevealExperience view={view} />;
}
