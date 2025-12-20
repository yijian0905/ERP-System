/**
 * License Middleware - Organization Account Authorization Model
 * 
 * This middleware validates tenant subscription status using database records.
 * No client-side license keys required - authorization is tied to Organization.
 * 
 * @see license-system-guide.md
 */

import type { LicenseFeatures, LicenseTier } from '@erp/shared-types';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { getTenantCapabilities } from './capability.js';

/**
 * Validated license information from database
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
  isExpiringSoon: boolean;
}

// Cache for validated licenses per tenant
const licenseCache = new Map<string, { license: ValidatedLicense; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Extend FastifyRequest with license context
 */
declare module 'fastify' {
  interface FastifyRequest {
    /** Validated license for the current tenant */
    license?: ValidatedLicense;
  }
}

/**
 * Get tier-based default features
 */
function getTierFeatures(tier: LicenseTier): LicenseFeatures {
  const features: Record<LicenseTier, LicenseFeatures> = {
    L1: {
      inventory: true,
      basicReports: true,
      invoicing: true,
      customers: true,
      products: true,
      orders: true,
      warehouses: true,
      predictiveAnalytics: false,
      demandForecasting: false,
      advancedReports: false,
      multiWarehouse: false,
      batchTracking: false,
      aiChatAssistant: false,
      schemaIsolation: false,
      customIntegrations: false,
      auditLogs: false,
      multiCurrency: false,
      advancedPermissions: false,
      apiAccess: false,
    },
    L2: {
      inventory: true,
      basicReports: true,
      invoicing: true,
      customers: true,
      products: true,
      orders: true,
      warehouses: true,
      predictiveAnalytics: true,
      demandForecasting: true,
      advancedReports: true,
      multiWarehouse: true,
      batchTracking: true,
      aiChatAssistant: false,
      schemaIsolation: false,
      customIntegrations: false,
      auditLogs: false,
      multiCurrency: false,
      advancedPermissions: false,
      apiAccess: false,
    },
    L3: {
      inventory: true,
      basicReports: true,
      invoicing: true,
      customers: true,
      products: true,
      orders: true,
      warehouses: true,
      predictiveAnalytics: true,
      demandForecasting: true,
      advancedReports: true,
      multiWarehouse: true,
      batchTracking: true,
      aiChatAssistant: true,
      schemaIsolation: true,
      customIntegrations: true,
      auditLogs: true,
      multiCurrency: true,
      advancedPermissions: true,
      apiAccess: true,
    },
  };
  return features[tier];
}

/**
 * Generate validated license from database record
 */
function createValidatedLicense(
  license: {
    id: string;
    tenantId: string;
    tier: string;
    maxUsers: number;
    maxProducts: number | null;
    startsAt: Date;
    expiresAt: Date;
  },
  capabilities: Array<{ code: string; enabled: boolean }>
): ValidatedLicense {
  const tier = license.tier as LicenseTier;
  const now = new Date();
  const daysRemaining = Math.ceil((license.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Merge tier features with capability-based features
  const tierFeatures = getTierFeatures(tier);
  const features: LicenseFeatures = { ...tierFeatures };

  // Override with capabilities from TenantCapability table if present
  const hasCapability = (code: string) =>
    capabilities.some(c => c.code === code && c.enabled);

  if (hasCapability('forecasting')) {
    features.demandForecasting = true;
    features.predictiveAnalytics = true;
  }
  if (hasCapability('ai_chat')) {
    features.aiChatAssistant = true;
  }
  if (hasCapability('audit')) {
    features.auditLogs = true;
  }

  return {
    id: license.id,
    tenantId: license.tenantId,
    tier,
    features,
    maxUsers: license.maxUsers,
    maxProducts: license.maxProducts ?? undefined,
    startsAt: license.startsAt,
    expiresAt: license.expiresAt,
    daysRemaining,
    isExpired: daysRemaining <= 0,
    isExpiringSoon: daysRemaining > 0 && daysRemaining <= 30,
  };
}

/**
 * Middleware to load and validate license for the current tenant
 * Uses database-based validation (Organization Account Authorization model)
 */
export async function licenseMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const tenantId = request.tenantId;

  if (!tenantId) {
    // No tenant context, skip license check
    return;
  }

  try {
    // Check cache first
    const cached = licenseCache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
      request.license = cached.license;
      return;
    }

    // Query database for active license
    const license = await prisma.license.findFirst({
      where: {
        tenantId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!license) {
      logger.warn(`No active license found for tenant: ${tenantId}`);
      return reply.status(403).send({
        success: false,
        error: {
          code: 'NO_ACTIVE_LICENSE',
          message: 'Your organization does not have an active subscription. Please contact your billing administrator.',
        },
      });
    }

    // Get capabilities from TenantCapability table
    const capabilities = await getTenantCapabilities(tenantId);

    // Create validated license
    const validatedLicense = createValidatedLicense(license, capabilities);

    // Cache the license
    licenseCache.set(tenantId, {
      license: validatedLicense,
      expiresAt: Date.now() + CACHE_TTL,
    });

    request.license = validatedLicense;
  } catch (error) {
    logger.error('License validation error', { tenantId, error });
    return reply.status(500).send({
      success: false,
      error: {
        code: 'LICENSE_ERROR',
        message: 'Unable to verify subscription status. Please try again later.',
      },
    });
  }
}

/**
 * Create a tier guard middleware
 * Requires the user's license to be at least the specified tier
 */
export function requireTier(...requiredTiers: LicenseTier[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const license = request.license;

    if (!license) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'LICENSE_REQUIRED',
          message: 'A valid subscription is required to access this feature',
        },
      });
    }

    // Check if the license tier is sufficient
    const tierHierarchy: Record<LicenseTier, number> = { L1: 1, L2: 2, L3: 3 };
    const currentTierLevel = tierHierarchy[license.tier];
    const requiredTierLevel = Math.min(...requiredTiers.map((t) => tierHierarchy[t]));

    if (currentTierLevel < requiredTierLevel) {
      const lowestRequiredTier = requiredTiers.find(
        (t) => tierHierarchy[t] === requiredTierLevel
      );

      return reply.status(403).send({
        success: false,
        error: {
          code: 'TIER_INSUFFICIENT',
          message: `This feature requires ${lowestRequiredTier} tier or higher. Your current tier is ${license.tier}.`,
          details: {
            requiredTier: lowestRequiredTier,
            currentTier: license.tier,
          },
        },
      });
    }
  };
}

