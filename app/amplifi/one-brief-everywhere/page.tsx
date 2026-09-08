import { redirect } from 'next/navigation';

export const metadata = {
  title: 'One Brief. Everywhere. | Amplifi',
  description: 'Give Amplifi the goal. Get the campaign.',
};

export default function OneBriefEverywherePage() {
  redirect('/amplifi#proof');
}
