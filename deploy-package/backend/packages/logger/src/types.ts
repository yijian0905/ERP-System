/**
 * @fileoverview Logger type definitions for ERP System
 * 
 * Defines structured logging types, event categories, and context interfaces
 * for consistent logging throughout the application.
 */

// ============================================
// LOG LEVELS
// ============================================

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
} as const;

// ============================================
// LOG CONTEXT
// ============================================

/**
 * Base context that should be included in all log entries
 */
export interface LogContext {
  /** Unique request identifier for tracing */
  requestId?: string;
  /** Tenant identifier for multi-tenant isolation */
  tenantId?: string;
  /** User identifier who triggered the action */
  userId?: string;
  /** Service name (api, web, ai-service) */
  service?: string;
  /** Environment (development, staging, production) */
  environment?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

/**
 * HTTP request context for API logging
 */
export interface HttpLogContext extends LogContext {
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ipAddress?: string;
  contentLength?: number;
}

/**
 * Database operation context
 */
export interface DatabaseLogContext extends LogContext {
  operation: 'query' | 'mutation' | 'transaction';
  model?: string;
  action?: string;
  duration: number;
  rowsAffected?: number;
}

/**
 * Error context with stack trace
 */
export interface ErrorLogContext extends LogContext {
  error: string;
  code?: string;
  stack?: string;
  cause?: string;
}

/**
 * Performance tracking context
 */
export interface PerformanceLogContext extends LogContext {
  operation: string;
  duration: number;
  threshold?: number;
  exceeded?: boolean;
}

// ============================================
// LOG EVENT CATEGORIES
// ============================================

/**
 * Authentication-related log events
 */
export type AuthLogEvent =
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGOUT'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_TOKEN_REFRESH'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_PASSWORD_RESET'
  | 'AUTH_PASSWORD_CHANGED'
  | 'AUTH_MFA_ENABLED'
  | 'AUTH_MFA_VERIFIED'
  | 'AUTH_SESSION_CREATED'
  | 'AUTH_SESSION_DESTROYED';

/**
 * Database-related log events
 */
export type DatabaseLogEvent =
  | 'DB_QUERY_SLOW'
  | 'DB_QUERY_ERROR'
  | 'DB_CONNECTION_LOST'
  | 'DB_CONNECTION_RESTORED'
  | 'DB_MIGRATION_START'
  | 'DB_MIGRATION_COMPLETE'
  | 'DB_MIGRATION_FAILED'
  | 'DB_SEED_START'
  | 'DB_SEED_COMPLETE';

/**
 * Business operation log events
 */
export type BusinessLogEvent =
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'INVOICE_CREATED'
  | 'INVOICE_PRINTED'
  | 'INVOICE_PAID'
  | 'INVOICE_OVERDUE'
  | 'INVENTORY_DEDUCTED'
  | 'INVENTORY_ADDED'
  | 'INVENTORY_ADJUSTED'
  | 'INVENTORY_LOW_STOCK'
  | 'INVENTORY_OUT_OF_STOCK'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED';

/**
 * License-related log events
 */
export type LicenseLogEvent =
  | 'LICENSE_VALIDATED'
  | 'LICENSE_INVALID'
  | 'LICENSE_EXPIRED'
  | 'LICENSE_FEATURE_DENIED'
  | 'LICENSE_TIER_MISMATCH'
  | 'LICENSE_GENERATED'
  | 'LICENSE_REVOKED'
  | 'LICENSE_RENEWED';

/**
 * AI service log events
 */
export type AILogEvent =
  | 'AI_PREDICTION_REQUEST'
  | 'AI_PREDICTION_COMPLETE'
  | 'AI_PREDICTION_CACHED'
  | 'AI_PREDICTION_ERROR'
  | 'AI_MODEL_LOADED'
  | 'AI_MODEL_UPDATED'
  | 'AI_CHAT_REQUEST'
  | 'AI_CHAT_RESPONSE'
  | 'AI_CHAT_ERROR'
  | 'AI_SERVICE_UNAVAILABLE';

/**
 * System-level log events
 */
export type SystemLogEvent =
  | 'SYSTEM_STARTUP'
  | 'SYSTEM_SHUTDOWN'
  | 'SYSTEM_READY'
  | 'HEALTH_CHECK_PASSED'
  | 'HEALTH_CHECK_FAILED'
  | 'CACHE_HIT'
  | 'CACHE_MISS'
  | 'CACHE_CLEARED'
  | 'BACKUP_STARTED'
  | 'BACKUP_COMPLETED'
  | 'BACKUP_FAILED'
  | 'JOB_STARTED'
  | 'JOB_COMPLETED'
  | 'JOB_FAILED'
  | 'JOB_RETRYING';

/**
 * Security-related log events
 */
export type SecurityLogEvent =
  | 'SECURITY_RATE_LIMIT_EXCEEDED'
  | 'SECURITY_INVALID_TOKEN'
  | 'SECURITY_UNAUTHORIZED_ACCESS'
  | 'SECURITY_PERMISSION_DENIED'
  | 'SECURITY_SUSPICIOUS_ACTIVITY'
  | 'SECURITY_BRUTE_FORCE_DETECTED';

/**
 * All log event types combined
 */
export type LogEvent =
  | AuthLogEvent
  | DatabaseLogEvent
  | BusinessLogEvent
  | LicenseLogEvent
  | AILogEvent
  | SystemLogEvent
  | SecurityLogEvent;

// ============================================
// LOG ENTRY
// ============================================

/**
 * Structured log entry format
 */
export interface LogEntry {
  /** ISO timestamp */
  timestamp: string;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Event type for categorization */
  event?: LogEvent;
  /** Contextual information */
  context: LogContext;
  /** Service identifier */
  service: string;
  /** Environment */
  environment: string;
}

// ============================================
// LOGGER CONFIGURATION
// ============================================

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /** Service name for identification */
  service: string;
  /** Environment (development, staging, production) */
  environment: string;
  /** Minimum log level to output */
  level: LogLevel;
  /** Enable console output */
  console: boolean;
  /** Enable file output */
  file: boolean;
  /** Directory for log files */
  logDir?: string;
  /** Enable JSON format (for production) */
  json: boolean;
  /** Enable colorized output (for development) */
  colorize: boolean;
  /** PII fields to mask */
  piiFields?: string[];
  /** Enable performance tracking */
  performance?: boolean;
  /** Slow query threshold in ms */
  slowQueryThreshold?: number;
  /** External transport configuration */
  externalTransport?: ExternalTransportConfig;
}