/**
 * Create a feature guard middleware
 * Requires specific features to be enabled in the license
 */
export function requireFeature(...features: (keyof LicenseFeatures)[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const license = request.license;

    if (!license) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'LICENSE_REQUIRED',
          message: 'A valid subscription is required to access this feature',
        },
      });
    }

    // Check all required features
    const missingFeatures = features.filter((f) => !license.features[f]);

    if (missingFeatures.length > 0) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'FEATURE_NOT_AVAILABLE',
          message: `This feature requires: ${missingFeatures.join(', ')}. Please upgrade your subscription.`,
          details: {
            missingFeatures,
            currentTier: license.tier,
          },
        },
      });
    }
  };
}

/**
 * Check if a feature is available (non-blocking)
 */
export function hasFeature(request: FastifyRequest, feature: keyof LicenseFeatures): boolean {
  return request.license?.features[feature] ?? false;
}

/**
 * Check if the license tier is sufficient (non-blocking)
 */
export function hasTier(request: FastifyRequest, requiredTier: LicenseTier): boolean {
  if (!request.license) return false;

  const tierHierarchy: Record<LicenseTier, number> = { L1: 1, L2: 2, L3: 3 };
  return tierHierarchy[request.license.tier] >= tierHierarchy[requiredTier];
}

/**
 * Clear the license cache (useful after license updates)
 */
export function clearLicenseCache(tenantId?: string): void {
  if (tenantId) {
    licenseCache.delete(tenantId);
  } else {
    licenseCache.clear();
  }
}

/**
 * Get license info for the current request
 */
export function getLicenseInfo(request: FastifyRequest): ValidatedLicense | null {
  return request.license || null;
}

/**
 * Custom error classes for license-related errors
 */
export class TierAccessError extends Error {
  constructor(
    message: string,
    public readonly requiredTier: LicenseTier,
    public readonly currentTier: LicenseTier
  ) {
    super(message);
    this.name = 'TierAccessError';
  }
}

export class FeatureAccessError extends Error {
  constructor(
    message: string,
    public readonly feature: string,
    public readonly requiredTier?: LicenseTier
  ) {
    super(message);
    this.name = 'FeatureAccessError';
  }
}

export class LicenseLimitError extends Error {
  constructor(
    message: string,
    public readonly limitType: string,
    public readonly currentCount: number,
    public readonly maxAllowed: number
  ) {
    super(message);
    this.name = 'LicenseLimitError';
  }
}

/**
 * Error handler for license-related errors
 */
export function handleLicenseError(
  error: unknown,
  reply: FastifyReply
): FastifyReply {
  if (error instanceof TierAccessError) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'TIER_ACCESS_DENIED',
        message: error.message,
        details: {
          requiredTier: error.requiredTier,
          currentTier: error.currentTier,
        },
      },
    });
  }

  if (error instanceof FeatureAccessError) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FEATURE_ACCESS_DENIED',
        message: error.message,
        details: {
          feature: error.feature,
          requiredTier: error.requiredTier,
        },
      },
    });
  }

  if (error instanceof LicenseLimitError) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'LICENSE_LIMIT_EXCEEDED',
        message: error.message,
        details: {
          limitType: error.limitType,
          currentCount: error.currentCount,
          maxAllowed: error.maxAllowed,
        },
      },
    });
  }

  // Re-throw unknown errors
  throw error;
}
