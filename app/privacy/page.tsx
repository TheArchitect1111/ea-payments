import { redirect } from 'next/navigation';

/** Canonical privacy URL is /legal/privacy (Legal Document Pack). */
export default function PrivacyRedirectPage() {
  redirect('/legal/privacy');
}
