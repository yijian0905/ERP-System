import { PrismaClient, Prisma } from '../generated/prisma-client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter (required for Prisma 7.x with engine type 'client')
const adapter = new PrismaPg(pool);

// Global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Explicitly export Prisma namespace (required for ESM compatibility)
export { Prisma };

// Re-export Prisma types and enums
export * from '../generated/prisma-client';
export type { PrismaClient } from '../generated/prisma-client';

/**
 * Models that require tenant isolation
 * These models have tenant_id column and should be filtered by tenant
 */
export const TENANT_ISOLATED_MODELS = [
  'User',
  'Role',
  'Category',
  'Product',
  'Warehouse',
  'InventoryItem',
  'InventoryMovement',
  'Customer',
  'Supplier',
  'SupplierProduct',
  'Order',
  'OrderItem',
  'Invoice',
  'InvoiceItem',
  'Payment',
  'License',
  'AuditLog',
  // Additional models that require tenant isolation
  'Asset',
  'EInvoice',
  'EInvoiceItem',
  'EInvoiceLog',
  'LhdnToken',
  'LhdnCredential',
  'CurrencyRate',
  'RefreshToken',
] as const;

export type TenantIsolatedModel = (typeof TENANT_ISOLATED_MODELS)[number];

/**
 * Create a tenant-scoped Prisma client extension
 * This middleware automatically filters all queries by tenant_id
 */
export function createTenantClient(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }: any) {
          if (TENANT_ISOLATED_MODELS.includes(model as TenantIsolatedModel)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async findFirst({ model, args, query }: any) {
          if (TENANT_ISOLATED_MODELS.includes(model as TenantIsolatedModel)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async findUnique({ model, args, query }: any) {
          const result = await query(args);
          // Verify the result belongs to the tenant
          if (
            result &&
            TENANT_ISOLATED_MODELS.includes(model as TenantIsolatedModel) &&
            'tenantId' in result &&
            result.tenantId !== tenantId
          ) {
            return null;
          }
          return result;
        },
        async create({ model, args, query }: any) {
          if (TENANT_ISOLATED_MODELS.includes(model as TenantIsolatedModel)) {
            args.data = { ...args.data, tenantId };
          }
          return query(args);
        },
        async createMany({ model, args, query }: any) {
          if (TENANT_ISOLATED_MODELS.includes(model as TenantIsolatedModel)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item: any) => ({ ...item, tenantId }));
            } else {
              args.data = { ...args.data, tenantId };
            }
          }
          return query(args);
        },
        async update({ model, args, query }: any) {
          if (TENANT_ISOLATED_MODELS.includes(model as TenantIsolatedModel)) {
            // Add tenant filter to where clause
            args.where = { ...args.where, tenantId } as typeof args.where;
          }
          return query(args);
        },
        async updateMany({ model, args, query }: any) {
          if (TENANT_ISOLATED_MODELS.includes(model as TenantIsolatedModel)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async delete({ model, args, query }: any) {
          if (TENANT_ISOLATED_MODELS.includes(model as TenantIsolatedModel)) {
            args.where = { ...args.where, tenantId } as typeof args.where;
          }
          return query(args);
        },
        async deleteMany({ model, args, query }: any) {
          if (TENANT_ISOLATED_MODELS.includes(model as TenantIsolatedModel)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async count({ model, args, query }: any) {
          if (TENANT_ISOLATED_MODELS.includes(model as TenantIsolatedModel)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async aggregate({ model, args, query }: any) {
          if (TENANT_ISOLATED_MODELS.includes(model as TenantIsolatedModel)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async groupBy({ model, args, query }: any) {
          if (TENANT_ISOLATED_MODELS.includes(model as TenantIsolatedModel)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
      },
    },
  });
}

/**
 * Type for tenant-scoped client
 */
export type TenantPrismaClient = ReturnType<typeof createTenantClient>;

/**
 * Disconnect from database
 */
export async function disconnect() {
  await prisma.$disconnect();
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Soft delete helper - sets deletedAt timestamp instead of deleting
 */
export function softDelete() {
  return {
    deletedAt: new Date(),
  };
}

/**
 * Filter for non-deleted records
 */
export const notDeleted = {
  deletedAt: null,
};

/**
 * Generate a unique order/invoice number
 */
export function generateDocumentNumber(prefix: string, sequence: number): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const seq = sequence.toString().padStart(5, '0');
  return `${prefix}${year}${month}-${seq}`;
}
