/**
 * Emotional copy for Client Experience — gold standard for the EA client ecosystem.
 * Intent: Apple clarity · Disney welcome · Ritz anticipation · Linear calm · Notion warmth.
 * Presentation helpers only — no new workflows.
 */

export const CX_EMOTION = {
  yourProject: {
    /** How they should feel: oriented, cared for, never behind. */
    lede: 'Everything that matters today is here — calmly, in one place.',
    cta: 'Open Your Project',
    navLabel: 'Your Project',
  },
  contact: {
    lede: 'When you want a person, write your guide. We respond within one business day.',
    panelTitle: 'We’re here when you need us',
    panelBody:
      'Send a note to your Efficiency Architects guide. For where the project stands and what happens next, Your Project always has the answer.',
    empty: 'Reach your guide by email anytime. Help also has answers for the most common questions.',
    cta: 'Contact your guide',
    navLabel: 'Contact',
  },
  documents: {
    lede: 'Materials we prepare for you appear here when they’re ready to review — never a homework pile.',
    idleTitle: 'Nothing to review yet',
    idleBody:
      'We’re preparing what you’ll need. When something is ready, it will show up here — and Your Project will tell you.',
    empty: 'Nothing to review yet. Rest easy — we’ll bring documents here when they’re ready.',
    /** Executive dual surface (non-CTP chrome) — same voice, no Trust Engine jargon. */
    executiveTitle: 'Documents',
    executiveLede:
      'Materials we prepare for you appear here when they’re ready — never a homework pile.',
    navLabel: 'Documents',
  },
  help: {
    lede: 'Answers first. A person when you need one. You’re never stuck alone.',
    fabLabel: 'Need a hand?',
    drawerKicker: 'Here for you',
    drawerTitle: 'Quick answers',
    drawerIntro: 'Most questions have a calm answer here. If you still need us, Contact reaches your guide.',
    navLabel: 'Help',
    anytimeLabel: 'Help anytime',
  },
  journey: {
    navLabel: 'Journey',
    snapshotTitle: 'Where you stand',
    contactSectionTitle: 'Stay close',
    contactSectionLede:
      'Questions, notes, and recommendations live here with your guide — calmly, without chasing email threads.',
    messageCta: 'Contact your guide',
    openContactCta: 'Open Contact & Help',
    backCta: 'Back to Journey',
    continueCta: 'Continue in Your Project',
    portalPages: ['Your Project', 'Contact', 'Documents', 'Help'] as const,
  },
  notifications: {
    title: 'What’s new',
    lede: 'Everything that matters recently — calmly, in one place.',
    empty: 'Quiet for now — we’ll bring updates here when there’s something useful.',
    panelTitle: 'Updates',
    panelEmpty: 'Nothing waiting — rest easy.',
    markRead: 'Clear these',
    viewAll: 'See everything',
  },
  legal: {
    gateKicker: 'A quiet pause',
    gateTitle: 'A few documents need a quiet look',
    gateBody: 'When you’re ready, accept and continue — no rush.',
  },
  email: {
    openYourProject: 'Open Your Project',
    eyebrowClientExperience: 'Client Experience',
    eyebrowYourProject: 'Your Project',
  },
} as const;
