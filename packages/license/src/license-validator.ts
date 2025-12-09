import type { LicenseFeatures, LicenseTier } from '@erp/shared-types';
import jwt from 'jsonwebtoken';

import type {
  FeatureAccessResult,
  LicenseTokenPayload,
  LicenseValidationError,
  LicenseValidationResult,
  ValidatedLicense,
} from './types';
import { getMinimumTierForFeature, isTierSufficient } from './types';

/**
 * License validator class for validating and checking license access
 */
export class LicenseValidator {
  private readonly encryptionKey: string;
  private cachedLicense: ValidatedLicense | null = null;
  private cacheExpiry: number = 0;
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor(encryptionKey: string) {
    if (!encryptionKey || encryptionKey.length < 32) {
      throw new Error('License encryption key must be at least 32 characters');
    }
    this.encryptionKey = encryptionKey;
  }

  /**
   * Validate a license key and return the license details
   */
  validate(licenseKey: string, tenantId?: string): LicenseValidationResult {
    try {
      // Decode the license key (JWT format)
      const decoded = jwt.verify(licenseKey, this.encryptionKey, {
        algorithms: ['HS256'],
      }) as LicenseTokenPayload;

      // Check tenant match if provided
      if (tenantId && decoded.tid !== tenantId) {
        return {
          valid: false,
          error: 'TENANT_MISMATCH',
        };
      }

      const now = Date.now();
      const startsAt = new Date(decoded.iat * 1000);
      const expiresAt = new Date(decoded.exp * 1000);

      // Check if license has started
      if (now < decoded.iat * 1000) {
        return {
          valid: false,
          error: 'LICENSE_NOT_STARTED',
        };
      }

      // Check if license has expired
      if (now > decoded.exp * 1000) {
        return {
          valid: false,
          error: 'LICENSE_EXPIRED',
        };
      }

      const daysRemaining = Math.ceil((decoded.exp * 1000 - now) / (24 * 60 * 60 * 1000));

      const license: ValidatedLicense = {
        id: decoded.lid,
        tenantId: decoded.tid,
        tier: decoded.tier,
        features: decoded.features,
        maxUsers: decoded.maxUsers,
        maxProducts: decoded.maxProducts,
        startsAt,
        expiresAt,
        daysRemaining,
        isExpired: false,
        isExpiringSoon: daysRemaining <= 30,
      };

      // Cache the validated license
      this.cachedLicense = license;
      this.cacheExpiry = now + this.cacheDuration;

      return {
        valid: true,
        license,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: 'LICENSE_EXPIRED',
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'INVALID_LICENSE_KEY',
        };
      }

      return {
        valid: false,
        error: 'DECRYPTION_FAILED',
      };
    }
  }

  /**
   * Get cached license or validate again
   */
  getCachedOrValidate(licenseKey: string, tenantId?: string): LicenseValidationResult {
    const now = Date.now();

    if (this.cachedLicense && now < this.cacheExpiry) {
      // Check if cached license matches tenant
      if (tenantId && this.cachedLicense.tenantId !== tenantId) {
        return this.validate(licenseKey, tenantId);
      }

      // Check if cached license is still valid
      if (now < this.cachedLicense.expiresAt.getTime()) {
        return {
          valid: true,
          license: this.cachedLicense,
        };
      }
    }

    return this.validate(licenseKey, tenantId);
  }

  /**
   * Check if a specific feature is accessible with the current license
   */
  checkFeatureAccess(
    license: ValidatedLicense,
    feature: keyof LicenseFeatures
  ): FeatureAccessResult {
    // Check if feature is enabled in license
    if (!license.features[feature]) {
      const requiredTier = getMinimumTierForFeature(feature);
      return {
        allowed: false,
        reason: `Feature '${feature}' requires ${requiredTier} tier or higher`,
        requiredTier,
        currentTier: license.tier,
      };
    }

    return {
      allowed: true,
    };
  }

  /**
   * Check if a tier requirement is met
   */
  checkTierAccess(license: ValidatedLicense, requiredTier: LicenseTier): FeatureAccessResult {
    if (!isTierSufficient(license.tier, requiredTier)) {
      return {
        allowed: false,
        reason: `This feature requires ${requiredTier} tier or higher`,
        requiredTier,
        currentTier: license.tier,
      };
    }

    return {
      allowed: true,
    };
  }

  /**
   * Check if user limit is exceeded
   */
  checkUserLimit(license: ValidatedLicense, currentUserCount: number): boolean {
    return currentUserCount < license.maxUsers;
  }

  /**
   * Check if product limit is exceeded (if applicable)
   */
  checkProductLimit(license: ValidatedLicense, currentProductCount: number): boolean {
    if (!license.maxProducts) {
      return true; // No limit
    }
    return currentProductCount < license.maxProducts;
  }

  /**
   * Clear the license cache
   */
  clearCache(): void {
    this.cachedLicense = null;
    this.cacheExpiry = 0;
  }
}

/**
 * Create a license validator instance
 */
export function createLicenseValidator(encryptionKey: string): LicenseValidator {
  return new LicenseValidator(encryptionKey);
}

/**
 * Get human-readable error message for license validation error
 */
export function getLicenseErrorMessage(error: LicenseValidationError): string {
  const messages: Record<LicenseValidationError, string> = {
    INVALID_LICENSE_KEY: 'The license key is invalid or malformed',
    LICENSE_EXPIRED: 'Your license has expired. Please renew to continue using the system',
    LICENSE_NOT_STARTED: 'Your license is not yet active',
    LICENSE_TAMPERED: 'The license key appears to have been modified',
    LICENSE_REVOKED: 'This license has been revoked',
    TENANT_MISMATCH: 'This license is not valid for your organization',
    DECRYPTION_FAILED: 'Unable to verify the license key',
  };

  return messages[error] || 'An unknown license error occurred';
}

