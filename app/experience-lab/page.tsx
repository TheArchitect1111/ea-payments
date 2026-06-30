import type { Metadata } from 'next';
import EAExperienceLab from './EAExperienceLab';
import { experienceMeta } from '@/lib/ea-experience-lab';
import './ea-experience-lab.css';

export const metadata: Metadata = {
  title: experienceMeta.title,
  description: experienceMeta.description,
  openGraph: {
    title: experienceMeta.title,
    description: experienceMeta.description,
    url: experienceMeta.path,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: experienceMeta.title,
    description: experienceMeta.description,
  },
};

export default function ExperienceLabPage() {
  return <EAExperienceLab />;
}
