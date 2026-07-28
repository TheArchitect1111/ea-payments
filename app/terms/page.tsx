import { redirect } from 'next/navigation';

/** Canonical terms URL is /legal/terms (Legal Document Pack). */
export default function TermsRedirectPage() {
  redirect('/legal/terms');
}
