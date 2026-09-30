import LearningPage from '../../[slug]/learning/page';

export const dynamic = 'force-dynamic';

export default async function AmandaLearningPage({ searchParams }: { searchParams: Promise<{ enrolled?: string }> }) {
  const { enrolled } = await searchParams;
  return <LearningPage params={Promise.resolve({ slug: 'amanda-catherine' })} initialAmandaCourseId={enrolled} />;
}
