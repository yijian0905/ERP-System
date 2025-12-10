import {
  createLicenseValidator,
  FeatureAccessError,
  LicenseLimitError,
  TierAccessError,
  type ValidatedLicense,
} from '@erp/license';
import type { ApiResponse, LicenseFeatures, LicenseTier } from '@erp/shared-types';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';

/**
 * Minimum key length for security
 */
const MIN_KEY_LENGTH = 32;

/**
 * Get license encryption key with validation
 */
function getLicenseEncryptionKey(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const key = process.env.LICENSE_ENCRYPTION_KEY;

  if (isProduction) {
    if (!key || key.length < MIN_KEY_LENGTH) {
      throw new Error(
        `LICENSE_ENCRYPTION_KEY environment variable must be set with at least ${MIN_KEY_LENGTH} characters in production`
      );
    }
    return key;
  }

  // In development, use default but log a warning
  if (!key) {
    console.warn(
      '⚠️  WARNING: Using default license encryption key. Set LICENSE_ENCRYPTION_KEY environment variable for security.'
    );
  }

  return key || 'dev-only-license-key-not-for-production-use';
}

// Create a singleton license validator
const licenseValidator = createLicenseValidator(getLicenseEncryptionKey());

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
 * Get license from database for a tenant
 */
async function getLicenseKeyFromDatabase(tenantId: string): Promise<string | null> {
  try {
    const license = await prisma.license.findFirst({
      where: {
        tenantId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (license) {
      logger.debug(`Found active license for tenant: ${tenantId}`);
      return license.licenseKey;
    }

    logger.debug(`No active license found for tenant: ${tenantId}`);
    return null;
  } catch (error) {
    logger.error('Error fetching license from database', { tenantId, error });
    return null;
  }
}

/**
 * Generate a demo license for development/testing
 */
function generateDemoLicense(tenantId: string, tier: LicenseTier = 'L2'): ValidatedLicense {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year

  return {
    id: 'demo-license',
    tenantId,
    tier,
    features: {
      // L1 features
      inventory: true,
      basicReports: true,
      invoicing: true,
      customers: true,
      products: true,
      orders: true,
      warehouses: true,
      // L2 features (if tier is L2 or L3)
      predictiveAnalytics: tier !== 'L1',
      demandForecasting: tier !== 'L1',
      advancedReports: tier !== 'L1',
      multiWarehouse: tier !== 'L1',
      batchTracking: tier !== 'L1',
      // L3 features (if tier is L3)
      aiChatAssistant: tier === 'L3',
      schemaIsolation: tier === 'L3',
      customIntegrations: tier === 'L3',
      auditLogs: tier === 'L3',
      multiCurrency: tier === 'L3',
      advancedPermissions: tier === 'L3',
      apiAccess: tier === 'L3',
    },
    maxUsers: tier === 'L3' ? 100 : tier === 'L2' ? 25 : 5,
    maxProducts: tier === 'L3' ? undefined : tier === 'L2' ? 10000 : 500,
    startsAt: now,
    expiresAt,
    daysRemaining: 365,
    isExpired: false,
    isExpiringSoon: false,
  };
}

/**
 * Middleware to load and validate license for the current tenant
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

    // Get license from database
    const licenseKey = await getLicenseKeyFromDatabase(tenantId);

    let license: ValidatedLicense;

    if (licenseKey) {
      // Validate the license key
      const result = licenseValidator.validate(licenseKey, tenantId);

      if (!result.valid || !result.license) {
        logger.warn(`Invalid license for tenant ${tenantId}: ${result.error}`);
        
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'LICENSE_INVALID',
            message: 'Your license is invalid or has expired. Please contact support.',
          },
        };
        return reply.status(403).send(response);
      }

      license = result.license;
    } else {
      // No license found, use demo license based on tier from JWT
      const tier = request.tier || 'L1';
      license = generateDemoLicense(tenantId, tier);
      logger.debug(`Using demo license for tenant ${tenantId} with tier ${tier}`);
    }

    // Cache the license
    licenseCache.set(tenantId, {
      license,
      expiresAt: Date.now() + CACHE_TTL,
    });

    request.license = license;
  } catch (error) {
    logger.error('License validation error', { tenantId, error });
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'LICENSE_ERROR',
        message: 'Unable to verify license. Please try again later.',
      },
    };
    return reply.status(500).send(response);
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
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'LICENSE_REQUIRED',
          message: 'A valid license is required to access this feature',
        },
      };
      return reply.status(403).send(response);
    }

    // Check if the license tier is sufficient
    const tierHierarchy: Record<LicenseTier, number> = { L1: 1, L2: 2, L3: 3 };
    const currentTierLevel = tierHierarchy[license.tier];
    const requiredTierLevel = Math.min(...requiredTiers.map((t) => tierHierarchy[t]));

    if (currentTierLevel < requiredTierLevel) {
      const lowestRequiredTier = requiredTiers.find(
        (t) => tierHierarchy[t] === requiredTierLevel
      );

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TIER_INSUFFICIENT',
          message: `This feature requires ${lowestRequiredTier} tier or higher. Your current tier is ${license.tier}.`,
          details: {
            requiredTier: lowestRequiredTier,
            currentTier: license.tier,
          },
        },
      };
      return reply.status(403).send(response);
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
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'LICENSE_REQUIRED',
          message: 'A valid license is required to access this feature',
        },
      };
      return reply.status(403).send(response);
    }

    // Check all required features
    const missingFeatures = features.filter((f) => !license.features[f]);

    if (missingFeatures.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FEATURE_NOT_AVAILABLE',
          message: `This feature requires: ${missingFeatures.join(', ')}. Please upgrade your license.`,
          details: {
            missingFeatures,
            currentTier: license.tier,
          },
        },
      };
      return reply.status(403).send(response);
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
 * Error handler for license-related errors
 */
export function handleLicenseError(
  error: unknown,
  reply: FastifyReply
): FastifyReply {
  if (error instanceof TierAccessError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'TIER_ACCESS_DENIED',
        message: error.message,
        details: {
          requiredTier: error.requiredTier,
          currentTier: error.currentTier,
        },
      },
    };
    return reply.status(403).send(response);
  }

  if (error instanceof FeatureAccessError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'FEATURE_ACCESS_DENIED',
        message: error.message,
        details: {
          feature: error.feature,
          requiredTier: error.requiredTier,
        },
      },
    };
    return reply.status(403).send(response);
  }

  if (error instanceof LicenseLimitError) {
    const response: ApiResponse = {
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
    };
    return reply.status(403).send(response);
  }

  // Re-throw unknown errors
  throw error;
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

