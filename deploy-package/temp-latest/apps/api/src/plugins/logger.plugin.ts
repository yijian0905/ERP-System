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
    level = (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'http' | 'debug') || 'info',
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

    // Attach to request using Fastify's request context pattern
    // @ts-expect-error - Extending request with requestId
    request.requestId = requestId;
    // @ts-expect-error - Extending request with startTime
    request.startTime = performance.now();

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

      const extendedRequest = request as ExtendedFastifyRequest;
      const duration = Math.round(performance.now() - (extendedRequest.startTime || 0));
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
    const errorWithCode = error as Error & { code?: string; statusCode?: number };

    logger.error(`Request error: ${error.message}`, {
      ...context,
      error: error.message,
      stack: error.stack,
      code: errorWithCode.code,
      statusCode: errorWithCode.statusCode || 500,
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
  const extReq = request as ExtendedFastifyRequest;
  const user = extReq.user;
  const tenantContext = extReq.tenantContext;

  return {
    requestId: extReq.requestId,
    tenantId: tenantContext?.tenantId || user?.tid,
    userId: user?.sub,
    method: request.method,
    path: request.url,
    userAgent: request.headers['user-agent'],
    ipAddress: request.ip,
  };
}

// ============================================
// TYPE DECLARATIONS
// ============================================

// Extended request types for logger plugin
// Use intersection to add properties without conflicting with existing types
type ExtendedFastifyRequest = FastifyRequest & {
  requestId?: string;
  startTime?: number;
  tenantContext?: { tenantId?: string };
};

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

// Type-safe server instance with logger
interface FastifyInstanceWithLogger {
  logger: Logger;
}

/**
 * Create a child logger with route-specific context
 */
export function createRouteLogger(
  request: FastifyRequest,
  moduleName: string
): Logger {
  const server = request.server as unknown as FastifyInstanceWithLogger;
  const extReq = request as ExtendedFastifyRequest;

  return server.logger.child({
    requestId: extReq.requestId,
    tenantId: extReq.tenantContext?.tenantId || extReq.user?.tid,
    userId: extReq.user?.sub,
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
  const server = request.server as unknown as FastifyInstanceWithLogger;
  const extReq = request as ExtendedFastifyRequest;

  server.logger.event(event, message, {
    requestId: extReq.requestId,
    tenantId: extReq.tenantContext?.tenantId || extReq.user?.tid,
    userId: extReq.user?.sub,
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
  const server = request.server as unknown as FastifyInstanceWithLogger;
  const extReq = request as ExtendedFastifyRequest;

  server.logger.dbOperation({
    operation,
    model,
    action,
    duration,
    tenantId: extReq.tenantContext?.tenantId || extReq.user?.tid,
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
  const server = request.server as unknown as FastifyInstanceWithLogger;
  const extReq = request as ExtendedFastifyRequest;

  server.logger.licenseCheck({
    tenantId: extReq.tenantContext?.tenantId || extReq.user?.tid || '',
    tier,
    feature,
    valid,
    reason,
  });
}
