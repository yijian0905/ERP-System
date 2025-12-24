import type { FastifySchema } from 'fastify';

/**
 * Type helper for Fastify route schemas
 * This allows us to define schemas without using 'as any'
 */
export type RouteSchema = FastifySchema;

/**
 * Common schema definitions for reuse
 */
export const CommonSchemas = {
  /**
   * UUID parameter schema
   */
  idParam: {
    type: 'object' as const,
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' },
    },
  },

  /**
   * Pagination query schema
   */
  pagination: {
    type: 'object' as const,
    properties: {
      page: { type: 'number', minimum: 1, default: 1 },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
      sortBy: { type: 'string' },
      sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
    },
  },

  /**
   * Search query schema
   */
  search: {
    type: 'object' as const,
    properties: {
      search: { type: 'string', maxLength: 200 },
    },
  },

  /**
   * Success response schema
   */
  successResponse: {
    type: 'object' as const,
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: { type: 'object' },
    },
  },

  /**
   * Error response schema
   */
  errorResponse: {
    type: 'object' as const,
    properties: {
      success: { type: 'boolean', enum: [false] },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object' },
        },
        required: ['code', 'message'],
      },
    },
  },

  /**
   * Pagination meta schema
   */
  paginationMeta: {
    type: 'object' as const,
    properties: {
      page: { type: 'number' },
      limit: { type: 'number' },
      total: { type: 'number' },
      totalPages: { type: 'number' },
    },
  },
};

/**
 * Create a standard route schema with common settings
 */
export function createRouteSchema(options: {
  description: string;
  tags: string[];
  security?: boolean;
  params?: Record<string, unknown>;
  querystring?: Record<string, unknown>;
  body?: Record<string, unknown>;
  response?: Record<number, unknown>;
}): RouteSchema {
  const schema: RouteSchema = {
    description: options.description,
    tags: options.tags,
  };

  if (options.security !== false) {
    schema.security = [{ bearerAuth: [] }];
  }

  if (options.params) {
    schema.params = options.params;
  }

  if (options.querystring) {
    schema.querystring = options.querystring;
  }

  if (options.body) {
    schema.body = options.body;
  }

  if (options.response) {
    schema.response = options.response;
  }

  return schema;
}

/**
 * Standard error responses for different HTTP status codes
 */
export const ErrorResponses = {
  400: CommonSchemas.errorResponse,
  401: CommonSchemas.errorResponse,
  403: CommonSchemas.errorResponse,
  404: CommonSchemas.errorResponse,
  409: CommonSchemas.errorResponse,
  429: CommonSchemas.errorResponse,
  500: CommonSchemas.errorResponse,
};
