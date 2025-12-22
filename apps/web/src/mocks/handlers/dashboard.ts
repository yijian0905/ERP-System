/**
 * Dashboard MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockDashboardStats, mockSalesChartData, mockTopProducts, mockRecentOrders } from '../data/dashboard';

export const dashboardHandlers = [
    // GET /api/v1/dashboard/stats
    http.get('/api/v1/dashboard/stats', () => {
        return HttpResponse.json({
            success: true,
            data: mockDashboardStats,
        });
    }),

    // GET /api/v1/dashboard/sales-chart
    http.get('/api/v1/dashboard/sales-chart', () => {
        return HttpResponse.json({
            success: true,
            data: mockSalesChartData,
        });
    }),

    // GET /api/v1/dashboard/top-products
    http.get('/api/v1/dashboard/top-products', () => {
        return HttpResponse.json({
            success: true,
            data: mockTopProducts,
        });
    }),

    // GET /api/v1/dashboard/recent-orders
    http.get('/api/v1/dashboard/recent-orders', () => {
        return HttpResponse.json({
            success: true,
            data: mockRecentOrders,
        });
    }),
];
