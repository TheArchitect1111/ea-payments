import { ensureConnectForPortal, packageIncludesConnect } from '@/lib/connect-provision';

export async function provisionConnectAfterCheckout(input: {
  portalSlug?: string;
  organizationName: string;
  ownerEmail: string;
  packagePurchased: string;
  connectIndustry?: string | null;
}): Promise<void> {
  if (!input.portalSlug) return;
  if (!packageIncludesConnect(input.packagePurchased, { isDemo: input.portalSlug === 'demo-client' })) {
    return;
  }

  const result = await ensureConnectForPortal({
    portalSlug: input.portalSlug,
    organizationName: input.organizationName,
    ownerEmail: input.ownerEmail,
    industry: input.connectIndustry,
    sendWelcomeEmail: true,
  });

  if (!result.ok) {
    console.error('[connect] auto-provision failed', input.portalSlug, result.error);
  }
}
