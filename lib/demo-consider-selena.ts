import { embedOpportunityPayload, type OpportunityExperiencePayload } from './opportunity-experience';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app';
const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const CAPTURES_TABLE = process.env.AIRTABLE_CAPTURES_TABLE ?? 'Capture Records';

export const DEMO_CONSIDER_SLUG = 'selena';

export function buildDemoSelenaPayload(): OpportunityExperiencePayload {
  const shareUrl = `${BASE_URL.replace(/\/$/, '')}/consider/${DEMO_CONSIDER_SLUG}`;

  return {
    version: 1,
    prospectSlug: DEMO_CONSIDER_SLUG,
    businessName: 'Selena Executive Coaching',
    prospectName: 'Selena',
    extraction: {
      businessName: 'Selena Executive Coaching',
      industry: 'Professional Services',
      audience: 'Executive leadership',
      cta: 'Schedule',
      website: 'https://ea-payments.vercel.app/simplifi',
      visualElements: ['Brand identity present', 'Photography or imagery', 'Social proof elements'],
      messaging: 'Transformation-focused coaching for leaders ready to scale impact without burning out.',
      uploadType: 'demo',
    },
    analysis: {
      scores: {
        visibility: 68,
        exposure: 54,
        conversion: 61,
        differentiation: 72,
        modernity: 58,
        trust: 74,
      },
      strengths: [
        'Distinct positioning language separates you from generic competitors.',
        'Trust signals help reduce hesitation before engagement.',
        'Core offering is identifiable to a first-time visitor.',
      ],
      weaknesses: ['Conversion paths could be clearer above the fold.'],
      missedOpportunities: [
        'Add a single primary CTA above the fold with low-friction next step.',
        'Expand discoverability through consistent content and social proof.',
      ],
      competitiveRisks: [
        'Competitors with stronger digital presence may capture attention first.',
      ],
      messagingGaps: ['Add testimonials closer to primary CTAs.'],
      visualGaps: ['Refresh visual hierarchy so the eye lands on action first.'],
      estimates: {
        revenueLeftOnTable: {
          low: 18000,
          high: 42000,
          assumption: 'Based on average score 64/100 vs. category benchmark ~72/100.',
        },
        leadsMissed: { low: 6, high: 22, assumption: 'Estimated monthly leads not captured due to unclear next steps.' },
        engagementLoss: { low: 18, high: 38, assumption: 'Visitors who disengage before understanding the offer.' },
      },
    },
    magnifi: {
      currentState:
        'Selena Executive Coaching presents a foundation with identifiable strengths. Composite opportunity score: 64/100 across visibility, exposure, conversion, differentiation, modernity, and trust.',
      opportunityAnalysis:
        'Some gaps may limit how quickly prospects understand the value. Add a single primary CTA above the fold. Estimated revenue opportunity: $18,000–$42,000 annually.',
      futureState:
        'Imagine Selena Executive Coaching with a single clear path from first impression to booked conversation. Every touchpoint reinforces trust, differentiation, and momentum.',
      recommendedImprovements: [
        'Clarify the primary outcome you deliver in one sentence.',
        'Align headline, subhead, and CTA to the same promise.',
        'Refresh visual hierarchy so the eye lands on action first.',
      ],
      strategicOpportunities: [
        'Build an Executive Transformation™ narrative that turns interest into scheduled conversations.',
        'Unify capture, follow-up, and visibility in one Pulse-tracked system.',
        'Package proof adjacent to every CTA.',
      ],
      creativeDirections: [
        'Cinematic reveal: problem → hidden cost → future state → first move.',
        'Social-proof carousel highlighting transformation stories.',
        'Assessment-first funnel: Operational MRI™ before any purchase conversation.',
      ],
      quickWins: [
        'Add one primary CTA above the fold.',
        'Rewrite headline to state who you help and the outcome.',
        'Publish one case study on the highest-traffic page.',
      ],
      longTermOpportunities: [
        'Automated nurture sequence tied to assessment completion.',
        'Client portal for ongoing engagement (Pulse + Magnifi).',
        'Quarterly opportunity reviews with Simplifi capture on every campaign.',
      ],
      considerThePossibilities:
        'What if Selena Executive Coaching captured every interested visitor instead of losing 18–38% to confusion or friction?\n\nWhat if 6–22 additional leads per month converted because the path forward was unmistakable?\n\nConsider the possibilities™ — then take the Operational MRI™ to prioritize what matters most.',
    },
    clientMessage: `While reviewing your business, event, organization, or marketing, I noticed several opportunities that may help increase visibility, engagement, and results.

I created a complimentary Opportunity Experience that highlights what is working, where opportunities may exist, and what improvements could potentially create a greater impact.

You can review it here:

${shareUrl}

I hope you find it valuable.`,
    shareUrl,
    portalSlug: 'demo-client',
    createdAt: new Date().toISOString(),
    tracking: { views: 0, assessmentStarted: false, assessmentCompleted: false, discoveryBooked: false },
  };
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function ensureDemoConsiderSelena(): Promise<boolean> {
  if (!process.env.AIRTABLE_API_KEY) return false;

  const payload = buildDemoSelenaPayload();
  const analysisSummary = [
    'Demo Opportunity Experience · Selena Executive Coaching',
    'Visibility 68 · Exposure 54 · Conversion 61 · Differentiation 72 · Modernity 58 · Trust 74',
    'Template: Executive Transformation™',
  ].join('\n');
  const description = embedOpportunityPayload(analysisSummary, payload);

  const safe = DEMO_CONSIDER_SLUG.replace(/'/g, "\\'");
  const lookupUrl = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(CAPTURES_TABLE)}?filterByFormula=${encodeURIComponent(`{Consider Slug}='${safe}'`)}&maxRecords=1`;

  try {
    const lookup = await fetch(lookupUrl, { headers: authHeaders(), cache: 'no-store' });
    if (!lookup.ok) return false;
    const data = (await lookup.json()) as { records?: { id: string }[] };

    const fields = {
      'Capture ID': 'CAP-DEMO-SELENA',
      Title: 'Selena Executive Coaching',
      'Business Name': payload.businessName,
      'Prospect Name': 'Selena',
      'Consider Slug': DEMO_CONSIDER_SLUG,
      'Share URL': payload.shareUrl,
      'Client Message': payload.clientMessage,
      Description: description,
      'Analysis Summary': analysisSummary,
      'Capture Type': 'Opportunity',
      Source: 'Simplifi Portal · demo-client',
      Priority: 'High',
      Status: 'Routed',
      'Date Captured': new Date().toISOString().slice(0, 10),
      'EA Fit Score': 78,
      'Opportunity Score': 72,
      'Visibility Score': 68,
      'Exposure Score': 54,
      'Conversion Score': 61,
      'Differentiation Score': 72,
      'Modernity Score': 58,
      'Trust Confidence': 74,
      'Prospect Status': 'Shared',
      'Portal Slug': 'demo-client',
      'Blueprint Template': 'Executive Transformation',
      'Product Alignment': 'Simplifi, Magnifi, Pulse',
    };

    const existing = data.records?.[0];
    if (existing) {
      const res = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(CAPTURES_TABLE)}/${existing.id}`,
        { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ fields, typecast: true }) },
      );
      return res.ok;
    }

    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(CAPTURES_TABLE)}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
