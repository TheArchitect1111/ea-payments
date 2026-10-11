import { redirect } from 'next/navigation';

export default async function AssessmentPage({ searchParams }: { searchParams: Promise<{ portal?: string }> }) {
  const { portal } = await searchParams;
  if (portal && /^[a-z0-9-]{1,80}$/.test(portal)) redirect(`/portal/${portal}/discovery`);
  redirect('https://cc.efficiencyarchitects.online/ctp');
}
