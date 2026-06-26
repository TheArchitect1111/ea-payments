import type { Metadata } from 'next';
import SimplifiEnvironmentComparison from './SimplifiEnvironmentComparison';
import './simplifi-environments.css';

export const metadata: Metadata = {
  title: 'Simplifi Environment Mockups',
  description: 'Side-by-side Simplifi environment mockups for Air, Ocean, and Summit.',
};

export default function SimplifiEnvironmentMockupsPage() {
  return <SimplifiEnvironmentComparison />;
}
