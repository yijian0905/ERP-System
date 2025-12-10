import type { LicenseTier, UserRole } from '@erp/shared-types';
import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';

/**
 * JWT Token payload for access tokens
 */
export interface AccessTokenPayload {
  /** User ID */
  sub: string;
  /** Tenant ID */
  tid: string;
  /** User email */
  email: string;
  /** User role */
  role: UserRole;
  /** License tier */
  tier: LicenseTier;
  /** User permissions */
  permissions: string[];
  /** Token type */
  type: 'access';
  /** Issued at */
  iat: number;
  /** Expires at */
  exp: number;
}

/**
 * JWT Token payload for refresh tokens
 */
export interface RefreshTokenPayload {
  /** User ID */
  sub: string;
  /** Tenant ID */
  tid: string;
  /** Token type */
  type: 'refresh';
  /** Token family ID for rotation */
  family: string;
  /** Issued at */
  iat: number;
  /** Expires at */
  exp: number;
}

/**
 * Token pair returned after authentication
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Configuration for JWT tokens
 */
export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
}

/**
 * Minimum secret length for security
 */
const MIN_SECRET_LENGTH = 32;

/**
 * Cached JWT config to avoid repeated validation
 */
let cachedConfig: JwtConfig | null = null;

/**
 * Get JWT configuration from environment
 * Throws an error if secrets are not properly configured in production
 */
export function getJwtConfig(): JwtConfig {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  // In production, require properly configured secrets
  if (isProduction) {
    if (!accessSecret || accessSecret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET environment variable must be set with at least ${MIN_SECRET_LENGTH} characters in production`
      );
    }
    if (!refreshSecret || refreshSecret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `JWT_REFRESH_SECRET environment variable must be set with at least ${MIN_SECRET_LENGTH} characters in production`
      );
    }
  }

  // In development, use defaults but log a warning
  const finalAccessSecret = accessSecret || 'dev-only-jwt-secret-not-for-production-use';
  const finalRefreshSecret = refreshSecret || 'dev-only-refresh-secret-not-for-production';

  if (!isProduction && (!accessSecret || !refreshSecret)) {
    console.warn(
      '⚠️  WARNING: Using default JWT secrets. Set JWT_SECRET and JWT_REFRESH_SECRET environment variables for security.'
    );
  }

  cachedConfig = {
    accessSecret: finalAccessSecret,
    refreshSecret: finalRefreshSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'erp-system',
    audience: process.env.JWT_AUDIENCE || 'erp-api',
  };

  return cachedConfig;
}

/**
 * Clear cached JWT config (useful for testing)
 */
export function clearJwtConfigCache(): void {
  cachedConfig = null;
}

/**
 * Generate a new access token
 */
export function generateAccessToken(
  payload: Omit<AccessTokenPayload, 'type' | 'iat' | 'exp'>,
  config: JwtConfig
): string {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = parseTimeToSeconds(config.accessExpiresIn);

  const tokenPayload: AccessTokenPayload = {
    ...payload,
    type: 'access',
    iat: now,
    exp: now + expiresIn,
  };

  return jwt.sign(tokenPayload, config.accessSecret, {
    algorithm: 'HS256',
    issuer: config.issuer,
    audience: config.audience,
  });
}

/**
 * Generate a new refresh token
 */
export function generateRefreshToken(
  userId: string,
  tenantId: string,
  family: string,
  config: JwtConfig
): string {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = parseTimeToSeconds(config.refreshExpiresIn);

  const tokenPayload: RefreshTokenPayload = {
    sub: userId,
    tid: tenantId,
    type: 'refresh',
    family,
    iat: now,
    exp: now + expiresIn,
  };

  return jwt.sign(tokenPayload, config.refreshSecret, {
    algorithm: 'HS256',
    issuer: config.issuer,
    audience: config.audience,
  });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(
  payload: Omit<AccessTokenPayload, 'type' | 'iat' | 'exp'>,
  family: string,
  config: JwtConfig
): TokenPair {
  const accessToken = generateAccessToken(payload, config);
  const refreshToken = generateRefreshToken(payload.sub, payload.tid, family, config);
  const expiresIn = parseTimeToSeconds(config.accessExpiresIn);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string, config: JwtConfig): AccessTokenPayload {
  const decoded = jwt.verify(token, config.accessSecret, {
    algorithms: ['HS256'],
    issuer: config.issuer,
    audience: config.audience,
  }) as AccessTokenPayload;

  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }

  return decoded;
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string, config: JwtConfig): RefreshTokenPayload {
  const decoded = jwt.verify(token, config.refreshSecret, {
    algorithms: ['HS256'],
    issuer: config.issuer,
    audience: config.audience,
  }) as RefreshTokenPayload;

  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  return decoded;
}

/**
 * Decode a token without verification (for debugging/logging)
 */
export function decodeToken<T>(token: string): T | null {
  try {
    return jwt.decode(token) as T;
  } catch {
    return null;
  }
}

/**
 * Parse time string (e.g., '15m', '1h', '7d') to seconds
 */
export function parseTimeToSeconds(time: string): number {
  const match = time.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return value * multipliers[unit];
}

/**
 * Generate a random token family ID
 */
export function generateTokenFamily(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Token validation errors
 */
export type TokenError =
  | 'TOKEN_MISSING'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_MALFORMED'
  | 'TOKEN_TYPE_INVALID';

/**
 * Get user-friendly error message for token errors
 */
export function getTokenErrorMessage(error: TokenError): string {
  const messages: Record<TokenError, string> = {
    TOKEN_MISSING: 'Authentication required',
    TOKEN_INVALID: 'Invalid authentication token',
    TOKEN_EXPIRED: 'Authentication token has expired',
    TOKEN_MALFORMED: 'Malformed authentication token',
    TOKEN_TYPE_INVALID: 'Invalid token type',
  };
  return messages[error];
}

/**
 * Extend Fastify request with authenticated user info
 */
declare module 'fastify' {
  interface FastifyRequest {
    /** Authenticated user from JWT */
    user?: AccessTokenPayload;
    /** Tenant ID from JWT */
    tenantId?: string;
    /** License tier from JWT */
    tier?: LicenseTier;
  }
}

/**
 * Register JWT type augmentation with Fastify
 */
export function registerJwtTypes(_fastify: FastifyInstance): void {
  // Type augmentation is handled via declaration merging above
}

