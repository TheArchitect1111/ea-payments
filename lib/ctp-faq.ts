/**
 * Self-serve FAQ for CTP portal — answers clients without pinging Brick.
 * Labels match Client Experience nav: Your Project, Documents, Contact, Help, Journey.
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
      'This is your private Consider the Possibilities™ project home. Your Project shows one clear next step, Documents holds materials we prepare for you, Contact reaches your guide, and Help answers common questions. We use what you share here to shape your website and portal experience.',
  },
  {
    id: 'where-start',
    question: 'Where should I start?',
    answer:
      'Open Your Project — it always shows the one next step that matters right now. If you are brand new, Journey in the menu tells the short story of where you are and what happens next. You never need to hunt through menus.',
  },
  {
    id: 'dont-have-brand',
    question: "I don't have a logo or brand kit yet. Is that okay?",
    answer:
      "Yes. Share what you do have — even rough notes, competitor sites you like, or photos from your phone. When Your Project asks for design details, add what you can and save. If you're starting from scratch, we'll help shape the brand as part of the project.",
  },
  {
    id: 'when-live',
    question: 'When will my website or portal go live?',
    answer:
      'After we have what we need and you confirm the plan, our team builds. Website tracks often get a starter site first; custom design and Connect experiences follow the plan in your proposal. Timeline is usually a few weeks depending on scope — Your Project will show progress as stages complete.',
  },
  {
    id: 'when-pay',
    question: 'When do I pay?',
    answer:
      'Payment happens when your proposal is ready for commitment — Your Project will show a clear confirmation step with a secure checkout link. You do not pay just for opening this workspace or saving design details.',
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
      'Yes. When Your Project asks for design details, update the fields or upload a new file and save again. Mark complete again only when you want us notified that you are ready for review.',
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
      'Only when Your Project asks you to. When a strategy conversation is the next step, you will see a clear schedule action. Many clients share materials first, then book once context is in place.',
  },
  {
    id: 'stuck',
    question: 'I am stuck. What do I do without emailing you?',
    answer:
      'Use Help first — most questions are covered there. If something is broken (login loop, upload failure), open Contact and send a message. That creates a tracked request so the team can fix it without a back-and-forth email thread.',
  },
];
