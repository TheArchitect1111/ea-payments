import { notFound } from 'next/navigation';
import CigarJourney from './CigarJourney';

/** Deliberately never available in production, even if its flag is mistakenly set. */
export default function CigarCtpPreviewPage() {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview') notFound();
  return <CigarJourney />;
}