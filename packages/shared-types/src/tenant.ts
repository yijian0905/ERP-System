import type { LicenseTier, TenantStatus } from './entities';

// Re-export types for convenience
export type { LicenseTier, TenantStatus } from './entities';

/**
 * Company information for invoices and documents
 */
export interface CompanyInfo {
  name: string;
  legalName?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  logo?: string;
  favicon?: string;
}

/**
 * Regional settings
 */
export interface RegionalSettings {
  timezone: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimalSeparator: string;
    thousandsSeparator: string;
    decimalPlaces: number;
  };
}

/**
 * Invoice settings
 */
export interface InvoiceSettings {
  prefix: string;
  nextNumber: number;
  terms?: string;
  footer?: string;
  dueDays: number;
  taxRate: number;
  showLogo: boolean;
  showPaymentInfo: boolean;
}

/**
 * Order settings
 */
export interface OrderSettings {
  salesOrderPrefix: string;
  purchaseOrderPrefix: string;
  nextSalesOrderNumber: number;
  nextPurchaseOrderNumber: number;
  requireApproval: boolean;
  approvalThreshold?: number;
  autoConfirmOrders: boolean;
}

/**
 * Inventory settings
 */
export interface InventorySettings {
  trackBatches: boolean;
  trackSerialNumbers: boolean;
  trackExpiry: boolean;
  allowNegativeStock: boolean;
  defaultWarehouseId?: string;
  lowStockAlertEnabled: boolean;
  lowStockAlertThreshold: number;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  emailNotifications: boolean;
  lowStockAlerts: boolean;
  orderAlerts: boolean;
  paymentAlerts: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
}

/**
 * Security settings
 */
export interface SecuritySettings {
  mfaRequired: boolean;
  mfaEnforced: boolean;
  sessionTimeout: number; // minutes
  maxFailedLogins: number;
  lockoutDuration: number; // minutes
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  passwordExpiryDays: number;
  ipWhitelist?: string[];
}

/**
 * Tenant-specific settings
 */
export interface TenantSettings {
  company: CompanyInfo;
  regional: RegionalSettings;
  invoice: InvoiceSettings;
  order: OrderSettings;
  inventory: InventorySettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  customFields?: Record<string, unknown>;
}

/**
 * Tenant entity
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  status: TenantStatus;
  tier: LicenseTier;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/**
 * Tenant summary (for lists)
 */
export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  tier: LicenseTier;
  usersCount: number;
  productsCount: number;
  createdAt: string;
}

/**
 * Create tenant request
 */
export interface CreateTenantRequest {
  name: string;
  slug: string;
  domain?: string;
  tier?: LicenseTier;
  settings?: Partial<TenantSettings>;
  adminUser: {
    email: string;
    name: string;
    password: string;
  };
}

/**
 * Update tenant request
 */
export interface UpdateTenantRequest {
  name?: string;
  domain?: string;
  settings?: Partial<TenantSettings>;
}

/**
 * Update tenant status request
 */
export interface UpdateTenantStatusRequest {
  status: TenantStatus;
  reason?: string;
}

/**
 * Default tenant settings
 */
export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  company: {
    name: '',
  },
  regional: {
    timezone: 'UTC',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      decimalSeparator: '.',
      thousandsSeparator: ',',
      decimalPlaces: 2,
    },
  },
  invoice: {
    prefix: 'INV-',
    nextNumber: 1001,
    dueDays: 30,
    taxRate: 0,
    showLogo: true,
    showPaymentInfo: true,
  },
  order: {
    salesOrderPrefix: 'SO-',
    purchaseOrderPrefix: 'PO-',
    nextSalesOrderNumber: 1001,
    nextPurchaseOrderNumber: 1001,
    requireApproval: false,
    autoConfirmOrders: false,
  },
  inventory: {
    trackBatches: false,
    trackSerialNumbers: false,
    trackExpiry: false,
    allowNegativeStock: false,
    lowStockAlertEnabled: true,
    lowStockAlertThreshold: 10,
  },
  notifications: {
    emailNotifications: true,
    lowStockAlerts: true,
    orderAlerts: true,
    paymentAlerts: true,
    dailyDigest: false,
    weeklyReport: true,
  },
  security: {
    mfaRequired: false,
    mfaEnforced: false,
    sessionTimeout: 480, // 8 hours
    maxFailedLogins: 5,
    lockoutDuration: 30,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    passwordExpiryDays: 0, // Never expires
  },
};
