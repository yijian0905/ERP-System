import { DEFAULT_TIER_FEATURES, type LicenseFeatures, type LicenseTier } from '@erp/shared-types';
import jwt from 'jsonwebtoken';

import type { LicenseTokenPayload } from './types';

/**
 * Options for generating a license key
 */
export interface GenerateLicenseOptions {
  /** License ID */
  licenseId: string;
  /** Tenant ID this license belongs to */
  tenantId: string;
  /** License tier */
  tier: LicenseTier;
  /** Custom features (optional, defaults to tier features) */
  features?: Partial<LicenseFeatures>;
  /** Maximum users allowed */
  maxUsers: number;
  /** Maximum products allowed (optional) */
  maxProducts?: number;
  /** License start date (optional, defaults to now) */
  startsAt?: Date;
  /** License duration in days */
  durationDays: number;
}

/**
 * License generator class for creating encrypted license keys
 */
export class LicenseGenerator {
  private readonly encryptionKey: string;

  constructor(encryptionKey: string) {
    if (!encryptionKey || encryptionKey.length < 32) {
      throw new Error('License encryption key must be at least 32 characters');
    }
    this.encryptionKey = encryptionKey;
  }

  /**
   * Generate a new license key
   */
  generate(options: GenerateLicenseOptions): string {
    const {
      licenseId,
      tenantId,
      tier,
      features,
      maxUsers,
      maxProducts,
      startsAt = new Date(),
      durationDays,
    } = options;

    // Merge tier default features with custom features
    const tierFeatures = DEFAULT_TIER_FEATURES[tier];
    const mergedFeatures: LicenseFeatures = {
      ...tierFeatures,
      ...features,
    };

    // Calculate expiry date
    const expiresAt = new Date(startsAt);
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const payload: LicenseTokenPayload = {
      lid: licenseId,
      tid: tenantId,
      tier,
      features: mergedFeatures,
      maxUsers,
      maxProducts,
      iat: Math.floor(startsAt.getTime() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    // Generate JWT token
    const token = jwt.sign(payload, this.encryptionKey, {
      algorithm: 'HS256',
    });

    return token;
  }

  /**
   * Generate a trial license (30 days, L1 tier, limited features)
   */
  generateTrial(licenseId: string, tenantId: string): string {
    return this.generate({
      licenseId,
      tenantId,
      tier: 'L1',
      maxUsers: 3,
      maxProducts: 100,
      durationDays: 30,
    });
  }

  /**
   * Generate a demo license (90 days, L2 tier, all L2 features)
   */
  generateDemo(licenseId: string, tenantId: string): string {
    return this.generate({
      licenseId,
      tenantId,
      tier: 'L2',
      maxUsers: 10,
      maxProducts: 1000,
      durationDays: 90,
    });
  }

  /**
   * Extend an existing license
   */
  extend(currentLicenseKey: string, additionalDays: number): string {
    try {
      // Decode without verifying to get payload
      const decoded = jwt.decode(currentLicenseKey) as LicenseTokenPayload;
      
      if (!decoded) {
        throw new Error('Invalid license key');
      }

      const currentExpiry = new Date(decoded.exp * 1000);
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + additionalDays);

      const payload: LicenseTokenPayload = {
        ...decoded,
        exp: Math.floor(newExpiry.getTime() / 1000),
      };

      return jwt.sign(payload, this.encryptionKey, {
        algorithm: 'HS256',
      });
    } catch {
      throw new Error('Failed to extend license');
    }
  }

  /**
   * Upgrade a license to a higher tier
   */
  upgrade(
    currentLicenseKey: string,
    newTier: LicenseTier,
    options?: {
      additionalDays?: number;
      maxUsers?: number;
      maxProducts?: number;
    }
  ): string {
    try {
      const decoded = jwt.decode(currentLicenseKey) as LicenseTokenPayload;
      
      if (!decoded) {
        throw new Error('Invalid license key');
      }

      const tierFeatures = DEFAULT_TIER_FEATURES[newTier];
      let expiry = decoded.exp;

      if (options?.additionalDays) {
        const newExpiry = new Date(decoded.exp * 1000);
        newExpiry.setDate(newExpiry.getDate() + options.additionalDays);
        expiry = Math.floor(newExpiry.getTime() / 1000);
      }

      const payload: LicenseTokenPayload = {
        ...decoded,
        tier: newTier,
        features: tierFeatures,
        maxUsers: options?.maxUsers ?? decoded.maxUsers,
        maxProducts: options?.maxProducts ?? decoded.maxProducts,
        exp: expiry,
      };

      return jwt.sign(payload, this.encryptionKey, {
        algorithm: 'HS256',
      });
    } catch {
      throw new Error('Failed to upgrade license');
    }
  }
}

/**
 * Create a license generator instance
 */
export function createLicenseGenerator(encryptionKey: string): LicenseGenerator {
  return new LicenseGenerator(encryptionKey);
}

/**
 * Generate a formatted license key display string
 * Splits the JWT into segments for readability
 */
export function formatLicenseKeyForDisplay(licenseKey: string): string {
  // Take first 8 and last 8 characters
  const start = licenseKey.slice(0, 8);
  const end = licenseKey.slice(-8);
  return `${start}...${end}`;
}

/**
 * Validate license key format (basic check)
 */
export function isValidLicenseKeyFormat(licenseKey: string): boolean {
  // JWT format: header.payload.signature
  const parts = licenseKey.split('.');
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

