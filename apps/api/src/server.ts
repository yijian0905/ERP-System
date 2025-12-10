import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import type { FastifyRequest } from 'fastify';

import { errorHandler, notFoundHandler } from './lib/error-handler.js';
import { logger } from './lib/logger.js';
import { authRoutes } from './routes/auth.js';
import { healthRoutes } from './routes/health.js';
import { v1Routes } from './routes/v1/index.js';

/**
 * Parse and validate CORS origins from environment variable
 */
function parseCorsOrigins(): string[] | boolean {
  const corsEnv = process.env.CORS_ORIGIN;

  // Default to localhost in development
  if (!corsEnv) {
    return ['http://localhost:5173', 'http://localhost:3000'];
  }

  // Allow all origins with '*' (not recommended for production)
  if (corsEnv === '*') {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('⚠️  WARNING: CORS_ORIGIN is set to "*" in production. This is not recommended.');
    }
    return true;
  }

  // Parse comma-separated list of origins
  const origins = corsEnv.split(',').map((origin) => origin.trim()).filter(Boolean);

  // Validate each origin
  const validOrigins: string[] = [];
  for (const origin of origins) {
    try {
      // Validate URL format
      new URL(origin);
      validOrigins.push(origin);
    } catch {
      logger.warn(`Invalid CORS origin ignored: ${origin}`);
    }
  }

  if (validOrigins.length === 0) {
    logger.warn('No valid CORS origins found, using default');
    return ['http://localhost:5173'];
  }

  return validOrigins;
}

export async function buildServer() {
  const server = Fastify({
    logger: false, // We use Winston for logging
    trustProxy: true,
  });

  // Security plugins
  await server.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  });

  const corsOrigins = parseCorsOrigins();
  await server.register(cors, {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  await server.register(rateLimit, {
    timeWindow: '1 minute',
    keyGenerator: (request: FastifyRequest) => {
      // Use tenant ID if available, otherwise use IP
      const tenantId = request.tenantId;
      if (tenantId) {
        return `tenant:${tenantId}`;
      }
      return request.headers['x-forwarded-for']?.toString() || request.ip;
    },
    // Higher limit for authenticated users
    max: async (request: FastifyRequest) => {
      if (request.tenantId) {
        return 1000; // 1000 req/min for authenticated users
      }
      return 100; // 100 req/min for unauthenticated
    },
  });

  // Swagger documentation
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'ERP System API',
        description: 'Enterprise Resource Planning System API with multi-tenant support and tiered licensing (L1/L2/L3)',
        version: '1.0.0',
        contact: {
          name: 'ERP Support',
          email: 'support@erp-system.com',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Products', description: 'Product management' },
        { name: 'Analytics', description: 'Analytics and reporting (L2+)' },
        { name: 'AI', description: 'AI-powered features (L2/L3)' },
        { name: 'Audit', description: 'Audit logging (L3)' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT access token',
          },
        },
      },
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
    },
    staticCSP: true,
  });

  // Error handler
  server.setErrorHandler(errorHandler);

  // Request logging
  server.addHook('onRequest', async (request) => {
    const requestId = request.headers['x-request-id'] || crypto.randomUUID();
    request.headers['x-request-id'] = requestId as string;

    logger.info({
      type: 'request',
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
  });

  // Response logging
  server.addHook('onResponse', async (request, reply) => {
    logger.info({
      type: 'response',
      requestId: request.headers['x-request-id'],
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    });
  });

  // Register routes
  await server.register(healthRoutes);
  await server.register(authRoutes, { prefix: '/auth' });
  await server.register(v1Routes, { prefix: '/api/v1' });

  // 404 handler
  server.setNotFoundHandler(notFoundHandler);

  return server;
}
