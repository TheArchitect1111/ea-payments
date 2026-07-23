import { notFound } from 'next/navigation';
import { AmandaEditorialWebsite } from '@/app/components/experience/themes/amanda-editorial/AmandaEditorialExperiences';
import { amandaWebsitePreview } from '@/lib/experience-preview-data/amanda-catherine';

export default function AmandaWebsitePreviewPage() {
  if (process.env.VERCEL_ENV === 'production') notFound();
  return <AmandaEditorialWebsite {...amandaWebsitePreview} />;
}
