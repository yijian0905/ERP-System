import type {
  ApiResponse,
  CreateProductRequest,
  PaginationMeta,
  Product,
  UpdateProductRequest,
} from '@erp/shared-types';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { getTenantId } from '../../middleware/auth.js';
import { requireFeature, requireTier } from '../../middleware/license.js';
import { forecastDemand, checkAIServiceHealth } from '../../services/ai/index.js';
import { logger } from '../../lib/logger.js';
import {
  mockProducts as globalMockProducts,
} from '../../data/mock-data.js';

// Validation schemas
const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive('Cost must be positive'),
  taxRate: z.number().min(0).max(100).optional().default(0),
  minStock: z.number().int().min(0).optional().default(0),
  maxStock: z.number().int().min(0).optional().default(1000),
  reorderPoint: z.number().int().min(0).optional().default(0),
  reorderQty: z.number().int().min(0).optional().default(0),
});

const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
});

// Use centralized mock data (cast to Product type for API compatibility)
const mockProducts = globalMockProducts as unknown as Product[];

export async function productsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/products
   * List products with pagination
   */
  fastify.get<{
    Querystring: z.infer<typeof paginationSchema>;
    Reply: ApiResponse<Product[]>;
  }>(
    '/',
    {
      schema: {
        description: 'List all products with pagination',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 50 },
            sortBy: { type: 'string', default: 'createdAt' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            search: { type: 'string' },
          },
        },
      } as any,
    },
    async (request, reply) => {
      const params = paginationSchema.parse(request.query);
      const tenantId = getTenantId(request);

      // Filter by tenant
      let filteredProducts = mockProducts.filter((p) => p.tenantId === tenantId);

      if (params.search) {
        const search = params.search.toLowerCase();
        filteredProducts = filteredProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(search) ||
            p.sku.toLowerCase().includes(search)
        );
      }

      const total = filteredProducts.length;
      const start = (params.page - 1) * params.limit;
      const paginatedProducts = filteredProducts.slice(start, start + params.limit);

      const meta: PaginationMeta = {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      };

      return reply.send({
        success: true,
        data: paginatedProducts,
        meta,
      });
    }
  );

  /**
   * GET /api/v1/products/:id
   * Get single product
   */
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<Product>;
  }>(
    '/:id',
    {
      schema: {
        description: 'Get a product by ID',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      } as any,
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const product = mockProducts.find((p) => p.id === id && p.tenantId === tenantId);

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: product,
      });
    }
  );

  /**
   * POST /api/v1/products
   * Create new product
   */
  fastify.post<{
    Body: CreateProductRequest;
    Reply: ApiResponse<Product>;
  }>(
    '/',
    {
      schema: {
        description: 'Create a new product',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['sku', 'name', 'category', 'unit', 'price', 'cost'],
          properties: {
            sku: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            unit: { type: 'string' },
            price: { type: 'number' },
            cost: { type: 'number' },
            minStock: { type: 'number' },
            maxStock: { type: 'number' },
          },
        },
      } as any,
    },
    async (request: FastifyRequest<{ Body: CreateProductRequest }>, reply: FastifyReply) => {
      const validation = createProductSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
          },
        });
      }

      const tenantId = getTenantId(request);

      // Check for duplicate SKU
      const existingProduct = mockProducts.find(
        (p) => p.sku === validation.data.sku && p.tenantId === tenantId
      );
      if (existingProduct) {
        return reply.status(409).send({
          success: false,
          error: {
            code: 'DUPLICATE_SKU',
            message: 'A product with this SKU already exists',
          },
        });
      }

      const { category, ...productData } = validation.data;

      const newProduct: Product = {
        id: String(mockProducts.length + 1),
        tenantId,
        categoryId: category || null,
        barcode: null,
        ...productData,
        taxRate: productData.taxRate ?? 0,
        reorderPoint: productData.reorderPoint ?? 0,
        reorderQty: productData.reorderQty ?? 0,
        images: [],
        attributes: {},
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockProducts.push(newProduct);

      return reply.status(201).send({
        success: true,
        data: newProduct,
      });
    }
  );

  /**
   * PATCH /api/v1/products/:id
   * Update product
   */
  fastify.patch<{
    Params: { id: string };
    Body: UpdateProductRequest;
    Reply: ApiResponse<Product>;
  }>(
    '/:id',
    {
      schema: {
        description: 'Update a product',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateProductRequest }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const validation = updateProductSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
          },
        });
      }

      const productIndex = mockProducts.findIndex(
        (p) => p.id === id && p.tenantId === tenantId
      );

      if (productIndex === -1) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        });
      }

      const { category, ...updateData } = validation.data;

      mockProducts[productIndex] = {
        ...mockProducts[productIndex],
        ...updateData,
        ...(category !== undefined ? { categoryId: category || null } : {}),
        updatedAt: new Date().toISOString(),
      };

      return reply.send({
        success: true,
        data: mockProducts[productIndex],
      });
    }
  );

  /**
   * DELETE /api/v1/products/:id
   * Delete product (soft delete)
   */
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<{ message: string }>;
  }>(
    '/:id',
    {
      schema: {
        description: 'Delete a product (soft delete)',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const productIndex = mockProducts.findIndex(
        (p) => p.id === id && p.tenantId === tenantId
      );

      if (productIndex === -1) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        });
      }

      mockProducts[productIndex].deletedAt = new Date().toISOString();

      return reply.send({
        success: true,
        data: { message: 'Product deleted successfully' },
      });
    }
  );

  /**
   * GET /api/v1/products/:id/forecast
   * Get demand forecast for a product (L2+ feature)
   */
  fastify.get<{
    Params: { id: string };
    Querystring: { days?: number; includeConfidence?: boolean };
    Reply: ApiResponse<{
      forecast: Array<{ date: string; predicted_demand: number; lower_bound?: number; upper_bound?: number }>;
      confidence?: number;
      model_metrics?: Record<string, number>;
    }>;
  }>(
    '/:id/forecast',
    {
      schema: {
        description: 'Get demand forecast for a product (L2+ feature)',
        tags: ['Products', 'AI'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            days: { type: 'number', minimum: 1, maximum: 365, default: 30 },
            includeConfidence: { type: 'boolean', default: false },
          },
        },
      } as any,
      // Require L2 tier for this endpoint
      preHandler: [requireTier('L2', 'L3'), requireFeature('demandForecasting')],
    },
    async (request: FastifyRequest<{ Params: { id: string }; Querystring: { days?: number; includeConfidence?: boolean } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { days = 30, includeConfidence = false } = request.query;
      const tenantId = getTenantId(request);

      const product = mockProducts.find((p) => p.id === id && p.tenantId === tenantId);

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        });
      }

      try {
        // Check if AI service is available
        const isAIServiceAvailable = await checkAIServiceHealth();

        if (!isAIServiceAvailable) {
          logger.warn('AI service is not available, returning fallback forecast', {
            productId: id,
            tenantId,
          });

          // Fallback to simple forecast if AI service is unavailable
          const fallbackForecast = Array.from({ length: days }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i + 1);
            return {
              date: date.toISOString().split('T')[0],
              predicted_demand: Math.floor(Math.random() * 100) + 50,
            };
          });

          return reply.send({
            success: true,
            data: {
              forecast: fallbackForecast,
              confidence: 0.75,
              warning: 'AI service unavailable, using fallback forecast',
            },
          });
        }

        // Call Python AI service
        const forecastResponse = await forecastDemand({
          product_id: id,
          tenant_id: tenantId,
          forecast_days: days,
          include_confidence: includeConfidence,
        });

        // Transform response to match API format
        const forecast = forecastResponse.predictions.map((pred) => ({
          date: pred.date,
          predicted_demand: pred.predicted_demand,
          ...(pred.lower_bound && pred.upper_bound
            ? {
                lower_bound: pred.lower_bound,
                upper_bound: pred.upper_bound,
              }
            : {}),
        }));

        return reply.send({
          success: true,
          data: {
            forecast,
            confidence: forecastResponse.model_metrics?.r2 || 0.85,
            model_metrics: forecastResponse.model_metrics,
          },
        });
      } catch (error) {
        logger.error('Failed to get forecast from AI service', {
          error,
          productId: id,
          tenantId,
        });

        return reply.status(503).send({
          success: false,
          error: {
            code: 'AI_SERVICE_ERROR',
            message: 'Failed to get forecast from AI service',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/products/analytics
   * Get advanced product analytics (L2+ feature)
   */
  fastify.get<{
    Reply: ApiResponse<{
      topProducts: Array<{ id: string; name: string; sales: number }>;
      lowStock: Array<{ id: string; name: string; quantity: number }>;
      trends: Record<string, number>;
    }>;
  }>(
    '/analytics',
    {
      schema: {
        description: 'Get advanced product analytics (L2+ feature)',
        tags: ['Products', 'Analytics'],
        security: [{ bearerAuth: [] }],
      } as any,
      preHandler: [requireTier('L2', 'L3'), requireFeature('advancedReports')],
    },
    async (_request, reply) => {
      // Mock analytics data
      return reply.send({
        success: true,
        data: {
          topProducts: [
            { id: '1', name: 'Wireless Mouse', sales: 150 },
            { id: '2', name: 'Mechanical Keyboard', sales: 75 },
          ],
          lowStock: [
            { id: '2', name: 'Mechanical Keyboard', quantity: 5 },
          ],
          trends: {
            'week1': 120,
            'week2': 145,
            'week3': 132,
            'week4': 168,
          },
        },
      });
    }
  );

  /**
   * POST /api/v1/products/:id/ai-description
   * Generate AI product description (L3 feature)
   */
  fastify.post<{
    Params: { id: string };
    Reply: ApiResponse<{ description: string }>;
  }>(
    '/:id/ai-description',
    {
      schema: {
        description: 'Generate AI product description (L3 feature)',
        tags: ['Products', 'AI'],
        security: [{ bearerAuth: [] }],
      } as any,
      // Require L3 tier for this endpoint
      preHandler: [requireTier('L3'), requireFeature('aiChatAssistant')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const product = mockProducts.find((p) => p.id === id && p.tenantId === tenantId);

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        });
      }

      // Mock AI-generated description (replace with actual Ollama call)
      const categoryName = product.category?.name || 'product';
      const aiDescription = `Introducing the ${product.name} - a premium quality product designed for maximum efficiency and comfort. Built with attention to detail, this ${categoryName.toLowerCase()} item offers exceptional value for both personal and professional use.`;

      return reply.send({
        success: true,
        data: {
          description: aiDescription,
        },
      });
    }
  );

  /**
   * GET /api/v1/products/:id/audit-log
   * Get product audit log (L3 feature)
   */
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<Array<{
      action: string;
      userId: string;
      timestamp: string;
      changes: Record<string, unknown>;
    }>>;
  }>(
    '/:id/audit-log',
    {
      schema: {
        description: 'Get product audit log (L3 feature)',
        tags: ['Products', 'Audit'],
        security: [{ bearerAuth: [] }],
      } as any,
      preHandler: [requireTier('L3'), requireFeature('auditLogs')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const product = mockProducts.find((p) => p.id === id && p.tenantId === tenantId);

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        });
      }

      // Mock audit log data
      return reply.send({
        success: true,
        data: [
          {
            action: 'create',
            userId: '550e8400-e29b-41d4-a716-446655440000',
            timestamp: product.createdAt,
            changes: { name: product.name, sku: product.sku },
          },
          {
            action: 'update',
            userId: '550e8400-e29b-41d4-a716-446655440000',
            timestamp: product.updatedAt,
            changes: { price: product.price },
          },
        ],
      });
    }
  );
}
