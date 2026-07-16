/**
 * Industry design library — starting points only. Every client must still become unique.
 */

import type { CreativeDna, IndustryVerticalId } from './types';

export interface IndustryCreativeSeed {
  vertical: IndustryVerticalId;
  label: string;
  editorialStyle: CreativeDna['editorialStyle'];
  photographyStyle: string;
  typography: string;
  colorPalette: { primary: string; secondary: string; accent?: string };
  motion: string;
  portalStyle: string;
  presentationStyle: string;
  componentLanguage: string;
  visualMetaphors: string[];
  storyProgressionHint: string;
}

const SEEDS: IndustryCreativeSeed[] = [
  {
    vertical: 'sports',
    label: 'Sports',
    editorialStyle: 'netflix-documentary',
    photographyStyle: 'Athlete documentary — sweat, grit, arena light, community crowds.',
    typography: 'Bold condensed headlines; energetic but readable body.',
    colorPalette: { primary: '#0C0C0A', secondary: '#C8102E', accent: '#F4F4F4' },
    motion: 'Punch-cut energy on hero; slower human moments in story sections.',
    portalStyle: 'Locker-room clarity — progress, film, schedules without clutter.',
    presentationStyle: 'Coach-film narrative — chapter markers per recruiting phase.',
    componentLanguage: 'Jersey numbers as accents; field lines as dividers — not card grids.',
    visualMetaphors: ['Field lines', 'Spotlight', 'Timeline of growth'],
    storyProgressionHint: 'Talent → preparation → exposure → opportunity.',
  },
  {
    vertical: 'education',
    label: 'Education',
    editorialStyle: 'magazine',
    photographyStyle: 'Campus documentary — students, mentors, classrooms with natural light.',
    typography: 'Scholarly serif + accessible sans; generous line height.',
    colorPalette: { primary: '#1A2B4A', secondary: '#D4A853', accent: '#F7F5F0' },
    motion: 'Page-turn transitions; scroll reveals like magazine spreads.',
    portalStyle: 'Registrar clarity with warmth — tasks, deadlines, resources.',
    presentationStyle: 'Board deck as editorial feature story.',
    componentLanguage: 'Chapter headings, pull quotes, margin notes — not widget dashboards.',
    visualMetaphors: ['Open book', 'Pathway', 'Mentorship bridge'],
    storyProgressionHint: 'Curiosity → guidance → achievement → alumni impact.',
  },
  {
    vertical: 'nonprofit',
    label: 'Nonprofit',
    editorialStyle: 'documentary',
    photographyStyle: 'Human-first documentary — dignity, context, real environments.',
    typography: 'Warm serif headlines; highly legible sans for accessibility.',
    colorPalette: { primary: '#2D4A3E', secondary: '#E8DCC8', accent: '#8B4513' },
    motion: 'Gentle parallax; respect reduced-motion preferences.',
    portalStyle: 'Donor and volunteer journeys with transparent impact.',
    presentationStyle: 'Impact story with evidence, not vanity metrics.',
    componentLanguage: 'Story blocks, impact ribbons, testimonial film strips.',
    visualMetaphors: ['Ripple', 'Hands building', 'Community table'],
    storyProgressionHint: 'Need → mission → action → transformed lives.',
  },
  {
    vertical: 'healthcare',
    label: 'Healthcare',
    editorialStyle: 'luxury-hospitality',
    photographyStyle: 'Calm clinical trust — caregivers, patients (consented), soft daylight.',
    typography: 'Reassuring humanist sans; no sterile hospital clichés.',
    colorPalette: { primary: '#1E3A5F', secondary: '#7BA7BC', accent: '#F8FAFB' },
    motion: 'Slow, calming; no frantic UI motion.',
    portalStyle: 'Patient pathway clarity — appointments, records, education.',
    presentationStyle: 'Clinical excellence as hospitality experience.',
    componentLanguage: 'Soft panels, clear hierarchy, accessibility-first contrast.',
    visualMetaphors: ['Guided path', 'Steady hand', 'Breathing space'],
    storyProgressionHint: 'Concern → expertise → care → wellbeing.',
  },
  {
    vertical: 'financial-services',
    label: 'Financial Services',
    editorialStyle: 'editorial',
    photographyStyle: 'Trust documentary — families, advisors, real offices (not stock towers).',
    typography: 'Confident serif + precise sans; numbers legible at all sizes.',
    colorPalette: { primary: '#0F1C2E', secondary: '#B8956A', accent: '#FAFAF8' },
    motion: 'Measured reveals; data appears with context not flash.',
    portalStyle: 'Secure, calm control center — not trading-terminal chaos.',
    presentationStyle: 'Fiduciary narrative with clear decision points.',
    componentLanguage: 'Ledger lines, chapter milestones — not fintech neon.',
    visualMetaphors: ['Foundation', 'Compass', 'Generational arc'],
    storyProgressionHint: 'Uncertainty → clarity → plan → legacy.',
  },
  {
    vertical: 'professional-services',
    label: 'Professional Services',
    editorialStyle: 'editorial',
    photographyStyle: 'Partnership documentary — teams solving real problems on site.',
    typography: 'Authority serif + modern sans.',
    colorPalette: { primary: '#111111', secondary: '#4A5568', accent: '#C9A227' },
    motion: 'Case-study chapter scroll.',
    portalStyle: 'Client command center — projects, documents, communication.',
    presentationStyle: 'Proof-led story with client outcomes.',
    componentLanguage: 'Case file sections, expert pull quotes.',
    visualMetaphors: ['Blueprint', 'Handshake as partnership not cliché'],
    storyProgressionHint: 'Challenge → expertise → execution → outcome.',
  },
  {
    vertical: 'manufacturing',
    label: 'Manufacturing',
    editorialStyle: 'documentary',
    photographyStyle: 'Industrial craft — workers, machinery, quality detail, scale.',
    typography: 'Strong grotesque headlines; technical clarity in body.',
    colorPalette: { primary: '#1C1C1C', secondary: '#FF6B35', accent: '#E8E8E8' },
    motion: 'Rhythmic scroll matching production cadence.',
    portalStyle: 'Operations visibility — orders, safety, training.',
    presentationStyle: 'Engineering pride narrative.',
    componentLanguage: 'Spec sheets, process diagrams as design elements.',
    visualMetaphors: ['Assembly line as story', 'Precision', 'Craft'],
    storyProgressionHint: 'Raw material → craft → quality → market impact.',
  },
  {
    vertical: 'government',
    label: 'Government',
    editorialStyle: 'museum',
    photographyStyle: 'Civic documentary — citizens, public spaces, service delivery.',
    typography: 'Accessible, high-contrast, WCAG-first.',
    colorPalette: { primary: '#1B365D', secondary: '#C4A35A', accent: '#FFFFFF' },
    motion: 'Minimal; respect accessibility and cognitive load.',
    portalStyle: 'Service-oriented — clear tasks, plain language.',
    presentationStyle: 'Public accountability narrative.',
    componentLanguage: 'Clear sections, civic iconography sparingly.',
    visualMetaphors: ['Bridge', 'Seal as trust not decoration'],
    storyProgressionHint: 'Public need → service → outcome → trust.',
  },
  {
    vertical: 'hospitality',
    label: 'Hospitality',
    editorialStyle: 'luxury-hospitality',
    photographyStyle: 'Immersive environment — light, texture, guest moments.',
    typography: 'Elegant display + refined body.',
    colorPalette: { primary: '#2C2416', secondary: '#C9B896', accent: '#FFFEF9' },
    motion: 'Slow cinematic; ambient transitions.',
    portalStyle: 'Concierge experience — reservations, preferences, loyalty.',
    presentationStyle: 'Destination story — sensory chapters.',
    componentLanguage: 'Full-bleed imagery, generous whitespace, tactile UI.',
    visualMetaphors: ['Threshold', 'Table set', 'Horizon line'],
    storyProgressionHint: 'Arrival → experience → memory → return.',
  },
];

