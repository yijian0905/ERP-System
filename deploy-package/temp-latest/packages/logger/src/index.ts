/**
 * @fileoverview ERP System Structured Logger
 * 
 * Provides a comprehensive logging solution with:
 * - Structured JSON output for log aggregation
 * - Request correlation IDs for distributed tracing
 * - PII masking for security compliance
 * - Performance tracking utilities
 * - Environment-aware configuration
 * 
 * @example
 * ```typescript
 * import { createLogger } from '@erp/logger';
 * 
 * const logger = createLogger({
 *   service: 'api',
 *   environment: process.env.NODE_ENV || 'development',
 * });
 * 
 * logger.info('User logged in', { userId: '123', tenantId: 'abc' });
 * ```
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import {
  LoggerConfig,
  LogContext,
  LogLevel,
  LogEvent,
  PerformanceResult,
  AuditLogEntry,
  DEFAULT_PII_FIELDS,
  MASKING_PATTERNS,
} from './types';
import {
  createTransports,
  getLogLevelForEnvironment,
} from './transports';

// Re-export types
export * from './types';
export * from './transports';

// ============================================
// LOGGER CLASS
// ============================================

/**
 * Structured logger with context, PII masking, and performance tracking
 */
export class Logger {
  private winston: winston.Logger;
  private config: LoggerConfig;
  private defaultContext: LogContext;
  private piiFields: Set<string>;

