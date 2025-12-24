/**
 * Dashboard Mock Data
 */
export const mockDashboardStats = {
    // Current period stats
    totalRevenue: 125000,
    orderCount: 156,
    customerCount: 42,
    productCount: 85,
    // Previous period stats for comparison
    previousRevenue: 104167,  // ~20% lower
    previousOrders: 139,      // ~12% lower
    previousProducts: 75,     // ~13% lower
    previousCustomers: 36,    // ~17% lower
    // Calculated changes (these match what's calculated from current vs previous)
    revenueChange: 20.0,
    ordersChange: 12.2,
    productsChange: 13.3,
    customersChange: 16.7,
    // Additional financial stats
    paymentsReceived: 12450,
    outstanding: 3240,
    avgOrderValue: 289.50,
    inventoryValue: 148320,
    // Changes for financial stats (compared to last month)
    paymentsReceivedChange: 15.3,
    outstandingChange: -8.2,
    avgOrderValueChange: 5.8,
    inventoryValueChange: 7.1,
};

export const mockSalesChartData = [
    { name: 'Jan', sales: 12000, orders: 45 },
    { name: 'Feb', sales: 15000, orders: 52 },
    { name: 'Mar', sales: 18000, orders: 61 },
    { name: 'Apr', sales: 14000, orders: 48 },
    { name: 'May', sales: 21000, orders: 72 },
    { name: 'Jun', sales: 19000, orders: 65 },
    { name: 'Jul', sales: 22000, orders: 78 },
    { name: 'Aug', sales: 25000, orders: 85 },
    { name: 'Sep', sales: 23000, orders: 80 },
    { name: 'Oct', sales: 27000, orders: 92 },
    { name: 'Nov', sales: 30000, orders: 98 },
    { name: 'Dec', sales: 35000, orders: 115 },
];

// Daily revenue trend for the line chart
export const mockRevenueTrend = [
    { name: 'Mon', revenue: 4250 },
    { name: 'Tue', revenue: 5120 },
    { name: 'Wed', revenue: 3890 },
    { name: 'Thu', revenue: 6340 },
    { name: 'Fri', revenue: 7210 },
    { name: 'Sat', revenue: 4890 },
    { name: 'Sun', revenue: 3520 },
];

// Low stock products for alerts
export const mockLowStockProducts = [
    { sku: 'ELEC-001', name: 'Wireless Mouse', stock: 8, reorder: 25 },
    { sku: 'ELEC-002', name: 'USB-C Hub', stock: 12, reorder: 30 },
    { sku: 'OFFC-001', name: 'A4 Paper (500 sheets)', stock: 5, reorder: 50 },
    { sku: 'ELEC-003', name: 'Laptop Stand', stock: 3, reorder: 15 },
];

export const mockTopProducts = [
    { id: '1', name: 'Wireless Mouse', sales: 1250, revenue: 37475 },
    { id: '2', name: 'USB-C Hub', sales: 850, revenue: 42450 },
    { id: '3', name: 'Laptop Stand', sales: 620, revenue: 24800 },
];

export const mockRecentOrders = [
    { id: 'ORD-001', customer: 'Acme Corp', amount: '$329.89', status: 'Delivered' },
    { id: 'ORD-002', customer: 'Tech Solutions', amount: '$274.95', status: 'Shipped' },
    { id: 'ORD-003', customer: 'Global Traders', amount: '$1,250.00', status: 'Processing' },
    { id: 'ORD-004', customer: 'Metro Industries', amount: '$567.50', status: 'Pending' },
    { id: 'ORD-005', customer: 'Summit LLC', amount: '$892.00', status: 'Delivered' },
];
