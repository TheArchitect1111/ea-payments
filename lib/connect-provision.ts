import { CONNECT_INDUSTRY_TEMPLATES, normalizeConnectIndustry, type ConnectIndustry } from '@/lib/connect-industry-templates';
import { buildConnectKit, type ConnectKit } from '@/lib/connect-kit';
import { createConnectTenant, getConnectOrg, listConnectOrgs } from '@/lib/connect-store';
import { defaultModulesForPackage } from '@/lib/modules/registry';
import { sendConnectKitEmail } from '@/lib/email';

export function packageIncludesConnect(packagePurchased: string, options?: { isDemo?: boolean }): boolean {
  return defaultModulesForPackage(packagePurchased, options).includes('connect');
}

export type EnsureConnectInput = {
  portalSlug: string;
  organizationName: string;
  ownerEmail: string;
  industry?: ConnectIndustry | string | null;
  notificationEmails?: string[];
  sendWelcomeEmail?: boolean;
};

export type EnsureConnectResult = {
  ok: boolean;
  created: boolean;
  orgSlug: string;
  kit?: ConnectKit;
  persisted: boolean;
  warning?: string;
  error?: string;
};

export async function ensureConnectForPortal(input: EnsureConnectInput): Promise<EnsureConnectResult> {
  const orgSlug = input.portalSlug.trim().toLowerCase();
  const industry = normalizeConnectIndustry(input.industry ?? undefined);
  const template = CONNECT_INDUSTRY_TEMPLATES[industry];
  const notificationEmails = input.notificationEmails?.length
    ? input.notificationEmails
    : [input.ownerEmail.trim().toLowerCase()].filter(Boolean);

  try {
    const existing = (await listConnectOrgs()).find((org) => org.slug === orgSlug);
    if (existing) {
      const kit = buildConnectKit(existing, orgSlug);
      if (input.sendWelcomeEmail) {
        await sendConnectKitEmail({
          email: input.ownerEmail,
          organizationName: input.organizationName,
          kit,
        });
      }
      return { ok: true, created: false, orgSlug, kit, persisted: true };
    }

    const result = await createConnectTenant({
      slug: orgSlug,
      name: input.organizationName,
      offerHeadline: template.offerHeadline,
      resourceTitle: template.resourceTitle,
      leadTypes: template.leadTypes,
      teams: template.teams,
      guideTitle: template.resourceTitle,
      guideIntro: template.guideIntro,
      journeyTitle: template.journeyTitle,
      journeyIntro: template.journeyIntro,
      notificationEmails,
    });

    const org = await getConnectOrg(orgSlug);
    const kit = buildConnectKit(org, orgSlug);

    if (input.sendWelcomeEmail) {
      await sendConnectKitEmail({
        email: input.ownerEmail,
        organizationName: input.organizationName,
        kit,
      });
    }

    return {
      ok: true,
      created: true,
      orgSlug,
      kit,
      persisted: result.persisted,
      warning: result.warning,
    };
  } catch (error) {
    return {
      ok: false,
      created: false,
      orgSlug,
      persisted: false,
      error: error instanceof Error ? error.message : 'Connect provisioning failed.',
    };
  }
}
