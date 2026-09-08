export const AMPLIFI_CUSTOMER_ZERO = {
  customerId: 'amplifi',
  brand: 'Amplifi',
  campaignName: 'One Brief. Everywhere.',
  positioning: 'It does not help you make posts. It operates the campaign.',
  audience: ['small businesses','entrepreneurs','agencies and consultants'],
  objective: 'Grow qualified Amplifi trials and paid subscriptions by demonstrating the product through its own marketing.',
  primaryCta: 'Create my sample campaign',
  proofMechanism: 'Every campaign in this system is generated from the same guided Amplifi workflow customers use.',
  guardrails: [
    'Do not guarantee revenue, sales, leads, followers or campaign outcomes.',
    'Do not claim autonomous publishing unless the approved campaign actually used the connected publishing flow.',
    'Use clean, intelligent, human-centered creative. Avoid generic AI imagery and jargon.',
    'Every ad should demonstrate one simple business goal becoming a complete campaign.'
  ],
  briefs: [
    {
      id: 'barber-fill-midweek',
      business: 'Neighborhood barber shop',
      goal: 'Fill more Tuesday through Thursday appointment slots',
      audience: 'Local professionals and regular grooming customers',
      offer: 'Direct online booking',
      proof: 'Fast booking and clear availability',
      creativeHook: 'Fill Tuesday afternoons.',
      cta: 'See what Amplifi would create for your business'
    },
    {
      id: 'restaurant-mothers-day',
      business: 'Independent restaurant',
      goal: 'Sell out Mother’s Day brunch',
      audience: 'Families planning Mother’s Day',
      offer: 'Limited brunch reservations',
      proof: 'Distinctive menu and limited seating',
      creativeHook: 'Sell out Mother’s Day brunch.',
      cta: 'See the campaign Amplifi builds from one goal'
    },
    {
      id: 'consultant-consultations',
      business: 'Professional services consultant',
      goal: 'Generate 20 qualified consultations this month',
      audience: 'Business owners with a defined operational problem',
      offer: 'Consultation request',
      proof: 'Clear expertise and practical outcomes',
      creativeHook: 'Get 20 consultations this month.',
      cta: 'Give Amplifi your goal'
    }
  ],
  channels: ['Instagram','Facebook','LinkedIn','TikTok','X'],
  metrics: ['sample_campaign_started','sample_campaign_completed','pricing_viewed','checkout_started','subscription_started','campaign_published']
} as const;

export type AmplifiCustomerZeroBrief = typeof AMPLIFI_CUSTOMER_ZERO.briefs[number];
