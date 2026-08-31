import LearningPage from '../../[slug]/learning/page';

export const dynamic = 'force-dynamic';

export default function AmandaLearningPage() {
  return <LearningPage params={Promise.resolve({ slug: 'amanda-catherine' })} />;
}
