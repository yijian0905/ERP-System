import type {
  ApiResponse,
  PaginationMeta,
} from '@erp/shared-types';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { getTenantId } from '../../middleware/auth.js';
import { authRouteOptions } from '../../types/fastify-schema.js';

// Types
type ActionType = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export' | 'print' | 'approve' | 'reject';
type EntityType = 'product' | 'customer' | 'supplier' | 'order' | 'invoice' | 'payment' | 'inventory' | 'user' | 'settings' | 'warehouse' | 'asset';

interface AuditLog {
  id: string;
  tenantId: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: ActionType;
  entityType: EntityType;
  entityId: string | null;
  entityName: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedFields: string[] | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  duration: number | null;
  createdAt: string;
}

// Validation schemas
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  action: z.enum(['create', 'update', 'delete', 'login', 'logout', 'view', 'export', 'print', 'approve', 'reject']).optional(),
  entityType: z.enum(['product', 'customer', 'supplier', 'order', 'invoice', 'payment', 'inventory', 'user', 'settings', 'warehouse', 'asset']).optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Mock data
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '1',
    userName: 'Admin User',
    userEmail: 'admin@demo-company.com',
    action: 'update',
    entityType: 'product',
    entityId: 'prod-001',
    entityName: 'Wireless Mouse',
    oldValues: { price: 29.99, stock: 100 },
    newValues: { price: 34.99, stock: 150 },
    changedFields: ['price', 'stock'],
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    requestId: 'req-abc123',
    duration: 45,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: '2',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '2',
    userName: 'Manager User',
    userEmail: 'manager@demo-company.com',
    action: 'create',
    entityType: 'order',
    entityId: 'SO-2312-00045',
    entityName: 'Sales Order #SO-2312-00045',
    oldValues: null,
    newValues: { customerId: 'cust-001', total: 1250.00, items: 5 },
    changedFields: null,
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    requestId: 'req-def456',
    duration: 120,
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '1',
    userName: 'Admin User',
    userEmail: 'admin@demo-company.com',
    action: 'login',
    entityType: 'user',
    entityId: '1',
    entityName: 'Admin User',
    oldValues: null,
    newValues: { method: 'password' },
    changedFields: null,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    requestId: 'req-ghi789',
    duration: 15,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: '4',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '3',
    userName: 'Sales Rep',
    userEmail: 'sales@demo-company.com',
    action: 'print',
    entityType: 'invoice',
    entityId: 'INV-2312-00089',
    entityName: 'Invoice #INV-2312-00089',
    oldValues: null,
    newValues: { printedAt: new Date(Date.now() - 90000000).toISOString() },
    changedFields: null,
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    requestId: 'req-jkl012',
    duration: 250,
    createdAt: new Date(Date.now() - 90000000).toISOString(),
  },
  {
    id: '5',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '2',
    userName: 'Manager User',
    userEmail: 'manager@demo-company.com',
    action: 'delete',
    entityType: 'customer',
    entityId: 'cust-005',
    entityName: 'Inactive Customer Inc.',
    oldValues: { name: 'Inactive Customer Inc.', email: 'contact@inactive.com', status: 'inactive' },
    newValues: null,
    changedFields: null,
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    requestId: 'req-mno345',
    duration: 35,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
  {
    id: '6',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '4',
    userName: 'Warehouse Staff',
    userEmail: 'warehouse@demo-company.com',
    action: 'update',
    entityType: 'inventory',
    entityId: 'inv-item-001',
    entityName: 'Stock Adjustment - Wireless Mouse',
    oldValues: { quantity: 150 },
    newValues: { quantity: 145, reason: 'Damaged goods' },
    changedFields: ['quantity'],
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    requestId: 'req-pqr678',
    duration: 28,
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
  },
  {
    id: '7',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '1',
    userName: 'Admin User',
    userEmail: 'admin@demo-company.com',
    action: 'approve',
    entityType: 'order',
    entityId: 'PO-2312-00012',
    entityName: 'Purchase Order #PO-2312-00012',
    oldValues: { status: 'pending' },
    newValues: { status: 'approved', approvedBy: 'Admin User' },
    changedFields: ['status', 'approvedBy'],
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    requestId: 'req-stu901',
    duration: 18,
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
  },
  {
    id: '8',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    userId: null,
    userName: 'System',
    userEmail: null,
    action: 'export',
    entityType: 'settings',
    entityId: null,
    entityName: 'System Backup',
    oldValues: null,
    newValues: { exportType: 'full', format: 'json' },
    changedFields: null,
    ipAddress: null,
    userAgent: null,
    requestId: 'req-vwx234',
    duration: 5200,
    createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
  },
  {
    id: '9',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '2',
    userName: 'Manager User',
    userEmail: 'manager@demo-company.com',
    action: 'logout',
    entityType: 'user',
    entityId: '2',
    entityName: 'Manager User',
    oldValues: null,
    newValues: null,
    changedFields: null,
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    requestId: 'req-yza567',
    duration: 8,
    createdAt: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
  },
  {
    id: '10',
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '1',
    userName: 'Admin User',
    userEmail: 'admin@demo-company.com',
    action: 'create',
    entityType: 'warehouse',
    entityId: 'wh-003',
    entityName: 'Secondary Warehouse',
    oldValues: null,
    newValues: { code: 'WH-003', name: 'Secondary Warehouse', location: 'Building B' },
    changedFields: null,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    requestId: 'req-bcd890',
    duration: 65,
    createdAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
  },
];

