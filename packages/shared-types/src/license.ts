import type { LicenseTier } from './entities';
import type { Capability } from './capability';
import type { AuthPolicy } from './auth-policy';
import type { TenantBranding } from './branding';

// Re-export LicenseTier for convenience
export type { LicenseTier } from './entities';

/**
 * Feature flags for license validation
 * @deprecated Use capabilities array for new implementations
 */
export interface LicenseFeatures {
  // L1 Features (Standard)
  inventory: boolean;
  basicReports: boolean;
  invoicing: boolean;
  customers: boolean;
  products: boolean;
  orders: boolean;
  warehouses: boolean;

  // L2 Features (Professional)
  predictiveAnalytics: boolean;
  demandForecasting: boolean;
  advancedReports: boolean;
  multiWarehouse: boolean;
  batchTracking: boolean;

  // L3 Features (Enterprise)
  aiChatAssistant: boolean;
  schemaIsolation: boolean;
  customIntegrations: boolean;
  auditLogs: boolean;
  multiCurrency: boolean;
  advancedPermissions: boolean;
  apiAccess: boolean;
}

/**
 * License information
 */
export interface License {
  id: string;
  tenantId: string;
  tier: LicenseTier;
  licenseKey: string;
  /** @deprecated Use capabilities for new implementations */
  features: LicenseFeatures;
  /** New capability-based feature gating */
  capabilities?: Capability[];
  maxUsers: number;
  maxProducts?: number | null;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * License validation response
 */
export interface LicenseValidation {
  valid: boolean;
  tier: LicenseTier;
  /** @deprecated Use capabilities for new implementations */
  features: LicenseFeatures;
  /** New capability-based feature gating */
  capabilities?: Capability[];
  startsAt: string;
  expiresAt: string;
  daysRemaining: number;
  maxUsers: number;
  currentUsers: number;
  maxProducts?: number;
  currentProducts?: number;
}

/**
 * License activation request
 * @see spec.md §6 Desktop Application Lifecycle - POST /license/activate
 */
export interface LicenseActivationRequest {
  licenseKey: string;
  /** Optional server URL for self-hosted deployments */
  serverUrl?: string;
}

/**
 * License activation response
 * Returns License Context as per spec.md
 */
export interface LicenseActivationResponse {
  success: boolean;
  licenseContext: LicenseContext;
}

/**
 * License Context - persisted locally on Desktop app
 * @see spec.md §6 Desktop Application Lifecycle
 */
export interface LicenseContext {
  tenantId: string;
  capabilities: Capability[];
  authPolicy: AuthPolicy;
  branding: TenantBranding;
  tier: LicenseTier;
  expiresAt: string;
  activatedAt: string;
}


/**
 * Default features by tier
 */
export const DEFAULT_TIER_FEATURES: Record<LicenseTier, LicenseFeatures> = {
  L1: {
    // Standard features
    inventory: true,
    basicReports: true,
    invoicing: true,
    customers: true,
    products: true,
    orders: true,
    warehouses: true,
    // Professional features
    predictiveAnalytics: false,
    demandForecasting: false,
    advancedReports: false,
    multiWarehouse: false,
    batchTracking: false,
    // Enterprise features
    aiChatAssistant: false,
    schemaIsolation: false,
    customIntegrations: false,
    auditLogs: false,
    multiCurrency: false,
    advancedPermissions: false,
    apiAccess: false,
  },
  L2: {
    // Standard features
    inventory: true,
    basicReports: true,
    invoicing: true,
    customers: true,
    products: true,
    orders: true,
    warehouses: true,
    // Professional features
    predictiveAnalytics: true,
    demandForecasting: true,
    advancedReports: true,
    multiWarehouse: true,
    batchTracking: true,
    // Enterprise features
    aiChatAssistant: false,
    schemaIsolation: false,
    customIntegrations: false,
    auditLogs: false,
    multiCurrency: false,
    advancedPermissions: false,
    apiAccess: false,
  },
  L3: {
    // Standard features
    inventory: true,
    basicReports: true,
    invoicing: true,
    customers: true,
    products: true,
    orders: true,
    warehouses: true,
    // Professional features
    predictiveAnalytics: true,
    demandForecasting: true,
    advancedReports: true,
    multiWarehouse: true,
    batchTracking: true,
    // Enterprise features
    aiChatAssistant: true,
    schemaIsolation: true,
    customIntegrations: true,
    auditLogs: true,
    multiCurrency: true,
    advancedPermissions: true,
    apiAccess: true,
  },
};

/**
 * Tier display information
 */
export const TIER_INFO: Record<LicenseTier, { name: string; description: string }> = {
  L1: {
    name: 'Standard',
    description: 'Core ERP features for small businesses',
  },
  L2: {
    name: 'Professional',
    description: 'Advanced analytics and multi-warehouse support',
  },
  L3: {
    name: 'Enterprise',
    description: 'Full-featured ERP with AI and custom integrations',
  },
};

/**
 * Check if a feature is available for a given tier
 */
export function hasFeature(tier: LicenseTier, feature: keyof LicenseFeatures): boolean {
  return DEFAULT_TIER_FEATURES[tier][feature];
}

/**
 * Get all features for a tier
 */
export function getTierFeatures(tier: LicenseTier): LicenseFeatures {
  return DEFAULT_TIER_FEATURES[tier];
}
