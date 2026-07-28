import type { IndustryPack } from '@/lib/portal-universal/industry-pack';
import { CTP_CLIENT_PACK } from '@/lib/portal-universal/packs/ctp-client';

/**
 * Website + Portal Starter pack — CTP Client Experience five destinations + Intake.
 */
export const WEBSITE_PORTAL_PACK: IndustryPack = {
  ...CTP_CLIENT_PACK,
  id: 'website-portal',
  version: '1.0.0',
  title: 'Website + Portal Client Experience',
  description:
    'Website + Portal starter chrome (Progress, Documents, Contact, Help, Journey, Intake).',
  suggestedModuleIds: [
    ...CTP_CLIENT_PACK.suggestedModuleIds,
    'intake',
    'applications',
    'reports',
    'events',
  ],
  nav: [
    ...CTP_CLIENT_PACK.nav.filter((item) => item.id !== 'people' && item.id !== 'tasks'),
    {
      id: 'intake',
      universalCapabilityId: 'programs',
      label: 'Intake',
      order: 25,
      preferredModuleId: 'intake',
      hrefOverride: '/portal/{slug}/intake',
    },
  ],
};
