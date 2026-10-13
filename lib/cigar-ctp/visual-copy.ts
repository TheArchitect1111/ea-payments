/** Cigar CTP editorial headings and question-specific reasons.
 * Display-only content: never read by branching, scoring, reports or submissions.
 * Every question ID in questions.json must have exactly one entry here.
 */
export const CIGAR_INTRO_IMAGE_TITLE = 'A clearer picture at every step.';

export const CIGAR_QUESTION_VISUAL_COPY: Record<string, { title: string; reason: string }> = {
  C01: { title: 'Three paths. One clearer picture.', reason: 'Knowing your role helps us examine the partners, systems and numbers that matter to your business.' },
  C02: { title: 'Start with what matters most.', reason: 'Your priorities help us focus on improvements with the greatest potential operational impact.' },
  C03: { title: 'See the numbers that matter.', reason: 'This reveals whether delayed or scattered performance information slows your decisions.' },
  C04: { title: 'Make room for higher-value work.', reason: 'Recurring tasks show us where simpler processes could return valuable time to your team.' },
  C05: { title: 'Small gaps have real consequences.', reason: 'The effects of delays help us distinguish minor friction from costly disruptions.' },
  C06: { title: 'Connect what already works.', reason: 'Knowing where records live shows which systems could work together without unnecessary replacement.' },
  C07: { title: 'Keep every partner in the loop.', reason: 'Partner communication patterns reveal where missing updates may disrupt orders and decisions.' },
  B01: { title: 'Know where every box lives.', reason: 'Inventory location and custody help us uncover blind spots between your brand and its partners.' },
  B02: { title: 'Follow every sale.', reason: 'This identifies where sales visibility may break down across retailers, distributors and direct channels.' },
  B03: { title: 'Reports you can rely on.', reason: 'Reporting consistency helps us find gaps between actual sales activity and the information you receive.' },
  B04: { title: 'Account for every movement.', reason: 'Distinguishing transfers and adjustments from unexplained discrepancies helps us identify inventory controls.' },
  B05: { title: 'Know what truly earns.', reason: 'Product and channel margin visibility helps reveal which sales contribute to sustainable profit.' },
  B06: { title: 'Keep cash decisions moving.', reason: 'This shows where paperwork and partner follow-up may delay collections or critical decisions.' },
  B07: { title: 'Grow through stronger connections.', reason: 'Your growth priorities guide us toward coordination improvements worth testing first.' },
  L01: { title: 'A clearer view of every sale.', reason: 'Comparing sales and humidor records helps us spot avoidable counting and availability problems.' },
  L02: { title: 'Build trust in your inventory.', reason: 'Understanding stock discrepancies helps us identify preventable errors and reliable controls.' },
  L03: { title: 'Keep favorites in the humidor.', reason: 'Stockout and reorder patterns reveal where supply gaps could affect the guest experience.' },
  L04: { title: 'Make belonging effortless.', reason: 'Membership and locker workflows show opportunities to strengthen relationships and recurring revenue.' },
  L05: { title: 'Give the team more time for guests.', reason: 'Daily coordination patterns show where administrative work may limit the time available for hospitality.' },
  L06: { title: 'Know what drives the bottom line.', reason: 'This identifies missing sales and cost insights that could improve everyday business decisions.' },
  L07: { title: 'Better vendor conversations.', reason: 'Supplier communication patterns reveal where orders, credits and deliveries need clearer follow-through.' },
  D01: { title: 'Make every order flow.', reason: 'How orders arrive reveals avoidable data entry, tracking and retailer-service delays.' },
  D02: { title: 'Make ownership visible.', reason: 'Recording stock ownership and location helps prevent inventory and partner-reporting errors.' },
  D03: { title: 'Deliver with confidence.', reason: 'Fulfillment exceptions help us identify delays and corrections that consume team capacity.' },
  D04: { title: 'Keep brand partners informed.', reason: 'We ask to see where brand reporting could become more timely, accurate and dependable.' },
  D05: { title: 'Every movement accounted for.', reason: 'Stock movement patterns help us distinguish normal adjustments from reconciliation gaps.' },
  D06: { title: 'Close the follow-up loop.', reason: 'This identifies financial and partner workflows that may slow settlements or collections.' },
  D07: { title: 'Scale relationships, not paperwork.', reason: 'Your priorities help us focus on visibility that reduces overhead as distribution grows.' },
  F01: { title: 'Start with one meaningful win.', reason: 'Your first 90-day goal helps us prioritize improvements you can evaluate in practical terms.' },
  F02: { title: 'Leave nothing important out.', reason: 'Your perspective may surface operational realities our standard questions have not captured.' },
};

export const CIGAR_STAGE_IMAGE_TITLES: Record<string, string> = {
  upload: 'Bring the records you already have.',
  contact: 'Let’s stay connected.',
  review: 'See the picture taking shape.',
  submitted: 'Clarity for what comes next.',
};
