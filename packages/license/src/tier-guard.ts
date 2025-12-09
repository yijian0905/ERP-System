import type { LicenseFeatures, LicenseTier } from '@erp/shared-types';

import type { FeatureAccessResult, ValidatedLicense } from './types';
import { getMinimumTierForFeature, isTierSufficient, TIER_HIERARCHY } from './types';

/**
 * Tier guard error for feature access denial
 */
export class TierAccessError extends Error {
  public readonly code: string = 'TIER_ACCESS_DENIED';
  public readonly requiredTier: LicenseTier;
  public readonly currentTier: LicenseTier;
  public readonly feature?: string;

  constructor(
    message: string,
    requiredTier: LicenseTier,
    currentTier: LicenseTier,
    feature?: string
  ) {
    super(message);
    this.name = 'TierAccessError';
    this.requiredTier = requiredTier;
    this.currentTier = currentTier;
    this.feature = feature;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      requiredTier: this.requiredTier,
      currentTier: this.currentTier,
      feature: this.feature,
    };
  }
}

/**
 * Feature access error for disabled features
 */
export class FeatureAccessError extends Error {
  public readonly code: string = 'FEATURE_ACCESS_DENIED';
  public readonly feature: string;
  public readonly requiredTier: LicenseTier;

  constructor(feature: string, requiredTier: LicenseTier) {
    super(`Feature '${feature}' requires ${requiredTier} tier or higher`);
    this.name = 'FeatureAccessError';
    this.feature = feature;
    this.requiredTier = requiredTier;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      feature: this.feature,
      requiredTier: this.requiredTier,
    };
  }
}

/**
 * License limit error (users, products, etc.)
 */
export class LicenseLimitError extends Error {
  public readonly code: string = 'LICENSE_LIMIT_EXCEEDED';
  public readonly limitType: string;
  public readonly currentCount: number;
  public readonly maxAllowed: number;

  constructor(limitType: string, currentCount: number, maxAllowed: number) {
    super(`${limitType} limit exceeded: ${currentCount}/${maxAllowed}`);
    this.name = 'LicenseLimitError';
    this.limitType = limitType;
    this.currentCount = currentCount;
    this.maxAllowed = maxAllowed;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      limitType: this.limitType,
      currentCount: this.currentCount,
      maxAllowed: this.maxAllowed,
    };
  }
}

/**
 * Guard function that throws if tier is insufficient
 */
export function requireTier(
  license: ValidatedLicense,
  requiredTier: LicenseTier
): void {
  if (!isTierSufficient(license.tier, requiredTier)) {
    throw new TierAccessError(
      `This feature requires ${requiredTier} tier or higher. Your current tier is ${license.tier}.`,
      requiredTier,
      license.tier
    );
  }
}

/**
 * Guard function that throws if feature is not enabled
 */
export function requireFeature(
  license: ValidatedLicense,
  feature: keyof LicenseFeatures
): void {
  if (!license.features[feature]) {
    const requiredTier = getMinimumTierForFeature(feature);
    throw new FeatureAccessError(String(feature), requiredTier);
  }
}

/**
 * Guard function that throws if user limit is exceeded
 */
export function requireUserLimit(
  license: ValidatedLicense,
  currentUserCount: number
): void {
  if (currentUserCount >= license.maxUsers) {
    throw new LicenseLimitError('User', currentUserCount, license.maxUsers);
  }
}

/**
 * Guard function that throws if product limit is exceeded
 */
export function requireProductLimit(
  license: ValidatedLicense,
  currentProductCount: number
): void {
  if (license.maxProducts && currentProductCount >= license.maxProducts) {
    throw new LicenseLimitError('Product', currentProductCount, license.maxProducts);
  }
}

/**
 * Check multiple tiers and return the result
 */
