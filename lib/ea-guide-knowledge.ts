import type { GuidePageContext, KnowledgeEntry } from './ea-guide-types';

export const EA_GUIDE_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'platform-overview',
    topic: 'Platform overview',
    keywords: ['platform', 'ea', 'efficiency architects', 'overview', 'what is', 'how does'],
    question: 'What is the EA platform?',
    answer:
      'Efficiency Architects (EA) is a unified platform for discovery, delivery, and adoption. Discover The Possibilities™ captures your goals, Passport to Possibilities™ maps your journey, Pulse™ tracks health, and your Client Portal holds documents, payments, training, and messages.',
    nextSteps: ['Complete discovery if you have not yet', 'Open your dashboard for the recommended next step'],
  },
  {
    id: 'discover',
    topic: 'Discover The Possibilities™',
    portalType: 'discover',
    keywords: ['discover', 'assessment', 'intake', 'possibilities', 'questionnaire'],
    question: 'What is Discover The Possibilities™?',
    answer:
      'Discover The Possibilities™ is EA\'s guided intake. Your answers shape your Blueprint, proposal, and portal experience. After submit, EA reviews your intake and opens your Passport to Possibilities™.',
    nextSteps: ['Complete all sections honestly', 'Submit when ready — EA will follow up in your portal'],
  },
  {
    id: 'passport',
    topic: 'Passport to Possibilities™',
    portalType: 'passport',
    keywords: ['passport', 'roadmap', 'phases', 'journey', 'milestones'],
    question: 'What is Passport to Possibilities™?',
    answer:
      'Passport to Possibilities™ is your personalized roadmap from discovery to delivery. It shows phases, milestones, what is complete, and what needs your action next.',
    nextSteps: ['Open Passport to see your current phase', 'Complete the action on your dashboard'],
  },
  {
    id: 'pulse',
    topic: 'Pulse™',
    portalType: 'pulse',
    keywords: ['pulse', 'dashboard', 'health', 'engagement', 'signals', 'scores'],
    question: 'What is Pulse™?',
    answer:
      'Pulse™ surfaces operational health — visibility, capacity, engagement, and training adoption. Scores highlight what changed and link to recommended actions.',
    nextSteps: ['Review flagged areas first', 'Launch the Pulse dashboard tour from the Orb'],
  },
  {
    id: 'blueprint',
    topic: 'Blueprint',
    keywords: ['blueprint', 'plan', 'scope', 'design', 'architecture'],
    question: 'What is a Blueprint?',
    answer:
      'Your Blueprint is EA\'s plan for your digital experience — structure, features, priorities, and delivery approach. Review it carefully before approving.',
    nextSteps: ['Open Documents or Blueprint section', 'Use Walk me through it for a guided review'],
  },
  {
    id: 'proposals',
    topic: 'Proposals',
    keywords: ['proposal', 'quote', 'scope', 'pricing', 'approve'],
    question: 'How do I review a proposal?',
    answer:
      'Your proposal outlines scope, investment, timeline, and deliverables. Read each section, ask the Orb about anything unclear, then approve to unlock agreements and implementation.',
    nextSteps: ['Open your proposal in Documents', 'Run the Approve proposal walkthrough'],
  },
  {
    id: 'agreements',
    topic: 'Agreements',
    keywords: ['agreement', 'contract', 'sign', 'terms'],
    question: 'Where are my agreements?',
    answer:
      'Agreements appear in Documents after proposal approval. Sign electronically when prompted. EA advances your timeline once agreements are complete.',
    nextSteps: ['Check Documents for pending agreements', 'Complete signature when ready'],
  },
  {
    id: 'payments',
    topic: 'Payments',
    keywords: ['payment', 'invoice', 'billing', 'pay', 'stripe', 'checkout'],
    question: 'How do I make a payment?',
    answer:
      'Open Payments or Billing in your portal. Invoices use secure Stripe checkout. After payment, EA is notified automatically and your project advances.',
    nextSteps: ['Confirm invoice matches your proposal', 'Run the Make payment walkthrough'],
  },
  {
    id: 'uploads',
    topic: 'Uploads',
    keywords: ['upload', 'file', 'document', 'logo', 'photo', 'asset'],
    question: 'How do I upload documents?',
    answer:
      'Go to Uploads or Documents, choose your files, and submit. Use clear file names. EA is notified when uploads arrive.',
    nextSteps: ['Gather logos, photos, and brand assets', 'Run the Upload documents walkthrough'],
  },
  {
    id: 'documents',
    topic: 'Documents',
    keywords: ['documents', 'files', 'deliverables', 'download'],
    question: 'Where are my documents?',
    answer:
      'Documents holds Blueprints, proposals, agreements, deliverables, and uploaded files. Everything EA shares with you lives here.',
    nextSteps: ['Open Documents from your dashboard', 'Download or review the latest version'],
  },
  {
    id: 'training',
    topic: 'Training',
    portalType: 'training',
    keywords: ['training', 'academy', 'learn', 'module', 'course', 'certification'],
    question: 'How does training work?',
    answer:
      'The Training Hub offers short, role-based modules. Complete them in order. Progress saves automatically. Training drives adoption across your organization.',
    nextSteps: ['Continue your next incomplete module', 'Run the Complete training walkthrough'],
  },
  {
    id: 'messages',
    topic: 'Messages',
    keywords: ['message', 'update', 'communication', 'notify', 'inbox'],
    question: 'How do I send a message or update?',
    answer:
      'Use Messages or Update Hub inside your portal. Keep communication here so nothing is lost in email. EA replies appear in the same thread.',
    nextSteps: ['Open Messages or Updates', 'Be specific about what you need'],
  },
  {
    id: 'events',
    topic: 'Events',
    portalType: 'event',
    keywords: ['event', 'registration', 'rsvp', 'attendee'],
    question: 'How do events work in my portal?',
    answer:
      'The Event Portal manages registration, attendees, and event updates. Create events, share registration links, and track sign-ups from your dashboard.',
    nextSteps: ['Open Events from your portal menu', 'Create or review your next event'],
  },
  {
    id: 'users',
    topic: 'Users',
    keywords: ['user', 'team', 'member', 'invite', 'add user'],
    question: 'How do I add a user?',
    answer:
      'Admins can invite users from the Admin or Client Portal settings. Assign roles so each person sees the right features and permissions.',
    nextSteps: ['Open Users or Team settings', 'Invite with the correct role'],
  },
  {
    id: 'roles',
    topic: 'Roles',
    keywords: ['role', 'permission', 'access', 'admin', 'client', 'volunteer'],
    question: 'What roles exist in EA portals?',
    answer:
      'Common roles: Guest (discovery), Client (portal access), Owner (full client control), Admin (EA team), Staff, Volunteer, Family, and Learner (training). Your role controls what you see and can do.',
    nextSteps: ['Check your profile for your current role', 'Ask your admin if you need different access'],
  },
  {
    id: 'admin-actions',
    topic: 'Admin actions',
    portalType: 'admin',
    keywords: ['admin', 'mission control', 'factory', 'protocol', 'manage'],
    question: 'What can I do in the Admin Portal?',
    answer:
      'Mission Control manages pipeline, delivery, clients, EA Factory launches, protocols, and guide escalations. Use it to operate the full EA platform.',
    nextSteps: ['Open Mission Control dashboard', 'Review EA Guide escalations when users need help'],
  },
  {
    id: 'timeline',
    topic: 'Timeline',
    keywords: ['timeline', 'milestone', 'implementation', 'schedule', 'what happens next'],
    question: 'How do I view my implementation timeline?',
    answer:
      'The timeline shows phases, milestones, dates, and dependencies. The next open milestone is your focus area.',
    nextSteps: ['Open Timeline from your dashboard', 'Run the Implementation timeline walkthrough'],
  },
  {
    id: 'terminology-ea-guide',
    topic: 'EA terminology',
    keywords: ['orb', 'guide', 'ea guide', 'terminology', 'glossary'],
    question: 'What is EA Guide™?',
    answer:
      'EA Guide™ is the floating EA Orb — your universal guide across all EA portals. It answers questions, walks you through processes, and escalates to the EA team only when needed. No help desk email required.',
    nextSteps: ['Click the Orb to ask a question', 'Try Walk me through this page'],
  },
  {
    id: 'what-happens-next',
    topic: 'What happens next',
    keywords: ['next', 'what now', 'after', 'then', 'following'],
    question: 'What happens next?',
    answer:
      'Your dashboard and Passport show the recommended next step. Typical flow: Discover → Blueprint review → Proposal approval → Agreement → Payment → Implementation → Training → Launch.',
    nextSteps: ['Check your dashboard recommended action', 'Open Passport for the full roadmap'],
  },
  {
    id: 'common-upload-fail',
    topic: 'Common issues',
    keywords: ['upload failed', 'error', 'not working', 'stuck', 'problem', 'issue', 'help'],
    question: 'My upload is not working. What should I do?',
    answer:
      'Check file size and format (PDF, PNG, JPG are usually fine). Try a smaller file or different browser. If it still fails, use the Orb to escalate — EA receives your page context automatically.',
    nextSteps: ['Retry with a smaller file', 'Escalate to EA team from the Orb after one retry'],
  },
  {
    id: 'common-payment',
    topic: 'Common issues',
    keywords: ['payment failed', 'card declined', 'invoice', 'billing issue'],
    question: 'My payment did not go through.',
    answer:
      'Verify card details and billing address. Check that the invoice amount matches your proposal. If payment still fails, escalate through the Orb — do not email as the first step.',
    nextSteps: ['Retry secure checkout', 'Escalate with invoice details via the Orb'],
  },
];

