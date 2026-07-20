import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import {
  resolvePortalMemberHome,
  type PortalMemberHome,
} from '@/lib/portal-member-home';
import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { moduleHref, getModuleDefinition } from '@/lib/modules/registry';

export const dynamic = 'force-dynamic';

const TILE_HREF: Record<string, (slug: string) => string> = {
  updates: (slug) => `/portal/${slug}/updates`,
  'update hub': (slug) => `/portal/${slug}/updates`,
  resources: (slug) => `/portal/${slug}/resources`,
  events: (slug) => `/portal/${slug}/events`,
  ask: (slug) => `/portal/${slug}/ask`,
  guide: (slug) => `/portal/${slug}/ask`,
  documents: (slug) => `/portal/${slug}/documents`,
  messaging: (slug) => `/portal/${slug}/messaging`,
  messages: (slug) => `/portal/${slug}/messaging`,
  learning: (slug) => `/portal/${slug}/learning`,
  training: (slug) => `/portal/${slug}/learning`,
  pulse: (slug) => `/portal/${slug}/pulse`,
  connect: (slug) => `/portal/${slug}/connect`,
  ctp: (slug) => `/portal/${slug}/ctp`,
};

function tileHref(slug: string, tile: string): string {
  const key = tile.trim().toLowerCase();
  if (TILE_HREF[key]) return TILE_HREF[key](slug);
  for (const [pattern, href] of Object.entries(TILE_HREF)) {
    if (key.includes(pattern)) return href(slug);
  }
  const updates = getModuleDefinition('update-hub');
  return updates ? moduleHref(slug, updates) : `/portal/${slug}`;
}

export default async function MemberHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { session, client } = await requirePortalModule(slug, 'member');

  const org = await findOrganizationByPortalSlug(slug);
  const organizationId =
    (session.orgId && !session.orgId.startsWith('org_') ? session.orgId : null) ||
    org?.id ||
    '';
  const organizationName =
    org?.name?.trim() ||
    client.organization?.trim() ||
    client.clientName?.trim() ||
    'Your organization';

  let home: PortalMemberHome;
  if (organizationId && !organizationId.startsWith('org_')) {
    home = await resolvePortalMemberHome({
      portalSlug: slug,
      organizationId,
      organizationName,
    });
  } else {
    home = {
      id: `member-home-${slug}`,
      portalSlug: slug,
      organizationId: organizationId || 'pending',
      organizationName,
      persona: 'Member',
      purpose: `A clear home for people who belong with ${organizationName}.`,
      talkingPoint: 'One place for updates, resources, and the next step.',
      businessValue: 'Members stay oriented without chasing email threads.',
      tiles: ['Updates', 'Resources', 'Events', 'Ask'],
      source: 'default',
      updatedAt: new Date().toISOString(),
    };
  }

  return (
    <PortalSubpage
      slug={slug}
      active="member"
      kicker={home.persona}
      title={`${organizationName} member home`}
      lede={home.purpose}
    >
      {(home.talkingPoint || home.businessValue) && (
        <div className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
          {home.talkingPoint ? <p className="ep-module-card-note">{home.talkingPoint}</p> : null}
          {home.businessValue ? (
            <p className="ep-module-card-note" style={{ marginTop: '0.5rem' }}>
              {home.businessValue}
            </p>
          ) : null}
        </div>
      )}
      <ul className="ep-module-list">
        {home.tiles.map((tile) => {
          const href = tileHref(slug, tile);
          return (
            <li key={tile} className="ep-module-card">
              <Link href={href} className="ep-module-card-title">
                {tile}
              </Link>
              <p className="ep-module-card-note">Open in your portal</p>
            </li>
          );
        })}
      </ul>
    </PortalSubpage>
  );
}
