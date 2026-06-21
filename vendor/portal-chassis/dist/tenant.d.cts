/** Per-tenant portal configuration — branding, layout, modules, data layer. */
type TenantBrand = {
    name: string;
    nameLine2?: string;
    logo: string;
    colors: {
        primary: string;
        accent?: string;
        background?: string;
        text?: string;
    };
    fromEmail: string;
    supportEmail: string;
};
type TenantNavItem = {
    label: string;
    href: string;
    roles?: string[];
    comingSoon?: boolean;
};
type TenantLayout = {
    publicNav: string[];
    portalNav: TenantNavItem[];
    adminNav: TenantNavItem[];
};
type TenantAirtable = {
    baseId: string;
    tables: Record<string, string>;
    fieldMap?: Record<string, string>;
};
type TenantConfig = {
    id: string;
    brand: TenantBrand;
    layout: TenantLayout;
    modules: string[];
    airtable: TenantAirtable;
    urls: {
        canonical: string;
    };
    auth?: {
        provider: 'hmac' | 'clerk';
        cookieName?: string;
        secretEnvKey?: string;
    };
};

export type { TenantAirtable, TenantBrand, TenantConfig, TenantLayout, TenantNavItem };
