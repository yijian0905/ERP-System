/**
 * Reports Mock Data
 */
export const mockSalesReport = {
    totalSales: 125000,
    totalOrders: 156,
    averageOrderValue: 801.28,
    topCustomers: [
        { id: '1', name: 'Acme Corporation', totalSpent: 45000, orderCount: 32 },
        { id: '2', name: 'Tech Solutions Inc', totalSpent: 28000, orderCount: 18 },
    ],
    salesByMonth: [
        { month: 'Jan', amount: 12000 },
        { month: 'Feb', amount: 15000 },
        { month: 'Mar', amount: 18000 },
    ],
};

export const mockInventoryReport = {
    totalProducts: 85,
    totalValue: 250000,
    lowStockItems: 5,
    outOfStockItems: 2,
    topMovingProducts: [
        { id: '1', name: 'Wireless Mouse', movement: 150 },
        { id: '2', name: 'USB-C Hub', movement: 85 },
    ],
};

export const mockFinancialReport = {
    totalRevenue: 125000,
    totalExpenses: 85000,
    netProfit: 40000,
    profitMargin: 32.0,
    revenueByCategory: [
        { category: 'Electronics', amount: 75000 },
        { category: 'Office Supplies', amount: 35000 },
        { category: 'Furniture', amount: 15000 },
    ],
};

export const mockCostAccountingReport = {
    costCenters: [
        { id: '1', name: 'Marketing', budget: 50000, spent: 25000, variance: -25000 },
        { id: '2', name: 'IT', budget: 100000, spent: 75000, variance: -25000 },
    ],
    totalBudget: 225000,
    totalSpent: 150000,
    totalVariance: -75000,
};
