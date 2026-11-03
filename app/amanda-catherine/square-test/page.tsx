import SquareTestForm from './SquareTestForm';
export const metadata = { title: 'Wood Therapy $1 workflow test', robots: { index: false, follow: false } };
export default function Page() {
  return <main className="mx-auto max-w-lg px-5 py-14"><h1 className="font-serif text-3xl">Wood Therapy — $1 workflow test</h1>
    <p className="my-5">Use your own email for this test. Square Sandbox simulates a CAD $1 payment without moving real money.</p>
    <SquareTestForm /></main>;
}
