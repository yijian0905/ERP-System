import type {
  ApiResponse,
  CreateRoleRequest,
  PaginationMeta,
  PermissionRecord,
  RoleWithPermissions,
  UpdateRoleRequest,
} from '@erp/shared-types';
import { ALL_PERMISSION_CODES, PERMISSION_MODULES } from '@erp/shared-types';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { getTenantId, hasPermission } from '../../middleware/auth.js';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { authRouteOptions } from '../../types/fastify-schema.js';

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  displayName: z.string().min(1, 'Display name is required').max(255),
  description: z.string().max(1000).optional(),
  color: z.string().max(20).optional(),
  permissionIds: z.array(z.string().uuid()).min(1, 'At least one permission is required'),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  permissionIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

// Default system roles that will be created for each tenant
const DEFAULT_SYSTEM_ROLES = [
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full access to all system features',
    color: 'red',
    isSystem: true,
    permissionCodes: ALL_PERMISSION_CODES,
  },
  {
    name: 'manager',
    displayName: 'Manager',
    description: 'Can manage operations but cannot modify system settings',
    color: 'blue',
    isSystem: true,
    permissionCodes: ALL_PERMISSION_CODES.filter(
      (p) => !p.startsWith('roles:') && !p.startsWith('settings:') && p !== 'audit:view'
    ),
  },
  {
    name: 'user',
    displayName: 'Standard User',
    description: 'Basic access for day-to-day operations',
    color: 'green',
    isSystem: true,
    permissionCodes: [
      'products:view',
      'inventory:view',
      'customers:view',
      'customers:create',
      'suppliers:view',
      'orders:view',
      'orders:create',
      'invoices:view',
      'invoices:create',
      'payments:view',
      'reports:view',
    ],
  },
  {
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access to the system',
    color: 'gray',
    isSystem: true,
    permissionCodes: ALL_PERMISSION_CODES.filter((p) => p.endsWith(':view')),
  },
];

// Predefined role templates for quick creation
const ROLE_TEMPLATES = {
  warehouse_manager: {
    displayName: 'Warehouse Manager',
    description: 'Manages inventory and warehouse operations',
    color: 'orange',
    permissionCodes: [
      'products:view',
      'inventory:view',
      'inventory:adjust',
      'inventory:transfer',
      'suppliers:view',
      'orders:view',
      'reports:view',
    ],
  },
  hr_manager: {
    displayName: 'HR Manager',
    description: 'Manages users and access permissions',
    color: 'purple',
    permissionCodes: [
      'users:view',
      'users:create',
      'users:update',
      'roles:view',
      'audit:view',
      'settings:view',
    ],
  },
  sales_rep: {
    displayName: 'Sales Representative',
    description: 'Handles sales orders and customer relationships',
    color: 'cyan',
    permissionCodes: [
      'products:view',
      'inventory:view',
      'customers:view',
      'customers:create',
      'customers:update',
      'orders:view',
      'orders:create',
      'orders:update',
      'invoices:view',
      'invoices:create',
      'payments:view',
      'reports:view',
    ],
  },
  accountant: {
    displayName: 'Accountant',
    description: 'Manages invoices, payments, and financial reports',
    color: 'teal',
    permissionCodes: [
      'customers:view',
      'invoices:view',
      'invoices:create',
      'invoices:update',
      'invoices:send',
      'payments:view',
      'payments:create',
      'payments:update',
      'reports:view',
      'reports:export',
    ],
  },
  purchasing_officer: {
    displayName: 'Purchasing Officer',
    description: 'Handles supplier relationships and purchase orders',
    color: 'indigo',
    permissionCodes: [
      'products:view',
      'inventory:view',
      'suppliers:view',
      'suppliers:create',
      'suppliers:update',
      'orders:view',
      'orders:create',
      'orders:update',
      'reports:view',
    ],
  },
};

