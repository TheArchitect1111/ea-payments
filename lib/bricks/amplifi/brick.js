export const AmplifiBrick = {
  name: "Amplifi by EA",
  dba: "DBA of Ascension Systems, LLC",
  promise: "Focus on your craft. Let Amplifi handle social media.",
  process: [
    "Tell us goal: I want 20 new customers this month",
    "AI builds strategy: Who to reach, what to say, when to post",
    "We make 5-post campaign: copy, creative direction, booking link, images - transformation, benefits, testimonials, availability, reminder - not generic",
    "You approve on phone: Tap Yes, we post where you said when you said - Nothing without Yes plus Redo",
    "See what made money: Track inquiries bookings revenue not likes - 11 posts 132 clicks 19 trials $145 proof"
  ],
  threeWays: {
    manual: { name: "You Publish Manual", best: "Full control", easier: "No more staring what to post, complete campaign given" },
    scheduled: { name: "You Approve We Post Scheduled", popular: true, best: "Handled consistently but still control", easier: "No remembering, no 10pm couch posting, handles daily" },
    automated: { name: "We Handle It Fully Automated Future Premium", best: "Marketing runs without daily involvement", easier: "Marketing runs without you thinking", note: "Building toward with safeguards, today focus Option 2" }
  },
  smarter: {
    businessMemory: "Remembers services pricing audience what worked - Post 20 smarter than post 1",
    emptyDetection: "Checks what needs to move not random - Future calendar integration auto detect cancellation post in 2 min",
    channelLocked: "Only posts where you said when you said - Yes required - Redo any post - Protects Ascension Systems LLC",
    incomeTracker: "Tracks money not likes - 11 posts $145 proof product markets itself",
    selfMarketing: "Product markets itself via runner.js with utm_source=self",
    brick: "EA ecosystem - createGrowthCampaign() other bricks can call",
    antiGeneric: "5-post framework tied to goal not Happy Monday spam - Guard rejects generic",
    voiceMemory: "Learns your tone not generic AI voice",
    ruleEngine: "Never discount without permission, pause when full",
    customerWinLoop: "Booking via link auto creates testimonial post",
    statistical: "Best times increase bookings, campaigns around goals 3x vs random, our proof 11 posts $145"
  },
  guarantee: "You are in control. Nothing posts without your Yes on your phone. Don't love it? Don't post it. Plus redo any post or campaign with one tap.",
  policy: "Cancel anytime, no money back, keep access till end",
  supportEmail: "support@efficiencyarchitects.online forwards to info@efficiencyarchitects.online via Namecheap free forwarding",
  pricing: { starter: 49, growth: 99, pro: 199, fees: "2.9% + 30c" }
}

export function createGrowthCampaign(goal) {
  // Uses generator, returns 5-post campaign with images, booking links, redo capability
  return {
    goal,
    posts: 5,
    includes: ["copy", "creative direction", "booking link", "images - AI or your photo plus copy"],
    antiGeneric: true,
    requiresApproval: true,
    redoAvailable: true
  }
}
