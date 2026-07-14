import { redirect } from 'next/navigation';

/** Canonical buy path for automated Website + Portal Starter. */
export default function BuyPage() {
  redirect('/checkout?package=website_portal_starter');
}
