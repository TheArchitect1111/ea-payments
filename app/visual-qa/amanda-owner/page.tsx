import AmandaMemberHome from '@/app/portal/[slug]/member/AmandaMemberHome';

export const dynamic = 'force-dynamic';

export default function AmandaOwnerVisualQaPage() {
  return (
    <AmandaMemberHome
      slug="amanda-catherine"
      email="amanda@aesthetikine.com"
      role="owner"
    />
  );
}
