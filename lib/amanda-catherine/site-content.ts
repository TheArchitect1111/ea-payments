import { loadStudioRecord, loadStudioRecordFromAirtable, saveStudioRecord } from '@/lib/creative-studio/persistence';

export const AMANDA_SITE_RECORD_ID = 'amanda-catherine-site-v1';

export type AmandaSiteContent = {
  version: 1;
  updatedAt: string;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    imageUrl: string;
    videoUrl: string;
  };
  intro: { eyebrow: string; title: string; body: string };
  about: {
    title: string;
    body: string;
    secondaryBody: string;
    imageUrl: string;
    facts: Array<{ value: string; label: string }>;
  };
  pathways: {
    title: string;
    body: string;
    restoreBody: string;
    learnBody: string;
    createBody: string;
  };
  restore: { title: string; body: string; imageUrl: string };
  learn: { title: string; body: string; imageUrl: string };
  create: { title: string; body: string; imageUrl: string };
  impact: { title: string; body: string; imageUrl: string };
  contact: {
    title: string;
    body: string;
    email: string;
    phone: string;
    bookingUrl: string;
  };
  footer: { tagline: string; note: string };
};

export const DEFAULT_AMANDA_SITE_CONTENT: AmandaSiteContent = {
  version: 1,
  updatedAt: '2026-08-30T00:00:00.000Z',
  hero: {
    eyebrow: 'Restore yourself · Learn your craft · Create your legacy',
    title: 'Return to alignment. Build what comes next.',
    subtitle:
      'Helping people restore their health, practitioners elevate their skills, and founders build meaningful work through functional aesthetics, education, and creative leadership.',
    primaryLabel: 'Choose your pathway',
    primaryHref: '#pathways',
    secondaryLabel: 'Meet Amanda',
    secondaryHref: '#about',
    imageUrl: '/amanda-catherine/aesthetikine-studio-hero.jpg',
    videoUrl: '',
  },
  intro: {
    eyebrow: 'One integrated mission',
    title: 'Health, craft and calling belong in the same conversation.',
    body:
      'Amanda Catherine’s work brings evidence-informed care, clinical education, entrepreneurship, media and community together through one clear progression: Restore. Learn. Create.',
  },
  about: {
    title: 'Founder. Kinesiologist. Educator. Creative leader.',
    body:
      'Amanda Catherine is a Canadian entrepreneur, Registered Kinesiologist, best-selling author and founder of AesthetiKine and LIFELINE Experience. She helps people return to health, practitioners deepen their clinical confidence, and founders turn meaningful ideas into sustainable work.',
    secondaryBody:
      'Her experience spans corporate wellness, medical aesthetics, education, media, entrepreneurship, community leadership and faith-based initiatives.',
    imageUrl: '/amanda-catherine/aesthetikine-studio-hero.jpg',
    facts: [
      { value: '20+ years', label: 'Health, wellness and leadership experience' },
      { value: '200+ founders', label: 'Supported through business and creative work' },
      { value: 'Media & speaking', label: 'Interviews, keynotes and live conversations' },
      { value: 'Leadership', label: 'Community, education and mission-led initiatives' },
    ],
  },
  pathways: {
    title: 'Where are you beginning?',
    body:
      'Each pathway is built for a different moment, but all three are connected by the same belief: people thrive when health, skill and purpose are aligned.',
    restoreBody:
      'Personalized care for movement, recovery, nervous-system regulation, body confidence, skin and hair health.',
    learnBody:
      'Clinical-level education that integrates anatomy, fascia, lymphatics, assessment, safe application and business strategy.',
    createBody:
      'Strategy, storytelling, media, partnerships and community for founders, artists, ministries and mission-led organizations.',
  },
  restore: {
    title: 'Care that begins with the whole person.',
    body:
      'Every new client begins with assessment. Recommendations are shaped around movement, posture, stress, recovery, lifestyle and aesthetic goals rather than a one-size-fits-all treatment plan. Services include functional assessment, mobility and nervous-system restoration, body sculpting, lymphatic care, facial support, skin protocols, scalp and hair restoration, and workplace wellness.',
    imageUrl: '/amanda-catherine/aesthetikine-studio-hero.jpg',
  },
  learn: {
    title: 'Clinical confidence, not trend chasing.',
    body:
      'Education for health professionals, aestheticians, massage therapists, nurses, chiropractors, physiotherapists, kinesiologists, fitness professionals and entrepreneurs. Training pathways include Body Sculpt Certification™, Non-Surgical Tummy Tuck / BBL, Wood Therapy Certification, Reset Practitioner Training, Clinical Mentorship and Glow Pro IPL.',
    imageUrl: '/amanda-catherine/aesthetikine-certificate-premium.png',
  },
  create: {
    title: 'Build with purpose. Lead with impact.',
    body:
      'Create is Amanda Catherine’s founder, leadership and creative strategy division for entrepreneurs, artists, authors, ministries, nonprofits and organizations with a meaningful message. The work includes Empower Art Collective, LIFELINE LIVE and founder advisory across vision, brand positioning, launch planning, media strategy, speaking, partnerships and events.',
    imageUrl: '/amanda-catherine/aesthetikine-studio-hero.jpg',
  },
  impact: {
    title: 'Ideas made useful. Stories made visible.',
    body:
      'Amanda speaks on starting with what you have, monetizing your gifts, faith-based entrepreneurship, women’s wellness and turning setbacks into strategy. She is available for keynotes, panels, interviews, workshops, partnerships and media conversations.',
    imageUrl: '/amanda-catherine/aesthetikine-studio-hero.jpg',
  },
  contact: {
    title: 'Choose the conversation that fits your next step.',
    body:
      'Client care, practitioner training, corporate wellness, founder advisory, speaking, LIFELINE interviews, partnerships and Empower Art Collective inquiries are all welcomed through the appropriate channel.',
    email: 'Amanda@aesthetikine.com',
    phone: '226-581-2003',
    bookingUrl: 'https://aesthetikine.janeapp.com/',
  },
  footer: {
    tagline: 'Restore · Learn · Create',
    note:
      'Medical information is educational and does not replace individualized diagnosis or treatment. Results vary. Certificates of Completion do not constitute professional licensure or medical certification.',
  },
};

export async function getAmandaSiteContent(): Promise<AmandaSiteContent> {
  const saved = await loadStudioRecord<AmandaSiteContent>('experience', AMANDA_SITE_RECORD_ID);
  return saved?.version === 1 ? saved : DEFAULT_AMANDA_SITE_CONTENT;
}

export async function saveAmandaSiteContent(
  organizationId: string,
  content: AmandaSiteContent,
): Promise<{ ok: boolean; persisted: boolean; content: AmandaSiteContent; error?: string }> {
  const next: AmandaSiteContent = { ...content, version: 1, updatedAt: new Date().toISOString() };
  const result = await saveStudioRecord({
    recordType: 'experience',
    id: AMANDA_SITE_RECORD_ID,
    organizationId,
    title: 'Amanda Catherine public website',
    payload: next,
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
