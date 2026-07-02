import type { ConnectCampaign, ConnectOrgConfig } from '@/lib/connect-store';
import { getConnectCampaignUrl } from '@/lib/connect-store';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export type ConnectKitLink = {
  id: string;
  label: string;
  url: string;
  qrPath: string;
  note: string;
};

export type ConnectKit = {
  orgSlug: string;
  orgName: string;
  baseUrl: string;
  captureUrl: string;
  guideUrl: string;
  journeyUrl: string;
  kitPageUrl: string;
  links: ConnectKitLink[];
};

export function buildConnectQrPath(url: string, label: string): string {
  return `/api/connect/qr?url=${encodeURIComponent(url)}&label=${encodeURIComponent(label)}`;
}

function qrPath(url: string, label: string): string {
  return buildConnectQrPath(url, label);
}

export function connectPublicBaseUrl(): string {
  return EA_PLATFORM_URL.replace(/\/$/, '');
}

export function buildEventCaptureUrl(
  orgSlug: string,
  input: { event?: string; rep?: string; campaignId?: string },
  baseUrl = connectPublicBaseUrl(),
): string {
  const params = new URLSearchParams();
  if (input.event) params.set('event', input.event);
  if (input.rep) params.set('rep', input.rep);
  if (input.campaignId) params.set('campaign', input.campaignId);
  const query = params.toString();
  return `${baseUrl}/connect/${orgSlug}${query ? `?${query}` : ''}`;
}

export function buildConnectKit(org: ConnectOrgConfig, portalSlug: string, baseUrl = connectPublicBaseUrl()): ConnectKit {
  const captureUrl = `${baseUrl}/connect/${org.slug}`;
  const guideUrl = `${baseUrl}/connect/${org.slug}/guide`;
  const journeyUrl = `${baseUrl}/connect/${org.slug}/journey`;
  const kitPageUrl = `${baseUrl}/portal/${portalSlug}/connect`;

  const links: ConnectKitLink[] = org.campaigns.map((campaign: ConnectCampaign) => {
    const url = getConnectCampaignUrl({ ...org, template: { ...org.template, domain: baseUrl.replace(/^https?:\/\//, '') } }, campaign);
    return {
      id: campaign.id,
      label: campaign.name,
      url,
      qrPath: qrPath(url, campaign.name),
      note: campaign.type,
    };
  });

  if (!links.length) {
    links.push({
      id: 'launch',
      label: `${org.name} Capture QR`,
      url: captureUrl,
      qrPath: qrPath(captureUrl, `${org.name} Connect`),
      note: 'Default capture link',
    });
  }

  return {
    orgSlug: org.slug,
    orgName: org.name,
    baseUrl,
    captureUrl,
    guideUrl,
    journeyUrl,
    kitPageUrl,
    links,
  };
}
