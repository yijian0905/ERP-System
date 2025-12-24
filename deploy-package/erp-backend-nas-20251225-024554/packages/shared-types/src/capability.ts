/**
 * Capability-based feature gating model
 * @see spec.md §3 Licensing & Capability Model
 */

/**
 * Capability codes as defined in spec
 * UI and API access MUST be gated by capabilities[code], never by tier
 */
export type CapabilityCode =
    | 'erp_core'
    | 'forecasting'
    | 'ai_chat'
    | 'ai_agent'
    | 'automation_rules';

/**
 * Capability configuration
 */
export interface Capability {
    code: CapabilityCode;
    enabled: boolean;
}

/**
 * Subscription tiers (business-facing labels only)
 * Engineering MUST treat tiers as labels only - all enforcement via capabilities
 */
export type SubscriptionTier = 'BASIC' | 'PRO' | 'ENTERPRISE';

/**
 * Default capabilities by subscription tier
 * This maps business tiers to capability sets
 */
export const DEFAULT_TIER_CAPABILITIES: Record<SubscriptionTier, Capability[]> = {
    BASIC: [
        { code: 'erp_core', enabled: true },
        { code: 'forecasting', enabled: false },
        { code: 'ai_chat', enabled: false },
        { code: 'ai_agent', enabled: false },
        { code: 'automation_rules', enabled: false },
    ],
    PRO: [
        { code: 'erp_core', enabled: true },
        { code: 'forecasting', enabled: true },
        { code: 'ai_chat', enabled: false },
        { code: 'ai_agent', enabled: false },
        { code: 'automation_rules', enabled: false },
    ],
    ENTERPRISE: [
        { code: 'erp_core', enabled: true },
        { code: 'forecasting', enabled: true },
        { code: 'ai_chat', enabled: true },
        { code: 'ai_agent', enabled: false }, // default false as per spec
        { code: 'automation_rules', enabled: false }, // future
    ],
};

/**
 * Check if a capability is enabled in a capability set
 */
export function hasCapability(
    capabilities: Capability[],
    code: CapabilityCode
): boolean {
    const cap = capabilities.find((c) => c.code === code);
    return cap?.enabled ?? false;
}

/**
 * Get capabilities for a subscription tier
 */
export function getCapabilitiesForTier(tier: SubscriptionTier): Capability[] {
    return [...DEFAULT_TIER_CAPABILITIES[tier]];
}

/**
 * All capability codes for iteration
 */
export const ALL_CAPABILITY_CODES: CapabilityCode[] = [
    'erp_core',
    'forecasting',
    'ai_chat',
    'ai_agent',
    'automation_rules',
];
