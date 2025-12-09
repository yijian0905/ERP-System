/**
 * Global Mock Data Module for Frontend
 * Centralized mock data for simulating production environment
 * 
 * This module provides consistent test data across all UI components.
 * In production, this data would come from API calls.
 */

// ============================================================================
// Constants
// ============================================================================

export const DEMO_TENANT_ID = '550e8400-e29b-41d4-a716-446655440001';

// Category IDs
export const CATEGORY_IDS = {
  ELECTRONICS: '550e8400-e29b-41d4-a716-446655440010',
  OFFICE: '550e8400-e29b-41d4-a716-446655440011',
  FURNITURE: '550e8400-e29b-41d4-a716-446655440012',
} as const;

// ============================================================================
// Product Data
// ============================================================================

export interface MockProduct {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  categoryId: string;
  unit: string;
  price: number;
  cost: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQty: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
}

export const mockProducts: MockProduct[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440101',
    name: 'Wireless Mouse',
    sku: 'ELEC-001',
    description: 'Ergonomic wireless mouse with USB receiver',
    category: 'Electronics',
    categoryId: CATEGORY_IDS.ELECTRONICS,
    unit: 'pcs',
    price: 29.99,
    cost: 15.0,
    currentStock: 150,
    minStock: 10,
    maxStock: 200,
    reorderPoint: 20,
    reorderQty: 50,
    status: 'ACTIVE',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440102',
    name: 'Mechanical Keyboard',
    sku: 'ELEC-002',
    description: 'RGB mechanical keyboard with Cherry MX switches',
    category: 'Electronics',
    categoryId: CATEGORY_IDS.ELECTRONICS,
    unit: 'pcs',
    price: 149.99,
    cost: 75.0,
    currentStock: 8,
    minStock: 5,
    maxStock: 100,
    reorderPoint: 10,
    reorderQty: 25,
    status: 'ACTIVE',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440103',
    name: 'USB-C Hub',
    sku: 'ELEC-003',
    description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader',
    category: 'Electronics',
    categoryId: CATEGORY_IDS.ELECTRONICS,
    unit: 'pcs',
    price: 59.99,
    cost: 28.0,
    currentStock: 200,
    minStock: 15,
    maxStock: 150,
    reorderPoint: 25,
    reorderQty: 40,
    status: 'ACTIVE',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440104',
    name: 'A4 Copy Paper',
    sku: 'OFFC-001',
    description: 'Premium A4 copy paper, 80gsm, 500 sheets',
    category: 'Office Supplies',
    categoryId: CATEGORY_IDS.OFFICE,
    unit: 'ream',
    price: 8.99,
    cost: 4.5,
    currentStock: 500,
    minStock: 100,
    maxStock: 2000,
    reorderPoint: 200,
    reorderQty: 500,
    status: 'ACTIVE',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440105',
    name: 'Printer Ink Cartridge',
    sku: 'OFFC-002',
    description: 'Compatible ink cartridge for HP printers',
    category: 'Office Supplies',
    categoryId: CATEGORY_IDS.OFFICE,
    unit: 'pcs',
    price: 24.99,
    cost: 12.0,
    currentStock: 12,
    minStock: 20,
    maxStock: 200,
    reorderPoint: 30,
    reorderQty: 50,
    status: 'ACTIVE',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440106',
    name: 'Ergonomic Office Chair',
    sku: 'FURN-001',
    description: 'Adjustable ergonomic chair with lumbar support',
    category: 'Furniture',
    categoryId: CATEGORY_IDS.FURNITURE,
    unit: 'pcs',
    price: 299.99,
    cost: 150.0,
    currentStock: 25,
    minStock: 5,
    maxStock: 50,
    reorderPoint: 8,
    reorderQty: 15,
    status: 'ACTIVE',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440107',
    name: '27" 4K Monitor',
    sku: 'ELEC-004',
    description: '27-inch 4K UHD IPS monitor with USB-C',
    category: 'Electronics',
    categoryId: CATEGORY_IDS.ELECTRONICS,
    unit: 'pcs',
    price: 449.99,
    cost: 280.0,
    currentStock: 18,
    minStock: 3,
    maxStock: 30,
    reorderPoint: 5,
    reorderQty: 10,
    status: 'ACTIVE',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440108',
    name: 'Sticky Notes Pack',
    sku: 'OFFC-003',
    description: 'Assorted color sticky notes, 3x3 inches',
    category: 'Office Supplies',
    categoryId: CATEGORY_IDS.OFFICE,
    unit: 'pack',
    price: 12.99,
    cost: 5.5,
    currentStock: 320,
    minStock: 50,
    maxStock: 500,
    reorderPoint: 80,
    reorderQty: 100,
    status: 'ACTIVE',
  },
];

// ============================================================================
// Customer Data
// ============================================================================

export interface MockCustomer {
  id: string;
  code: string;
  name: string;
  type: 'INDIVIDUAL' | 'COMPANY' | 'GOVERNMENT' | 'NONPROFIT';
  email: string;
  phone: string;
  address: string;
  creditLimit: number;
  currentBalance: number;
  paymentTerms: number;
  isActive: boolean;
}

