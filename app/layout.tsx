import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Efficiency Architects - Operational Architecture For Growing Businesses',
  description:
    'Efficiency Architects helps organizations reclaim time, reduce costs, unlock capacity, and fuel growth through systems design.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
