/**
 * Golden fixtures for Simplifi OS certification (deterministic, portal-scoped).
 */

function daysAgo(n) {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

function daysFromNow(n) {
  return new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Portal A — primary dogfood workspace.
 */
export function fixturePortalA() {
  return {
    portalSlug: 'cert-portal-a',
    objects: [
      {
        id: 'recMikePromise',
        title: 'Promise to Mike — send CPR proposal',
        type: 'Opportunity',
        status: 'active',
        nextAction: 'Email Mike the CPR proposal draft',
        whyThisMatters: 'Mike is waiting on the proposal you promised.',
        whatWeRecommend: 'Send the draft today.',
        dueDate: daysAgo(2),
        dateCaptured: daysAgo(12),
        opportunityScore: 72,
        owner: 'Mike',
        savePurpose: undefined,
      },
      {
        id: 'recCprOne',
        title: 'CPR partnership proposal',
        type: 'Opportunity',
        status: 'active',
        nextAction: 'Schedule discovery call',
        whyThisMatters: 'Strategic partnership with CPR.',
        whatWeRecommend: 'Confirm stakeholders.',
        dueDate: daysFromNow(3),
        dateCaptured: daysAgo(4),
        opportunityScore: 68,
        owner: 'CPR',
      },
      {
        id: 'recCprTwo',
        title: 'CPR partnership proposal draft',
        type: 'Opportunity',
        status: 'active',
        nextAction: 'Merge with primary CPR capture',
        whyThisMatters: 'Likely duplicate of CPR partnership.',
        whatWeRecommend: 'Link or archive duplicate.',
        dateCaptured: daysAgo(3),
        opportunityScore: 55,
        owner: 'CPR',
      },
      {
        id: 'recCprThree',
        title: 'CPR partnership proposal follow-up',
        type: 'Note',
        status: 'active',
        nextAction: 'File under CPR opportunity',
        whyThisMatters: 'Third mention of CPR partnership proposal.',
        whatWeRecommend: 'Consolidate.',
        dateCaptured: daysAgo(2),
        opportunityScore: 40,
      },
      {
        id: 'recStale',
        title: 'Harbor Shield website refresh',
        type: 'Opportunity',
        status: 'active',
        nextAction: 'Re-open conversation',
        whyThisMatters: 'Gone quiet for weeks.',
        whatWeRecommend: 'Light-touch check-in.',
        dateCaptured: daysAgo(25),
        opportunityScore: 48,
      },
      {
        id: 'recMomentum',
        title: 'Northline Guide launch',
        type: 'Opportunity',
        status: 'active',
        nextAction: 'Ship launch email',
        whyThisMatters: 'High score and recent activity.',
        whatWeRecommend: 'Act while momentum is high.',
        dateCaptured: daysAgo(2),
        opportunityScore: 81,
      },
      {
        id: 'recPerson',
        title: 'Selena Ortiz',
        type: 'Person',
        status: 'active',
        nextAction: 'Connect to an opportunity',
        whyThisMatters: 'Relationship without linked work.',
        whatWeRecommend: 'Link to active deal.',
        dateCaptured: daysAgo(20),
        opportunityScore: 30,
      },
      {
        id: 'recDeferred',
        title: 'Research Docling OCR path',
        type: 'Note',
        status: 'active',
        nextAction: 'Decide keep or drop',
        whyThisMatters: 'Saved for later without a date.',
        whatWeRecommend: 'Defer with date or dismiss.',
        dateCaptured: daysAgo(18),
        opportunityScore: 35,
        savePurpose: 'research later',
        saveReason: 'maybe useful',
      },
    ],
  };
}

/**
 * Portal B — isolation control (must never leak into A answers).
 */
export function fixturePortalB() {
  return {
    portalSlug: 'cert-portal-b',
    objects: [
      {
        id: 'recSecretB',
        title: 'SECRET TENANT B ONLY — Quantum Deal',
        type: 'Opportunity',
        status: 'active',
        nextAction: 'Do not leak',
        whyThisMatters: 'Isolation canary.',
        whatWeRecommend: 'N/A',
        dateCaptured: daysAgo(1),
        opportunityScore: 99,
        owner: 'TenantB',
      },
    ],
  };
}

export function emptyActionCenter() {
  return { needsAttention: [], recommended: [], watchlist: [] };
}

export function actionCenterFromObjects(objects) {
  const needsAttention = [];
  for (const o of objects) {
    if (o.dueDate && Date.parse(o.dueDate) < Date.now()) {
      needsAttention.push({
        id: o.id,
        title: `Overdue: ${o.title}`,
        detail: o.nextAction,
        href: `/simplifi/opportunity/${o.id}`,
        priority: 'critical',
        section: 'attention',
      });
    }
  }
  return { needsAttention, recommended: [], watchlist: [] };
}
