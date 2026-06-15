import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Efficiency Architects - Payment Portal',
  description: 'Secure payment portal for Efficiency Architects services.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
