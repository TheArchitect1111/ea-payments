import type { Metadata } from 'next';
import EAAthleticsExperience from './EAAthleticsExperience';
import './experience.css';

export const metadata: Metadata = {
  title: 'EA Athletics Experience',
  description:
    'A cinematic story experience for coaches discovering what happens when an athletic organization finally works together.',
};

export default function EAAthleticsExperiencePage() {
  return <EAAthleticsExperience />;
}
