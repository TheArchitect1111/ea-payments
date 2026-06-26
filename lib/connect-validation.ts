import type { ConnectionMethod, NewConnectionInput, NewConnectProfileInput } from './connect-types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function str(value: unknown) {
  return String(value ?? '').trim();
}

function jsonArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function validateConnectProfileBody(body: Record<string, unknown>, ownerUserId = 'admin') {
  const slug = str(body.slug).toLowerCase();
  const brandName = str(body.brandName || body.brand_name);
  const headline = str(body.headline);
  const ctaText = str(body.ctaText || body.cta_text) || 'Connect';
  const primaryColor = str(body.primaryColor || body.primary_color) || '#0A66FF';

  if (!slugPattern.test(slug)) return { ok: false as const, error: 'Slug must use lowercase letters, numbers, and hyphens.' };
  if (!brandName) return { ok: false as const, error: 'Brand name is required.' };
  if (!headline) return { ok: false as const, error: 'Headline is required.' };

  const input: NewConnectProfileInput = {
    ownerUserId: str(body.ownerUserId || body.owner_user_id) || ownerUserId,
    slug,
    brandName,
    logoUrl: str(body.logoUrl || body.logo_url) || undefined,
    primaryColor,
    headline,
    subheadline: str(body.subheadline) || undefined,
    ctaText,
    defaultDestinationUrl: str(body.defaultDestinationUrl || body.default_destination_url) || undefined,
    destinations: jsonArray(body.destinations),
    resources: jsonArray(body.resources),
    welcomeEmailSubject: str(body.welcomeEmailSubject || body.welcome_email_subject) || undefined,
    welcomeEmailBody: str(body.welcomeEmailBody || body.welcome_email_body) || undefined,
    ownerNotificationEmail: str(body.ownerNotificationEmail || body.owner_notification_email) || undefined,
    isActive: body.isActive == null && body.is_active == null ? true : Boolean(body.isActive ?? body.is_active),
  };
  return { ok: true as const, input };
}

export function validateConnectionBody(body: Record<string, unknown>, profileId: string, ownerUserId: string) {
  const name = str(body.name);
  const email = str(body.email).toLowerCase();
  const method = (str(body.connectionMethod || body.connection_method) || 'email') as ConnectionMethod;

  if (!name) return { ok: false as const, error: 'Name is required.' };
  if (!emailPattern.test(email)) return { ok: false as const, error: 'A valid email is required.' };
  if (!['google', 'email', 'apple', 'microsoft', 'linkedin'].includes(method)) {
    return { ok: false as const, error: 'Connection method is invalid.' };
  }

  const input: NewConnectionInput = {
    connectProfileId: profileId,
    ownerUserId,
    name,
    email,
    phone: str(body.phone) || undefined,
    company: str(body.company) || undefined,
    role: str(body.role) || undefined,
    location: str(body.location) || undefined,
    notes: str(body.notes) || undefined,
    campaign: str(body.campaign) || undefined,
    referralSource: str(body.referralSource || body.referral_source) || undefined,
    utmSource: str(body.utmSource || body.utm_source) || undefined,
    utmMedium: str(body.utmMedium || body.utm_medium) || undefined,
    utmCampaign: str(body.utmCampaign || body.utm_campaign) || undefined,
    connectionMethod: method,
    device: str(body.device) || undefined,
    browser: str(body.browser) || undefined,
  };

  return { ok: true as const, input };
}
