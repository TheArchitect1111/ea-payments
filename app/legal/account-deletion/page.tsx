import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageShell from '@/app/components/landing/LegalPageShell';

export const metadata: Metadata = {
  title: 'Delete your Simplifi Orb account — Efficiency Architects',
  description:
    'How to delete your Simplifi Orb account and associated personal data (Google Play account deletion).',
  alternates: { canonical: '/legal/account-deletion' },
};

export default function AccountDeletionPage() {
  return (
    <LegalPageShell
      title="Delete your Simplifi Orb account"
      kicker="Google Play account deletion · Ascension Systems / Efficiency Architects"
    >
      <div className="space-y-6 text-[15px] leading-7 text-neutral-700">
        <p>
          You can delete your Simplifi Orb account and associated personal data at any time. This page
          is the public web path required for Google Play (usable without installing the app).
        </p>

        <h2 className="text-lg font-bold text-[#1B2B4D]">In the mobile app (recommended)</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Open Simplifi Orb and sign in.</li>
          <li>Go to <strong>Settings</strong>.</li>
          <li>Tap <strong>Delete account</strong>.</li>
          <li>Read what will be removed, then confirm.</li>
        </ol>

        <h2 className="text-lg font-bold text-[#1B2B4D]">What is deleted</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Portal sign-in access for your account (access set to Suspended).</li>
          <li>Personal contact fields on your client record (email and display name anonymized).</li>
          <li>Stored password credentials for the portal account.</li>
          <li>Push notification tokens registered for your device/email.</li>
        </ul>
        <p>
          We may retain limited records required for security, fraud prevention, accounting, or legal
          obligations, consistent with our{' '}
          <Link href="/legal/privacy" className="font-semibold text-[#1B2B4D] underline">
            Privacy Policy
          </Link>
          .
        </p>

        <h2 className="text-lg font-bold text-[#1B2B4D]">Request by email</h2>
        <p>
          If you cannot use the app, email{' '}
          <a href="mailto:freedom@efficiencyarchitects.online" className="font-semibold underline">
            freedom@efficiencyarchitects.online
          </a>{' '}
          from the address on your account with subject line <strong>Account deletion request</strong>.
          We will verify ownership and complete deletion.
        </p>

        <h2 className="text-lg font-bold text-[#1B2B4D]">Shared demo accounts</h2>
        <p>
          Shared demo portals used for product demonstrations are not fully erased through self-serve
          deletion (so other testers are not locked out). Device push tokens for your session are still
          cleared. Contact support for a full demo wipe if needed.
        </p>
      </div>
    </LegalPageShell>
  );
}
