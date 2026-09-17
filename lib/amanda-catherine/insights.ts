import { AMANDA_ADMIN_REPORTS } from './config';
import { getAmandaAcademyOperations } from './owner-operations';

export async function getAmandaOwnerInsights() {
  const academy = await getAmandaAcademyOperations();
  return {
    academy: {
      activeCourseCount: academy.courses.length,
      studentCount: academy.students.length,
      certificateCount: academy.certificateCount,
      progressRecordCount: academy.progress.length,
    },
    reports: AMANDA_ADMIN_REPORTS,
    unavailableWithoutVerifiedSource: [
      'revenue',
      'outstanding balances',
      'appointment volume',
      'no-show rate',
      'lead conversion',
    ],
  } as const;
}

export const AMANDA_MARKETING_RESOURCES = [
  { id: 'website', title: 'Website', purpose: 'Review public messaging and approved offers' },
  { id: 'academy', title: 'Academy', purpose: 'Promote the canonical four-course catalog' },
  { id: 'lifeline', title: 'LIFELINE', purpose: 'Creative entrepreneurship offers and campaigns' },
  { id: 'media', title: 'Media Library', purpose: 'Approved photos, video and campaign assets' },
  { id: 'campaigns', title: 'Campaign Workspace', purpose: 'Plan promotions before publishing' },
] as const;
