import type {
  ApiResponse,
  PaginationMeta,
} from '@erp/shared-types';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { getTenantId } from '../../middleware/auth.js';
import {
  mockInventory as globalMockInventory,
  mockWarehouses,
  mockProducts,
  DEMO_TENANT_ID,
  DEMO_USER_ID,
} from '../../data/mock-data.js';

// Types
interface InventoryItem {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  batchNumber: string | null;
  lotNumber: string | null;
  expiryDate: string | null;
  location: string | null;
  costPrice: number | null;
  lastCountedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  product?: {
    name: string;
    sku: string;
    minStock: number;
    maxStock: number;
    reorderPoint: number;
  };
  warehouse?: {
    name: string;
    code: string;
  };
}

interface InventoryMovement {
  id: string;
  tenantId: string;
  productId: string;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  userId: string;
  type: string;
  quantity: number;
  unitCost: number | null;
  totalCost: number | null;
  reference: string | null;
  referenceType: string | null;
  notes: string | null;
  createdAt: string;
  // Joined fields
  product?: { name: string; sku: string };
  user?: { name: string };
}

// Validation schemas
const adjustmentSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int(),
  reason: z.enum(['ADJUSTMENT', 'DAMAGE', 'EXPIRED', 'RETURN_IN', 'RETURN_OUT', 'INITIAL']),
  notes: z.string().optional(),
});

