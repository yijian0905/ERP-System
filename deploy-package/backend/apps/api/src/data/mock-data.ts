/**
 * Global Mock Data Module
 * Centralized mock data for simulating production environment
 * 
 * This module provides consistent test data across all API endpoints.
 * In production, this would be replaced with actual database queries.
 */

// ============================================================================
// Constants
// ============================================================================

export const DEMO_TENANT_ID = '550e8400-e29b-41d4-a716-446655440001';
export const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440099';

// Category IDs
export const CATEGORY_IDS = {
  ELECTRONICS: '550e8400-e29b-41d4-a716-446655440010',
  OFFICE: '550e8400-e29b-41d4-a716-446655440011',
  FURNITURE: '550e8400-e29b-41d4-a716-446655440012',
};

// Warehouse IDs
export const WAREHOUSE_IDS = {
  MAIN: '550e8400-e29b-41d4-a716-446655440020',
  SECONDARY: '550e8400-e29b-41d4-a716-446655440021',
};

// ============================================================================
// Product Data
// ============================================================================

export interface MockProduct {
  id: string;
  tenantId: string;
  categoryId: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  unit: string;
  price: number;
  cost: number;
  taxRate: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQty: number;
  images: string[];
  attributes: Record<string, unknown>;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  createdAt: string;
  updatedAt: string;
}

export const mockProducts: MockProduct[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440101',
    tenantId: DEMO_TENANT_ID,
    categoryId: CATEGORY_IDS.ELECTRONICS,
    sku: 'ELEC-001',
    barcode: '1234567890101',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with USB receiver, 2.4GHz connection',
    unit: 'pcs',
    price: 29.99,
    cost: 15.0,
    taxRate: 6,
    minStock: 10,
    maxStock: 200,
    reorderPoint: 20,
    reorderQty: 50,
    images: [],
    attributes: { color: 'black', wireless: true },
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440102',
    tenantId: DEMO_TENANT_ID,
    categoryId: CATEGORY_IDS.ELECTRONICS,
    sku: 'ELEC-002',
    barcode: '1234567890102',
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard with Cherry MX Blue switches',
    unit: 'pcs',
    price: 149.99,
    cost: 75.0,
    taxRate: 6,
    minStock: 5,
    maxStock: 100,
    reorderPoint: 10,
    reorderQty: 25,
    images: [],
    attributes: { switchType: 'Cherry MX Blue', rgb: true },
    status: 'ACTIVE',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440103',
    tenantId: DEMO_TENANT_ID,
    categoryId: CATEGORY_IDS.ELECTRONICS,
    sku: 'ELEC-003',
    barcode: '1234567890103',
    name: 'USB-C Hub',
    description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader',
    unit: 'pcs',
    price: 59.99,
    cost: 28.0,
    taxRate: 6,
    minStock: 15,
    maxStock: 150,
    reorderPoint: 25,
    reorderQty: 40,
    images: [],
    attributes: { ports: 7, hdmi: true },
    status: 'ACTIVE',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440104',
    tenantId: DEMO_TENANT_ID,
    categoryId: CATEGORY_IDS.OFFICE,
    sku: 'OFFC-001',
    barcode: '1234567890104',
    name: 'A4 Copy Paper',
    description: 'Premium A4 copy paper, 80gsm, 500 sheets per ream',
    unit: 'ream',
    price: 8.99,
    cost: 4.5,
    taxRate: 0,
    minStock: 100,
    maxStock: 2000,
    reorderPoint: 200,
    reorderQty: 500,
    images: [],
    attributes: { size: 'A4', gsm: 80 },
    status: 'ACTIVE',
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440105',
    tenantId: DEMO_TENANT_ID,
    categoryId: CATEGORY_IDS.OFFICE,
    sku: 'OFFC-002',
    barcode: '1234567890105',
    name: 'Printer Ink Cartridge',
    description: 'Compatible ink cartridge for HP printers, Black',
    unit: 'pcs',
    price: 24.99,
    cost: 12.0,
    taxRate: 6,
    minStock: 20,
    maxStock: 200,
    reorderPoint: 30,
    reorderQty: 50,
    images: [],
    attributes: { color: 'black', brand: 'HP compatible' },
    status: 'ACTIVE',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440106',
    tenantId: DEMO_TENANT_ID,
    categoryId: CATEGORY_IDS.FURNITURE,
    sku: 'FURN-001',
    barcode: '1234567890106',
    name: 'Ergonomic Office Chair',
    description: 'Adjustable ergonomic office chair with lumbar support',
    unit: 'pcs',
    price: 299.99,
    cost: 150.0,
    taxRate: 6,
    minStock: 5,
    maxStock: 50,
    reorderPoint: 8,
    reorderQty: 15,
    images: [],
    attributes: { material: 'mesh', adjustable: true },
    status: 'ACTIVE',
    createdAt: '2024-01-06T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440107',
    tenantId: DEMO_TENANT_ID,
    categoryId: CATEGORY_IDS.ELECTRONICS,
    sku: 'ELEC-004',
    barcode: '1234567890107',
    name: '27" 4K Monitor',
    description: '27-inch 4K UHD IPS monitor with USB-C connectivity',
    unit: 'pcs',
    price: 449.99,
    cost: 280.0,
    taxRate: 6,
    minStock: 3,
    maxStock: 30,
    reorderPoint: 5,
    reorderQty: 10,
    images: [],
    attributes: { size: '27"', resolution: '4K' },
    status: 'ACTIVE',
    createdAt: '2024-01-07T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440108',
    tenantId: DEMO_TENANT_ID,
    categoryId: CATEGORY_IDS.OFFICE,
    sku: 'OFFC-003',
    barcode: '1234567890108',
    name: 'Sticky Notes Pack',
    description: 'Assorted color sticky notes, 3x3 inches, 12 pads',
    unit: 'pack',
    price: 12.99,
    cost: 5.5,
    taxRate: 0,
    minStock: 50,
    maxStock: 500,
    reorderPoint: 80,
    reorderQty: 100,
    images: [],
    attributes: { size: '3x3', count: 12 },
    status: 'ACTIVE',
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
];

