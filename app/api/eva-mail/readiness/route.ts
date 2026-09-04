import { NextResponse } from 'next/server';
import { EVA_MAIL_DEFAULTS, EVA_MAIL_TENANTS, getEvaMailAddress } from '../../../../lib/eva-mail/config';
import { postalConfigured } from '../../../../lib/eva-mail/postal';

export const dynamic = 'force-dynamic';

export async function GET() {
  const transportReady = postalConfigured();
  const tenants = Object.values(EVA_MAIL_TENANTS).map((tenant) => ({
    id: tenant.id,
    label: tenant.label,
    enabled: tenant.enabled,
    address: getEvaMailAddress(tenant),
    autoReply: tenant.autoReply,
    domainReady: Boolean(tenant.domain),
    transportReady,
    operational: Boolean(tenant.enabled && tenant.domain && transportReady),
  }));

  return NextResponse.json({
    capability: EVA_MAIL_DEFAULTS.capability,
    provider: EVA_MAIL_DEFAULTS.provider,
    standardOnFuturePortals: EVA_MAIL_DEFAULTS.standardOnFuturePortals,
    transportReady,
    tenants,
  });
}
