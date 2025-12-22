/**
 * Dashboard Mock Data
 */
export const mockDashboardStats = {
    totalRevenue: 125000,
    totalOrders: 156,
    totalCustomers: 42,
    totalProducts: 85,
    revenueChange: 12.5,
    ordersChange: 8.3,
    customersChange: 5.2,
    productsChange: 2.1,
};

export const mockSalesChartData = [
    { month: 'Jan', sales: 12000, orders: 45 },
    { month: 'Feb', sales: 15000, orders: 52 },
    { month: 'Mar', sales: 18000, orders: 61 },
    { month: 'Apr', sales: 14000, orders: 48 },
    { month: 'May', sales: 21000, orders: 72 },
    { month: 'Jun', sales: 19000, orders: 65 },
    { month: 'Jul', sales: 22000, orders: 78 },
    { month: 'Aug', sales: 25000, orders: 85 },
    { month: 'Sep', sales: 23000, orders: 80 },
    { month: 'Oct', sales: 27000, orders: 92 },
    { month: 'Nov', sales: 30000, orders: 98 },
    { month: 'Dec', sales: 35000, orders: 115 },
];

export const mockTopProducts = [
    { id: '1', name: 'Wireless Mouse', sales: 1250, revenue: 37475 },
    { id: '2', name: 'USB-C Hub', sales: 850, revenue: 42450 },
    { id: '3', name: 'Laptop Stand', sales: 620, revenue: 24800 },
];

export const mockRecentOrders = [
    { id: '1', orderNumber: 'SO-2024-001', customer: 'Acme Corp', total: 329.89, status: 'CONFIRMED' },
    { id: '2', orderNumber: 'SO-2024-002', customer: 'Tech Solutions', total: 274.95, status: 'PENDING' },
    { id: '3', orderNumber: 'SO-2024-003', customer: 'Global Traders', total: 1250.00, status: 'SHIPPED' },
];
