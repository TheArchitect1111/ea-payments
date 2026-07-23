import { notFound } from 'next/navigation';
import { AmandaEditorialPortal } from '@/app/components/experience/themes/amanda-editorial/AmandaEditorialExperiences';
import { amandaPortalNav } from '@/lib/experience-preview-data/amanda-catherine';

export default function AmandaPortalPreviewPage() {
  if (process.env.VERCEL_ENV === 'production') notFound();
  return <AmandaEditorialPortal firstName="Amanda" brandName="Amanda Catherine" navItems={amandaPortalNav} />;
}
