export { TenantAirtable, TenantBrand, TenantConfig, TenantLayout, TenantNavItem } from './tenant.js';
export { EnvRequirement, TenantEnvReport, TenantValidationResult, checkTenantEnv, requiredEnvForTenant, validateTenant } from './tenant-env.js';
export { ClerkShell, ClerkShellProps } from './clerk.js';
import * as next_server from 'next/server';
import * as react from 'react';
import { ReactNode } from 'react';
export { HmacSessionConfig, SessionCookieOptions, makeSessionCookie, newSessionExpiry, signHmacSession, verifyHmacSession } from './hmac.js';
export { HmacPortalMiddlewareConfig, SlugRoleRoute, createHmacPortalMiddleware } from './middleware.js';
export { NavItem, PortalLayout, PortalLayoutProps } from './portal-layout.js';
export { HeaderPortalShell, HeaderPortalShellProps, HeaderPortalTab } from './layout.js';
export { ActivityTimeline, BriefExperience, BriefExperienceProps, QuickActions, UniversalBriefCard, UniversalBriefCardProps } from './brief-experience.js';
export { MissionControlExperience, MissionControlExperienceProps } from './mission-control-experience.js';
export { AirtableQueryParams, AirtableRecord, airtableCreate, airtableDelete, airtableGet, airtableGetOne, airtableUpdate } from './airtable.js';
export { triggerMakeWebhook } from './webhooks.js';
export { EmailPayload, sendEmail } from './email.js';
export { adminEmail, allowSampleData, isDemoMode, isProductionDeploy, requireEnv } from './env.js';
export { AdminNotifyInput, notifyAdmin } from './notify.js';
export { generateTempPassword, hashPassword, verifyPassword } from './passwords.js';
export { ProvisionPortalUserInput, ProvisionPortalUserResult, provisionPortalUser } from './provisioning.js';
export { ACTIVITY_EVENTS_TABLE, ActivityEvent, ActivityEventInput, ActivityEventListOptions, ActivityModule, fromAirtableRecord, listActivityEvents, normalizeActivityEvent, publishActivityEvent } from './activity.js';
export { BriefAction, BriefCard, BriefRequest, BriefResponse, buildBriefResponse, scoreActivityEvent, selectBriefCards, toBriefCard } from './brief.js';
export { PlatformEvent, PlatformEventCategory, PlatformEventSource, PulseEventRow, fromActivityEvent, fromPulseAirtableRecord, fromPulseEventRow, mergeEventStreams, toActivityEventInput } from './platform-events.js';
export { AgentDefinition, AgentKind, AgentRun, AgentRunInput, AgentRunStatus, EA_AGENT_REGISTRY, isActiveAgent, listAgentRuns, publishAgentRun, toAgentRun } from './agents.js';
export { ActionCard, ContinueWorkingItem, DEFAULT_ACTION_CARDS, DEFAULT_INTENT_EXAMPLES, MissionControlRequest, MissionControlResponse, MomentumStat, buildMissionControlFromStreams, buildMissionControlResponse } from './mission-control.js';
export { IntentNavRoute, IntentOrchestratorRoute, IntentRouteResult, IntentRouteType, IntentRouterConfig, routeIntent } from './intent.js';
export { OpportunityEdgeType, OpportunityGraph, OpportunityGraphEdge, OpportunityGraphInput, OpportunityGraphNode, OpportunityNodeType, ResolvedIntentRecord, buildOpportunityGraph, intentToActivityEventInput, linkIntentToOpportunity, searchOpportunityGraph } from './opportunity-graph.js';
export { EAMotionDuration, InstantFeelButton, OptimisticSaveBadge, OptimisticSaveStatus, ProgressMomentum, SkeletonBlock, eaMotion, useOptimisticSave } from './instant-feel.js';

interface MiddlewareConfig {
    protectedPrefixes: string[];
    adminPrefixes: string[];
    publicRoutes: string[];
}
/**
 * Returns a ready-to-export Clerk middleware and its Next.js matcher config.
 *
 * Usage in middleware.ts:
 *   const { middleware, config } = createPortalMiddleware({ ... });
 *   export default middleware;
 *   export { config };
 */
declare function createPortalMiddleware(cfg: MiddlewareConfig): {
    middleware: next_server.NextMiddleware;
    config: {
        matcher: string[];
    };
};

interface RoleGuardProps {
    requiredRole: "Member" | "Officer" | "Admin";
    fallback?: ReactNode;
    children: ReactNode;
}
/**
 * Renders children only when the signed-in user's publicMetadata.role
 * meets or exceeds requiredRole. Renders fallback (default: null) otherwise.
 * Role hierarchy: Admin > Officer > Member.
 */
declare function RoleGuard({ requiredRole, fallback, children }: RoleGuardProps): react.JSX.Element | null;

/**
 * Server-side role check for API route handlers.
 * Returns a 401/403 Response if the check fails, or null if the caller may proceed.
 *
 * Usage:
 *   const guard = await withRoleProtection(request, "Officer");
 *   if (guard) return guard;
 */
declare function withRoleProtection(_request: Request, requiredRole: string): Promise<Response | null>;

export { type MiddlewareConfig, RoleGuard, type RoleGuardProps, createPortalMiddleware, withRoleProtection };
