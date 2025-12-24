/**
 * Unified permission definitions for the ERP system
 * All permissions use dot notation: resource.action
 */

/**
 * Permission actions
 */
export const Actions = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  MANAGE: 'manage',
  EXPORT: 'export',
  PRINT: 'print',
  APPROVE: 'approve',
  CANCEL: 'cancel',
  TRANSFER: 'transfer',
  ADJUST: 'adjust',
  RECORD: 'record',
} as const;

/**
 * Permission resources
 */
export const Resources = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  ROLES: 'roles',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  INVENTORY: 'inventory',
  WAREHOUSES: 'warehouses',
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  ORDERS: 'orders',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  PURCHASING: 'purchasing',
  REQUISITIONS: 'requisitions',
  COST_CENTERS: 'cost-centers',
  ASSETS: 'assets',
  RECURRING: 'recurring',
  REPORTS: 'reports',
  FORECASTING: 'forecasting',
  SETTINGS: 'settings',
  AI: 'ai',
  AUDIT: 'audit',
  EINVOICE: 'einvoice',
} as const;

/**
 * All available permissions in the system
 */
export const Permissions = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',

  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',

  // Roles
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_EDIT: 'roles.edit',
  ROLES_DELETE: 'roles.delete',

  // Products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',

  // Categories
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_EDIT: 'categories.edit',
  CATEGORIES_DELETE: 'categories.delete',

  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_TRANSFER: 'inventory.transfer',

  // Warehouses
  WAREHOUSES_VIEW: 'warehouses.view',
  WAREHOUSES_MANAGE: 'warehouses.manage',

  // Customers
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_DELETE: 'customers.delete',

  // Suppliers
  SUPPLIERS_VIEW: 'suppliers.view',
  SUPPLIERS_MANAGE: 'suppliers.manage',

  // Orders
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_EDIT: 'orders.edit',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_APPROVE: 'orders.approve',

  // Invoices
  INVOICES_VIEW: 'invoices.view',
  INVOICES_CREATE: 'invoices.create',
  INVOICES_EDIT: 'invoices.edit',
  INVOICES_DELETE: 'invoices.delete',
  INVOICES_PRINT: 'invoices.print',

  // Payments
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_RECORD: 'payments.record',

  // Purchasing
  PURCHASING_VIEW: 'purchasing.view',
  PURCHASING_CREATE: 'purchasing.create',
  PURCHASING_APPROVE: 'purchasing.approve',

  // Requisitions
  REQUISITIONS_VIEW: 'requisitions.view',
  REQUISITIONS_CREATE: 'requisitions.create',
  REQUISITIONS_APPROVE: 'requisitions.approve',

  // Cost Centers
  COST_CENTERS_VIEW: 'cost-centers.view',
  COST_CENTERS_MANAGE: 'cost-centers.manage',

  // Assets
  ASSETS_VIEW: 'assets.view',
  ASSETS_MANAGE: 'assets.manage',

  // Recurring
  RECURRING_VIEW: 'recurring.view',
  RECURRING_MANAGE: 'recurring.manage',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  // Forecasting (L2+)
  FORECASTING_VIEW: 'forecasting.view',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SETTINGS_USERS: 'settings.users',
  SETTINGS_COMPANY: 'settings.company',

  // AI (L3)
  AI_CHAT: 'ai.chat',
  AI_PREDICTIONS: 'ai.predictions',

  // Audit (L3)
  AUDIT_VIEW: 'audit.view',

  // E-Invoice
  EINVOICE_VIEW: 'einvoice.view',
  EINVOICE_CREATE: 'einvoice.create',
  EINVOICE_SUBMIT: 'einvoice.submit',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

/**
 * Role-based default permissions
 */
