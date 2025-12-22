import type { LicenseTier, UserRole } from './entities';

// Re-export types for convenience
export type { LicenseTier, UserRole } from './entities';

/**
 * JWT token payload structure
 */
export interface TokenPayload {
  userId: string;
  tenantId: string;
  tier: LicenseTier;
  role: UserRole;
  permissions: string[];
  iat?: number;
  exp?: number;
}

/**
 * Refresh token payload
 */
export interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Login request body
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login response with tokens
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

/**
 * Authenticated user info
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: UserRole;
  roleId?: string | null;
  roleName?: string | null;
  roleDisplayName?: string | null;
  tenantId: string;
  tenantName: string;
  tier: LicenseTier;
  permissions: string[];
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

/**
 * Change password request (authenticated user)
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Registration request
 */
export interface RegisterRequest {
  tenantName: string;
  tenantSlug: string;
  name: string;
  email: string;
  password: string;
  tier?: LicenseTier;
}

/**
 * Registration response
 */
export interface RegisterResponse {
  tenantId: string;
  userId: string;
  message: string;
}

/**
 * Session info
 */
export interface SessionInfo {
  id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

/**
 * Permission definitions
 */
export const PERMISSIONS = {
  // User management
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // Role management
  ROLES_VIEW: 'roles:view',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',
  
  // Product management
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  
  // Inventory management
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_TRANSFER: 'inventory:transfer',
  
  // Customer management
  CUSTOMERS_VIEW: 'customers:view',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',
  
  // Supplier management
  SUPPLIERS_VIEW: 'suppliers:view',
  SUPPLIERS_CREATE: 'suppliers:create',
  SUPPLIERS_UPDATE: 'suppliers:update',
  SUPPLIERS_DELETE: 'suppliers:delete',
  
  // Order management
  ORDERS_VIEW: 'orders:view',
  ORDERS_CREATE: 'orders:create',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_DELETE: 'orders:delete',
  ORDERS_APPROVE: 'orders:approve',
  
  // Invoice management
  INVOICES_VIEW: 'invoices:view',
  INVOICES_CREATE: 'invoices:create',
  INVOICES_UPDATE: 'invoices:update',
  INVOICES_DELETE: 'invoices:delete',
  INVOICES_SEND: 'invoices:send',
  
  // Payment management
  PAYMENTS_VIEW: 'payments:view',
  PAYMENTS_CREATE: 'payments:create',
  PAYMENTS_UPDATE: 'payments:update',
  
  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  
  // Audit logs (L3)
  AUDIT_VIEW: 'audit:view',
  
  // AI features (L2/L3)
  AI_PREDICTIONS: 'ai:predictions',
  AI_CHAT: 'ai:chat',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Legacy role-based permissions (for backward compatibility when custom roles not assigned)
 * When users have a custom role assigned (roleId), permissions come from that role instead
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS),
  MANAGER: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.ROLES_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_TRANSFER,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_CREATE,
    PERMISSIONS.SUPPLIERS_UPDATE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_APPROVE,
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.INVOICES_UPDATE,
    PERMISSIONS.INVOICES_SEND,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.AI_PREDICTIONS,
  ],
  USER: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.INVOICES_CREATE,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  VIEWER: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.INVOICES_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

/**
 * Check if a role has a permission (legacy)
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Get all permissions for a role (legacy)
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * All permissions grouped by module for UI display
 */
