import FormPage from '../FormPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EnrollPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course = '' } = await searchParams;
  return <FormPage kind="enroll" course={course} />;
}