const transferSchema = z.object({
  productId: z.string().uuid(),
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// Use centralized mock data
const mockInventoryItems: InventoryItem[] = globalMockInventory.map((item) => ({
  id: item.id,
  tenantId: item.tenantId,
  productId: item.productId,
  warehouseId: item.warehouseId,
  quantity: item.quantity,
  reservedQty: item.reservedQty,
  availableQty: item.quantity - item.reservedQty,
  batchNumber: item.batchNumber,
  lotNumber: item.lotNumber,
  expiryDate: item.expiryDate,
  location: item.location,
  costPrice: item.costPrice,
  lastCountedAt: item.lastCountedAt,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  product: item.product ? {
    name: item.product.name,
    sku: item.product.sku,
    minStock: item.product.minStock,
    maxStock: item.product.maxStock,
    reorderPoint: item.product.reorderPoint,
  } : undefined,
  warehouse: item.warehouse ? {
    name: item.warehouse.name,
    code: item.warehouse.code,
  } : undefined,
}));

const mockMovements: InventoryMovement[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440401',
    tenantId: DEMO_TENANT_ID,
    productId: mockProducts[0].id,
    fromWarehouseId: null,
    toWarehouseId: mockWarehouses[0].id,
    userId: DEMO_USER_ID,
    type: 'PURCHASE',
    quantity: 100,
    unitCost: mockProducts[0].cost,
    totalCost: mockProducts[0].cost * 100,
    reference: 'PO-2024-001',
    referenceType: 'purchase_order',
    notes: 'Initial stock purchase',
    createdAt: '2024-12-01T10:00:00Z',
    product: { name: mockProducts[0].name, sku: mockProducts[0].sku },
    user: { name: 'Admin User' },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440402',
    tenantId: DEMO_TENANT_ID,
    productId: mockProducts[0].id,
    fromWarehouseId: mockWarehouses[0].id,
    toWarehouseId: null,
    userId: DEMO_USER_ID,
    type: 'SALE',
    quantity: 10,
    unitCost: mockProducts[0].cost,
    totalCost: mockProducts[0].cost * 10,
    reference: 'SO-2024-001',
    referenceType: 'sales_order',
    notes: null,
    createdAt: '2024-12-05T14:30:00Z',
    product: { name: mockProducts[0].name, sku: mockProducts[0].sku },
    user: { name: 'Admin User' },
  },
];

export async function inventoryRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/inventory
   * List inventory items with pagination
   */
  fastify.get<{
    Querystring: z.infer<typeof paginationSchema>;
    Reply: ApiResponse<InventoryItem[]>;
  }>(
    '/',
    {
      schema: {
        description: 'List inventory items with pagination',
        tags: ['Inventory'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request, reply) => {
      const params = paginationSchema.parse(request.query);
      const tenantId = getTenantId(request);

      let filtered = mockInventoryItems.filter((i) => i.tenantId === tenantId);

      if (params.warehouseId) {
        filtered = filtered.filter((i) => i.warehouseId === params.warehouseId);
      }

      if (params.productId) {
        filtered = filtered.filter((i) => i.productId === params.productId);
      }

      if (params.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(
          (i) =>
            i.product?.name.toLowerCase().includes(search) ||
            i.product?.sku.toLowerCase().includes(search)
        );
      }

      const total = filtered.length;
      const start = (params.page - 1) * params.limit;
      const paginated = filtered.slice(start, start + params.limit);

      const meta: PaginationMeta = {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      };

      return reply.send({
        success: true,
        data: paginated,
        meta,
      });
    }
  );

  /**
   * GET /api/v1/inventory/movements
   * List inventory movements
   */
  fastify.get<{
    Querystring: z.infer<typeof paginationSchema>;
    Reply: ApiResponse<InventoryMovement[]>;
  }>(
    '/movements',
    {
      schema: {
        description: 'List inventory movements',
        tags: ['Inventory'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request, reply) => {
      const params = paginationSchema.parse(request.query);
      const tenantId = getTenantId(request);

      let filtered = mockMovements.filter((m) => m.tenantId === tenantId);

      if (params.productId) {
        filtered = filtered.filter((m) => m.productId === params.productId);
      }

      const total = filtered.length;
      const start = (params.page - 1) * params.limit;
      const paginated = filtered.slice(start, start + params.limit);

      const meta: PaginationMeta = {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      };

      return reply.send({
        success: true,
        data: paginated,
        meta,
      });
    }
  );

  /**
   * POST /api/v1/inventory/adjust
   * Create inventory adjustment
   */
  fastify.post<{
    Body: z.infer<typeof adjustmentSchema>;
    Reply: ApiResponse<InventoryMovement>;
  }>(
    '/adjust',
    {
      schema: {
        description: 'Create inventory adjustment',
        tags: ['Inventory'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request, reply) => {
      const validation = adjustmentSchema.safeParse(request.body);
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
      const { productId, warehouseId, quantity, reason, notes } = validation.data;

      // Create movement record
      const movement: InventoryMovement = {
        id: String(mockMovements.length + 1),
        tenantId,
        productId,
        fromWarehouseId: quantity < 0 ? warehouseId : null,
        toWarehouseId: quantity > 0 ? warehouseId : null,
        userId: '1', // TODO: Get from request
        type: reason,
        quantity: Math.abs(quantity),
        unitCost: null,
        totalCost: null,
        reference: `ADJ-${Date.now()}`,
        referenceType: 'adjustment',
        notes: notes || null,
        createdAt: new Date().toISOString(),
      };

      mockMovements.push(movement);

      return reply.status(201).send({
        success: true,
        data: movement,
      });
    }
  );

  /**
   * POST /api/v1/inventory/transfer
   * Transfer inventory between warehouses
   */
  fastify.post<{
    Body: z.infer<typeof transferSchema>;
    Reply: ApiResponse<InventoryMovement[]>;
  }>(
    '/transfer',
    {
      schema: {
        description: 'Transfer inventory between warehouses',
        tags: ['Inventory'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request, reply) => {
      const validation = transferSchema.safeParse(request.body);
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
      const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = validation.data;

      const reference = `TRF-${Date.now()}`;

      // Create transfer out movement
      const transferOut: InventoryMovement = {
        id: String(mockMovements.length + 1),
        tenantId,
        productId,
        fromWarehouseId,
        toWarehouseId: null,
        userId: '1',
        type: 'TRANSFER_OUT',
        quantity,
        unitCost: null,
        totalCost: null,
        reference,
        referenceType: 'transfer',
        notes: notes || null,
        createdAt: new Date().toISOString(),
      };

      // Create transfer in movement
      const transferIn: InventoryMovement = {
        id: String(mockMovements.length + 2),
        tenantId,
        productId,
        fromWarehouseId: null,
        toWarehouseId,
        userId: '1',
        type: 'TRANSFER_IN',
        quantity,
        unitCost: null,
        totalCost: null,
        reference,
        referenceType: 'transfer',
        notes: notes || null,
        createdAt: new Date().toISOString(),
      };

      mockMovements.push(transferOut, transferIn);

      return reply.status(201).send({
        success: true,
        data: [transferOut, transferIn],
      });
    }
  );

  /**
   * GET /api/v1/inventory/low-stock
   * Get items below reorder point
   */
  fastify.get<{
    Reply: ApiResponse<InventoryItem[]>;
  }>(
    '/low-stock',
    {
      schema: {
        description: 'Get items below reorder point',
        tags: ['Inventory'],
        security: [{ bearerAuth: [] }],
      } as any,
    },
    async (request, reply) => {
      const tenantId = getTenantId(request);

      const lowStock = mockInventoryItems.filter(
        (i) =>
          i.tenantId === tenantId &&
          i.product &&
          i.quantity <= i.product.reorderPoint
      );

      return reply.send({
        success: true,
        data: lowStock,
      });
    }
  );
}
