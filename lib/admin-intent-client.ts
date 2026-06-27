/**
 * Shared client handler for /api/admin/intent — used by Mission Control,
 * EA Voice, and the ⌘K command bar.
 */

export type IntentRoutePayload = {
  type: string;
  message?: string;
  whyRecommended?: string;
  href?: string;
  followUpHref?: string;
};

export type OrchestrationPayload = {
  response?: {
    summary?: string;
    recommendedNextSteps?: string[];
    confidence?: number;
  };
  agents?: Array<{ name: string; status: string }>;
};

export type AdminIntentResponse = {
  ok?: boolean;
  route?: IntentRoutePayload;
  orchestration?: OrchestrationPayload;
  orchestrationError?: string;
  error?: string;
};

export type IntentExecutionResult = {
  status: string;
  orchestration: OrchestrationPayload | null;
  navigated: boolean;
};

export async function submitAdminIntent(query: string): Promise<AdminIntentResponse> {
  const res = await fetch('/api/admin/intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query.trim() }),
  });
  return (await res.json()) as AdminIntentResponse;
}

export function executeIntentRoute(
  data: AdminIntentResponse,
  options: {
    onNavigate?: (href: string) => void;
    onTour?: () => void;
  } = {},
): IntentExecutionResult {
  const navigate = options.onNavigate ?? ((href: string) => {
    window.location.href = href;
  });

  if (!data.ok || !data.route) {
    return {
      status: data.error ?? 'Could not route that intent. Try EA Voice (Ctrl+Shift+V).',
      orchestration: null,
      navigated: false,
    };
  }

  const route = data.route;
  const why = route.whyRecommended ? ` ${route.whyRecommended}` : '';
  let status = `${route.message ?? 'Done.'}${why}`;

  if (route.type === 'capture') {
    window.dispatchEvent(new CustomEvent('ea:open-capture'));
    return { status, orchestration: null, navigated: false };
  }

  if (route.type === 'tour') {
    options.onTour?.();
    return { status, orchestration: null, navigated: false };
  }

  if (data.orchestration) {
    if (route.followUpHref) {
      status = `${route.message} Review the agent summary below, then continue in the workspace.`;
    }
    return { status, orchestration: data.orchestration, navigated: false };
  }

  if (data.orchestrationError) {
    status = `${route.message} (${data.orchestrationError})`;
  }

  if (route.href) {
    navigate(route.href);
    return { status, orchestration: null, navigated: true };
  }

  return { status, orchestration: null, navigated: false };
}