const GENERAL_SEED: IndustryCreativeSeed = {
  vertical: 'general',
  label: 'General',
  editorialStyle: 'documentary',
  photographyStyle: 'Documentary realism aligned to the client story.',
  typography: 'Editorial headline + humanist body.',
  colorPalette: { primary: '#0C0C0A', secondary: '#A81D20', accent: '#F4F4F4' },
  motion: 'Story-led, intentional.',
  portalStyle: 'Mission-aligned portal — clarity without corporate boxes.',
  presentationStyle: 'Executive story deck.',
  componentLanguage: 'Narrative sections, not default card grids.',
  visualMetaphors: ['Journey', 'Threshold', 'Proof'],
  storyProgressionHint: 'Possibility → proof → path → partnership.',
};

export function industryCreativeSeed(vertical: IndustryVerticalId): IndustryCreativeSeed {
  return SEEDS.find((s) => s.vertical === vertical) ?? GENERAL_SEED;
}

export function inferIndustryVertical(hint: string): IndustryVerticalId {
  const h = hint.toLowerCase();
  if (/health|medical|clinic|hospital/.test(h)) return 'healthcare';
  if (/school|university|college|academy|education/.test(h)) return 'education';
  if (/nonprofit|church|ministry|foundation|charity/.test(h)) return 'nonprofit';
  if (/sport|athlete|recruit|team|league/.test(h)) return 'sports';
  if (/bank|finance|wealth|invest|credit/.test(h)) return 'financial-services';
  if (/consult|law|account|professional/.test(h)) return 'professional-services';
  if (/manufact|industrial|factory|plant/.test(h)) return 'manufacturing';
  if (/government|municipal|public sector|civic/.test(h)) return 'government';
  if (/hotel|hospitality|resort|restaurant|venue/.test(h)) return 'hospitality';
  return 'general';
}

export function listIndustryVerticals(): Array<{ id: IndustryVerticalId; label: string }> {
  return [...SEEDS.map((s) => ({ id: s.vertical, label: s.label })), { id: 'general', label: 'General' }];
}
