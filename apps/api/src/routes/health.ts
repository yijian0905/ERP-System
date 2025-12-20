import type { ApiResponse } from '@erp/shared-types';
import type { FastifyInstance, RouteShorthandOptions } from 'fastify';

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
}

// Extended schema type for OpenAPI compatibility
interface RouteSchema extends RouteShorthandOptions {
  schema?: {
    description?: string;
    tags?: string[];
    response?: Record<number, unknown>;
    security?: Array<{ bearerAuth?: string[] }>;
  };
}

export async function healthRoutes(fastify: FastifyInstance) {
  const healthRouteOptions: RouteSchema = {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                timestamp: { type: 'string' },
                version: { type: 'string' },
                uptime: { type: 'number' },
              },
            },
          },
        },
      },
    },
  };

  fastify.get<{ Reply: ApiResponse<HealthCheck> }>(
    '/health',
    healthRouteOptions,
    async (_request, reply) => {
      const healthData: HealthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
      };

      return reply.send({
        success: true,
        data: healthData,
      });
    }
  );

  fastify.get('/ready', async (_request, reply) => {
    // Add database and Redis checks here
    return reply.send({
      success: true,
      data: { ready: true },
    });
  });
}