export async function rolesRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/roles
   * List roles with pagination
   */
  fastify.get<{
    Querystring: z.infer<typeof paginationSchema>;
    Reply: ApiResponse<RoleWithPermissions[]>;
  }>(
    '/',
    authRouteOptions('List all roles with their permissions', ['Roles']),
    async (request, reply) => {
      // Check permission
      if (!hasPermission(request, 'roles:view')) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view roles',
          },
        });
      }

      const params = paginationSchema.parse(request.query);
      const tenantId = getTenantId(request);

      try {
        const where: Record<string, unknown> = {
          tenantId,
          deletedAt: null,
        };

        if (params.search) {
          where.OR = [
            { name: { contains: params.search, mode: 'insensitive' } },
            { displayName: { contains: params.search, mode: 'insensitive' } },
          ];
        }

        if (params.isActive !== undefined) {
          where.isActive = params.isActive;
        }

        const [roles, total] = await Promise.all([
          prisma.role.findMany({
            where,
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
              _count: {
                select: { users: true },
              },
            },
            orderBy: [
              { isSystem: 'desc' },
              { createdAt: 'asc' },
            ],
            skip: (params.page - 1) * params.limit,
            take: params.limit,
          }),
          prisma.role.count({ where }),
        ]);

        const meta: PaginationMeta = {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit),
        };

        // Transform to include user count
        const rolesWithCount = roles.map((role) => ({
          ...role,
          userCount: role._count.users,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt.toISOString(),
          deletedAt: role.deletedAt?.toISOString() || null,
          permissions: role.permissions.map((rp) => ({
            ...rp,
            createdAt: rp.createdAt.toISOString(),
            permission: rp.permission
              ? {
                ...rp.permission,
                createdAt: rp.permission.createdAt.toISOString(),
              }
              : undefined,
          })),
        }));

        return reply.send({
          success: true,
          data: rolesWithCount as unknown as RoleWithPermissions[],
          meta,
        });
      } catch (error) {
        logger.error('Failed to fetch roles', { error, tenantId });
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch roles',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/roles/permissions
   * List all available permissions
   */
  fastify.get<{
    Reply: ApiResponse<{
      modules: typeof PERMISSION_MODULES;
      permissions: PermissionRecord[];
    }>;
  }>(
    '/permissions',
    authRouteOptions('List all available permissions grouped by module', ['Roles']),
    async (request, reply) => {
      if (!hasPermission(request, 'roles:view')) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view permissions',
          },
        });
      }

      try {
        const permissions = await prisma.permission.findMany({
          orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }],
        });

        return reply.send({
          success: true,
          data: {
            modules: PERMISSION_MODULES,
            permissions: permissions.map((p) => ({
              ...p,
              createdAt: p.createdAt.toISOString(),
            })),
          },
        });
      } catch (error) {
        logger.error('Failed to fetch permissions', { error });
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch permissions',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/roles/templates
   * Get predefined role templates
   */
  fastify.get<{
    Reply: ApiResponse<typeof ROLE_TEMPLATES>;
  }>(
    '/templates',
    authRouteOptions('Get predefined role templates for quick creation', ['Roles']),
    async (request, reply) => {
      if (!hasPermission(request, 'roles:view')) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view role templates',
          },
        });
      }

      return reply.send({
        success: true,
        data: ROLE_TEMPLATES,
      });
    }
  );

  /**
   * GET /api/v1/roles/:id
   * Get single role with permissions
   */
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<RoleWithPermissions>;
  }>(
    '/:id',
    authRouteOptions('Get a role by ID with its permissions', ['Roles']),
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      if (!hasPermission(request, 'roles:view')) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view roles',
          },
        });
      }

      const { id } = request.params;
      const tenantId = getTenantId(request);

      try {
        const role = await prisma.role.findFirst({
          where: {
            id,
            tenantId,
            deletedAt: null,
          },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
            _count: {
              select: { users: true },
            },
          },
        });

        if (!role) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Role not found',
            },
          });
        }

        return reply.send({
          success: true,
          data: {
            ...role,
            userCount: role._count.users,
            createdAt: role.createdAt.toISOString(),
            updatedAt: role.updatedAt.toISOString(),
            deletedAt: role.deletedAt?.toISOString() || null,
            permissions: role.permissions.map((rp) => ({
              ...rp,
              createdAt: rp.createdAt.toISOString(),
              permission: rp.permission
                ? {
                  ...rp.permission,
                  createdAt: rp.permission.createdAt.toISOString(),
                }
                : undefined,
            })),
          } as unknown as RoleWithPermissions,
        });
      } catch (error) {
        logger.error('Failed to fetch role', { error, id, tenantId });
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch role',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/roles
   * Create new role
   */
  fastify.post<{
    Body: CreateRoleRequest;
    Reply: ApiResponse<RoleWithPermissions>;
  }>(
    '/',
    authRouteOptions('Create a new custom role', ['Roles']),
    async (request, reply) => {
      if (!hasPermission(request, 'roles:create')) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to create roles',
          },
        });
      }

      const validation = createRoleSchema.safeParse(request.body);
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
      const { name, displayName, description, color, permissionIds } = validation.data;

      try {
        // Check if role name already exists
        const existingRole = await prisma.role.findFirst({
          where: {
            tenantId,
            name: name.toLowerCase().replace(/\s+/g, '_'),
            deletedAt: null,
          },
        });

        if (existingRole) {
          return reply.status(409).send({
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'A role with this name already exists',
            },
          });
        }

        // Verify all permission IDs exist
        const permissions = await prisma.permission.findMany({
          where: { id: { in: permissionIds } },
        });

        if (permissions.length !== permissionIds.length) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'One or more permission IDs are invalid',
            },
          });
        }

        // Create role with permissions
        const role = await prisma.role.create({
          data: {
            tenantId,
            name: name.toLowerCase().replace(/\s+/g, '_'),
            displayName,
            description,
            color,
            isSystem: false,
            permissions: {
              create: permissionIds.map((permissionId) => ({
                permissionId,
              })),
            },
          },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        });

        logger.info('Role created', { roleId: role.id, tenantId, name });

        return reply.status(201).send({
          success: true,
          data: {
            ...role,
            createdAt: role.createdAt.toISOString(),
            updatedAt: role.updatedAt.toISOString(),
            deletedAt: role.deletedAt?.toISOString() || null,
            permissions: role.permissions.map((rp) => ({
              ...rp,
              createdAt: rp.createdAt.toISOString(),
              permission: rp.permission
                ? {
                  ...rp.permission,
                  createdAt: rp.permission.createdAt.toISOString(),
                }
                : undefined,
            })),
          } as unknown as RoleWithPermissions,
        });
      } catch (error) {
        logger.error('Failed to create role', { error, tenantId });
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create role',
          },
        });
      }
    }
  );

  /**
   * PATCH /api/v1/roles/:id
   * Update role
   */
  fastify.patch<{
    Params: { id: string };
    Body: UpdateRoleRequest;
    Reply: ApiResponse<RoleWithPermissions>;
  }>(
    '/:id',
    authRouteOptions('Update a role', ['Roles']),
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateRoleRequest }>,
      reply: FastifyReply
    ) => {
      if (!hasPermission(request, 'roles:update')) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update roles',
          },
        });
      }

      const { id } = request.params;
      const tenantId = getTenantId(request);

      const validation = updateRoleSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
          },
        });
      }

      try {
        // Check if role exists
        const existingRole = await prisma.role.findFirst({
          where: { id, tenantId, deletedAt: null },
        });

        if (!existingRole) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Role not found',
            },
          });
        }

        // System roles can only have permissions updated, not name/displayName
        if (existingRole.isSystem && (validation.data.name || validation.data.displayName)) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Cannot modify name of system roles',
            },
          });
        }

        const { permissionIds, ...updateData } = validation.data;

        // If name is being updated, normalize it
        if (updateData.name) {
          updateData.name = updateData.name.toLowerCase().replace(/\s+/g, '_');

          // Check for name conflict
          const nameConflict = await prisma.role.findFirst({
            where: {
              tenantId,
              name: updateData.name,
              id: { not: id },
              deletedAt: null,
            },
          });

          if (nameConflict) {
            return reply.status(409).send({
              success: false,
              error: {
                code: 'CONFLICT',
                message: 'A role with this name already exists',
              },
            });
          }
        }

        // Update role and permissions in a transaction
        const role = await prisma.$transaction(async (tx) => {
          // Update role fields
          await tx.role.update({
            where: { id },
            data: updateData,
          });

          // Update permissions if provided
          if (permissionIds) {
            // Delete existing permissions
            await tx.rolePermission.deleteMany({
              where: { roleId: id },
            });

            // Create new permissions
            await tx.rolePermission.createMany({
              data: permissionIds.map((permissionId) => ({
                roleId: id,
                permissionId,
              })),
            });
          }

          // Fetch updated role with permissions
          return tx.role.findUnique({
            where: { id },
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          });
        });

        if (!role) {
          throw new Error('Failed to update role');
        }

        logger.info('Role updated', { roleId: id, tenantId });

        return reply.send({
          success: true,
          data: {
            ...role,
            createdAt: role.createdAt.toISOString(),
            updatedAt: role.updatedAt.toISOString(),
            deletedAt: role.deletedAt?.toISOString() || null,
            permissions: role.permissions.map((rp) => ({
              ...rp,
              createdAt: rp.createdAt.toISOString(),
              permission: rp.permission
                ? {
                  ...rp.permission,
                  createdAt: rp.permission.createdAt.toISOString(),
                }
                : undefined,
            })),
          } as unknown as RoleWithPermissions,
        });
      } catch (error) {
        logger.error('Failed to update role', { error, id, tenantId });
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update role',
          },
        });
      }
    }
  );

  /**
   * DELETE /api/v1/roles/:id
   * Delete role (soft delete)
   */
  fastify.delete<{
    Params: { id: string };
    Reply: ApiResponse<{ message: string }>;
  }>(
    '/:id',
    authRouteOptions('Delete a custom role (soft delete)', ['Roles']),
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      if (!hasPermission(request, 'roles:delete')) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete roles',
          },
        });
      }

      const { id } = request.params;
      const tenantId = getTenantId(request);

      try {
        const role = await prisma.role.findFirst({
          where: { id, tenantId, deletedAt: null },
          include: {
            _count: { select: { users: true } },
          },
        });

        if (!role) {
          return reply.status(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Role not found',
            },
          });
        }

        if (role.isSystem) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Cannot delete system roles',
            },
          });
        }

        if (role._count.users > 0) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Cannot delete role with ${role._count.users} assigned user(s). Please reassign users first.`,
            },
          });
        }

        // Soft delete
        await prisma.role.update({
          where: { id },
          data: { deletedAt: new Date(), isActive: false },
        });

        logger.info('Role deleted', { roleId: id, tenantId });

        return reply.send({
          success: true,
          data: { message: 'Role deleted successfully' },
        });
      } catch (error) {
        logger.error('Failed to delete role', { error, id, tenantId });
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete role',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/roles/from-template
   * Create role from template
   */
  fastify.post<{
    Body: { templateKey: string; name?: string; displayName?: string };
    Reply: ApiResponse<RoleWithPermissions>;
  }>(
    '/from-template',
    authRouteOptions('Create a new role from a predefined template', ['Roles']),
    async (request, reply) => {
      if (!hasPermission(request, 'roles:create')) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to create roles',
          },
        });
      }

      const { templateKey, name, displayName } = request.body as {
        templateKey: keyof typeof ROLE_TEMPLATES;
        name?: string;
        displayName?: string;
      };

      const template = ROLE_TEMPLATES[templateKey];
      if (!template) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid template key',
          },
        });
      }

      const tenantId = getTenantId(request);
      const roleName = name || templateKey;
      const roleDisplayName = displayName || template.displayName;

      try {
        // Check if role name already exists
        const existingRole = await prisma.role.findFirst({
          where: { tenantId, name: roleName, deletedAt: null },
        });

        if (existingRole) {
          return reply.status(409).send({
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'A role with this name already exists',
            },
          });
        }

        // Get permission IDs from codes
        const permissions = await prisma.permission.findMany({
          where: { code: { in: template.permissionCodes } },
        });

        const role = await prisma.role.create({
          data: {
            tenantId,
            name: roleName,
            displayName: roleDisplayName,
            description: template.description,
            color: template.color,
            isSystem: false,
            permissions: {
              create: permissions.map((p) => ({
                permissionId: p.id,
              })),
            },
          },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        });

        logger.info('Role created from template', {
          roleId: role.id,
          tenantId,
          templateKey,
        });

        return reply.status(201).send({
          success: true,
          data: {
            ...role,
            createdAt: role.createdAt.toISOString(),
            updatedAt: role.updatedAt.toISOString(),
            deletedAt: role.deletedAt?.toISOString() || null,
            permissions: role.permissions.map((rp) => ({
              ...rp,
              createdAt: rp.createdAt.toISOString(),
              permission: rp.permission
                ? {
                  ...rp.permission,
                  createdAt: rp.permission.createdAt.toISOString(),
                }
                : undefined,
            })),
          } as unknown as RoleWithPermissions,
        });
      } catch (error) {
        logger.error('Failed to create role from template', { error, tenantId, templateKey });
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create role from template',
          },
        });
      }
    }
  );
}

// Export default system roles for seeding
export { DEFAULT_SYSTEM_ROLES, ROLE_TEMPLATES };