export function checkTiers(
  license: ValidatedLicense,
  requiredTiers: LicenseTier[]
): FeatureAccessResult {
  // Find the minimum required tier from the list
  const minRequired = requiredTiers.reduce((min, tier) => {
    return TIER_HIERARCHY[tier] < TIER_HIERARCHY[min] ? tier : min;
  }, requiredTiers[0]);

  if (!isTierSufficient(license.tier, minRequired)) {
    return {
      allowed: false,
      reason: `Requires one of: ${requiredTiers.join(', ')}`,
      requiredTier: minRequired,
      currentTier: license.tier,
    };
  }

  return { allowed: true };
}

/**
 * Check multiple features and return combined result
 */
export function checkFeatures(
  license: ValidatedLicense,
  features: (keyof LicenseFeatures)[]
): FeatureAccessResult {
  const missingFeatures: string[] = [];
  let highestRequiredTier: LicenseTier = 'L1';

  for (const feature of features) {
    if (!license.features[feature]) {
      missingFeatures.push(String(feature));
      const requiredTier = getMinimumTierForFeature(feature);
      if (TIER_HIERARCHY[requiredTier] > TIER_HIERARCHY[highestRequiredTier]) {
        highestRequiredTier = requiredTier;
      }
    }
  }

  if (missingFeatures.length > 0) {
    return {
      allowed: false,
      reason: `Missing features: ${missingFeatures.join(', ')}`,
      requiredTier: highestRequiredTier,
      currentTier: license.tier,
    };
  }

  return { allowed: true };
}

/**
 * Create a tier guard that can be used as a higher-order function
 */
export function createTierGuard(requiredTier: LicenseTier) {
  return (license: ValidatedLicense): void => {
    requireTier(license, requiredTier);
  };
}

/**
 * Create a feature guard that can be used as a higher-order function
 */
export function createFeatureGuard(feature: keyof LicenseFeatures) {
  return (license: ValidatedLicense): void => {
    requireFeature(license, feature);
  };
}

/**
 * Decorator-style guard for tier requirements
 * Usage: @TierRequired('L2')
 */
export function TierRequired(requiredTier: LicenseTier) {
  return function <T extends (...args: unknown[]) => unknown>(
    _target: object,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value;
    
    if (originalMethod) {
      descriptor.value = function (this: { license?: ValidatedLicense }, ...args: Parameters<T>) {
        const license = this.license;
        if (!license) {
          throw new Error('License not found in context');
        }
        requireTier(license, requiredTier);
        return originalMethod.apply(this, args) as ReturnType<T>;
      } as T;
    }
    
    return descriptor;
  };
}

/**
 * Decorator-style guard for feature requirements
 * Usage: @FeatureRequired('predictiveAnalytics')
 */
export function FeatureRequired(feature: keyof LicenseFeatures) {
  return function <T extends (...args: unknown[]) => unknown>(
    _target: object,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value;
    
    if (originalMethod) {
      descriptor.value = function (this: { license?: ValidatedLicense }, ...args: Parameters<T>) {
        const license = this.license;
        if (!license) {
          throw new Error('License not found in context');
        }
        requireFeature(license, feature);
        return originalMethod.apply(this, args) as ReturnType<T>;
      } as T;
    }
    
    return descriptor;
  };
}

/**
 * Utility to get upgrade suggestions based on missing features
 */
export function getUpgradeSuggestion(
  currentTier: LicenseTier,
  missingFeature: keyof LicenseFeatures
): { suggestedTier: LicenseTier; message: string } | null {
  const requiredTier = getMinimumTierForFeature(missingFeature);
  
  if (isTierSufficient(currentTier, requiredTier)) {
    return null; // Feature should be available, might be disabled
  }

  const tierNames: Record<LicenseTier, string> = {
    L1: 'Standard',
    L2: 'Professional',
    L3: 'Enterprise',
  };

  return {
    suggestedTier: requiredTier,
    message: `Upgrade to ${tierNames[requiredTier]} (${requiredTier}) to unlock ${missingFeature}`,
  };
}

