import { loadStudioRecord, loadStudioRecordFromAirtable, saveStudioRecord } from '@/lib/creative-studio/persistence';

export const AMANDA_SITE_RECORD_ID = 'amanda-catherine-site-v2';

type Program = { title: string; price: string; description: string };
type CreateCard = { title: string; body: string };

export type AmandaSiteContent = {
  version: 2;
  updatedAt: string;
  hero: {
    eyebrow: string; title: string; subtitle: string;
    primaryLabel: string; primaryHref: string;
    secondaryLabel: string; secondaryHref: string;
    imageUrl: string; videoUrl: string;
  };
  intro: { eyebrow: string; title: string; body: string };
  restore: {
    eyebrow: string; title: string; body: string; imageUrl: string;
    clinicName: string; clinicSubtitle: string; address: string;
    phone: string; email: string; bookingUrl: string;
  };
  pathways: { eyebrow: string; title: string; restoreBody: string; learnBody: string; createBody: string };
  learn: {
    eyebrow: string; title: string; body: string; imageUrl: string;
    ctaLabel: string; ctaHref: string; programs: Program[];
  };
  create: { eyebrow: string; title: string; body: string; imageUrl: string; cards: CreateCard[] };
  contact: {
    eyebrow: string; title: string; body: string; email: string; phone: string;
    address: string; hours: string; bookingUrl: string; enrollUrl: string;
  };
  footer: { tagline: string; note: string };
};

export const DEFAULT_AMANDA_SITE_CONTENT: AmandaSiteContent = {
  version: 2,
  updatedAt: '2026-08-30T00:00:00.000Z',
  hero: {
    eyebrow: 'Health · Education · Leadership',
    title: 'Restore.\nLearn.\nCreate.',
    subtitle: 'Clinical wellness, practitioner education, founder strategy and purpose-driven media, brought together through one clear Amanda Catherine experience.',
    primaryLabel: 'Book through Jane',
    primaryHref: 'https://aesthetikine.janeapp.com/',
    secondaryLabel: 'Explore training',
    secondaryHref: 'https://efficiencyarchitects.online/portal/amanda-catherine/enroll',
    imageUrl: '',
    videoUrl: '',
  },
  intro: {
    eyebrow: 'One connected platform',
    title: 'Restore health. Build confidence. Create meaningful impact.',
    body: 'Amanda Catherine is a Registered Kinesiologist, educator, founder and media personality. Her work spans clinical care, practitioner training, corporate wellness, entrepreneurship, speaking and community initiatives.',
  },
  restore: {
    eyebrow: 'Restore your health',
    title: 'Clinical care grounded in movement and function.',
    body: 'AesthetiKine supports clients through kinesiology, movement restoration, body sculpting and wellness services. Appointments, clinical booking and payment are handled securely through Jane.',
    imageUrl: '',
    clinicName: 'Amanda Catherine',
    clinicSubtitle: 'Registered Kinesiologist & Founder of AesthetiKine',
    address: '26 Queen St W, Cambridge, Ontario',
    phone: '226-581-2003',
    email: 'Amanda@aesthetikine.com',
    bookingUrl: 'https://aesthetikine.janeapp.com/',
  },
  pathways: {
    eyebrow: 'Three pathways',
    title: 'Choose the work that fits your next chapter.',
    restoreBody: 'Clinical kinesiology, movement, body sculpting and client wellness.',
    learnBody: 'Practitioner certifications, clinical mentorship and professional development.',
    createBody: 'Founder advisory, speaking, LIFELINE LIVE and community initiatives.',
  },
  learn: {
    eyebrow: 'Learn your craft',
    title: 'Clinical confidence, not trend chasing.',
    body: 'Training for health professionals, aestheticians, massage therapists, nurses, chiropractors, physiotherapists, kinesiologists, fitness professionals and entrepreneurs.',
    imageUrl: '',
    ctaLabel: 'View courses & training',
    ctaHref: 'https://efficiencyarchitects.online/portal/amanda-catherine/enroll',
    programs: [
      { title: 'Body Sculpt Certification™', price: '$4,997', description: 'Two-day intensive with tools, protocols, business resources and 90-day mentorship.' },
      { title: 'Non-Surgical Tummy Tuck / BBL', price: '$1,497', description: 'One-day certification.' },
      { title: 'Wood Therapy Certification', price: '$997', description: 'One-day training.' },
      { title: 'Reset Practitioner Training', price: '$997', description: 'Movement and nervous-system restoration method.' },
      { title: 'Clinical Mentorship', price: 'From $250/hr', description: '' },
      { title: 'Glow Pro IPL', price: '$24,995', description: '' },
    ],
  },
  create: {
    eyebrow: 'Create your legacy',
    title: 'Build with purpose. Lead with impact.',
    body: '',
    imageUrl: '',
    cards: [
      { title: 'Empower Art Collective', body: 'Connecting creatives, founders and community leaders through education, events, mentorship and collaboration.' },
      { title: 'LIFELINE LIVE', body: 'Interviews, podcasts, documentaries and live conversations centered on faith, leadership, healing and transformation.' },
      { title: 'Founder Advisory', body: 'Vision, brand positioning, launch planning, media strategy, partnerships, events and speaking support.' },
    ],
  },
  contact: {
    eyebrow: 'Begin here',
    title: 'Choose the conversation that fits your next step.',
    body: 'Client care, training, corporate wellness, founder advisory, speaking, media, partnerships and community inquiries are welcomed.',
    email: 'Amanda@aesthetikine.com',
    phone: '226-581-2003',
    address: '26 Queen Street West, Cambridge, Ontario',
    hours: 'By appointment only',
    bookingUrl: 'https://aesthetikine.janeapp.com/',
    enrollUrl: 'https://efficiencyarchitects.online/portal/amanda-catherine/enroll',
  },
  footer: {
    tagline: 'Restore · Learn · Create',
    note: 'Amanda Catherine · AesthetiKine · LIFELINE LIVE · Empower Art Collective',
  },
};

export async function getAmandaSiteContent(): Promise<AmandaSiteContent> {
  const saved = await loadStudioRecord<AmandaSiteContent>('experience', AMANDA_SITE_RECORD_ID);
  return saved?.version === 2 ? saved : DEFAULT_AMANDA_SITE_CONTENT;
}

export async function saveAmandaSiteContent(
  organizationId: string,
  content: AmandaSiteContent,
): Promise<{ ok: boolean; persisted: boolean; content: AmandaSiteContent; error?: string }> {
  const next: AmandaSiteContent = { ...content, version: 2, updatedAt: new Date().toISOString() };
  const result = await saveStudioRecord({
    recordType: 'experience', id: AMANDA_SITE_RECORD_ID, organizationId,
    title: 'Amanda Catherine canonical public website', payload: next,
  });
  if (!result.ok) return { ok: false, persisted: false, content: next, error: result.error };
  if (result.persistedToAirtable) {
    const durable = await loadStudioRecordFromAirtable<AmandaSiteContent>('experience', AMANDA_SITE_RECORD_ID);
    if (!durable || durable.updatedAt !== next.updatedAt) {
      return { ok: false, persisted: false, content: next, error: 'Durable website save verification failed.' };
    }
  }
  return { ok: true, persisted: result.persistedToAirtable, content: next };
}
