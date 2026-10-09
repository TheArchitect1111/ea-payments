import { notFound } from 'next/navigation';
import ClientExperience from './ClientExperience';

export const dynamic = 'force-dynamic';

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9][a-z0-9-]{0,48}$/.test(id)) notFound();
  const projectName = id.split('-').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ');
  return <ClientExperience projectId={id} projectName={projectName} />;
}
