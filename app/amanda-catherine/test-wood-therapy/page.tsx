import WoodTestButton from '@/components/amanda/WoodTestButton';
export const metadata = { title: 'Wood Therapy test', robots: { index: false, follow: false } };
export default function Page() {
  return <main className="mx-auto max-w-xl px-5 py-16"><h1>Wood Therapy — CAD $1 test</h1>
    <p>Enter your own email at checkout. Use test card 4242 4242 4242 4242, expiry 12/34, CVC 123.</p>
    <p>Your receipt and course access instructions will arrive by email. Preview access lasts 72 hours.</p><WoodTestButton /></main>;
}
