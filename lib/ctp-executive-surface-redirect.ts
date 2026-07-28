/**
 * Soft-redirect CTP Client Experience clients away from executive dual surfaces.
 * Preserves architecture: same portal host, CTP submission detection, landing helpers.
 */
import { redirect } from 'next/navigation';
import { shouldUseClientExperienceShell } from '@/lib/ctp-client-nav';
import { portalCtpPath } from '@/lib/ctp-opportunity-routes';

export type CtpClientSurfaceTarget = 'progress' | 'documents' | 'messages' | 'support';

const TARGET_SEGMENTS: Record<CtpClientSurfaceTarget, string> = {
  progress: 'ctp/progress',
  documents: 'ctp/documents',
  messages: 'ctp/messages',
  support: 'ctp/support',
};

/**
 * If this portal uses Client Experience chrome, redirect to the matching CTP surface.
 * Call at the top of executive module pages (documents, messaging, updates, ask).
 */
export async function redirectCtpClientFromExecutiveSurface(
  slug: string,
  target: CtpClientSurfaceTarget,
): Promise<void> {
  const useClientShell = await shouldUseClientExperienceShell(slug);
  if (!useClientShell) return;
  redirect(portalCtpPath(slug, TARGET_SEGMENTS[target]));
}
