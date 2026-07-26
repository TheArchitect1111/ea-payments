import { notFound } from 'next/navigation';
import { isUniversalPeopleEnabled } from '@/lib/people/flags';

/**
 * Minimal staff People directory shell.
 * Flag OFF → hard 404 (INV-17).
 */
export default async function PeoplePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isUniversalPeopleEnabled()) {
    notFound();
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>People</h1>
      <p>
        Directory for portal <code>{slug}</code>.
      </p>
      <p>
        Use <code>/api/portal/{slug}/people</code> for list/create when authenticated.
      </p>
    </main>
  );
}
