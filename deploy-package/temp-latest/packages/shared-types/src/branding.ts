/**
 * Tenant Branding types
 * @see spec.md §4 Branding (All Tiers)
 *
 * All subscription tiers MAY configure a tenant logo.
 * Branding SHOULD be cached locally for immediate desktop startup.
 */

/**
 * Tenant branding configuration
 */
export interface TenantBranding {
    /** URL to the tenant's logo image */
    logoUrl?: string;
    /** Primary brand color (hex format) */
    primaryColor?: string;
    /** Secondary brand color (hex format) */
    secondaryColor?: string;
    /** Company display name */
    companyName?: string;
    /** Favicon URL */
    faviconUrl?: string;
}

/**
 * Branding update request (for POST /tenant/branding/logo)
 */
export interface BrandingLogoUpdateRequest {
    /** Base64 encoded image data or URL */
    logo: string;
    /** Image format (png, jpg, svg) */
    format?: 'png' | 'jpg' | 'svg';
}

/**
 * Branding update response
 */
export interface BrandingUpdateResponse {
    success: boolean;
    branding: TenantBranding;
}

/**
 * Default branding for tenants without custom branding
 */
export const DEFAULT_BRANDING: TenantBranding = {
    logoUrl: undefined,
    primaryColor: '#3B82F6', // Blue-500
    secondaryColor: '#1E40AF', // Blue-800
    companyName: undefined,
    faviconUrl: undefined,
};
