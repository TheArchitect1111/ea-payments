import AmandaWaitlistForm from '@/components/amanda/AmandaWaitlistForm';
import { findAmandaWaitlistInterest } from '@/lib/amanda-catherine/waitlist-interests';
export default function WaitlistForm({ courseId }: { courseId: string }) {
  const interest = findAmandaWaitlistInterest(courseId);
  return interest ? <AmandaWaitlistForm courseId={interest.id} courseName={interest.title} /> : null;
}
