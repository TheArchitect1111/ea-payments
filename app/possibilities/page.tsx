import type { Metadata } from 'next';
import PossibilitiesExperience from '@/app/components/possibilities/PossibilitiesExperience';
import { experienceMeta } from '@/lib/possibilities-experience';
import './possibilities-experience.css';

export const metadata: Metadata = {
  title: experienceMeta.title,
  description: experienceMeta.description,
  openGraph: {
    title: experienceMeta.title,
    description: experienceMeta.description,
    url: experienceMeta.sharePath,
    type: 'website',
  },
};

export default function PossibilitiesPage() {
  return <PossibilitiesExperience />;
}
