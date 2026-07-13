import type { EAPortalType } from '@/lib/ea-guide-types';

const PROMPTS_BY_PORTAL: Partial<Record<EAPortalType, string[]>> = {
  discover: [
    'What happens after I submit discovery?',
    'How do training solutions fit in?',
    'What is a Possibilities Blueprint?',
  ],
  client: [
    'What should I do first in my portal?',
    'Where are my documents and payments?',
    'How do I send a message to EA?',
  ],
  admin: [
    'What should I review in Mission Control?',
    'How do escalations work?',
    'Where are EA Factory protocols?',
  ],
  pulse: [
    'What do Pulse scores mean?',
    'Which area needs attention first?',
    'How is training adoption tracked?',
  ],
  passport: [
    'What is my current phase?',
    'What action is due next?',
    'How do milestones work?',
  ],
  training: [
    'How do I continue my next lesson?',
    'Where is my certification progress?',
    'Can I send a team reminder?',
  ],
};

const DEFAULT_PROMPTS = [
  'What should I do on this page?',
  'Walk me through the next step.',
  'What happens after I complete this?',
];

export function getSuggestedPrompts(portalType: EAPortalType, workflow?: string): string[] {
  if (workflow === 'uploads') {
    return ['How do I upload files?', 'What happens after upload?', 'Who can see my uploads?'];
  }
  if (workflow === 'payments') {
    return ['How does checkout work?', 'When will I get a receipt?', 'Who do I contact about billing?'];
  }
  if (workflow === 'blueprint') {
    return ['What is in my Blueprint?', 'How do I approve the plan?', 'Can I request changes?'];
  }
  return PROMPTS_BY_PORTAL[portalType] ?? DEFAULT_PROMPTS;
}