export const PERMISSION_MODULES = {
  users: {
    name: 'User Management',
    permissions: [
      { code: PERMISSIONS.USERS_VIEW, name: 'View Users', description: 'Can view user list and details' },
      { code: PERMISSIONS.USERS_CREATE, name: 'Create Users', description: 'Can create new users' },
      { code: PERMISSIONS.USERS_UPDATE, name: 'Update Users', description: 'Can update user information' },
      { code: PERMISSIONS.USERS_DELETE, name: 'Delete Users', description: 'Can delete users' },
    ],
  },
  roles: {
    name: 'Role Management',
    permissions: [
      { code: PERMISSIONS.ROLES_VIEW, name: 'View Roles', description: 'Can view roles and permissions' },
      { code: PERMISSIONS.ROLES_CREATE, name: 'Create Roles', description: 'Can create new roles' },
      { code: PERMISSIONS.ROLES_UPDATE, name: 'Update Roles', description: 'Can update role permissions' },
      { code: PERMISSIONS.ROLES_DELETE, name: 'Delete Roles', description: 'Can delete custom roles' },
    ],
  },
  products: {
    name: 'Product Management',
    permissions: [
      { code: PERMISSIONS.PRODUCTS_VIEW, name: 'View Products', description: 'Can view product catalog' },
      { code: PERMISSIONS.PRODUCTS_CREATE, name: 'Create Products', description: 'Can create new products' },
      { code: PERMISSIONS.PRODUCTS_UPDATE, name: 'Update Products', description: 'Can update product information' },
      { code: PERMISSIONS.PRODUCTS_DELETE, name: 'Delete Products', description: 'Can delete products' },
    ],
  },
  inventory: {
    name: 'Inventory Management',
    permissions: [
      { code: PERMISSIONS.INVENTORY_VIEW, name: 'View Inventory', description: 'Can view inventory levels' },
      { code: PERMISSIONS.INVENTORY_ADJUST, name: 'Adjust Inventory', description: 'Can make inventory adjustments' },
      { code: PERMISSIONS.INVENTORY_TRANSFER, name: 'Transfer Inventory', description: 'Can transfer stock between warehouses' },
    ],
  },
  customers: {
    name: 'Customer Management',
    permissions: [
      { code: PERMISSIONS.CUSTOMERS_VIEW, name: 'View Customers', description: 'Can view customer list' },
      { code: PERMISSIONS.CUSTOMERS_CREATE, name: 'Create Customers', description: 'Can create new customers' },
      { code: PERMISSIONS.CUSTOMERS_UPDATE, name: 'Update Customers', description: 'Can update customer information' },
      { code: PERMISSIONS.CUSTOMERS_DELETE, name: 'Delete Customers', description: 'Can delete customers' },
    ],
  },
  suppliers: {
    name: 'Supplier Management',
    permissions: [
      { code: PERMISSIONS.SUPPLIERS_VIEW, name: 'View Suppliers', description: 'Can view supplier list' },
      { code: PERMISSIONS.SUPPLIERS_CREATE, name: 'Create Suppliers', description: 'Can create new suppliers' },
      { code: PERMISSIONS.SUPPLIERS_UPDATE, name: 'Update Suppliers', description: 'Can update supplier information' },
      { code: PERMISSIONS.SUPPLIERS_DELETE, name: 'Delete Suppliers', description: 'Can delete suppliers' },
    ],
  },
  orders: {
    name: 'Order Management',
    permissions: [
      { code: PERMISSIONS.ORDERS_VIEW, name: 'View Orders', description: 'Can view orders' },
      { code: PERMISSIONS.ORDERS_CREATE, name: 'Create Orders', description: 'Can create new orders' },
      { code: PERMISSIONS.ORDERS_UPDATE, name: 'Update Orders', description: 'Can update orders' },
      { code: PERMISSIONS.ORDERS_DELETE, name: 'Delete Orders', description: 'Can delete orders' },
      { code: PERMISSIONS.ORDERS_APPROVE, name: 'Approve Orders', description: 'Can approve pending orders' },
    ],
  },
  invoices: {
    name: 'Invoice Management',
    permissions: [
      { code: PERMISSIONS.INVOICES_VIEW, name: 'View Invoices', description: 'Can view invoices' },
      { code: PERMISSIONS.INVOICES_CREATE, name: 'Create Invoices', description: 'Can create new invoices' },
      { code: PERMISSIONS.INVOICES_UPDATE, name: 'Update Invoices', description: 'Can update invoices' },
      { code: PERMISSIONS.INVOICES_DELETE, name: 'Delete Invoices', description: 'Can delete invoices' },
      { code: PERMISSIONS.INVOICES_SEND, name: 'Send Invoices', description: 'Can send invoices to customers' },
    ],
  },
  payments: {
    name: 'Payment Management',
    permissions: [
      { code: PERMISSIONS.PAYMENTS_VIEW, name: 'View Payments', description: 'Can view payment records' },
      { code: PERMISSIONS.PAYMENTS_CREATE, name: 'Create Payments', description: 'Can record payments' },
      { code: PERMISSIONS.PAYMENTS_UPDATE, name: 'Update Payments', description: 'Can update payment records' },
    ],
  },
  reports: {
    name: 'Reports',
    permissions: [
      { code: PERMISSIONS.REPORTS_VIEW, name: 'View Reports', description: 'Can view reports and analytics' },
      { code: PERMISSIONS.REPORTS_EXPORT, name: 'Export Reports', description: 'Can export reports to file' },
    ],
  },
  settings: {
    name: 'Settings',
    permissions: [
      { code: PERMISSIONS.SETTINGS_VIEW, name: 'View Settings', description: 'Can view system settings' },
      { code: PERMISSIONS.SETTINGS_UPDATE, name: 'Update Settings', description: 'Can modify system settings' },
    ],
  },
  audit: {
    name: 'Audit Logs',
    permissions: [
      { code: PERMISSIONS.AUDIT_VIEW, name: 'View Audit Logs', description: 'Can view audit trail' },
    ],
  },
  ai: {
    name: 'AI Features',
    permissions: [
      { code: PERMISSIONS.AI_PREDICTIONS, name: 'AI Predictions', description: 'Can use predictive analytics' },
      { code: PERMISSIONS.AI_CHAT, name: 'AI Chat Assistant', description: 'Can use AI chat assistant' },
    ],
  },
} as const;

/**
 * Flat list of all permission codes
 */
export const ALL_PERMISSION_CODES = Object.values(PERMISSIONS);
