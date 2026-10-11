import EAAssistant from '@/app/components/ea-assistant/EAAssistant';
import { resolvePortalWorkspaceChrome } from '@/lib/platform/portal-workspace';
import AmandaCtaTracker from '@/app/portal/amanda-catherine/(engagement)/AmandaCtaTracker';

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function PortalRouteLayout({ children, params }: Props) {
  const { slug } = await params;
  const chrome = await resolvePortalWorkspaceChrome(slug);

  const content = (
    <>
      {children}
      <EAAssistant surface="portal" workspaceAiContext={chrome.aiContext || undefined} />
    </>
  );
  return slug==='amanda-catherine'?<AmandaCtaTracker>{content}</AmandaCtaTracker>:content;
}