// ============================================================================
// Customer Data
// ============================================================================

export interface MockCustomer {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: 'INDIVIDUAL' | 'COMPANY' | 'GOVERNMENT' | 'NONPROFIT';
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  taxId: string | null;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
  paymentTerms: number;
  creditLimit: number;
  currentBalance: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mockCustomers: MockCustomer[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440201',
    tenantId: DEMO_TENANT_ID,
    code: 'CUST-001',
    name: 'Acme Corporation',
    type: 'COMPANY',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    mobile: null,
    website: 'https://acme.com',
    taxId: '12-3456789',
    billingAddress: {
      street: '123 Business Ave',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
    },
    shippingAddress: {
      street: '123 Business Ave',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
    },
    paymentTerms: 30,
    creditLimit: 50000,
    currentBalance: 12500,
    notes: 'VIP customer, priority shipping',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440202',
    tenantId: DEMO_TENANT_ID,
    code: 'CUST-002',
    name: 'TechStart Inc',
    type: 'COMPANY',
    email: 'orders@techstart.io',
    phone: '+1 (555) 987-6543',
    mobile: '+1 (555) 111-2222',
    website: 'https://techstart.io',
    taxId: '98-7654321',
    billingAddress: {
      street: '456 Innovation Drive',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'USA',
    },
    shippingAddress: {
      street: '456 Innovation Drive',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'USA',
    },
    paymentTerms: 15,
    creditLimit: 25000,
    currentBalance: 8750,
    notes: 'Startup, fast-growing client',
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440203',
    tenantId: DEMO_TENANT_ID,
    code: 'CUST-003',
    name: 'City Government Office',
    type: 'GOVERNMENT',
    email: 'procurement@city.gov',
    phone: '+1 (555) 444-5555',
    mobile: null,
    website: 'https://city.gov',
    taxId: 'GOV-12345',
    billingAddress: {
      street: '789 City Hall Plaza',
      city: 'Boston',
      state: 'MA',
      zip: '02108',
      country: 'USA',
    },
    shippingAddress: {
      street: '789 City Hall Plaza',
      city: 'Boston',
      state: 'MA',
      zip: '02108',
      country: 'USA',
    },
    paymentTerms: 60,
    creditLimit: 100000,
    currentBalance: 0,
    notes: 'Government contract, net 60 terms',
    isActive: true,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440204',
    tenantId: DEMO_TENANT_ID,
    code: 'CUST-004',
    name: 'Local Education Foundation',
    type: 'NONPROFIT',
    email: 'supplies@education.org',
    phone: '+1 (555) 666-7777',
    mobile: null,
    website: 'https://education.org',
    taxId: 'NP-98765',
    billingAddress: {
      street: '321 Learning Lane',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'USA',
    },
    shippingAddress: {
      street: '321 Learning Lane',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'USA',
    },
    paymentTerms: 30,
    creditLimit: 15000,
    currentBalance: 2500,
    notes: 'Nonprofit discount applies',
    isActive: true,
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440205',
    tenantId: DEMO_TENANT_ID,
    code: 'CUST-005',
    name: 'John Smith',
    type: 'INDIVIDUAL',
    email: 'john.smith@email.com',
    phone: null,
    mobile: '+1 (555) 888-9999',
    website: null,
    taxId: null,
    billingAddress: {
      street: '555 Residential St',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      country: 'USA',
    },
    shippingAddress: {
      street: '555 Residential St',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      country: 'USA',
    },
    paymentTerms: 0,
    creditLimit: 1000,
    currentBalance: 0,
    notes: 'Individual customer, prepaid only',
    isActive: true,
    createdAt: '2024-01-14T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
];

// ============================================================================
// Inventory Data
// ============================================================================

export interface MockInventoryItem {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  batchNumber: string | null;
  lotNumber: string | null;
  expiryDate: string | null;
  location: string | null;
  costPrice: number | null;
  lastCountedAt: string | null;
  createdAt: string;
  updatedAt: string;
  product?: MockProduct;
  warehouse?: { id: string; name: string; code: string };
}

export const mockWarehouses = [
  {
    id: WAREHOUSE_IDS.MAIN,
    tenantId: DEMO_TENANT_ID,
    code: 'MAIN',
    name: 'Main Warehouse',
    address: '100 Warehouse Blvd, Industrial Park',
    isActive: true,
  },
  {
    id: WAREHOUSE_IDS.SECONDARY,
    tenantId: DEMO_TENANT_ID,
    code: 'SEC',
    name: 'Secondary Storage',
    address: '200 Storage Ave, East Side',
    isActive: true,
  },
];

export const mockInventory: MockInventoryItem[] = mockProducts.map((product, index) => ({
  id: `550e8400-e29b-41d4-a716-446655440${300 + index}`,
  tenantId: DEMO_TENANT_ID,
  productId: product.id,
  warehouseId: index % 2 === 0 ? WAREHOUSE_IDS.MAIN : WAREHOUSE_IDS.SECONDARY,
  quantity: Math.floor(Math.random() * 200) + 10,
  reservedQty: Math.floor(Math.random() * 20),
  get availableQty() {
    return this.quantity - this.reservedQty;
  },
  batchNumber: `BATCH-2024-${String(index + 1).padStart(3, '0')}`,
  lotNumber: null,
  expiryDate: null,
  location: `A-${Math.floor(index / 4) + 1}-${(index % 4) + 1}`,
  costPrice: product.cost,
  lastCountedAt: '2024-01-10T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  product,
  warehouse: index % 2 === 0 ? mockWarehouses[0] : mockWarehouses[1],
}));

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
// Helper Functions
// ============================================================================

/**
 * Filter data by tenant ID
 */
export function filterByTenant<T extends { tenantId: string }>(
  data: T[],
  tenantId: string
): T[] {
  return data.filter((item) => item.tenantId === tenantId);
}

/**
 * Find item by ID and tenant
 */
export function findByIdAndTenant<T extends { id: string; tenantId: string }>(
  data: T[],
  id: string,
  tenantId: string
): T | undefined {
  return data.find((item) => item.id === id && item.tenantId === tenantId);
}

/**
 * Paginate data
 */
export function paginate<T>(
  data: T[],
  page: number,
  limit: number
): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const items = data.slice(start, start + limit);

  return { items, total, page, limit, totalPages };
}

/**
 * Search data by name or sku
 */
export function searchProducts(
  products: MockProduct[],
  search: string
): MockProduct[] {
  const searchLower = search.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower)
  );
}

/**
 * Search customers by name or code
 */
export function searchCustomers(
  customers: MockCustomer[],
  search: string
): MockCustomer[] {
  const searchLower = search.toLowerCase();
  return customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchLower) ||
      c.code.toLowerCase().includes(searchLower) ||
      (c.email && c.email.toLowerCase().includes(searchLower))
  );
}

/**
 * Get product summary for forecasting
 */
export function getProductSummary(product: MockProduct) {
  const inventory = mockInventory.find((i) => i.productId === product.id);
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    currentStock: inventory?.availableQty || 0,
    reorderPoint: product.reorderPoint,
    reorderQty: product.reorderQty,
  };
}

/**
 * Generate mock product IDs for demo purposes
 */
export function getProductIds(): string[] {
  return mockProducts.map((p) => p.id);
}

