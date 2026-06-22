import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Efficiency Architects — Discover The Possibilities',
  description:
    'An invitation to imagine what becomes possible. More time. More opportunity. More impact. More freedom. More life.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
