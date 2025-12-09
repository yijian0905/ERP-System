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
  tier: LicenseTier;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  tier: LicenseTier | null;
}

interface AuthActions {
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  logout: () => void;
  hasFeature: (feature: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  tier: null,
};

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
        });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...updates },
            tier: updates.tier || user.tier,
          });
        }
      },

      logout: () => {
        set(initialState);
        // Clear any other auth-related state
        localStorage.removeItem('erp-auth');
      },

      hasFeature: (feature: string) => {
        const { tier } = get();
        if (!tier) return false;

        // Feature mapping based on tier
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

        return tierFeatures[tier]?.includes(feature) ?? false;
      },

      hasPermission: (_permission: string) => {
        // Permission check can be implemented based on user's permissions array
        // For now, return true (all authenticated users have access)
        const { isAuthenticated } = get();
        return isAuthenticated;
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
