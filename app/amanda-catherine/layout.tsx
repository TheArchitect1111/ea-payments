import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Amanda Catherine | Restore · Learn · Create',
  description:
    'Amanda Catherine brings together AesthetiKine care, practitioner education, creative leadership, media, and founder support through Restore, Learn, and Create.',
};

export default function AmandaCatherineLayout({ children }: { children: ReactNode }) {
  return children;
}
