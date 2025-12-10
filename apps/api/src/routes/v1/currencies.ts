import type {
  ApiResponse,
  CreateCurrencyRequest,
  CreateExchangeRateRequest,
  Currency,
  CurrencyConversionRequest,
  CurrencyConversionResult,
  ExchangeRate,
  PaginationMeta,
  UpdateCurrencyRequest,
  UpdateExchangeRateRequest,
} from '@erp/shared-types';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { getTenantId } from '../../middleware/auth.js';

// Validation schemas
const createCurrencySchema = z.object({
  code: z.string().length(3, 'Currency code must be exactly 3 characters').toUpperCase(),
  name: z.string().min(1, 'Name is required').max(100),
  symbol: z.string().min(1, 'Symbol is required').max(10),
  decimalPlaces: z.number().int().min(0).max(4).optional().default(2),
  symbolPosition: z.enum(['BEFORE', 'AFTER']).optional().default('BEFORE'),
  thousandsSeparator: z.string().max(5).optional().default(','),
  decimalSeparator: z.string().max(5).optional().default('.'),
  isBaseCurrency: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
});

const updateCurrencySchema = createCurrencySchema.partial().extend({
  isActive: z.boolean().optional(),
});

const createExchangeRateSchema = z.object({
  fromCurrencyId: z.string().uuid('Invalid from currency ID'),
  toCurrencyId: z.string().uuid('Invalid to currency ID'),
  rate: z.number().positive('Rate must be positive'),
  effectiveDate: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  source: z.enum(['MANUAL', 'API_OPENEXCHANGE', 'API_FIXER', 'API_CURRENCYLAYER', 'API_XE', 'BANK_FEED']).optional().default('MANUAL'),
  sourceReference: z.string().max(255).optional(),
});

const updateExchangeRateSchema = z.object({
  rate: z.number().positive('Rate must be positive').optional(),
  effectiveDate: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  source: z.enum(['MANUAL', 'API_OPENEXCHANGE', 'API_FIXER', 'API_CURRENCYLAYER', 'API_XE', 'BANK_FEED']).optional(),
  sourceReference: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
});

const conversionSchema = z.object({
  amount: z.number().nonnegative('Amount must be non-negative'),
  fromCurrency: z.string().length(3, 'Currency code must be exactly 3 characters').toUpperCase(),
  toCurrency: z.string().length(3, 'Currency code must be exactly 3 characters').toUpperCase(),
  date: z.string().datetime().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  sortBy: z.string().optional().default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  search: z.string().optional(),
  activeOnly: z.coerce.boolean().optional().default(true),
});

