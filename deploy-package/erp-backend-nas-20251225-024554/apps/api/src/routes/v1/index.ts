import type { FastifyInstance } from 'fastify';

import { authMiddlewareAsync } from '../../middleware/auth.js';
import { licenseMiddleware } from '../../middleware/license.js';
import { auditRoutes } from './audit.js';
import { companyRoutes } from './company.js';
import { currenciesRoutes } from './currencies.js';
import { customersRoutes } from './customers.js';
import { dashboardRoutes } from './dashboard.js';
import { einvoicesRoutes } from './einvoices.js';
import { forecastingRoutes } from './forecasting.js';
import { inventoryRoutes } from './inventory.js';
import { printAuditRoutes } from './print-audit.js';
import { productsRoutes } from './products.js';
import { rolesRoutes } from './roles.js';
import { suppliersRoutes } from './suppliers.js';
import { warehousesRoutes } from './warehouses.js';

export async function v1Routes(fastify: FastifyInstance) {
  // Authentication middleware for all v1 routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authMiddlewareAsync(request, reply);
  });

  // License validation middleware (runs after auth)
  fastify.addHook('preHandler', async (request, reply) => {
    await licenseMiddleware(request, reply);
  });

  // Register all v1 routes
  await fastify.register(productsRoutes, { prefix: '/products' });
  await fastify.register(customersRoutes, { prefix: '/customers' });
  await fastify.register(inventoryRoutes, { prefix: '/inventory' });
  await fastify.register(auditRoutes, { prefix: '/audit' });
  await fastify.register(rolesRoutes, { prefix: '/roles' });
  await fastify.register(einvoicesRoutes, { prefix: '/einvoices' });
  await fastify.register(currenciesRoutes, { prefix: '/currencies' });
  await fastify.register(forecastingRoutes, { prefix: '/forecasting' });
  await fastify.register(printAuditRoutes, { prefix: '/print-audit' });
  await fastify.register(companyRoutes, { prefix: '/company' });
  await fastify.register(dashboardRoutes, { prefix: '/dashboard' });
  await fastify.register(suppliersRoutes, { prefix: '/suppliers' });
  await fastify.register(warehousesRoutes, { prefix: '/warehouses' });
}


