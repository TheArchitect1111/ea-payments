import { redirect } from 'next/navigation';

/** Canonical CTP intake — never invent alternatives. */
export default function HomePage() {
  redirect('https://cc.efficiencyarchitects.online/ctp');
}
