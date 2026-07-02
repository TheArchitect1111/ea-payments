import type { Metadata } from 'next';
import LiveYourLifeExperience from '@/app/components/experience/LiveYourLifeExperience';
import { experienceMeta } from '@/lib/live-your-life';
import './live-your-life.css';

export const metadata: Metadata = {
  title: experienceMeta.title,
  description: experienceMeta.description,
  openGraph: {
    title: experienceMeta.title,
    description: experienceMeta.description,
    url: experienceMeta.sharePath,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: experienceMeta.title,
    description: experienceMeta.description,
  },
};

export default function LiveYourLifePage() {
  return <LiveYourLifeExperience />;
}
