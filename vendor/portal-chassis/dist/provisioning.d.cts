import { TenantConfig } from './tenant.cjs';

/**
 * Generic portal user provisioning for any tenant.
 *
 * Closes the chassis "create client → welcome email → login" gap that was
 * previously CPR-specific (`/api/portal/create-client`). Tenant-agnostic:
 * pass a `TenantConfig` and a user, get back a record + login credentials,
 * with welcome email and admin notification handled.
 */

interface ProvisionPortalUserInput {
    /** Tenant the user belongs to — drives brand, Airtable, and login URL. */
    tenant: TenantConfig;
    email: string;
    name: string;
    /** Logical role, e.g. "parent" | "athlete" | "member" | "client". */
    role?: string;
    /** URL-safe identity slug. Generated from name/email when omitted. */
    slug?: string;
    /** Logical table key in `tenant.airtable.tables`, or a literal table name. */
    table?: string;
    /** Extra Airtable fields merged into the created record. */
    fields?: Record<string, unknown>;
    /** Supply to set a known password; otherwise a temp password is generated. */
    password?: string;
    /** Default true. Sends the branded welcome email with login details. */
    sendWelcomeEmail?: boolean;
    /** Default true. Emails the tenant admin that a user was provisioned. */
    notifyAdminOnCreate?: boolean;
    /** Default true. Rejects if a record with this email already exists. */
    failIfExists?: boolean;
    /** Path appended to the canonical URL for login. Default "/portal/login". */
    loginPath?: string;
    /** Env var holding a Make webhook URL to fire on provision (optional). */
    welcomeWebhookEnvKey?: string;
}
interface ProvisionPortalUserResult {
    recordId: string;
    email: string;
    name: string;
    role: string;
    slug: string;
    loginUrl: string;
    /** Present only when the password was generated (deliver securely once). */
    tempPassword?: string;
    welcomeEmailSent: boolean;
    adminNotified: boolean;
    webhookFired: boolean;
}
/**
 * Provision a portal user end-to-end: dedupe, hash credentials, create the
 * Airtable record, send the branded welcome email, notify the admin, and
 * optionally fire a Make webhook. Returns login details for the new user.
 */
declare function provisionPortalUser(input: ProvisionPortalUserInput): Promise<ProvisionPortalUserResult>;

export { type ProvisionPortalUserInput, type ProvisionPortalUserResult, provisionPortalUser };
