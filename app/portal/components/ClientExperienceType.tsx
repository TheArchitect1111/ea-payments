'use client';

import type { ReactNode } from 'react';
import { Fraunces, Manrope } from 'next/font/google';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--cex-font-display',
  display: 'swap',
});

const sans = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--cex-font-sans',
  display: 'swap',
});

/** Applies premium Client Experience typography tokens. */
export default function ClientExperienceType({ children }: { children: ReactNode }) {
  return (
    <div className={`cex-type ${display.variable} ${sans.variable}`}>{children}</div>
  );
}
