/** Production vs demo environment helpers for all EA portals. */
declare function isProductionDeploy(): boolean;
declare function isDemoMode(): boolean;
/** Sample/demo data only outside production or when DEMO_MODE is explicit. */
declare function allowSampleData(): boolean;
declare function requireEnv(name: string): string | null;
declare function adminEmail(fallback?: string): string;

export { adminEmail, allowSampleData, isDemoMode, isProductionDeploy, requireEnv };
