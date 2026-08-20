import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Test Amplifi | Early access workspace',
  description: 'Open the Amplifi early-access testing workspace.',
  robots: { index: false, follow: false },
};

export default function AmplifiTestPage() {
  redirect('/api/amplifi/trial');
}
