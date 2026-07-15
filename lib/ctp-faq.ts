/**
 * Self-serve FAQ for CTP portal — answers clients without pinging Brick.
 */

export type CtpFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const CTP_FAQ_ITEMS: CtpFaqItem[] = [
  {
    id: 'what-is-this',
    question: 'What is this workspace?',
    answer:
      'This is your private Consider the Possibilities™ project home. You can share brand details, upload files, review findings, and track progress. We use what you share here to shape your website, portal, or Connect experience.',
  },
  {
    id: 'where-start',
    question: 'Where should I start?',
    answer:
      'Open Design Studio (under Progress). Add your brand colors, voice, offer, and any logo or photos you have. Click Save, then Mark complete when you are done for now. You can come back anytime to add more.',
  },
  {
    id: 'dont-have-brand',
    question: "I don't have a logo or brand kit yet. Is that okay?",
    answer:
      "Yes. Share what you do have — even rough notes, competitor sites you like, or photos from your phone. If you're starting from scratch, we'll help shape the brand as part of the project.",
  },
  {
    id: 'when-live',
    question: 'When will my website or portal go live?',
    answer:
      'After you finish Design Studio inputs, our team reviews everything and builds. Website tracks often get a starter site first; custom design and Connect experiences follow the plan in your proposal. Timeline is usually a few weeks depending on scope.',
  },
  {
    id: 'when-pay',
    question: 'When do I pay?',
    answer:
      'Payment happens when your proposal is ready for commitment — you will see a Pay now card on this Overview (and a secure checkout link). You do not pay just for opening this workspace or saving Design Studio.',
  },
  {
    id: 'login',
    question: 'How do I sign back in later?',
    answer:
      'Use the same portal login link from your email. Prefer the email login link if you do not want to manage a password. Check spam if the link does not arrive within a few minutes.',
  },
  {
    id: 'wrong-info',
    question: 'I entered something wrong. Can I change it?',
    answer:
      'Yes. Return to Design Studio, update the fields or upload a new file, and Save again. Mark complete again only when you want us notified that you are ready for review.',
  },
  {
    id: 'who-sees',
    question: 'Who can see my uploads?',
    answer:
      'Your workspace is private to you and the Efficiency Architects delivery team working on your project. Files are used to build your experience — not shared publicly.',
  },
  {
    id: 'schedule',
    question: 'Do I need to book a call?',
    answer:
      'Only when you are ready. Use Scheduling in this workspace to book a strategy session. Many clients complete Design Studio first, then book once they have shared materials.',
  },
  {
    id: 'stuck',
    question: 'I am stuck. What do I do without emailing you?',
    answer:
      'Use this Help guide first. Most questions are covered here. If something is broken (login loop, upload failure), use Messages & Support in the workspace — that creates a tracked request so the team can fix it without a back-and-forth email thread.',
  },
];
