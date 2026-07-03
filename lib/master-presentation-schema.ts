/**
 * Master Presentation Generator™ — schema for executive capabilities decks.
 * Maps the 15-section transformation story to structured slide + deliverable data.
 */

export const MASTER_SECTION_IDS = [
  'current-reality',
  'hidden-cost',
  'imagine-possible',
  'philosophy',
  'transformation',
  'how-system-works',
  'interactive-experience',
  'accessibility',
  'manager-experience',
  'ai-assistant',
  'automation',
  'business-impact',
  'why-different',
  'future-vision',
  'call-to-action',
] as const;

export type MasterSectionId = (typeof MASTER_SECTION_IDS)[number];

export interface MasterPresentationSlide {
  id: MasterSectionId;
  title: string;
  purpose: string;
  headline: string;
  supportingContent: string[];
  suggestedVisual: string;
  suggestedDiagram?: string;
  speakerNotes: string;
  transition: string;
  timingSeconds: number;
}

export interface MasterPresentationDeliverables {
  executiveSummary: string;
  leaveBehind: string;
  proposalSummary: string;
  roiDiscussionPoints: string[];
  faq: { question: string; answer: string }[];
  objections: { objection: string; response: string }[];
  implementationRoadmap: { phase: string; detail: string }[];
  assetChecklist: string[];
  imageChecklist: string[];
  dashboardMockupNotes: string[];
  videoRecommendations: string[];
}

export interface MasterPresentationInput {
  organizationName: string;
  productName?: string;
  audience?: string;
  industry?: string;
  sourceText?: string;
  notes?: string;
  tenantId?: string;
}

export interface MasterPresentationPackage {
  version: string;
  generatedAt: string;
  organizationName: string;
  productName: string;
  audience: string;
  industry: string;
  slides: MasterPresentationSlide[];
  deliverables: MasterPresentationDeliverables;
  aiEnhanced: boolean;
}

export const MASTER_PRESENTATION_VERSION = '1.0.0';

export const SECTION_LABELS: Record<MasterSectionId, string> = {
  'current-reality': 'The Current Reality',
  'hidden-cost': 'The Hidden Cost',
  'imagine-possible': "Imagine What's Possible",
  philosophy: 'Our Philosophy',
  transformation: 'The Transformation',
  'how-system-works': 'How Our System Works',
  'interactive-experience': 'Interactive Experience',
  accessibility: 'Accessibility',
  'manager-experience': 'Manager Experience',
  'ai-assistant': 'AI Assistant',
  automation: 'Automation',
  'business-impact': 'Business Impact',
  'why-different': 'Why This Is Different',
  'future-vision': 'Future Vision',
  'call-to-action': 'Call to Action',
};
