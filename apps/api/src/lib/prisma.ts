/**
 * Re-export Prisma client and utilities from @erp/database package
 */
export { prisma, createTenantClient, disconnect, healthCheck } from '@erp/database';
export type { TenantPrismaClient } from '@erp/database';

