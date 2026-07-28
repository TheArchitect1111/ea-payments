import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { LegalReacceptanceGate } from '@/app/components/trust/LegalReacceptanceGate';
import {
  clientIdFromPortalSlug,
  evaluateReacceptanceGate,
} from '@/lib/trust-engine/reacceptance-guard';
import type { TrustProductId } from '@/lib/trust-engine/types';

/**
 * Server wrapper — after auth, blocks app UI until legal pack is current.
 * Exempts /legal and /trust paths to avoid redirect loops.
 */
export async function LegalReacceptanceShell({
  children,
  productId,
  realm,
}: {
  children: React.ReactNode;
  productId: TrustProductId;
  realm?: 'portal' | 'simplifi';
}) {
  const session = await requirePortalSession({
    realm: realm ?? (productId === 'simplifi' ? 'simplifi' : 'portal'),
  });

  if (!session?.slug) {
    return <>{children}</>;
  }

  const clientId = clientIdFromPortalSlug(session.slug);
  const { blocked, profile, pathname } = await evaluateReacceptanceGate({
    productId,
    clientId,
  });

  if (!blocked) {
    return <>{children}</>;
  }

  return (
    <LegalReacceptanceGate
      productId={productId}
      userId={session.sub || session.email || clientId}
      email={session.email}
      profile={profile}
      nextPath={pathname || undefined}
    />
  );
}
