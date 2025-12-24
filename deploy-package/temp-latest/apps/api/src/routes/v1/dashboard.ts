import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../lib/prisma.js';
import { sendSuccess } from '../../lib/response.js';
import { logger } from '../../lib/logger.js';

/**
 * Dashboard Routes
 * Provides statistics and metrics for the dashboard
 */
export async function dashboardRoutes(fastify: FastifyInstance) {
    // GET /api/v1/dashboard/stats - Dashboard overview statistics
    fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const tenantId = request.tenantId;

            // Get date ranges
            const now = new Date();
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            const startOfThisWeek = new Date(now);
            startOfThisWeek.setDate(now.getDate() - now.getDay());

            // Calculate current period stats
            // Total revenue from paid invoices this month
            const thisMonthRevenue = await db.invoice.aggregate({
                where: {
                    tenantId,
                    status: 'PAID',
                    paidDate: { gte: startOfThisMonth },
                },
                _sum: { total: true },
            });

            // Last month revenue for comparison
            const lastMonthRevenue = await db.invoice.aggregate({
                where: {
                    tenantId,
                    status: 'PAID',
                    paidDate: { gte: startOfLastMonth, lte: endOfLastMonth },
                },
                _sum: { total: true },
            });

            // Order counts (SALES type orders)
            const thisMonthOrders = await db.order.count({
                where: {
                    tenantId,
                    type: 'SALES',
                    createdAt: { gte: startOfThisMonth },
                },
            });

            const lastMonthOrders = await db.order.count({
                where: {
                    tenantId,
                    type: 'SALES',
                    createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
                },
            });

            // Product counts
            const totalProducts = await db.product.count({
                where: { tenantId, status: 'ACTIVE' },
            });

            const lastMonthProducts = await db.product.count({
                where: {
                    tenantId,
                    status: 'ACTIVE',
                    createdAt: { lt: startOfThisMonth },
                },
            });

            // Customer counts
            const totalCustomers = await db.customer.count({
                where: { tenantId },
            });

            const customersLastWeek = await db.customer.count({
                where: {
                    tenantId,
                    createdAt: { lt: startOfThisWeek },
                },
            });

            // Financial stats
            const paymentsReceived = await db.invoice.aggregate({
                where: {
                    tenantId,
                    status: 'PAID',
                    paidDate: { gte: startOfThisMonth },
                },
                _sum: { total: true },
            });

            const outstandingInvoices = await db.invoice.aggregate({
                where: {
                    tenantId,
                    status: { in: ['PENDING', 'OVERDUE'] },
                },
                _sum: { total: true },
            });

            // Inventory value
            const inventoryItems = await db.inventoryItem.findMany({
                where: { tenantId },
                select: {
                    quantity: true,
                    costPrice: true,
                },
            });

            const inventoryValue = inventoryItems.reduce((sum, item) => {
                return sum + (item.quantity * (item.costPrice?.toNumber() || 0));
            }, 0);

            // Calculate percentage changes
            const currentRevenue = thisMonthRevenue._sum.total?.toNumber() || 0;
            const prevRevenue = lastMonthRevenue._sum.total?.toNumber() || 0;
            const revenueChange = prevRevenue > 0
                ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
                : 0;

            const ordersChange = lastMonthOrders > 0
                ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
                : 0;

            const productsChange = lastMonthProducts > 0
                ? ((totalProducts - lastMonthProducts) / lastMonthProducts) * 100
                : 0;

            const customersChange = customersLastWeek > 0
                ? ((totalCustomers - customersLastWeek) / customersLastWeek) * 100
                : 0;

            // Average order value
            const avgOrderValue = thisMonthOrders > 0
                ? currentRevenue / thisMonthOrders
                : 0;

            const stats = {
                // Current period stats
                totalRevenue: currentRevenue,
                orderCount: thisMonthOrders,
                productCount: totalProducts,
                customerCount: totalCustomers,
                // Percentage changes
                revenueChange: Math.round(revenueChange * 10) / 10,
                ordersChange: Math.round(ordersChange * 10) / 10,
                productsChange: Math.round(productsChange * 10) / 10,
                customersChange: Math.round(customersChange * 10) / 10,
                // Financial stats
                paymentsReceived: paymentsReceived._sum.total?.toNumber() || 0,
                outstanding: outstandingInvoices._sum.total?.toNumber() || 0,
                avgOrderValue: Math.round(avgOrderValue * 100) / 100,
                inventoryValue,
                // Financial change percentages (simplified for now)
                paymentsReceivedChange: Math.round(revenueChange * 10) / 10,
                outstandingChange: 0,
                avgOrderValueChange: 0,
                inventoryValueChange: 0,
            };

            return sendSuccess(reply, stats);
        } catch (error) {
            logger.error('Failed to fetch dashboard stats', { error });
            throw error;
        }
    });

    // GET /api/v1/dashboard/sales-chart - Monthly sales data
    fastify.get('/sales-chart', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const tenantId = request.tenantId;

            // Get last 12 months of data
            const months: { name: string; sales: number; orders: number }[] = [];
            const now = new Date();

            for (let i = 11; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                const monthName = monthDate.toLocaleString('en', { month: 'short' });

                const sales = await db.invoice.aggregate({
                    where: {
                        tenantId,
                        status: 'PAID',
                        paidDate: { gte: monthDate, lte: monthEnd },
                    },
                    _sum: { total: true },
                });

                const orders = await db.order.count({
                    where: {
                        tenantId,
                        type: 'SALES',
                        createdAt: { gte: monthDate, lte: monthEnd },
                    },
                });

                months.push({
                    name: monthName,
                    sales: sales._sum.total?.toNumber() || 0,
                    orders,
                });
            }

            return sendSuccess(reply, months);
        } catch (error) {
            logger.error('Failed to fetch sales chart data', { error });
            throw error;
        }
    });

    // GET /api/v1/dashboard/revenue-trend - Daily revenue for the week
    fastify.get('/revenue-trend', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const tenantId = request.tenantId;

            const days: { name: string; revenue: number }[] = [];
            const now = new Date();
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            for (let i = 6; i >= 0; i--) {
                const dayDate = new Date(now);
                dayDate.setDate(now.getDate() - i);
                dayDate.setHours(0, 0, 0, 0);

                const dayEnd = new Date(dayDate);
                dayEnd.setHours(23, 59, 59, 999);

                const revenue = await db.invoice.aggregate({
                    where: {
                        tenantId,
                        status: 'PAID',
                        paidDate: { gte: dayDate, lte: dayEnd },
                    },
                    _sum: { total: true },
                });

                days.push({
                    name: daysOfWeek[dayDate.getDay()],
                    revenue: revenue._sum.total?.toNumber() || 0,
                });
            }

            return sendSuccess(reply, days);
        } catch (error) {
            logger.error('Failed to fetch revenue trend', { error });
            throw error;
        }
    });

    // GET /api/v1/dashboard/recent-orders - Recent orders
    fastify.get('/recent-orders', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const tenantId = request.tenantId;

            const orders = await db.order.findMany({
                where: {
                    tenantId,
                    type: 'SALES',
                },
                include: {
                    customer: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            });

            const recentOrders = orders.map(order => ({
                id: order.orderNumber,
                customer: order.customer?.name || 'Unknown',
                amount: `$${order.total.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                status: order.status.charAt(0) + order.status.slice(1).toLowerCase().replace(/_/g, ' '),
            }));

            return sendSuccess(reply, recentOrders);
        } catch (error) {
            logger.error('Failed to fetch recent orders', { error });
            throw error;
        }
    });

    // GET /api/v1/dashboard/low-stock - Low stock products
    fastify.get('/low-stock', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const tenantId = request.tenantId;

            // Get products with inventory and filter for low stock
            const inventoryItems = await db.inventoryItem.findMany({
                where: { tenantId },
                include: {
                    product: {
                        select: {
                            name: true,
                            sku: true,
                            reorderPoint: true,
                        }
                    },
                },
                orderBy: { quantity: 'asc' },
            });

            // Filter to items below reorder point
            const lowStockItems = inventoryItems
                .filter(item => item.quantity <= item.product.reorderPoint)
                .slice(0, 4);

            const products = lowStockItems.map(item => ({
                sku: item.product.sku,
                name: item.product.name,
                stock: item.quantity,
                reorder: item.product.reorderPoint,
            }));

            return sendSuccess(reply, products);
        } catch (error) {
            logger.error('Failed to fetch low stock items', { error });
            throw error;
        }
    });
}
