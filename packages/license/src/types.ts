import type { LicenseFeatures, LicenseTier } from '@erp/shared-types';

/**
 * License token payload embedded in the encrypted license key
 */
export interface LicenseTokenPayload {
  /** License ID */
  lid: string;
  /** Tenant ID */
  tid: string;
  /** License tier */
  tier: LicenseTier;
  /** Features enabled */
  features: LicenseFeatures;
  /** Maximum users allowed */
  maxUsers: number;
  /** Maximum products allowed (optional) */
  maxProducts?: number;
  /** License start timestamp */
  iat: number;
  /** License expiry timestamp */
  exp: number;
}

/**
 * Result of license validation
 */
export interface LicenseValidationResult {
  valid: boolean;
  error?: LicenseValidationError;
  license?: ValidatedLicense;
}

/**
 * Validated license data
 */
export interface ValidatedLicense {
  id: string;
  tenantId: string;
  tier: LicenseTier;
  features: LicenseFeatures;
  maxUsers: number;
  maxProducts?: number;
  startsAt: Date;
  expiresAt: Date;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // Less than 30 days
}

/**
 * License validation error types
 */
export type LicenseValidationError =
  | 'INVALID_LICENSE_KEY'
  | 'LICENSE_EXPIRED'
  | 'LICENSE_NOT_STARTED'
  | 'LICENSE_TAMPERED'
  | 'LICENSE_REVOKED'
  | 'TENANT_MISMATCH'
  | 'DECRYPTION_FAILED';

/**
 * Feature access check result
 */
export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  requiredTier?: LicenseTier;
  currentTier?: LicenseTier;
}

/**
 * Tier comparison utilities
 */
export const TIER_HIERARCHY: Record<LicenseTier, number> = {
  L1: 1,
  L2: 2,
  L3: 3,
};

/**
 * Check if current tier meets or exceeds required tier
 */
export function isTierSufficient(current: LicenseTier, required: LicenseTier): boolean {
  return TIER_HIERARCHY[current] >= TIER_HIERARCHY[required];
}

/**
 * Get the minimum tier required for a feature
 */
export function getMinimumTierForFeature(feature: keyof LicenseFeatures): LicenseTier {
  // L1 features
  const l1Features: (keyof LicenseFeatures)[] = [
    'inventory',
    'basicReports',
    'invoicing',
    'customers',
    'products',
    'orders',
    'warehouses',
  ];

  // L2 features
  const l2Features: (keyof LicenseFeatures)[] = [
    'predictiveAnalytics',
    'demandForecasting',
    'advancedReports',
    'multiWarehouse',
    'batchTracking',
  ];

  // L3 features
  const l3Features: (keyof LicenseFeatures)[] = [
    'aiChatAssistant',
    'schemaIsolation',
    'customIntegrations',
    'auditLogs',
    'multiCurrency',
    'advancedPermissions',
    'apiAccess',
  ];

  if (l1Features.includes(feature)) return 'L1';
  if (l2Features.includes(feature)) return 'L2';
  if (l3Features.includes(feature)) return 'L3';

  return 'L3'; // Default to highest tier for unknown features
}

