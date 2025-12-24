/**
 * Authentication Policy types
 * @see spec.md §5 Authentication & Login (Policy-based)
 *
 * Login UI MUST be rendered from authPolicy, not from tier.
 */

/**
 * Primary authentication method
 */
export type AuthPrimaryMethod = 'password' | 'sso';

/**
 * MFA configuration
 */
export type MfaMode = 'off' | 'optional' | 'required';

/**
 * User identifier type for login
 */
export type LoginIdentifier = 'email' | 'username';

/**
 * Authentication policy for a tenant
 * Controls how the login UI should be rendered
 */
export interface AuthPolicy {
    /** Primary authentication method */
    primary: AuthPrimaryMethod;
    /** Allow password login as fallback when SSO is primary */
    allowPasswordFallback: boolean;
    /** MFA enforcement level */
    mfa: MfaMode;
    /** Type of identifier used for login */
    identifier: LoginIdentifier;
}

/**
 * Default auth policy for new tenants
 */
export const DEFAULT_AUTH_POLICY: AuthPolicy = {
    primary: 'password',
    allowPasswordFallback: true,
    mfa: 'off',
    identifier: 'email',
};

/**
 * SSO provider configuration (for future SSO implementation)
 */
export interface SsoProviderConfig {
    providerId: string;
    providerType: 'oauth2' | 'saml' | 'oidc';
    clientId?: string;
    issuerUrl?: string;
    enabled: boolean;
}

/**
 * Extended auth policy with SSO configuration
 */
export interface AuthPolicyWithSso extends AuthPolicy {
    ssoProviders?: SsoProviderConfig[];
}
