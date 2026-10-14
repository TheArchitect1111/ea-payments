import { redirect } from 'next/navigation';

export const metadata = { title: 'Practitioner Kit Information | Amanda Catherine', robots: { index: false, follow: false } };

export default function PractitionerKitPage() {
  redirect('/courses/starter-kit#waitlist');
}
