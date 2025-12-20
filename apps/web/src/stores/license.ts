/**
 * @file Organization Store - Frontend Organization Context Management
 * @description Manages organization state based on user login
 *
 * Per license-system-guide.md:
 * - No license key input on client
 * - All authorization validation happens on backend during login
 * - Authorization is based on "Organization" rather than "License Key"
 */

import { create } from 'zustand';

/**
 * Auth Policy
 */
export interface AuthPolicy {
    primary: 'password' | 'sso';
    allowPasswordFallback: boolean;
    mfa: 'off' | 'optional' | 'required';
    identifier: 'email' | 'username';
}

/**
 * Branding Configuration
 */
export interface BrandingConfig {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
}

/**
 * Organization Context (received after login)
 */
export interface OrganizationContext {
    tenantId: string;
    organizationName: string;
    authPolicy: AuthPolicy;
    capabilities: string[];
    branding: BrandingConfig;
    subscriptionStatus: 'active' | 'past_due' | 'expired' | 'cancelled';
    expiresAt?: string;
}

interface OrganizationState {
    isLoading: boolean;
    organizationContext: OrganizationContext | null;
    error: string | null;
}

interface OrganizationActions {
    setOrganizationContext: (context: OrganizationContext) => void;
    clearOrganizationContext: () => void;
    getBranding: () => BrandingConfig | null;
}

type OrganizationStore = OrganizationState & OrganizationActions;

const initialState: OrganizationState = {
    isLoading: false,
    organizationContext: null,
    error: null,
};

export const useOrganizationStore = create<OrganizationStore>()((set, get) => ({
    ...initialState,

    /**
     * Set organization context after successful login
     */
    setOrganizationContext: (context: OrganizationContext) => {
        set({
            organizationContext: context,
            isLoading: false,
            error: null,
        });
    },

    /**
     * Clear organization context on logout
     */
    clearOrganizationContext: () => {
        set({
            organizationContext: null,
            error: null,
        });
    },

    /**
     * Get cached branding for immediate display
     */
    getBranding: () => {
        const { organizationContext } = get();
        return organizationContext?.branding ?? null;
    },
}));

/**
 * Hook to get organization loading state
 */
export function useOrganizationLoading(): boolean {
    return useOrganizationStore((state) => state.isLoading);
}

/**
 * Hook to get branding config
 */
export function useBranding(): BrandingConfig | null {
    return useOrganizationStore((state) => state.organizationContext?.branding ?? null);
}

/**
 * Hook to get capabilities from organization
 */
export function useCapabilities(): string[] {
    return useOrganizationStore((state) => state.organizationContext?.capabilities ?? []);
}

/**
 * Hook to check subscription status
 */
export function useSubscriptionStatus(): string | null {
    return useOrganizationStore((state) => state.organizationContext?.subscriptionStatus ?? null);
}

// Keep legacy exports for backward compatibility during migration
export const useLicenseStore = useOrganizationStore;
export type LicenseContext = OrganizationContext;
