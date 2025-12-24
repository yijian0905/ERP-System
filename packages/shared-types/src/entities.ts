/**
 * Base entity with common fields for all tenant-isolated tables
 * Follows RLS pattern with tenant_id on all tables
 */
export interface BaseEntity {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// ============================================
// ENUMS
// ============================================

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
export type LicenseTier = 'L1' | 'L2' | 'L3';
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK';
export type WarehouseType = 'WAREHOUSE' | 'STORE' | 'VIRTUAL';
export type CustomerType = 'INDIVIDUAL' | 'COMPANY' | 'GOVERNMENT' | 'NONPROFIT';
export type OrderType = 'SALES' | 'PURCHASE' | 'RETURN' | 'TRANSFER';
export type OrderStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
export type InvoiceType = 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'PROFORMA';
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'SENT' | 'VIEWED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'VOID';
export type PaymentType = 'RECEIVED' | 'REFUND' | 'CREDIT' | 'ADVANCE';
export type PaymentMethod = 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'DIGITAL_WALLET' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type MovementType = 'PURCHASE' | 'SALE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'RETURN_IN' | 'RETURN_OUT' | 'DAMAGE' | 'EXPIRED' | 'INITIAL';

// ============================================
// CATEGORY
// ============================================

export interface Category extends BaseEntity {
  parentId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
  parent?: Category | null;
}

export interface CreateCategoryRequest {
  parentId?: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  isActive?: boolean;
}

// ============================================
// PRODUCT
// ============================================

export interface Product extends BaseEntity {
  categoryId?: string | null;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  price: number;
  cost: number;
  taxRate: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQty: number;
  weight?: number | null;
  dimensions?: ProductDimensions | null;
  images: string[];
  attributes: Record<string, unknown>;
  status: ProductStatus;
  category?: Category | null;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

export interface CreateProductRequest {
  categoryId?: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  unit: string;
  price: number;
  cost: number;
  taxRate?: number;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQty?: number;
  weight?: number;
  dimensions?: ProductDimensions;
  images?: string[];
  attributes?: Record<string, unknown>;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  status?: ProductStatus;
}

// ============================================
// WAREHOUSE
// ============================================

export interface Warehouse extends BaseEntity {
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  manager?: string | null;
  type: WarehouseType;
  isDefault: boolean;
  isActive: boolean;
}

export interface CreateWarehouseRequest {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  manager?: string;
  type?: WarehouseType;
  isDefault?: boolean;
}

export interface UpdateWarehouseRequest extends Partial<CreateWarehouseRequest> {
  isActive?: boolean;
}

// ============================================
// INVENTORY
// ============================================

export interface InventoryItem {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  batchNumber?: string | null;
  lotNumber?: string | null;
  serialNumber?: string | null;
  expiryDate?: string | null;
  location?: string | null;
  costPrice?: number | null;
  lastCountedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  warehouse?: Warehouse;
}

export interface InventoryMovement {
  id: string;
  tenantId: string;
  productId: string;
  fromWarehouseId?: string | null;
  toWarehouseId?: string | null;
  userId: string;
  type: MovementType;
  quantity: number;
  unitCost?: number | null;
  totalCost?: number | null;
  reference?: string | null;
  referenceType?: string | null;
  batchNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  product?: Product;
  fromWarehouse?: Warehouse | null;
  toWarehouse?: Warehouse | null;
}

export interface CreateInventoryMovementRequest {
  productId: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  reference?: string;
  referenceType?: string;
  batchNumber?: string;
  notes?: string;
}

export interface InventoryAdjustmentRequest {
  productId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
  notes?: string;
}

export interface InventorySummary {
  productId: string;
  productName: string;
  sku: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  totalValue: number;
  warehouses: WarehouseStock[];
}

export interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
}

// ============================================
// CUSTOMER
// ============================================

/**
 * Address structure for E-Invoice compliance
 * Per MyInvois spec §5.2, fields 14-15
 */
export interface Address {
  street?: string;        // addressLine1 in E-Invoice
  addressLine2?: string;  // Additional address line
  addressLine3?: string;  // Additional address line
  city?: string;
  state?: string;         // State code (01-17) for Malaysia
  postalCode?: string;
  country?: string;       // ISO 3166-1 alpha-3 (e.g., MYS)
}

/**
 * E-Invoice compliant Address structure
 * All fields per MyInvois spec
 */
export interface EInvoiceAddress {
  addressLine1: string;   // Mandatory
  addressLine2?: string;
  addressLine3?: string;
  cityName: string;       // Mandatory
  postalZone: string;     // Mandatory
  stateCode: string;      // Mandatory: 01-17 for Malaysia
  countryCode: string;    // Mandatory: ISO 3166-1 alpha-3
}

export interface Customer extends BaseEntity {
  code: string;
  name: string;
  type: CustomerType;
  email?: string | null;
  phone?: string | null;           // Mandatory for E-Invoice
  mobile?: string | null;
  fax?: string | null;
  website?: string | null;
  taxId?: string | null;           // TIN for E-Invoice
  // E-Invoice specific fields
  tin?: string | null;             // Tax Identification Number (equivalent to taxId)
  brn?: string | null;             // Business Registration Number
  sstNo?: string | null;           // SST Registration Number (conditional)
  billingAddress?: Address | null;
  shippingAddress?: Address | null;
  paymentTerms: number;
  creditLimit: number;
  currentBalance: number;
  notes?: string | null;
  tags: string[];
  isActive: boolean;
  // E-Invoice readiness flag
  eInvoiceReady?: boolean;         // Computed: has TIN/BRN, phone, complete address
}

export interface CreateCustomerRequest {
  code: string;
  name: string;
  type?: CustomerType;
  email?: string;
  phone?: string;        // Mandatory for E-Invoice
  mobile?: string;
  fax?: string;
  website?: string;
  taxId?: string;        // Legacy field
  // E-Invoice fields
  tin?: string;          // Tax Identification Number
  brn?: string;          // Business Registration Number
  sstNo?: string;        // SST Registration Number
  billingAddress?: Address;
  shippingAddress?: Address;
  paymentTerms?: number;
  creditLimit?: number;
  notes?: string;
  tags?: string[];
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  isActive?: boolean;
}

// ============================================
// SUPPLIER
// ============================================

export interface BankDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
}

