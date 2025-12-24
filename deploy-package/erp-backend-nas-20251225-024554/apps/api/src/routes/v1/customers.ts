import type {
  ApiResponse,
  PaginationMeta,
} from '@erp/shared-types';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { getTenantId } from '../../middleware/auth.js';
import { mockCustomers as globalMockCustomers } from '../../data/mock-data.js';
import { authRouteOptions } from '../../types/fastify-schema.js';

// Types
interface Customer {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: 'INDIVIDUAL' | 'COMPANY' | 'GOVERNMENT' | 'NONPROFIT';
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  taxId: string | null;
  billingAddress: object | null;
  shippingAddress: object | null;
  paymentTerms: number;
  creditLimit: number;
  currentBalance: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['INDIVIDUAL', 'COMPANY', 'GOVERNMENT', 'NONPROFIT']).optional().default('COMPANY'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  taxId: z.string().optional().nullable(),
  billingAddress: z.object({}).passthrough().optional().nullable(),
  shippingAddress: z.object({}).passthrough().optional().nullable(),
  paymentTerms: z.number().int().min(0).optional().default(30),
  creditLimit: z.number().min(0).optional().default(0),
  notes: z.string().optional().nullable(),
});

const updateCustomerSchema = createCustomerSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  type: z.enum(['INDIVIDUAL', 'COMPANY', 'GOVERNMENT', 'NONPROFIT']).optional(),
});

// Use centralized mock data
const mockCustomers = globalMockCustomers as unknown as Customer[];
let customerCounter = mockCustomers.length;

export async function customersRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/customers
   * List customers with pagination
   */
  fastify.get<{
    Querystring: z.infer<typeof paginationSchema>;
    Reply: ApiResponse<Customer[]>;
  }>(
    '/',
    authRouteOptions('List all customers with pagination', ['Customers']),
    async (request, reply) => {
      const params = paginationSchema.parse(request.query);
      const tenantId = getTenantId(request);

      let filteredCustomers = mockCustomers.filter((c) => c.tenantId === tenantId);

      // Filter by search
      if (params.search) {
        const search = params.search.toLowerCase();
        filteredCustomers = filteredCustomers.filter(
          (c) =>
            c.name.toLowerCase().includes(search) ||
            c.code.toLowerCase().includes(search) ||
            c.email?.toLowerCase().includes(search)
        );
      }

      // Filter by type
      if (params.type) {
        filteredCustomers = filteredCustomers.filter((c) => c.type === params.type);
      }

      const total = filteredCustomers.length;
      const start = (params.page - 1) * params.limit;
      const paginatedCustomers = filteredCustomers.slice(start, start + params.limit);

      const meta: PaginationMeta = {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      };

      return reply.send({
        success: true,
        data: paginatedCustomers,
        meta,
      });
    }
  );

  /**
   * GET /api/v1/customers/:id
   * Get single customer
   */
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<Customer>;
  }>(
    '/:id',
    authRouteOptions('Get a customer by ID', ['Customers']),
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const customer = mockCustomers.find((c) => c.id === id && c.tenantId === tenantId);

      if (!customer) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Customer not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: customer,
      });
    }
  );

  /**
   * POST /api/v1/customers
   * Create new customer
   */
  fastify.post<{
    Body: z.infer<typeof createCustomerSchema>;
    Reply: ApiResponse<Customer>;
  }>(
    '/',
    authRouteOptions('Create a new customer', ['Customers']),
    async (request, reply) => {
      const validation = createCustomerSchema.safeParse(request.body);
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
      customerCounter++;

      const newCustomer: Customer = {
        id: String(customerCounter),
        tenantId,
        code: `CUST-${String(customerCounter).padStart(3, '0')}`,
        ...validation.data,
        email: validation.data.email ?? null,
        phone: validation.data.phone ?? null,
        mobile: validation.data.mobile ?? null,
        website: validation.data.website ?? null,
        taxId: validation.data.taxId ?? null,
        billingAddress: validation.data.billingAddress ?? null,
        shippingAddress: validation.data.shippingAddress ?? null,
        notes: validation.data.notes ?? null,
        currentBalance: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCustomers.push(newCustomer);

      return reply.status(201).send({
        success: true,
        data: newCustomer,
      });
    }
  );

  /**
   * PATCH /api/v1/customers/:id
   * Update customer
   */
  fastify.patch<{
    Params: { id: string };
    Body: z.infer<typeof updateCustomerSchema>;
    Reply: ApiResponse<Customer>;
  }>(
    '/:id',
    authRouteOptions('Update a customer', ['Customers']),
    async (request: FastifyRequest<{ Params: { id: string }; Body: z.infer<typeof updateCustomerSchema> }>, reply: FastifyReply) => {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const validation = updateCustomerSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
          },
        });
      }

      const customerIndex = mockCustomers.findIndex(
        (c) => c.id === id && c.tenantId === tenantId
      );

      if (customerIndex === -1) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Customer not found',
          },
        });
      }

      mockCustomers[customerIndex] = {
        ...mockCustomers[customerIndex],
        ...validation.data,
        updatedAt: new Date().toISOString(),
      };

      return reply.send({
        success: true,
        data: mockCustomers[customerIndex],
      });
    }
  );

  /**
   * DELETE /api/v1/customers/:id
   * Delete customer (soft delete)
   */
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<{ message: string }>;
  }>(
    '/:id',
    authRouteOptions('Delete a customer (soft delete)', ['Customers']),
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const customerIndex = mockCustomers.findIndex(
        (c) => c.id === id && c.tenantId === tenantId
      );

      if (customerIndex === -1) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Customer not found',
          },
        });
      }

      mockCustomers[customerIndex].isActive = false;

      return reply.send({
        success: true,
        data: { message: 'Customer deleted successfully' },
      });
    }
  );
}
