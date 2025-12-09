/**
 * Forecasting Routes
 * API endpoints for AI-powered forecasting features (L2+)
 */

import type { ApiResponse } from '@erp/shared-types';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { getTenantId } from '../../middleware/auth.js';
import { requireFeature, requireTier } from '../../middleware/license.js';
import {
  forecastDemand,
  optimizeStock,
  analyzeSeasonalPatterns,
  checkAIServiceHealth,
  getAIInsights,
  bulkForecast,
} from '../../services/ai/index.js';
import { logger } from '../../lib/logger.js';

// Validation schemas
const forecastDemandSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  forecast_days: z.number().int().min(1).max(365).default(30),
  include_confidence: z.boolean().default(false),
});

const stockOptimizationSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  current_stock: z.number().min(0),
  lead_time_days: z.number().int().min(1).max(90).default(7),
  service_level: z.number().min(0).max(1).default(0.95),
});

const seasonalPatternSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  years: z.number().int().min(1).max(5).default(2),
});

export async function forecastingRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/forecasting/demand
   * Forecast product demand using AI
   */
  fastify.post<{
    Body: z.infer<typeof forecastDemandSchema>;
    Reply: ApiResponse<any>;
  }>(
    '/demand',
    {
      schema: {
        description: 'Forecast product demand using AI (L2+ feature)',
        tags: ['Forecasting', 'AI'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['product_id'],
          properties: {
            product_id: { type: 'string', format: 'uuid' },
            forecast_days: { type: 'number', minimum: 1, maximum: 365, default: 30 },
            include_confidence: { type: 'boolean', default: false },
          },
        },
      } as any,
      preHandler: [requireTier('L2', 'L3'), requireFeature('demandForecasting')],
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof forecastDemandSchema> }>, reply: FastifyReply) => {
      const tenantId = getTenantId(request);
      const body = forecastDemandSchema.parse(request.body);

      try {
        const isAIServiceAvailable = await checkAIServiceHealth();

        if (!isAIServiceAvailable) {
          return reply.status(503).send({
            success: false,
            error: {
              code: 'AI_SERVICE_UNAVAILABLE',
              message: 'AI service is currently unavailable',
            },
          });
        }

        const forecastResponse = await forecastDemand({
          product_id: body.product_id,
          tenant_id: tenantId,
          forecast_days: body.forecast_days,
          include_confidence: body.include_confidence,
        });

        return reply.send({
          success: true,
          data: forecastResponse,
        });
      } catch (error) {
        logger.error('Failed to forecast demand', { error, body, tenantId });

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: error.errors,
            },
          });
        }

        return reply.status(500).send({
          success: false,
          error: {
            code: 'FORECAST_ERROR',
            message: 'Failed to generate forecast',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/forecasting/stock-optimization
   * Get stock optimization recommendations
   */
  fastify.post<{
    Body: z.infer<typeof stockOptimizationSchema>;
    Reply: ApiResponse<any>;
  }>(
    '/stock-optimization',
    {
      schema: {
        description: 'Get stock optimization recommendations (L2+ feature)',
        tags: ['Forecasting', 'AI'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['product_id', 'current_stock'],
          properties: {
            product_id: { type: 'string', format: 'uuid' },
            current_stock: { type: 'number', minimum: 0 },
            lead_time_days: { type: 'number', minimum: 1, maximum: 90, default: 7 },
            service_level: { type: 'number', minimum: 0, maximum: 1, default: 0.95 },
          },
        },
      } as any,
      preHandler: [requireTier('L2', 'L3'), requireFeature('demandForecasting')],
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof stockOptimizationSchema> }>, reply: FastifyReply) => {
      const tenantId = getTenantId(request);
      const body = stockOptimizationSchema.parse(request.body);

      try {
        const isAIServiceAvailable = await checkAIServiceHealth();

        if (!isAIServiceAvailable) {
          return reply.status(503).send({
            success: false,
            error: {
              code: 'AI_SERVICE_UNAVAILABLE',
              message: 'AI service is currently unavailable',
            },
          });
        }

        const optimizationResponse = await optimizeStock({
          product_id: body.product_id,
          tenant_id: tenantId,
          current_stock: body.current_stock,
          lead_time_days: body.lead_time_days,
          service_level: body.service_level,
        });

        return reply.send({
          success: true,
          data: optimizationResponse,
        });
      } catch (error) {
        logger.error('Failed to optimize stock', { error, body, tenantId });

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: error.errors,
            },
          });
        }

        return reply.status(500).send({
          success: false,
          error: {
            code: 'OPTIMIZATION_ERROR',
            message: 'Failed to optimize stock',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/forecasting/seasonal-patterns
   * Analyze seasonal patterns in product demand
   */
  fastify.post<{
    Body: z.infer<typeof seasonalPatternSchema>;
    Reply: ApiResponse<any>;
  }>(
    '/seasonal-patterns',
    {
      schema: {
        description: 'Analyze seasonal patterns in product demand (L2+ feature)',
        tags: ['Forecasting', 'AI'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['product_id'],
          properties: {
            product_id: { type: 'string', format: 'uuid' },
            years: { type: 'number', minimum: 1, maximum: 5, default: 2 },
          },
        },
      } as any,
      preHandler: [requireTier('L2', 'L3'), requireFeature('demandForecasting')],
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof seasonalPatternSchema> }>, reply: FastifyReply) => {
      const tenantId = getTenantId(request);
      const body = seasonalPatternSchema.parse(request.body);

      try {
        const isAIServiceAvailable = await checkAIServiceHealth();

        if (!isAIServiceAvailable) {
          return reply.status(503).send({
            success: false,
            error: {
              code: 'AI_SERVICE_UNAVAILABLE',
              message: 'AI service is currently unavailable',
            },
          });
        }

        const patternResponse = await analyzeSeasonalPatterns({
          product_id: body.product_id,
          tenant_id: tenantId,
          years: body.years,
        });

        return reply.send({
          success: true,
          data: patternResponse,
        });
      } catch (error) {
        logger.error('Failed to analyze seasonal patterns', { error, body, tenantId });

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: error.errors,
            },
          });
        }

        return reply.status(500).send({
          success: false,
          error: {
            code: 'ANALYSIS_ERROR',
            message: 'Failed to analyze seasonal patterns',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/forecasting/health
   * Check AI service health
   */
  fastify.get<{
    Reply: ApiResponse<{ available: boolean; service_url: string }>;
  }>(
    '/health',
    {
      schema: {
        description: 'Check AI service health status',
        tags: ['Forecasting', 'AI'],
        security: [{ bearerAuth: [] }],
      } as any,
      preHandler: [requireTier('L2', 'L3')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const isAvailable = await checkAIServiceHealth();
        const serviceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

        return reply.send({
          success: true,
          data: {
            available: isAvailable,
            service_url: serviceUrl,
          },
        });
      } catch (error) {
        logger.error('Failed to check AI service health', { error });

        return reply.status(500).send({
          success: false,
          error: {
            code: 'HEALTH_CHECK_ERROR',
            message: 'Failed to check AI service health',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/forecasting/insights
   * Get AI-generated insights
   */
  fastify.get<{
    Reply: ApiResponse<any>;
  }>(
    '/insights',
    {
      schema: {
        description: 'Get AI-generated insights and recommendations',
        tags: ['Forecasting', 'AI'],
        security: [{ bearerAuth: [] }],
      } as any,
      preHandler: [requireTier('L2', 'L3'), requireFeature('demandForecasting')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const isAIServiceAvailable = await checkAIServiceHealth();

        if (!isAIServiceAvailable) {
          // Return mock insights when AI service is unavailable
          return reply.send({
            success: true,
            data: {
              generated_at: new Date().toISOString(),
              insights_count: 3,
              insights: [
                {
                  type: 'warning',
                  title: 'Stock Alert',
                  message: 'Some products are approaching reorder point. Review inventory levels.',
                  priority: 'high',
                  category: 'inventory'
                },
                {
                  type: 'trend',
                  title: 'Demand Trend',
                  message: 'Overall demand is stable with seasonal patterns detected.',
                  priority: 'medium',
                  category: 'demand'
                },
                {
                  type: 'optimization',
                  title: 'Optimization Opportunity',
                  message: 'Consider optimizing order quantities based on lead times.',
                  priority: 'low',
                  category: 'cost'
                }
              ],
              summary: { high_priority: 1, medium_priority: 1, low_priority: 1 },
              fallback: true
            },
          });
        }

        const insightsResponse = await getAIInsights();

        return reply.send({
          success: true,
          data: insightsResponse,
        });
      } catch (error) {
        logger.error('Failed to get AI insights', { error });

        return reply.status(500).send({
          success: false,
          error: {
            code: 'INSIGHTS_ERROR',
            message: 'Failed to get AI insights',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/forecasting/bulk
   * Bulk forecast for multiple products
   */
  fastify.post<{
    Body: { product_ids: string[]; forecast_days?: number };
    Reply: ApiResponse<any>;
  }>(
    '/bulk',
    {
      schema: {
        description: 'Bulk forecast for multiple products',
        tags: ['Forecasting', 'AI'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['product_ids'],
          properties: {
            product_ids: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
              minItems: 1,
              maxItems: 50
            },
            forecast_days: { type: 'number', minimum: 1, maximum: 90, default: 30 },
          },
        },
      } as any,
      preHandler: [requireTier('L2', 'L3'), requireFeature('demandForecasting')],
    },
    async (request: FastifyRequest<{ Body: { product_ids: string[]; forecast_days?: number } }>, reply: FastifyReply) => {
      const tenantId = getTenantId(request);
      const { product_ids, forecast_days = 30 } = request.body;

      try {
        const isAIServiceAvailable = await checkAIServiceHealth();

        if (!isAIServiceAvailable) {
          return reply.status(503).send({
            success: false,
            error: {
              code: 'AI_SERVICE_UNAVAILABLE',
              message: 'AI service is currently unavailable',
            },
          });
        }

        const bulkResponse = await bulkForecast({
          product_ids,
          tenant_id: tenantId,
          forecast_days,
        });

        return reply.send({
          success: true,
          data: bulkResponse,
        });
      } catch (error) {
        logger.error('Failed to bulk forecast', { error, product_ids, tenantId });

        return reply.status(500).send({
          success: false,
          error: {
            code: 'BULK_FORECAST_ERROR',
            message: 'Failed to generate bulk forecast',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  );
}

