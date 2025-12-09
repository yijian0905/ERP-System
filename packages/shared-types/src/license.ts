import type { LicenseTier } from './entities';

// Re-export LicenseTier for convenience
export type { LicenseTier } from './entities';

/**
 * Feature flags for license validation
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
  features: LicenseFeatures;
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
  features: LicenseFeatures;
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
 */
export interface LicenseActivationRequest {
  licenseKey: string;
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