export interface Supplier extends BaseEntity {
  code: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  fax?: string | null;
  website?: string | null;
  taxId?: string | null;
  address?: Address | null;
  bankDetails?: BankDetails | null;
  paymentTerms: number;
  currency: string;
  leadTime: number;
  minimumOrder: number;
  rating?: number | null;
  notes?: string | null;
  tags: string[];
  isActive: boolean;
}

export interface CreateSupplierRequest {
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  taxId?: string;
  address?: Address;
  bankDetails?: BankDetails;
  paymentTerms?: number;
  currency?: string;
  leadTime?: number;
  minimumOrder?: number;
  rating?: number;
  notes?: string;
  tags?: string[];
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  isActive?: boolean;
}

// ============================================
// ORDER
// ============================================

export interface Order extends BaseEntity {
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  customerId?: string | null;
  supplierId?: string | null;
  warehouseId?: string | null;
  createdById: string;
  approvedById?: string | null;
  orderDate: string;
  expectedDate?: string | null;
  shippedDate?: string | null;
  deliveredDate?: string | null;
  shippingAddress?: Address | null;
  billingAddress?: Address | null;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  discountType?: string | null;
  total: number;
  currency: string;
  exchangeRate: number;
  paymentTerms?: number | null;
  paymentMethod?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  customer?: Customer | null;
  supplier?: Supplier | null;
  warehouse?: Warehouse | null;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sku: string;
  name: string;
  description?: string | null;
  quantity: number;
  shippedQty: number;
  receivedQty: number;
  unitPrice: number;
  unitCost?: number | null;
  discount: number;
  discountType?: string | null;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface CreateOrderRequest {
  type: OrderType;
  customerId?: string;
  supplierId?: string;
  warehouseId?: string;
  orderDate?: string;
  expectedDate?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  discount?: number;
  discountType?: string;
  shippingCost?: number;
  currency?: string;
  paymentTerms?: number;
  paymentMethod?: string;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  items: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  unitPrice?: number;
  unitCost?: number;
  discount?: number;
  discountType?: string;
  taxRate?: number;
  notes?: string;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  expectedDate?: string;
  shippedDate?: string;
  deliveredDate?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  discount?: number;
  discountType?: string;
  shippingCost?: number;
  paymentTerms?: number;
  paymentMethod?: string;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
}

export interface UpdateOrderItemRequest {
  quantity?: number;
  shippedQty?: number;
  receivedQty?: number;
  unitPrice?: number;
  discount?: number;
  discountType?: string;
  taxRate?: number;
  notes?: string;
}

// ============================================
// INVOICE
// ============================================

export interface Invoice extends BaseEntity {
  orderId?: string | null;
  customerId: string;
  createdById: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string | null;
  subtotal: number;
  taxAmount: number;
  discount: number;
  shippingCost: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  currency: string;
  exchangeRate: number;
  notes?: string | null;
  terms?: string | null;
  footer?: string | null;
  metadata: Record<string, unknown>;
  sentAt?: string | null;
  viewedAt?: string | null;
  // E-Invoice specific fields (per MyInvois spec §5.2)
  eInvoiceVersion?: string | null;        // "1.1" recommended
  billingPeriodStart?: string | null;     // For recurring invoices
  billingPeriodEnd?: string | null;       // For recurring invoices  
  billingFrequency?: string | null;       // Daily, Weekly, Monthly
  paymentMode?: string | null;            // 01-07 per spec §6.4
  paymentBankAccount?: string | null;     // Bank account number
  prepaymentAmount?: number | null;       // Prepayment/advance
  prepaymentDate?: string | null;         // Prepayment date
  prepaymentReference?: string | null;    // Prepayment reference
  billReferenceNumber?: string | null;    // Bill reference
  order?: Order | null;
  customer?: Customer;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId?: string | null;
  sku?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  // E-Invoice specific fields
  classificationCode?: string | null;     // MSIC/product classification
  unitCode?: string | null;               // Unit of measure (C62, KGM, LTR etc.)
  taxTypeCode?: string | null;            // Tax type (01-06, E)
  taxExemptionReason?: string | null;     // If tax exempt
  product?: Product | null;
}

export interface CreateInvoiceRequest {
  orderId?: string;
  customerId: string;
  type?: InvoiceType;
  issueDate?: string;
  dueDate: string;
  discount?: number;
  shippingCost?: number;
  currency?: string;
  exchangeRate?: number;          // For non-MYR currencies
  notes?: string;
  terms?: string;
  footer?: string;
  // E-Invoice fields
  billingPeriodStart?: string;    // For recurring invoices
  billingPeriodEnd?: string;      // For recurring invoices
  billingFrequency?: string;      // Daily, Weekly, Monthly
  paymentMode?: string;           // 01-07 per spec
  paymentBankAccount?: string;    // Bank account number
  prepaymentAmount?: number;      // Prepayment/advance
  prepaymentDate?: string;        // Prepayment date
  prepaymentReference?: string;   // Prepayment reference
  billReferenceNumber?: string;   // Bill reference
  items: CreateInvoiceItemRequest[];
}

export interface CreateInvoiceItemRequest {
  productId?: string;
  sku?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  // E-Invoice fields
  classificationCode?: string;    // MSIC/product classification
  unitCode?: string;              // Unit of measure (C62, KGM, LTR)
  taxTypeCode?: string;           // Tax type (01-06, E)
  taxExemptionReason?: string;    // If tax exempt
}

export interface UpdateInvoiceRequest {
  status?: InvoiceStatus;
  dueDate?: string;
  discount?: number;
  shippingCost?: number;
  notes?: string;
  terms?: string;
  footer?: string;
  // E-Invoice fields
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  paymentMode?: string;
  paymentBankAccount?: string;
}

// ============================================
// PAYMENT
// ============================================

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId?: string | null;
  customerId: string;
  receivedById: string;
  paymentNumber: string;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  exchangeRate: number;
  paymentDate: string;
  reference?: string | null;
  notes?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  invoice?: Invoice | null;
  customer?: Customer;
}