/**
 * External transport configuration (e.g., Datadog, Sentry)
 */
export interface ExternalTransportConfig {
  type: 'sentry' | 'datadog' | 'elasticsearch' | 'loki';
  endpoint?: string;
  apiKey?: string;
  environment?: string;
}

// ============================================
// PERFORMANCE TRACKING
// ============================================

/**
 * Performance tracker result
 */
export interface PerformanceResult {
  /** End the tracking and log the result */
  end: (metadata?: Record<string, unknown>) => void;
  /** Get elapsed time without ending */
  elapsed: () => number;
}

// ============================================
// PII MASKING
// ============================================

/**
 * Default PII fields to mask in logs
 */
export const DEFAULT_PII_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'socialSecurityNumber',
  'taxId',
  'authorization',
] as const;

/**
 * Masking patterns for different data types
 */
export const MASKING_PATTERNS = {
  email: (value: string) => {
    const [local, domain] = value.split('@');
    if (!domain) return '[INVALID_EMAIL]';
    return `${local.charAt(0)}***@${domain}`;
  },
  creditCard: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 4) return '[REDACTED]';
    return `****-****-****-${cleaned.slice(-4)}`;
  },
  phone: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 4) return '[REDACTED]';
    return `***-***-${cleaned.slice(-4)}`;
  },
  ipAddress: (value: string) => {
    const parts = value.split('.');
    if (parts.length !== 4) return value;
    return `${parts[0]}.${parts[1]}.***.***`;
  },
  ssn: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 4) return '[REDACTED]';
    return `***-**-${cleaned.slice(-4)}`;
  },
  default: () => '[REDACTED]',
} as const;

// ============================================
// AUDIT LOG
// ============================================

/**
 * Audit log entry for compliance tracking
 */
export interface AuditLogEntry {
  /** Event type */
  event: string;
  /** Actor who performed the action */
  actorId: string;
  /** Actor type (user, system, api) */
  actorType: 'user' | 'system' | 'api';
  /** Target entity type */
  targetType?: string;
  /** Target entity ID */
  targetId?: string;
  /** Tenant ID */
  tenantId: string;
  /** Previous values (for updates) */
  oldValues?: Record<string, unknown>;
  /** New values (for creates/updates) */
  newValues?: Record<string, unknown>;
  /** IP address of the actor */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Timestamp */
  timestamp: Date;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

