/**
 * @fileoverview Fastify Logger Plugin
 * 
 * Integrates the @erp/logger package with Fastify for comprehensive
 * request logging, performance tracking, and error handling.
 * 
 * Features:
 * - HTTP request/response logging with correlation IDs
 * - Performance tracking for slow requests
 * - Tenant and user context injection
 * - PII masking in logs
 * - Error logging with stack traces
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { createLogger, Logger, LogContext, LogEvent } from '@erp/logger';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// CONFIGURATION
// ============================================

interface LoggerPluginOptions {
  /** Service name for identification */
  service?: string;
  /** Enable request logging */
  logRequests?: boolean;
  /** Enable response logging */
  logResponses?: boolean;
  /** Slow request threshold in ms */
  slowRequestThreshold?: number;
  /** Skip logging for these paths */
  ignorePaths?: string[];
  /** Log level */
  level?: 'error' | 'warn' | 'info' | 'http' | 'debug';
}

// ============================================
// PLUGIN IMPLEMENTATION
// ============================================

const loggerPlugin: FastifyPluginAsync<LoggerPluginOptions> = async (
  fastify,
  options
) => {
  const {
    service = 'api',
    logRequests = true,
    logResponses = true,
    slowRequestThreshold = 500,
    ignorePaths = ['/health', '/ready', '/metrics'],
    level = process.env.LOG_LEVEL as any || 'info',
  } = options;

  // Create logger instance
  const logger = createLogger({
    service,
    environment: process.env.NODE_ENV || 'development',
    level,
    console: true,
    file: process.env.NODE_ENV !== 'production',
    json: process.env.NODE_ENV === 'production',
    colorize: process.env.NODE_ENV !== 'production',
    slowQueryThreshold: slowRequestThreshold,
  });

  // Decorate fastify with logger
  fastify.decorate('logger', logger);

  // Add request ID and start time to every request
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Generate or use existing request ID
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    
    // Attach to request
    (request as any).requestId = requestId;
    (request as any).startTime = performance.now();
    
    // Set response header
    reply.header('x-request-id', requestId);
  });

  // Log incoming requests
  if (logRequests) {
    fastify.addHook('preHandler', async (request: FastifyRequest) => {
      // Skip ignored paths
      if (ignorePaths.some(path => request.url.startsWith(path))) {
        return;
      }

      const context = buildRequestContext(request);
      
      logger.debug(`${request.method} ${request.url}`, {
        ...context,
        event: 'HTTP_REQUEST_START' as LogEvent,
      });
    });
  }

  // Log responses and performance
  if (logResponses) {
    fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
      // Skip ignored paths
      if (ignorePaths.some(path => request.url.startsWith(path))) {
        return;
      }

      const duration = Math.round(performance.now() - ((request as any).startTime || 0));
      const context = buildRequestContext(request);
      
      // Determine log level based on status and duration
      const statusCode = reply.statusCode;
      const isError = statusCode >= 500;
      const isClientError = statusCode >= 400 && statusCode < 500;
      const isSlow = duration > slowRequestThreshold;

      const logContext = {
        ...context,
        statusCode,
        duration,
        contentLength: reply.getHeader('content-length'),
      };

      if (isError) {
        logger.error(`${request.method} ${request.url} ${statusCode} ${duration}ms`, logContext);
      } else if (isClientError) {
        logger.warn(`${request.method} ${request.url} ${statusCode} ${duration}ms`, logContext);
      } else if (isSlow) {
        logger.warn(`Slow request: ${request.method} ${request.url} ${statusCode} ${duration}ms`, {
          ...logContext,
          event: 'HTTP_REQUEST_SLOW' as LogEvent,
        });
      } else {
        logger.http(`${request.method} ${request.url} ${statusCode} ${duration}ms`, logContext);
      }
    });
  }

  // Log errors
  fastify.addHook('onError', async (request: FastifyRequest, _reply: FastifyReply, error: Error) => {
    const context = buildRequestContext(request);
    
    logger.error(`Request error: ${error.message}`, {
      ...context,
      error: error.message,
      stack: error.stack,
      code: (error as any).code,
      statusCode: (error as any).statusCode || 500,
    });
  });

  // Log application startup
  fastify.addHook('onReady', async () => {
    logger.info('Application started', {
      event: 'SYSTEM_STARTUP' as LogEvent,
      service,
      environment: process.env.NODE_ENV,
    });
  });

  // Log application shutdown
  fastify.addHook('onClose', async () => {
    logger.info('Application shutting down', {
      event: 'SYSTEM_SHUTDOWN' as LogEvent,
      service,
    });
    await logger.close();
  });
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build context object from request
 */
function buildRequestContext(request: FastifyRequest): LogContext {
  const user = (request as any).user;
  const tenantContext = (request as any).tenantContext;
  
  return {
    requestId: (request as any).requestId,
    tenantId: tenantContext?.tenantId,
    userId: user?.userId,
    method: request.method,
    path: request.url,
    userAgent: request.headers['user-agent'],
    ipAddress: request.ip,
  };
}

// ============================================
// TYPE DECLARATIONS
// ============================================

declare module 'fastify' {
  interface FastifyInstance {
    logger: Logger;
  }
}

// ============================================
// EXPORT
// ============================================

export default fp(loggerPlugin, {
  name: 'logger',
  fastify: '4.x',
});

export type { LoggerPluginOptions };

// ============================================
// UTILITY FUNCTIONS FOR ROUTE HANDLERS
// ============================================

/**
 * Create a child logger with route-specific context
 */
export function createRouteLogger(
  request: FastifyRequest,
  moduleName: string
): Logger {
  const logger = (request.server as any).logger as Logger;
  
  return logger.child({
    requestId: (request as any).requestId,
    tenantId: (request as any).tenantContext?.tenantId,
    userId: (request as any).user?.userId,
    module: moduleName,
  });
}

/**
 * Log a business event from a route handler
 */
export function logBusinessEvent(
  request: FastifyRequest,
  event: LogEvent,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const logger = (request.server as any).logger as Logger;
  
  logger.event(event, message, {
    requestId: (request as any).requestId,
    tenantId: (request as any).tenantContext?.tenantId,
    userId: (request as any).user?.userId,
    ...metadata,
  });
}

/**
 * Log a database operation
 */
export function logDbOperation(
  request: FastifyRequest,
  operation: 'query' | 'mutation' | 'transaction',
  model: string,
  action: string,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  const logger = (request.server as any).logger as Logger;
  
  logger.dbOperation({
    operation,
    model,
    action,
    duration,
    tenantId: (request as any).tenantContext?.tenantId,
    ...metadata,
  });
}

/**
 * Log license validation
 */
export function logLicenseCheck(
  request: FastifyRequest,
  tier: string,
  feature: string | undefined,
  valid: boolean,
  reason?: string
): void {
  const logger = (request.server as any).logger as Logger;
  
  logger.licenseCheck({
    tenantId: (request as any).tenantContext?.tenantId,
    tier,
    feature,
    valid,
    reason,
  });
}

