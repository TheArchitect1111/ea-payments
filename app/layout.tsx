import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Efficiency Architects — Imagine What Becomes Possible',
  description:
    'Help people create more of what matters and less of what doesn\'t. More life for individuals. More capacity for organizations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