// Mock data for development
const mockCurrencies: (Currency & { tenantId: string })[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440100',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2,
    symbolPosition: 'BEFORE',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isBaseCurrency: true,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440101',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimalPlaces: 2,
    symbolPosition: 'AFTER',
    thousandsSeparator: '.',
    decimalSeparator: ',',
    isBaseCurrency: false,
    isActive: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440102',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    decimalPlaces: 2,
    symbolPosition: 'BEFORE',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isBaseCurrency: false,
    isActive: true,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440103',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimalPlaces: 0,
    symbolPosition: 'BEFORE',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isBaseCurrency: false,
    isActive: true,
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440104',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    code: 'GBP',
    name: 'British Pound Sterling',
    symbol: '£',
    decimalPlaces: 2,
    symbolPosition: 'BEFORE',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isBaseCurrency: false,
    isActive: true,
    sortOrder: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockExchangeRates: (ExchangeRate & { tenantId: string })[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440200',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    fromCurrencyId: '550e8400-e29b-41d4-a716-446655440100', // USD
    toCurrencyId: '550e8400-e29b-41d4-a716-446655440101', // EUR
    rate: 0.92,
    inverseRate: 1.087,
    effectiveDate: new Date().toISOString(),
    expiresAt: null,
    source: 'MANUAL',
    sourceReference: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440201',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    fromCurrencyId: '550e8400-e29b-41d4-a716-446655440100', // USD
    toCurrencyId: '550e8400-e29b-41d4-a716-446655440102', // MYR
    rate: 4.47,
    inverseRate: 0.2237,
    effectiveDate: new Date().toISOString(),
    expiresAt: null,
    source: 'MANUAL',
    sourceReference: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440202',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    fromCurrencyId: '550e8400-e29b-41d4-a716-446655440100', // USD
    toCurrencyId: '550e8400-e29b-41d4-a716-446655440103', // JPY
    rate: 149.5,
    inverseRate: 0.00669,
    effectiveDate: new Date().toISOString(),
    expiresAt: null,
    source: 'MANUAL',
    sourceReference: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440203',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    fromCurrencyId: '550e8400-e29b-41d4-a716-446655440100', // USD
    toCurrencyId: '550e8400-e29b-41d4-a716-446655440104', // GBP
    rate: 0.79,
    inverseRate: 1.266,
    effectiveDate: new Date().toISOString(),
    expiresAt: null,
    source: 'MANUAL',
    sourceReference: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function currenciesRoutes(fastify: FastifyInstance) {
  // ============================================
  // CURRENCY ENDPOINTS
  // ============================================

  /**
   * GET /api/v1/currencies
   * List currencies with pagination
   */
  fastify.get<{
    Querystring: z.infer<typeof paginationSchema>;
    Reply: ApiResponse<Currency[]>;
  }>(
    '/',
    {
      schema: {
        description: 'List all currencies with pagination',
        tags: ['Currencies'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 50 },
            sortBy: { type: 'string', default: 'sortOrder' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
            search: { type: 'string' },
            activeOnly: { type: 'boolean', default: true },
          },
        },
      } as any,
    },
    async (request, reply) => {
      const params = paginationSchema.parse(request.query);
      const tenantId = getTenantId(request);

      // Filter by tenant and active status
      let filteredCurrencies = mockCurrencies.filter((c) => 
        c.tenantId === tenantId && (!params.activeOnly || c.isActive)
      );

      if (params.search) {
        const search = params.search.toLowerCase();
        filteredCurrencies = filteredCurrencies.filter(
          (c) =>
            c.name.toLowerCase().includes(search) ||
            c.code.toLowerCase().includes(search) ||
            c.symbol.includes(search)
        );
      }

      // Sort currencies
      filteredCurrencies.sort((a, b) => {
        const aVal = a[params.sortBy as keyof Currency] as string | number;
        const bVal = b[params.sortBy as keyof Currency] as string | number;
        if (params.sortOrder === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        }
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      });

      const total = filteredCurrencies.length;
      const start = (params.page - 1) * params.limit;
      const paginatedCurrencies = filteredCurrencies.slice(start, start + params.limit);

      const meta: PaginationMeta = {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      };

      return reply.send({
        success: true,
        data: paginatedCurrencies,
        meta,
      });
    }
  );

  /**
   * GET /api/v1/currencies/base
   * Get the base currency for the tenant
   */
  fastify.get<{
    Reply: ApiResponse<Currency | null>;
  }>(
    '/base',
    {
      schema: {
        description: 'Get the base currency for the tenant',
        tags: ['Currencies'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);

      const baseCurrency = mockCurrencies.find(
        (c) => c.tenantId === tenantId && c.isBaseCurrency && c.isActive
      );

      return reply.send({
        success: true,
        data: baseCurrency || null,
      });
    }
  );

  /**
   * GET /api/v1/currencies/:id
   * Get single currency
   */
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<Currency>;
  }>(
    '/:id',
    {
      schema: {
        description: 'Get a currency by ID',
        tags: ['Currencies'],
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

      const currency = mockCurrencies.find((c) => c.id === id && c.tenantId === tenantId);

      if (!currency) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Currency not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: currency,
      });
    }
  );

  /**
   * POST /api/v1/currencies
   * Create new currency
   */
  fastify.post<{
    Body: CreateCurrencyRequest;
    Reply: ApiResponse<Currency>;
  }>(
    '/',
    {
      schema: {
        description: 'Create a new currency',
        tags: ['Currencies'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request: FastifyRequest<{ Body: CreateCurrencyRequest }>, reply: FastifyReply) => {
      const validation = createCurrencySchema.safeParse(request.body);
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
      const data = validation.data;

      // Check for duplicate currency code
      const existingCurrency = mockCurrencies.find(
        (c) => c.code === data.code && c.tenantId === tenantId
      );
      if (existingCurrency) {
        return reply.status(409).send({
          success: false,
          error: {
            code: 'DUPLICATE_CURRENCY',
            message: `Currency with code ${data.code} already exists`,
          },
        });
      }

      // If this is marked as base currency, unset other base currencies
      if (data.isBaseCurrency) {
        mockCurrencies.forEach((c) => {
          if (c.tenantId === tenantId) {
            c.isBaseCurrency = false;
          }
        });
      }

      const newCurrency: Currency & { tenantId: string } = {
        id: crypto.randomUUID(),
        tenantId,
        code: data.code,
        name: data.name,
        symbol: data.symbol,
        decimalPlaces: data.decimalPlaces ?? 2,
        symbolPosition: data.symbolPosition ?? 'BEFORE',
        thousandsSeparator: data.thousandsSeparator ?? ',',
        decimalSeparator: data.decimalSeparator ?? '.',
        isBaseCurrency: data.isBaseCurrency ?? false,
        isActive: true,
        sortOrder: data.sortOrder ?? mockCurrencies.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCurrencies.push(newCurrency);

      return reply.status(201).send({
        success: true,
        data: newCurrency,
      });
    }
  );

  /**
   * PATCH /api/v1/currencies/:id
   * Update currency
   */
  fastify.patch<{
    Params: { id: string };
    Body: UpdateCurrencyRequest;
    Reply: ApiResponse<Currency>;
  }>(
    '/:id',
    {
      schema: {
        description: 'Update a currency',
        tags: ['Currencies'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateCurrencyRequest }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const validation = updateCurrencySchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
          },
        });
      }

      const currencyIndex = mockCurrencies.findIndex(
        (c) => c.id === id && c.tenantId === tenantId
      );

      if (currencyIndex === -1) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Currency not found',
          },
        });
      }

      const data = validation.data;

      // Check for duplicate currency code if changing
      if (data.code && data.code !== mockCurrencies[currencyIndex].code) {
        const existingCurrency = mockCurrencies.find(
          (c) => c.code === data.code && c.tenantId === tenantId && c.id !== id
        );
        if (existingCurrency) {
          return reply.status(409).send({
            success: false,
            error: {
              code: 'DUPLICATE_CURRENCY',
              message: `Currency with code ${data.code} already exists`,
            },
          });
        }
      }

      // If setting as base currency, unset others
      if (data.isBaseCurrency === true) {
        mockCurrencies.forEach((c) => {
          if (c.tenantId === tenantId && c.id !== id) {
            c.isBaseCurrency = false;
          }
        });
      }

      mockCurrencies[currencyIndex] = {
        ...mockCurrencies[currencyIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      return reply.send({
        success: true,
        data: mockCurrencies[currencyIndex],
      });
    }
  );

  /**
   * DELETE /api/v1/currencies/:id
   * Delete currency (soft delete)
   */
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<{ message: string }>;
  }>(
    '/:id',
    {
      schema: {
        description: 'Delete a currency (soft delete)',
        tags: ['Currencies'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const currencyIndex = mockCurrencies.findIndex(
        (c) => c.id === id && c.tenantId === tenantId
      );

      if (currencyIndex === -1) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Currency not found',
          },
        });
      }

      // Cannot delete base currency
      if (mockCurrencies[currencyIndex].isBaseCurrency) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'CANNOT_DELETE_BASE',
            message: 'Cannot delete base currency. Set another currency as base first.',
          },
        });
      }

      mockCurrencies[currencyIndex].deletedAt = new Date().toISOString();
      mockCurrencies[currencyIndex].isActive = false;

      return reply.send({
        success: true,
        data: { message: 'Currency deleted successfully' },
      });
    }
  );

  // ============================================
  // EXCHANGE RATE ENDPOINTS
  // ============================================

  /**
   * GET /api/v1/currencies/exchange-rates
   * List exchange rates with pagination
   */
  fastify.get<{
    Querystring: z.infer<typeof paginationSchema>;
    Reply: ApiResponse<ExchangeRate[]>;
  }>(
    '/exchange-rates',
    {
      schema: {
        description: 'List all exchange rates with pagination',
        tags: ['Currencies', 'Exchange Rates'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request, reply) => {
      const params = paginationSchema.parse(request.query);
      const tenantId = getTenantId(request);

      const filteredRates = mockExchangeRates.filter((r) => 
        r.tenantId === tenantId && (!params.activeOnly || r.isActive)
      );

      // Add currency details
      const ratesWithCurrencies = filteredRates.map((rate) => ({
        ...rate,
        fromCurrency: mockCurrencies.find((c) => c.id === rate.fromCurrencyId),
        toCurrency: mockCurrencies.find((c) => c.id === rate.toCurrencyId),
      }));

      const total = ratesWithCurrencies.length;
      const start = (params.page - 1) * params.limit;
      const paginatedRates = ratesWithCurrencies.slice(start, start + params.limit);

      const meta: PaginationMeta = {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      };

      return reply.send({
        success: true,
        data: paginatedRates,
        meta,
      });
    }
  );

  /**
   * GET /api/v1/currencies/exchange-rates/:fromCode/:toCode
   * Get current exchange rate between two currencies
   */
  fastify.get<{
    Params: { fromCode: string; toCode: string };
    Querystring: { date?: string };
    Reply: ApiResponse<ExchangeRate>;
  }>(
    '/exchange-rates/:fromCode/:toCode',
    {
      schema: {
        description: 'Get exchange rate between two currencies',
        tags: ['Currencies', 'Exchange Rates'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request, reply) => {
      const { fromCode, toCode } = request.params;
      const { date } = request.query as { date?: string };
      const tenantId = getTenantId(request);

      // Find currencies by code
      const fromCurrency = mockCurrencies.find(
        (c) => c.code.toUpperCase() === fromCode.toUpperCase() && c.tenantId === tenantId
      );
      const toCurrency = mockCurrencies.find(
        (c) => c.code.toUpperCase() === toCode.toUpperCase() && c.tenantId === tenantId
      );

      if (!fromCurrency || !toCurrency) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'CURRENCY_NOT_FOUND',
            message: `One or both currencies not found: ${fromCode}, ${toCode}`,
          },
        });
      }

      // Same currency - rate is 1
      if (fromCurrency.id === toCurrency.id) {
        return reply.send({
          success: true,
          data: {
            id: 'same-currency',
            tenantId,
            fromCurrencyId: fromCurrency.id,
            toCurrencyId: toCurrency.id,
            rate: 1,
            inverseRate: 1,
            effectiveDate: new Date().toISOString(),
            expiresAt: null,
            source: 'MANUAL' as const,
            sourceReference: null,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            fromCurrency,
            toCurrency,
          },
        });
      }

      // Find direct rate or inverse rate
      const targetDate = date ? new Date(date) : new Date();
      
      let exchangeRate = mockExchangeRates.find(
        (r) =>
          r.tenantId === tenantId &&
          r.fromCurrencyId === fromCurrency.id &&
          r.toCurrencyId === toCurrency.id &&
          r.isActive &&
          new Date(r.effectiveDate) <= targetDate &&
          (!r.expiresAt || new Date(r.expiresAt) >= targetDate)
      );

      // Try inverse rate
      if (!exchangeRate) {
        const inverseRate = mockExchangeRates.find(
          (r) =>
            r.tenantId === tenantId &&
            r.fromCurrencyId === toCurrency.id &&
            r.toCurrencyId === fromCurrency.id &&
            r.isActive &&
            new Date(r.effectiveDate) <= targetDate &&
            (!r.expiresAt || new Date(r.expiresAt) >= targetDate)
        );

        if (inverseRate) {
          // Create a virtual rate from the inverse
          exchangeRate = {
            ...inverseRate,
            id: `inverse-${inverseRate.id}`,
            fromCurrencyId: fromCurrency.id,
            toCurrencyId: toCurrency.id,
            rate: inverseRate.inverseRate,
            inverseRate: inverseRate.rate,
          };
        }
      }

      if (!exchangeRate) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'RATE_NOT_FOUND',
            message: `No exchange rate found for ${fromCode} to ${toCode}`,
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          ...exchangeRate,
          fromCurrency,
          toCurrency,
        },
      });
    }
  );

  /**
   * POST /api/v1/currencies/exchange-rates
   * Create new exchange rate
   */
  fastify.post<{
    Body: CreateExchangeRateRequest;
    Reply: ApiResponse<ExchangeRate>;
  }>(
    '/exchange-rates',
    {
      schema: {
        description: 'Create a new exchange rate',
        tags: ['Currencies', 'Exchange Rates'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request: FastifyRequest<{ Body: CreateExchangeRateRequest }>, reply: FastifyReply) => {
      const validation = createExchangeRateSchema.safeParse(request.body);
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
      const data = validation.data;

      // Validate currencies exist
      const fromCurrency = mockCurrencies.find(
        (c) => c.id === data.fromCurrencyId && c.tenantId === tenantId
      );
      const toCurrency = mockCurrencies.find(
        (c) => c.id === data.toCurrencyId && c.tenantId === tenantId
      );

      if (!fromCurrency || !toCurrency) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_CURRENCY',
            message: 'One or both currency IDs are invalid',
          },
        });
      }

      if (data.fromCurrencyId === data.toCurrencyId) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'SAME_CURRENCY',
            message: 'From and To currencies must be different',
          },
        });
      }

      const effectiveDate = data.effectiveDate || new Date().toISOString();
      const inverseRate = Number((1 / data.rate).toFixed(8));

      const newRate: ExchangeRate & { tenantId: string } = {
        id: crypto.randomUUID(),
        tenantId,
        fromCurrencyId: data.fromCurrencyId,
        toCurrencyId: data.toCurrencyId,
        rate: data.rate,
        inverseRate,
        effectiveDate,
        expiresAt: data.expiresAt || null,
        source: data.source ?? 'MANUAL',
        sourceReference: data.sourceReference || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockExchangeRates.push(newRate);

      return reply.status(201).send({
        success: true,
        data: {
          ...newRate,
          fromCurrency,
          toCurrency,
        },
      });
    }
  );

  /**
   * PATCH /api/v1/currencies/exchange-rates/:id
   * Update exchange rate
   */
  fastify.patch<{
    Params: { id: string };
    Body: UpdateExchangeRateRequest;
    Reply: ApiResponse<ExchangeRate>;
  }>(
    '/exchange-rates/:id',
    {
      schema: {
        description: 'Update an exchange rate',
        tags: ['Currencies', 'Exchange Rates'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateExchangeRateRequest }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const validation = updateExchangeRateSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
          },
        });
      }

      const rateIndex = mockExchangeRates.findIndex(
        (r) => r.id === id && r.tenantId === tenantId
      );

      if (rateIndex === -1) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Exchange rate not found',
          },
        });
      }

      const data = validation.data;

      // Recalculate inverse rate if rate changed
      if (data.rate !== undefined) {
        (data as any).inverseRate = Number((1 / data.rate).toFixed(8));
      }

      mockExchangeRates[rateIndex] = {
        ...mockExchangeRates[rateIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const fromCurrency = mockCurrencies.find(
        (c) => c.id === mockExchangeRates[rateIndex].fromCurrencyId
      );
      const toCurrency = mockCurrencies.find(
        (c) => c.id === mockExchangeRates[rateIndex].toCurrencyId
      );

      return reply.send({
        success: true,
        data: {
          ...mockExchangeRates[rateIndex],
          fromCurrency,
          toCurrency,
        },
      });
    }
  );

  /**
   * DELETE /api/v1/currencies/exchange-rates/:id
   * Delete exchange rate
   */
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<{ message: string }>;
  }>(
    '/exchange-rates/:id',
    {
      schema: {
        description: 'Delete an exchange rate',
        tags: ['Currencies', 'Exchange Rates'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const rateIndex = mockExchangeRates.findIndex(
        (r) => r.id === id && r.tenantId === tenantId
      );

      if (rateIndex === -1) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Exchange rate not found',
          },
        });
      }

      mockExchangeRates[rateIndex].isActive = false;

      return reply.send({
        success: true,
        data: { message: 'Exchange rate deleted successfully' },
      });
    }
  );

  // ============================================
  // CONVERSION ENDPOINT
  // ============================================

  /**
   * POST /api/v1/currencies/convert
   * Convert amount between currencies
   */
  fastify.post<{
    Body: CurrencyConversionRequest;
    Reply: ApiResponse<CurrencyConversionResult>;
  }>(
    '/convert',
    {
      schema: {
        description: 'Convert amount between currencies',
        tags: ['Currencies'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request: FastifyRequest<{ Body: CurrencyConversionRequest }>, reply: FastifyReply) => {
      const validation = conversionSchema.safeParse(request.body);
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
      const { amount, fromCurrency: fromCode, toCurrency: toCode, date } = validation.data;

      // Find currencies by code
      const fromCurrency = mockCurrencies.find(
        (c) => c.code === fromCode && c.tenantId === tenantId
      );
      const toCurrency = mockCurrencies.find(
        (c) => c.code === toCode && c.tenantId === tenantId
      );

      if (!fromCurrency || !toCurrency) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'CURRENCY_NOT_FOUND',
            message: `One or both currencies not found: ${fromCode}, ${toCode}`,
          },
        });
      }

      // Same currency
      if (fromCurrency.id === toCurrency.id) {
        return reply.send({
          success: true,
          data: {
            originalAmount: amount,
            convertedAmount: amount,
            fromCurrency: fromCode,
            toCurrency: toCode,
            exchangeRate: 1,
            inverseRate: 1,
            effectiveDate: new Date().toISOString(),
            source: 'MANUAL' as const,
          },
        });
      }

      // Find exchange rate
      const targetDate = date ? new Date(date) : new Date();
      
      const exchangeRate = mockExchangeRates.find(
        (r) =>
          r.tenantId === tenantId &&
          r.fromCurrencyId === fromCurrency.id &&
          r.toCurrencyId === toCurrency.id &&
          r.isActive &&
          new Date(r.effectiveDate) <= targetDate &&
          (!r.expiresAt || new Date(r.expiresAt) >= targetDate)
      );

      let rate: number;
      let inverseRate: number;
      let source: ExchangeRate['source'] = 'MANUAL';
      let effectiveDate = new Date().toISOString();

      if (exchangeRate) {
        rate = Number(exchangeRate.rate);
        inverseRate = Number(exchangeRate.inverseRate);
        source = exchangeRate.source;
        effectiveDate = exchangeRate.effectiveDate;
      } else {
        // Try inverse rate
        const inverse = mockExchangeRates.find(
          (r) =>
            r.tenantId === tenantId &&
            r.fromCurrencyId === toCurrency.id &&
            r.toCurrencyId === fromCurrency.id &&
            r.isActive &&
            new Date(r.effectiveDate) <= targetDate &&
            (!r.expiresAt || new Date(r.expiresAt) >= targetDate)
        );

        if (inverse) {
          rate = Number(inverse.inverseRate);
          inverseRate = Number(inverse.rate);
          source = inverse.source;
          effectiveDate = inverse.effectiveDate;
        } else {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'RATE_NOT_FOUND',
              message: `No exchange rate found for ${fromCode} to ${toCode}`,
            },
          });
        }
      }

      const convertedAmount = Number((amount * rate).toFixed(toCurrency.decimalPlaces));

      return reply.send({
        success: true,
        data: {
          originalAmount: amount,
          convertedAmount,
          fromCurrency: fromCode,
          toCurrency: toCode,
          exchangeRate: rate,
          inverseRate,
          effectiveDate,
          source,
        },
      });
    }
  );

  /**
   * POST /api/v1/currencies/bulk-convert
   * Convert multiple amounts at once
   */
  fastify.post<{
    Body: CurrencyConversionRequest[];
    Reply: ApiResponse<CurrencyConversionResult[]>;
  }>(
    '/bulk-convert',
    {
      schema: {
        description: 'Convert multiple amounts between currencies',
        tags: ['Currencies'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request: FastifyRequest<{ Body: CurrencyConversionRequest[] }>, reply: FastifyReply) => {
      const conversions = request.body;
      
      if (!Array.isArray(conversions) || conversions.length === 0) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request body must be a non-empty array of conversion requests',
          },
        });
      }

      if (conversions.length > 100) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Maximum 100 conversions per request',
          },
        });
      }

      const tenantId = getTenantId(request);
      const results: CurrencyConversionResult[] = [];

      for (const conversion of conversions) {
        const validation = conversionSchema.safeParse(conversion);
        if (!validation.success) {
          continue; // Skip invalid entries
        }

        const { amount, fromCurrency: fromCode, toCurrency: toCode, date } = validation.data;

        const fromCurrency = mockCurrencies.find(
          (c) => c.code === fromCode && c.tenantId === tenantId
        );
        const toCurrency = mockCurrencies.find(
          (c) => c.code === toCode && c.tenantId === tenantId
        );

        if (!fromCurrency || !toCurrency) continue;

        if (fromCurrency.id === toCurrency.id) {
          results.push({
            originalAmount: amount,
            convertedAmount: amount,
            fromCurrency: fromCode,
            toCurrency: toCode,
            exchangeRate: 1,
            inverseRate: 1,
            effectiveDate: new Date().toISOString(),
            source: 'MANUAL',
          });
          continue;
        }

        const targetDate = date ? new Date(date) : new Date();
        
        const exchangeRate = mockExchangeRates.find(
          (r) =>
            r.tenantId === tenantId &&
            r.fromCurrencyId === fromCurrency.id &&
            r.toCurrencyId === toCurrency.id &&
            r.isActive &&
            new Date(r.effectiveDate) <= targetDate &&
            (!r.expiresAt || new Date(r.expiresAt) >= targetDate)
        );

        let rate: number;
        let inverseRate: number;
        let source: ExchangeRate['source'] = 'MANUAL';
        let effectiveDate = new Date().toISOString();

        if (exchangeRate) {
          rate = Number(exchangeRate.rate);
          inverseRate = Number(exchangeRate.inverseRate);
          source = exchangeRate.source;
          effectiveDate = exchangeRate.effectiveDate;
        } else {
          const inverse = mockExchangeRates.find(
            (r) =>
              r.tenantId === tenantId &&
              r.fromCurrencyId === toCurrency.id &&
              r.toCurrencyId === fromCurrency.id &&
              r.isActive
          );

          if (inverse) {
            rate = Number(inverse.inverseRate);
            inverseRate = Number(inverse.rate);
            source = inverse.source;
            effectiveDate = inverse.effectiveDate;
          } else {
            continue; // Skip if no rate found
          }
        }

        results.push({
          originalAmount: amount,
          convertedAmount: Number((amount * rate).toFixed(toCurrency.decimalPlaces)),
          fromCurrency: fromCode,
          toCurrency: toCode,
          exchangeRate: rate,
          inverseRate,
          effectiveDate,
          source,
        });
      }

      return reply.send({
        success: true,
        data: results,
      });
    }
  );
}