export const RolePermissions: Record<string, Permission[]> = {
  ADMIN: [
    Permissions.DASHBOARD_VIEW,
    Permissions.USERS_VIEW,
    Permissions.USERS_CREATE,
    Permissions.USERS_EDIT,
    Permissions.USERS_DELETE,
    Permissions.ROLES_VIEW,
    Permissions.ROLES_CREATE,
    Permissions.ROLES_EDIT,
    Permissions.ROLES_DELETE,
    Permissions.PRODUCTS_VIEW,
    Permissions.PRODUCTS_CREATE,
    Permissions.PRODUCTS_EDIT,
    Permissions.PRODUCTS_DELETE,
    Permissions.CATEGORIES_VIEW,
    Permissions.CATEGORIES_CREATE,
    Permissions.CATEGORIES_EDIT,
    Permissions.CATEGORIES_DELETE,
    Permissions.INVENTORY_VIEW,
    Permissions.INVENTORY_ADJUST,
    Permissions.INVENTORY_TRANSFER,
    Permissions.WAREHOUSES_VIEW,
    Permissions.WAREHOUSES_MANAGE,
    Permissions.CUSTOMERS_VIEW,
    Permissions.CUSTOMERS_CREATE,
    Permissions.CUSTOMERS_EDIT,
    Permissions.CUSTOMERS_DELETE,
    Permissions.SUPPLIERS_VIEW,
    Permissions.SUPPLIERS_MANAGE,
    Permissions.ORDERS_VIEW,
    Permissions.ORDERS_CREATE,
    Permissions.ORDERS_EDIT,
    Permissions.ORDERS_CANCEL,
    Permissions.ORDERS_APPROVE,
    Permissions.INVOICES_VIEW,
    Permissions.INVOICES_CREATE,
    Permissions.INVOICES_EDIT,
    Permissions.INVOICES_DELETE,
    Permissions.INVOICES_PRINT,
    Permissions.PAYMENTS_VIEW,
    Permissions.PAYMENTS_RECORD,
    Permissions.PURCHASING_VIEW,
    Permissions.PURCHASING_CREATE,
    Permissions.PURCHASING_APPROVE,
    Permissions.REPORTS_VIEW,
    Permissions.REPORTS_EXPORT,
    Permissions.FORECASTING_VIEW,
    Permissions.SETTINGS_VIEW,
    Permissions.SETTINGS_EDIT,
    Permissions.SETTINGS_USERS,
    Permissions.SETTINGS_COMPANY,
    Permissions.AI_CHAT,
    Permissions.AI_PREDICTIONS,
    Permissions.AUDIT_VIEW,
    Permissions.EINVOICE_VIEW,
    Permissions.EINVOICE_CREATE,
    Permissions.EINVOICE_SUBMIT,
  ],
  MANAGER: [
    Permissions.DASHBOARD_VIEW,
    Permissions.USERS_VIEW,
    Permissions.PRODUCTS_VIEW,
    Permissions.PRODUCTS_CREATE,
    Permissions.PRODUCTS_EDIT,
    Permissions.CATEGORIES_VIEW,
    Permissions.INVENTORY_VIEW,
    Permissions.INVENTORY_ADJUST,
    Permissions.INVENTORY_TRANSFER,
    Permissions.WAREHOUSES_VIEW,
    Permissions.CUSTOMERS_VIEW,
    Permissions.CUSTOMERS_CREATE,
    Permissions.CUSTOMERS_EDIT,
    Permissions.SUPPLIERS_VIEW,
    Permissions.SUPPLIERS_MANAGE,
    Permissions.ORDERS_VIEW,
    Permissions.ORDERS_CREATE,
    Permissions.ORDERS_EDIT,
    Permissions.ORDERS_APPROVE,
    Permissions.INVOICES_VIEW,
    Permissions.INVOICES_CREATE,
    Permissions.INVOICES_PRINT,
    Permissions.PAYMENTS_VIEW,
    Permissions.PAYMENTS_RECORD,
    Permissions.REPORTS_VIEW,
    Permissions.REPORTS_EXPORT,
    Permissions.FORECASTING_VIEW,
  ],
  USER: [
    Permissions.DASHBOARD_VIEW,
    Permissions.PRODUCTS_VIEW,
    Permissions.CATEGORIES_VIEW,
    Permissions.INVENTORY_VIEW,
    Permissions.WAREHOUSES_VIEW,
    Permissions.CUSTOMERS_VIEW,
    Permissions.CUSTOMERS_CREATE,
    Permissions.SUPPLIERS_VIEW,
    Permissions.ORDERS_VIEW,
    Permissions.ORDERS_CREATE,
    Permissions.INVOICES_VIEW,
    Permissions.INVOICES_CREATE,
    Permissions.PAYMENTS_VIEW,
    Permissions.REPORTS_VIEW,
  ],
  VIEWER: [
    Permissions.DASHBOARD_VIEW,
    Permissions.PRODUCTS_VIEW,
    Permissions.CATEGORIES_VIEW,
    Permissions.INVENTORY_VIEW,
    Permissions.WAREHOUSES_VIEW,
    Permissions.CUSTOMERS_VIEW,
    Permissions.SUPPLIERS_VIEW,
    Permissions.ORDERS_VIEW,
    Permissions.INVOICES_VIEW,
    Permissions.PAYMENTS_VIEW,
    Permissions.REPORTS_VIEW,
  ],
};

/**
 * Check if a permission string is valid
 */
export function isValidPermission(permission: string): permission is Permission {
  return Object.values(Permissions).includes(permission as Permission);
}

/**
 * Get permissions for a role
 */
export function getPermissionsForRole(role: string): Permission[] {
  return RolePermissions[role] || [];
}