export const mockCustomers: MockCustomer[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440201',
    code: 'CUST-001',
    name: 'Acme Corporation',
    type: 'COMPANY',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business Ave, New York, NY 10001',
    creditLimit: 50000,
    currentBalance: 12500,
    paymentTerms: 30,
    isActive: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440202',
    code: 'CUST-002',
    name: 'TechStart Inc',
    type: 'COMPANY',
    email: 'orders@techstart.io',
    phone: '+1 (555) 987-6543',
    address: '456 Innovation Drive, San Francisco, CA 94105',
    creditLimit: 25000,
    currentBalance: 8750,
    paymentTerms: 15,
    isActive: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440203',
    code: 'CUST-003',
    name: 'City Government Office',
    type: 'GOVERNMENT',
    email: 'procurement@city.gov',
    phone: '+1 (555) 444-5555',
    address: '789 City Hall Plaza, Boston, MA 02108',
    creditLimit: 100000,
    currentBalance: 0,
    paymentTerms: 60,
    isActive: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440204',
    code: 'CUST-004',
    name: 'Local Education Foundation',
    type: 'NONPROFIT',
    email: 'supplies@education.org',
    phone: '+1 (555) 666-7777',
    address: '321 Learning Lane, Chicago, IL 60601',
    creditLimit: 15000,
    currentBalance: 2500,
    paymentTerms: 30,
    isActive: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440205',
    code: 'CUST-005',
    name: 'John Smith',
    type: 'INDIVIDUAL',
    email: 'john.smith@email.com',
    phone: '+1 (555) 888-9999',
    address: '555 Residential St, Seattle, WA 98101',
    creditLimit: 1000,
    currentBalance: 0,
    paymentTerms: 0,
    isActive: true,
  },
];

// ============================================================================
// Seasonal Trends Data
// ============================================================================

export interface SeasonalTrend {
  month: string;
  electronics: number;
  office: number;
  furniture: number;
}

export const seasonalTrends: SeasonalTrend[] = [
  { month: 'Jan', electronics: 85, office: 120, furniture: 45 },
  { month: 'Feb', electronics: 88, office: 110, furniture: 50 },
  { month: 'Mar', electronics: 95, office: 105, furniture: 55 },
  { month: 'Apr', electronics: 100, office: 100, furniture: 60 },
  { month: 'May', electronics: 102, office: 95, furniture: 65 },
  { month: 'Jun', electronics: 95, office: 90, furniture: 70 },
  { month: 'Jul', electronics: 90, office: 85, furniture: 75 },
  { month: 'Aug', electronics: 110, office: 130, furniture: 80 },
  { month: 'Sep', electronics: 125, office: 150, furniture: 70 },
  { month: 'Oct', electronics: 115, office: 140, furniture: 60 },
  { month: 'Nov', electronics: 120, office: 120, furniture: 55 },
  { month: 'Dec', electronics: 130, office: 100, furniture: 50 },
];

// ============================================================================
// Stock Recommendation Styles
// ============================================================================

export const recommendationStyles = {
  critical: {
    label: 'Urgent',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  reorder_needed: {
    label: 'Order Now',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  adequate: {
    label: 'OK',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  overstocked: {
    label: 'Overstock',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
} as const;

export type RecommendationStatus = keyof typeof recommendationStyles;

// ============================================================================
// Forecast Period Options
// ============================================================================

export const forecastPeriods = {
  '2weeks': { label: '2 Weeks', days: 14 },
  '4weeks': { label: '4 Weeks', days: 28 },
  '8weeks': { label: '8 Weeks', days: 56 },
  '12weeks': { label: '12 Weeks', days: 84 },
} as const;

export type ForecastPeriod = keyof typeof forecastPeriods;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get product by ID
 */
export function getProductById(id: string): MockProduct | undefined {
  return mockProducts.find((p) => p.id === id);
}

/**
 * Get customer by ID
 */
export function getCustomerById(id: string): MockCustomer | undefined {
  return mockCustomers.find((c) => c.id === id);
}

/**
 * Get all product IDs
 */
export function getProductIds(): string[] {
  return mockProducts.map((p) => p.id);
}

/**
 * Get products for forecasting (simplified)
 */
export function getProductsForForecasting() {
  return mockProducts.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    currentStock: p.currentStock,
    reorderPoint: p.reorderPoint,
    category: p.category,
  }));
}

/**
 * Calculate stock status for a product
 */
export function getStockStatus(
  currentStock: number,
  reorderPoint: number
): RecommendationStatus {
  if (currentStock <= reorderPoint * 0.5) return 'critical';
  if (currentStock <= reorderPoint) return 'reorder_needed';
  if (currentStock >= reorderPoint * 3) return 'overstocked';
  return 'adequate';
}

/**
 * Search products
 */
export function searchProducts(query: string): MockProduct[] {
  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.sku.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search customers
 */
export function searchCustomers(query: string): MockCustomer[] {
  const lowerQuery = query.toLowerCase();
  return mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.code.toLowerCase().includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get products by category
 */
export function getProductsByCategory(categoryId: string): MockProduct[] {
  return mockProducts.filter((p) => p.categoryId === categoryId);
}

/**
 * Get low stock products
 */
export function getLowStockProducts(): MockProduct[] {
  return mockProducts.filter((p) => p.currentStock <= p.reorderPoint);
}

/**
 * Get category summary
 */
export function getCategorySummary() {
  const categories: Record<string, { count: number; totalValue: number }> = {};
  
  mockProducts.forEach((p) => {
    if (!categories[p.category]) {
      categories[p.category] = { count: 0, totalValue: 0 };
    }
    categories[p.category].count++;
    categories[p.category].totalValue += p.currentStock * p.price;
  });

  return Object.entries(categories).map(([name, data]) => ({
    name,
    ...data,
  }));
}