export interface CreatePaymentRequest {
  invoiceId?: string;
  customerId: string;
  type?: PaymentType;
  method: PaymentMethod;
  amount: number;
  currency?: string;
  paymentDate?: string;
  reference?: string;
  notes?: string;
}

export interface UpdatePaymentRequest {
  status?: PaymentStatus;
  reference?: string;
  notes?: string;
}

// ============================================
// USER
// ============================================

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  roleId?: string | null;
  avatar?: string | null;
  phone?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  customRole?: Role | null;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  roleId?: string;
  avatar?: string;
  phone?: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  roleId?: string;
  avatar?: string;
  phone?: string;
  isActive?: boolean;
}

// ============================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================

export interface Role extends BaseEntity {
  name: string;
  displayName: string;
  description?: string | null;
  color?: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissions?: RolePermission[];
}

export interface PermissionRecord {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  module: string;
  action: string;
  sortOrder: number;
  createdAt: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: string;
  permission?: PermissionRecord;
}

export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  displayName?: string;
  description?: string;
  color?: string;
  permissionIds?: string[];
  isActive?: boolean;
}

export interface RoleWithPermissions extends Role {
  permissions: RolePermission[];
}

// Permission module definitions for grouping in UI
export type PermissionModule =
  | 'users'
  | 'roles'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'orders'
  | 'invoices'
  | 'payments'
  | 'reports'
  | 'settings'
  | 'audit'
  | 'ai';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'approve' | 'export' | 'send' | 'adjust' | 'transfer';

// ============================================
// AUDIT LOG
// ============================================

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  changedFields?: string[] | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  duration?: number | null;
  createdAt: string;
  user?: User | null;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
}
