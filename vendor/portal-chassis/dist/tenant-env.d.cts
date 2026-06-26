import { TenantConfig } from './tenant.cjs';

/**
 * Per-tenant env checklist + config validation.
 *
 * `requiredEnvForTenant()` generates the env vars a deploy needs from its
 * `TenantConfig`. `checkTenantEnv()` reports what is missing at runtime.
 * `validateTenant()` catches incomplete configs before deploy. Together they
 * make a new tenant deploy self-verifying instead of relying on tribal memory.
 */

interface EnvRequirement {
    key: string;
    purpose: string;
    /** Required for the deploy to function (vs. recommended guardrails). */
    required: boolean;
}
interface TenantEnvReport {
    ok: boolean;
    missingRequired: EnvRequirement[];
    missingRecommended: EnvRequirement[];
    present: string[];
}
interface TenantValidationResult {
    ok: boolean;
    errors: string[];
    warnings: string[];
}
/** Build the env requirement list for a tenant from its config. */
declare function requiredEnvForTenant(tenant: TenantConfig): EnvRequirement[];
/** Check which required/recommended env vars are missing at runtime. */
declare function checkTenantEnv(tenant: TenantConfig): TenantEnvReport;
/** Validate a tenant config for completeness before deploy. */
declare function validateTenant(tenant: TenantConfig): TenantValidationResult;

export { type EnvRequirement, type TenantEnvReport, type TenantValidationResult, checkTenantEnv, requiredEnvForTenant, validateTenant };
