/**
 * Intent router — unified natural-language routing for Mission Control,
 * command bar, EA Voice, and orchestrator entry points.
 *
 * Chassis port of ea-payments `intent-router.ts` without ea-voice coupling.
 * Deploys extend routes via `IntentRouterConfig`.
 */
type IntentRouteType = 'navigate' | 'capture' | 'tour' | 'analyze' | 'audit' | 'orchestrate' | 'explain';
interface IntentRouteResult {
    type: IntentRouteType;
    message: string;
    whyRecommended?: string;
    href?: string;
    query?: string;
    orchestratorIntent?: string;
    confidence: number;
}
interface IntentNavRoute {
    pattern: RegExp;
    href: string;
    label: string;
    why: string;
}
interface IntentOrchestratorRoute {
    pattern: RegExp;
    intent: string;
    why: string;
}
interface IntentRouterConfig {
    directNav?: IntentNavRoute[];
    orchestrator?: IntentOrchestratorRoute[];
}
/** Route natural-language intent to navigation, workflows, or orchestrator. */
declare function routeIntent(input: string, config?: IntentRouterConfig): IntentRouteResult;

export { type IntentNavRoute, type IntentOrchestratorRoute, type IntentRouteResult, type IntentRouteType, type IntentRouterConfig, routeIntent };
