import type { CampaignBrief, CampaignGoalId } from './types';
import { goalById } from './goals';

const URL_RE = /https?:\/\/[^\s,)]+/gi;
const DATE_RE =
  /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,?\s*\d{4})?|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/gi;
const TIME_RE = /\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi;

function firstMatch(text: string, re: RegExp): string | undefined {
  const m = text.match(re);
  return m?.[0]?.trim();
}

function inferTitle(story: string, goalId: CampaignGoalId): string {
  const trimmed = story.trim();
  const firstSentence = trimmed.split(/[.!?]/)[0]?.trim();
  if (firstSentence && firstSentence.length <= 120) return firstSentence;
  return `${goalById(goalId).label} — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
}

function inferAudience(goalId: CampaignGoalId): string {
  switch (goalId) {
    case 'recruit-athletes':
    case 'fill-camp':
      return 'Athletes and families';
    case 'enroll-students':
      return 'Prospective students and parents';
    case 'raise-donations':
    case 'find-sponsors':
      return 'Donors, sponsors, and community supporters';
    case 'promote-event':
      return 'Community members and attendees';
    default:
      return 'Your community and stakeholders';
  }
}

function inferCta(goalId: CampaignGoalId): string {
  switch (goalId) {
    case 'recruit-athletes':
    case 'enroll-students':
    case 'fill-camp':
      return 'Register now';
    case 'raise-donations':
      return 'Give today';
    case 'find-sponsors':
      return 'Become a sponsor';
    case 'promote-event':
      return 'Reserve your spot';
    default:
      return 'Learn more';
  }
}

function heuristicExtract(story: string, goalId: CampaignGoalId): CampaignBrief {
  const urls = story.match(URL_RE) ?? [];
  const title = inferTitle(story, goalId);
  const missingFields: string[] = [];

  const date = firstMatch(story, DATE_RE);
  const time = firstMatch(story, TIME_RE);
  if (!date && /event|camp|fundraiser|registration opens/i.test(story)) missingFields.push('date');
  if (!urls.length && /register|sign up|apply/i.test(story)) missingFields.push('registration link');

  return {
    title,
    audience: inferAudience(goalId),
    date,
    time,
    location: /at\s+([A-Z][^.!?]{3,60})/i.exec(story)?.[1]?.trim(),
    callToAction: inferCta(goalId),
    website: urls[0],
    registrationLink: urls.find((u) => /register|signup|apply|form/i.test(u)) ?? urls[0],
    sponsors: [],
    summary: story.trim(),
    missingFields,
  };
}

async function openAiExtract(story: string, goalId: CampaignGoalId): Promise<CampaignBrief | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const goal = goalById(goalId);
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Extract campaign brief fields from an administrator story. Return JSON only with keys: title, audience, date, time, location, callToAction, website, registrationLink, sponsors (array), organization, summary, missingFields (array of field names still unknown).',
        },
        {
          role: 'user',
          content: `Goal: ${goal.label}\n\nStory:\n${story}`,
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as Partial<CampaignBrief> & { sponsors?: string[] };
    const base = heuristicExtract(story, goalId);
    return {
      title: parsed.title?.trim() || base.title,
      audience: parsed.audience?.trim() || base.audience,
      date: parsed.date?.trim() || base.date,
      time: parsed.time?.trim() || base.time,
      location: parsed.location?.trim() || base.location,
      callToAction: parsed.callToAction?.trim() || base.callToAction,
      website: parsed.website?.trim() || base.website,
      registrationLink: parsed.registrationLink?.trim() || base.registrationLink,
      sponsors: Array.isArray(parsed.sponsors) ? parsed.sponsors.map(String).filter(Boolean) : base.sponsors,
      organization: parsed.organization?.trim(),
      summary: parsed.summary?.trim() || base.summary,
      missingFields: Array.isArray(parsed.missingFields)
        ? parsed.missingFields.map(String).filter(Boolean)
        : base.missingFields,
    };
  } catch {
    return null;
  }
}

export async function extractCampaignBrief(story: string, goalId: CampaignGoalId): Promise<CampaignBrief> {
  const ai = await openAiExtract(story, goalId);
  if (ai) return ai;
  return heuristicExtract(story, goalId);
}
