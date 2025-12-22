/**
 * Reports MSW Handlers
 */
import { http, HttpResponse } from 'msw';
import { mockSalesReport, mockInventoryReport, mockFinancialReport, mockCostAccountingReport } from '../data/reports';

export const reportsHandlers = [
    // GET /api/v1/reports/sales
    http.get('/api/v1/reports/sales', () => {
        return HttpResponse.json({
            success: true,
            data: mockSalesReport,
        });
    }),

    // GET /api/v1/reports/inventory
    http.get('/api/v1/reports/inventory', () => {
        return HttpResponse.json({
            success: true,
            data: mockInventoryReport,
        });
    }),

    // GET /api/v1/reports/financial
    http.get('/api/v1/reports/financial', () => {
        return HttpResponse.json({
            success: true,
            data: mockFinancialReport,
        });
    }),

    // GET /api/v1/reports/cost-accounting
    http.get('/api/v1/reports/cost-accounting', () => {
        return HttpResponse.json({
            success: true,
            data: mockCostAccountingReport,
        });
    }),
];