export async function auditRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/audit
   * List audit logs with pagination and filters
   */
  fastify.get<{
    Querystring: z.infer<typeof paginationSchema>;
    Reply: ApiResponse<AuditLog[]>;
  }>(
    '/',
    authRouteOptions('List all audit logs with pagination and filters', ['Audit']),
    async (request, reply) => {
      const params = paginationSchema.parse(request.query);
      const tenantId = getTenantId(request);

      let filteredLogs = mockAuditLogs.filter((l) => l.tenantId === tenantId);

      // Filter by search
      if (params.search) {
        const search = params.search.toLowerCase();
        filteredLogs = filteredLogs.filter(
          (l) =>
            l.userName?.toLowerCase().includes(search) ||
            l.entityName?.toLowerCase().includes(search) ||
            l.entityId?.toLowerCase().includes(search) ||
            l.ipAddress?.toLowerCase().includes(search)
        );
      }

      // Filter by action
      if (params.action) {
        filteredLogs = filteredLogs.filter((l) => l.action === params.action);
      }

      // Filter by entity type
      if (params.entityType) {
        filteredLogs = filteredLogs.filter((l) => l.entityType === params.entityType);
      }

      // Filter by user
      if (params.userId) {
        filteredLogs = filteredLogs.filter((l) => l.userId === params.userId);
      }

      // Filter by date range
      if (params.startDate) {
        const startDate = new Date(params.startDate);
        filteredLogs = filteredLogs.filter((l) => new Date(l.createdAt) >= startDate);
      }
      if (params.endDate) {
        const endDate = new Date(params.endDate);
        filteredLogs = filteredLogs.filter((l) => new Date(l.createdAt) <= endDate);
      }

      // Sort
      filteredLogs.sort((a, b) => {
        const order = params.sortOrder === 'asc' ? 1 : -1;
        if (params.sortBy === 'createdAt') {
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order;
        }
        return 0;
      });

      const total = filteredLogs.length;
      const start = (params.page - 1) * params.limit;
      const paginatedLogs = filteredLogs.slice(start, start + params.limit);

      const meta: PaginationMeta = {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      };

      return reply.send({
        success: true,
        data: paginatedLogs,
        meta,
      });
    }
  );

  /**
   * GET /api/v1/audit/:id
   * Get single audit log
   */
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<AuditLog>;
  }>(
    '/:id',
    authRouteOptions('Get an audit log by ID', ['Audit']),
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      const tenantId = getTenantId(request);

      const log = mockAuditLogs.find((l) => l.id === id && l.tenantId === tenantId);

      if (!log) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Audit log not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: log,
      });
    }
  );

  /**
   * GET /api/v1/audit/stats
   * Get audit log statistics
   */
  fastify.get<{
    Reply: ApiResponse<{
      totalLogs: number;
      todayLogs: number;
      uniqueUsers: number;
      criticalActions: number;
      actionBreakdown: Record<string, number>;
      entityBreakdown: Record<string, number>;
    }>;
  }>(
    '/stats',
    authRouteOptions('Get audit log statistics', ['Audit']),
    async (request, reply) => {
      const tenantId = getTenantId(request);
      const filteredLogs = mockAuditLogs.filter((l) => l.tenantId === tenantId);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayLogs = filteredLogs.filter((l) => new Date(l.createdAt) >= today).length;
      const uniqueUsers = new Set(filteredLogs.filter((l) => l.userId).map((l) => l.userId)).size;
      const criticalActions = filteredLogs.filter((l) =>
        ['delete', 'approve', 'reject'].includes(l.action)
      ).length;

      const actionBreakdown: Record<string, number> = {};
      const entityBreakdown: Record<string, number> = {};

      filteredLogs.forEach((log) => {
        actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
        entityBreakdown[log.entityType] = (entityBreakdown[log.entityType] || 0) + 1;
      });

      return reply.send({
        success: true,
        data: {
          totalLogs: filteredLogs.length,
          todayLogs,
          uniqueUsers,
          criticalActions,
          actionBreakdown,
          entityBreakdown,
        },
      });
    }
  );

  /**
   * GET /api/v1/audit/export
   * Export audit logs as CSV
   */
  fastify.get<{
    Querystring: z.infer<typeof paginationSchema>;
  }>(
    '/export',
    authRouteOptions('Export audit logs as CSV', ['Audit']),
    async (request, reply) => {
      const params = paginationSchema.parse(request.query);
      const tenantId = getTenantId(request);

      let filteredLogs = mockAuditLogs.filter((l) => l.tenantId === tenantId);

      // Apply filters (same as list endpoint)
      if (params.action) {
        filteredLogs = filteredLogs.filter((l) => l.action === params.action);
      }
      if (params.entityType) {
        filteredLogs = filteredLogs.filter((l) => l.entityType === params.entityType);
      }
      if (params.startDate) {
        const startDate = new Date(params.startDate);
        filteredLogs = filteredLogs.filter((l) => new Date(l.createdAt) >= startDate);
      }
      if (params.endDate) {
        const endDate = new Date(params.endDate);
        filteredLogs = filteredLogs.filter((l) => new Date(l.createdAt) <= endDate);
      }

      // Generate CSV
      const headers = ['ID', 'Timestamp', 'User', 'Email', 'Action', 'Entity Type', 'Entity ID', 'Entity Name', 'IP Address', 'Duration (ms)'];
      const rows = filteredLogs.map((log) => [
        log.id,
        log.createdAt,
        log.userName || 'System',
        log.userEmail || '-',
        log.action,
        log.entityType,
        log.entityId || '-',
        log.entityName || '-',
        log.ipAddress || '-',
        log.duration?.toString() || '-',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);

      return reply.send(csvContent);
    }
  );
}


