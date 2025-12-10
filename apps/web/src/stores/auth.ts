import type { LicenseTier, UserRole } from '@erp/shared-types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Authenticated user info
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: UserRole;
  tenantId: string;
  tenantName?: string;
  tier: LicenseTier;
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  tier: LicenseTier | null;
  permissions: string[];
}

interface AuthActions {
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  logout: () => void;
  hasFeature: (feature: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  hasAllPermissions: (...permissions: string[]) => boolean;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  tier: null,
  permissions: [],
};

/**
 * Feature mapping based on license tier
 */
const tierFeatures: Record<LicenseTier, string[]> = {
  L1: [
    'inventory',
    'basicReports',
    'invoicing',
    'customers',
    'products',
    'orders',
    'warehouses',
  ],
  L2: [
    'inventory',
    'basicReports',
    'invoicing',
    'customers',
    'products',
    'orders',
    'warehouses',
    'predictiveAnalytics',
    'demandForecasting',
    'advancedReports',
    'multiWarehouse',
    'batchTracking',
  ],
  L3: [
    'inventory',
    'basicReports',
    'invoicing',
    'customers',
    'products',
    'orders',
    'warehouses',
    'predictiveAnalytics',
    'demandForecasting',
    'advancedReports',
    'multiWarehouse',
    'batchTracking',
    'aiChatAssistant',
    'schemaIsolation',
    'customIntegrations',
    'auditLogs',
    'multiCurrency',
    'advancedPermissions',
    'apiAccess',
  ],
};

/**
 * Normalize permission string for comparison
 * Handles both colon and dot notation
 */
function normalizePermission(permission: string): string {
  return permission.toLowerCase().replace(/:/g, '.');
}

/**
 * Check if a permission matches (supports wildcards)
 */
function permissionMatches(userPermission: string, requiredPermission: string): boolean {
  const normalizedUser = normalizePermission(userPermission);
  const normalizedRequired = normalizePermission(requiredPermission);

  // Exact match
  if (normalizedUser === normalizedRequired) {
    return true;
  }

  // Wildcard match (e.g., "products.*" matches "products.view")
  if (normalizedUser.endsWith('.*')) {
    const prefix = normalizedUser.slice(0, -2);
    return normalizedRequired.startsWith(prefix + '.');
  }

  // Admin wildcard (e.g., "*" matches everything)
  if (normalizedUser === '*') {
    return true;
  }

  return false;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAuth: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          tier: user.tier,
          permissions: user.permissions || [],
        });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...updates };
          set({
            user: updatedUser,
            tier: updates.tier || user.tier,
            permissions: updates.permissions || user.permissions || [],
          });
        }
      },

      logout: () => {
        set(initialState);
        // Clear auth storage
        localStorage.removeItem('erp-auth');
      },

      hasFeature: (feature: string) => {
        const { tier } = get();
        if (!tier) return false;
        return tierFeatures[tier]?.includes(feature) ?? false;
      },

      hasPermission: (permission: string) => {
        const { isAuthenticated, permissions } = get();

        // Must be authenticated
        if (!isAuthenticated) {
          return false;
        }

        // No permissions array means no access
        if (!permissions || permissions.length === 0) {
          return false;
        }

        // Check if any user permission matches the required permission
        return permissions.some((userPerm) => permissionMatches(userPerm, permission));
      },

      hasAnyPermission: (...requiredPermissions: string[]) => {
        const { hasPermission } = get();
        return requiredPermissions.some((permission) => hasPermission(permission));
      },

      hasAllPermissions: (...requiredPermissions: string[]) => {
        const { hasPermission } = get();
        return requiredPermissions.every((permission) => hasPermission(permission));
      },
    }),
    {
      name: 'erp-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        tier: state.tier,
        permissions: state.permissions,
      }),
    }
  )
);

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.isAuthenticated);
}

/**
 * Hook to get current user
 */
export function useUser(): AuthUser | null {
  return useAuthStore((state) => state.user);
}

/**
 * Hook to get current tier
 */
export function useTier(): LicenseTier | null {
  return useAuthStore((state) => state.tier);
}

/**
 * Hook to check if user has a feature
 */
export function useHasFeature(feature: string): boolean {
  return useAuthStore((state) => state.hasFeature(feature));
}

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(permission: string): boolean {
  return useAuthStore((state) => state.hasPermission(permission));
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useHasAnyPermission(...permissions: string[]): boolean {
  return useAuthStore((state) => state.hasAnyPermission(...permissions));
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useHasAllPermissions(...permissions: string[]): boolean {
  return useAuthStore((state) => state.hasAllPermissions(...permissions));
}

/**
 * Hook to get user's permissions
 */
export function usePermissions(): string[] {
  return useAuthStore((state) => state.permissions);
}
