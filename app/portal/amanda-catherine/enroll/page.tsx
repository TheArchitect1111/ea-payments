import { redirect } from 'next/navigation';
export default async function EnrollRedirect({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course } = await searchParams;
  const q = course ? `?course=${encodeURIComponent(course)}` : '';
  redirect(`/portal/amanda-catherine/classes${q}`);
}
