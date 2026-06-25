import type { Metadata } from 'next';
import EAGuideOrb from './components/ea-guide/EAGuideOrb';
import './globals.css';

export const metadata: Metadata = {
  title: 'Efficiency Architects - One Place For Everything',
  description:
    'A guided transformation experience for organizations that have outgrown scattered updates, training, documents, and decisions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body data-ea-guide="dashboard">
        {children}
        <EAGuideOrb />
      </body>
    </html>
  );
}