  constructor(config: Partial<LoggerConfig> = {}) {
    // Merge with defaults
    this.config = {
      service: config.service || 'erp',
      environment: config.environment || process.env.NODE_ENV || 'development',
      level: config.level || getLogLevelForEnvironment(config.environment || 'development'),
      console: config.console ?? true,
      file: config.file ?? (config.environment !== 'production'),
      logDir: config.logDir || './logs',
      json: config.json ?? (config.environment === 'production'),
      colorize: config.colorize ?? (config.environment !== 'production'),
      piiFields: config.piiFields || [...DEFAULT_PII_FIELDS],
      performance: config.performance ?? true,
      slowQueryThreshold: config.slowQueryThreshold || 100,
      externalTransport: config.externalTransport,
    };

    this.piiFields = new Set(this.config.piiFields);
    this.defaultContext = {
      service: this.config.service,
      environment: this.config.environment,
    };

    // Create Winston logger
    this.winston = winston.createLogger({
      level: this.config.level,
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
      },
      defaultMeta: {
        service: this.config.service,
        environment: this.config.environment,
      },
      transports: createTransports(this.config),
      exitOnError: false,
    });
  }

  // ============================================
  // LOGGING METHODS
  // ============================================

  /**
   * Log an error message
   */
  error(message: string, context?: LogContext | Error): void {
    if (context instanceof Error) {
      this.log('error', message, {
        error: context.message,
        stack: context.stack,
        code: (context as any).code,
      });
    } else {
      this.log('error', message, context);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log an HTTP request/response
   */
  http(message: string, context?: LogContext): void {
    this.log('http', message, context);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log with a specific event type for categorization
   */
  event(eventType: LogEvent, message: string, context?: LogContext): void {
    this.log('info', message, { ...context, event: eventType });
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const maskedContext = context ? this.maskPII(context) : {};
    const mergedContext = { ...this.defaultContext, ...maskedContext };
    
    this.winston.log(level, message, {
      context: mergedContext,
      event: (context as any)?.event,
    });
  }

  // ============================================
  // CONTEXT MANAGEMENT
  // ============================================

  /**
   * Create a child logger with additional default context
   */
  child(context: LogContext): Logger {
    const childLogger = Object.create(this);
    childLogger.defaultContext = { ...this.defaultContext, ...context };
    return childLogger;
  }

  /**
   * Set default context for all subsequent logs
   */
  setContext(context: LogContext): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  /**
   * Generate a new correlation/request ID
   */
  generateRequestId(): string {
    return uuidv4();
  }

  // ============================================
  // PII MASKING
  // ============================================

  /**
   * Mask PII fields in an object
   */
  maskPII<T extends Record<string, unknown>>(data: T): T {
    const masked = { ...data };
    
    for (const [key, value] of Object.entries(masked)) {
      if (this.piiFields.has(key.toLowerCase())) {
        masked[key as keyof T] = '[REDACTED]' as any;
      } else if (typeof value === 'string') {
        // Check for specific patterns
        if (key.toLowerCase().includes('email') && value.includes('@')) {
          masked[key as keyof T] = MASKING_PATTERNS.email(value) as any;
        } else if (key.toLowerCase().includes('phone')) {
          masked[key as keyof T] = MASKING_PATTERNS.phone(value) as any;
        } else if (key.toLowerCase().includes('card')) {
          masked[key as keyof T] = MASKING_PATTERNS.creditCard(value) as any;
        } else if (key.toLowerCase().includes('ssn') || key.toLowerCase().includes('social')) {
          masked[key as keyof T] = MASKING_PATTERNS.ssn(value) as any;
        }
      } else if (typeof value === 'object' && value !== null) {
        masked[key as keyof T] = this.maskPII(value as Record<string, unknown>) as any;
      }
    }
    
    return masked;
  }

  // ============================================
  // PERFORMANCE TRACKING
  // ============================================

  /**
   * Start tracking an operation's duration
   * 
   * @example
   * ```typescript
   * const perf = logger.track('database.query');
   * const result = await db.query(...);
   * perf.end({ rowCount: result.length });
   * ```
   */
  track(operation: string): PerformanceResult {
    const startTime = performance.now();
    const context = { ...this.defaultContext };

    return {
      end: (metadata?: Record<string, unknown>) => {
        const duration = Math.round(performance.now() - startTime);
        const exceeded = duration > (this.config.slowQueryThreshold || 100);
        
        const level: LogLevel = exceeded ? 'warn' : 'debug';
        const message = exceeded
          ? `Slow operation: ${operation} took ${duration}ms`
          : `${operation} completed in ${duration}ms`;
        
        this.log(level, message, {
          ...context,
          ...metadata,
          operation,
          duration,
          exceeded,
        });
      },
      elapsed: () => Math.round(performance.now() - startTime),
    };
  }

  /**
   * Log a slow query warning
   */
  slowQuery(query: string, duration: number, context?: LogContext): void {
    this.warn(`Slow query detected: ${duration}ms`, {
      ...context,
      query: query.substring(0, 500), // Truncate long queries
      duration,
      event: 'DB_QUERY_SLOW',
    });
  }

  // ============================================
  // AUDIT LOGGING
  // ============================================

  /**
   * Log an audit trail entry for compliance
   */
  audit(entry: AuditLogEntry): void {
    const maskedEntry = {
      ...entry,
      oldValues: entry.oldValues ? this.maskPII(entry.oldValues) : undefined,
      newValues: entry.newValues ? this.maskPII(entry.newValues) : undefined,
    };

    this.info(`AUDIT: ${entry.event}`, {
      ...maskedEntry,
      event: entry.event as LogEvent,
    });
  }

  // ============================================
  // SPECIALIZED LOGGERS
  // ============================================

  /**
   * Log HTTP request
   */
  httpRequest(req: {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    requestId?: string;
    tenantId?: string;
    userId?: string;
    userAgent?: string;
    ipAddress?: string;
  }): void {
    const level: LogLevel = req.statusCode >= 500 ? 'error' : req.statusCode >= 400 ? 'warn' : 'http';
    
    this.log(level, `${req.method} ${req.path} ${req.statusCode} ${req.duration}ms`, {
      ...req,
      event: 'HTTP_REQUEST' as LogEvent,
    });
  }

  /**
   * Log database operation
   */
  dbOperation(op: {
    operation: 'query' | 'mutation' | 'transaction';
    model?: string;
    action?: string;
    duration: number;
    tenantId?: string;
    rowsAffected?: number;
    error?: string;
  }): void {
    const level: LogLevel = op.error ? 'error' : op.duration > (this.config.slowQueryThreshold || 100) ? 'warn' : 'debug';
    const event: LogEvent = op.error ? 'DB_QUERY_ERROR' : op.duration > (this.config.slowQueryThreshold || 100) ? 'DB_QUERY_SLOW' : 'DB_QUERY_SLOW';
    
    this.log(level, `DB ${op.operation}: ${op.model}.${op.action} (${op.duration}ms)`, {
      ...op,
      event,
    });
  }

  /**
   * Log license validation
   */
  licenseCheck(result: {
    tenantId: string;
    tier: string;
    feature?: string;
    valid: boolean;
    reason?: string;
  }): void {
    const event: LogEvent = result.valid ? 'LICENSE_VALIDATED' : 'LICENSE_INVALID';
    const level: LogLevel = result.valid ? 'debug' : 'warn';
    
    this.log(level, `License check: ${result.valid ? 'passed' : 'failed'}`, {
      ...result,
      event,
    });
  }

  /**
   * Log AI service interaction
   */
  aiOperation(op: {
    type: 'prediction' | 'chat';
    model?: string;
    tenantId?: string;
    duration?: number;
    cached?: boolean;
    error?: string;
    tokens?: number;
  }): void {
    const level: LogLevel = op.error ? 'error' : 'info';
    const event: LogEvent = op.error
      ? (op.type === 'chat' ? 'AI_CHAT_ERROR' : 'AI_PREDICTION_ERROR')
      : op.cached
        ? 'AI_PREDICTION_CACHED'
        : (op.type === 'chat' ? 'AI_CHAT_RESPONSE' : 'AI_PREDICTION_COMPLETE');
    
    this.log(level, `AI ${op.type}: ${op.cached ? 'cached' : 'computed'} (${op.duration}ms)`, {
      ...op,
      event,
    });
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  /**
   * Flush all transports and close the logger
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.winston.on('finish', resolve);
      this.winston.end();
    });
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create a new logger instance
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

// ============================================
// DEFAULT INSTANCE
// ============================================

/**
 * Default logger instance for simple use cases
 */
export const logger = createLogger();

export default logger;

