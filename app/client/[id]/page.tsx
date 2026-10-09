import { notFound } from 'next/navigation';
import { getHqProject, hqStorageStatus, SHELVES } from '../_lib/hq-store';
import ClientExperience from './ClientExperience';

export const dynamic = 'force-dynamic';

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9][a-z0-9-]{0,48}$/.test(id)) notFound();
  const stored = await getHqProject(id);
  if (!stored && hqStorageStatus() !== 'local') notFound();
  const project = stored ?? {
    id, name: id.split('-').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' '), domain: '', livePath: '',
    shelves: SHELVES.map((shelf) => shelf.id), lockDesign: true, items: [], formDestinations: {},
    updatedAt: new Date().toISOString(), updatedBy: 'Robert',
  };
  return <ClientExperience projectId={id} projectName={project.name} domain={project.domain} livePath={project.livePath} localFallback={!stored} />;
}