function scoreEntry(entry: KnowledgeEntry, query: string, context: GuidePageContext): number {
  const q = query.toLowerCase();
  let score = 0;
  if (entry.portalType && entry.portalType === context.portalType) score += 4;
  if (context.workflow && entry.keywords.some((k) => context.workflow!.includes(k))) score += 3;
  for (const keyword of entry.keywords) {
    if (q.includes(keyword)) score += 2;
  }
  if (entry.question.toLowerCase().includes(q) || q.includes(entry.topic.toLowerCase())) score += 3;
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);
  for (const token of tokens) {
    if (entry.answer.toLowerCase().includes(token)) score += 1;
    if (entry.keywords.some((k) => k.includes(token))) score += 1;
  }
  return score;
}

export interface GuideAnswerResult {
  answer: string;
  entryId?: string;
  topic?: string;
  nextSteps?: string[];
  confidence: 'high' | 'medium' | 'low';
  suggestEscalation: boolean;
}

export function answerGuideQuestion(query: string, context: GuidePageContext): GuideAnswerResult {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      answer: 'Ask me about this page, your next step, uploads, payments, training, or any EA process.',
      confidence: 'low',
      suggestEscalation: false,
    };
  }

  const ranked = EA_GUIDE_KNOWLEDGE.map((entry) => ({
    entry,
    score: scoreEntry(entry, trimmed, context),
  }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 2) {
    return {
      answer: `I don't have a specific answer for "${trimmed}" on ${context.label} yet. I can walk you through this page, or send your question to the EA team with full context from where you are now.`,
      confidence: 'low',
      suggestEscalation: true,
    };
  }

  const pagePrefix =
    best.entry.portalType === context.portalType || context.workflow
      ? `On ${context.label}: `
      : '';

  return {
    answer: `${pagePrefix}${best.entry.answer}`,
    entryId: best.entry.id,
    topic: best.entry.topic,
    nextSteps: best.entry.nextSteps,
    confidence: best.score >= 6 ? 'high' : 'medium',
    suggestEscalation: best.score < 4,
  };
}

export function getPageSpecificHint(context: GuidePageContext): string {
  if (context.workflow === 'uploads') {
    return 'You are in the uploads workflow. I can walk you through choosing files and what happens after upload.';
  }
  if (context.workflow === 'blueprint') return 'You are reviewing your Blueprint. I can guide you section by section.';
  if (context.workflow === 'proposal') return 'You are in the proposal workflow. I can help you review and approve.';
  if (context.workflow === 'payments') return 'You are in payments. I can explain checkout and what happens after you pay.';
  if (context.workflow === 'timeline') return 'You are viewing your implementation timeline. I can explain milestones and next steps.';
  if (context.workflow === 'training') return 'You are in the Training Hub. I can help you continue your next module.';
  if (context.workflow === 'messages') return 'You are in Messages. I can show you how to send and read updates.';
  if (context.portalType === 'discover') return 'You are in Discover The Possibilities™. I can explain the intake and what happens after submit.';
  if (context.portalType === 'admin') return 'You are in Mission Control. I can orient you to admin dashboards and escalations.';
  if (context.portalType === 'pulse') return 'You are in Pulse™. I can explain scores and recommended actions.';
  return `You are in ${context.label}. Ask about this page or walk through the process step by step.`;
}
