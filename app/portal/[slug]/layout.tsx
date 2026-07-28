import EAAssistant from '@/app/components/ea-assistant/EAAssistant';
import { LegalReacceptanceShell } from '@/app/components/trust/LegalReacceptanceShell';
import { resolvePortalWorkspaceChrome } from '@/lib/platform/portal-workspace';

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function PortalRouteLayout({ children, params }: Props) {
  const { slug } = await params;
  const chrome = await resolvePortalWorkspaceChrome(slug);

  return (
    <LegalReacceptanceShell productId="portal_products" realm="portal">
      {children}
      <EAAssistant surface="portal" workspaceAiContext={chrome.aiContext || undefined} />
    </LegalReacceptanceShell>
  );
}
