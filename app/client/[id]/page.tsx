import { notFound } from 'next/navigation';
import { getHqProject } from '../_lib/hq-store';
import ClientExperience from './ClientExperience';

export const dynamic = 'force-dynamic';

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getHqProject(id);
  if (!project) notFound();
  return <ClientExperience projectId={id} projectName={project.name} domain={project.domain} livePath={project.livePath} />;
}
