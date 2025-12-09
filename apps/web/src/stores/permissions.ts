import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Permission categories and their specific permissions
 */
export const PERMISSION_CATEGORIES = {
  dashboard: {
    label: 'Dashboard',
    permissions: {
      'dashboard.view': 'View Dashboard',
    },
  },
  products: {
    label: 'Products',
    permissions: {
      'products.view': 'View Products',
      'products.create': 'Create Products',
      'products.edit': 'Edit Products',
      'products.delete': 'Delete Products',
    },
  },
  inventory: {
    label: 'Inventory',
    permissions: {
      'inventory.view': 'View Inventory',
      'inventory.adjust': 'Adjust Stock',
      'inventory.transfer': 'Transfer Stock',
    },
  },
  warehouses: {
    label: 'Warehouses',
    permissions: {
      'warehouses.view': 'View Warehouses',
      'warehouses.manage': 'Manage Warehouses',
    },
  },
  customers: {
    label: 'Customers',
    permissions: {
      'customers.view': 'View Customers',
      'customers.create': 'Create Customers',
      'customers.edit': 'Edit Customers',
      'customers.delete': 'Delete Customers',
    },
  },
  orders: {
    label: 'Orders',
    permissions: {
      'orders.view': 'View Orders',
      'orders.create': 'Create Orders',
      'orders.edit': 'Edit Orders',
      'orders.cancel': 'Cancel Orders',
    },
  },
  invoices: {
    label: 'Invoices',
    permissions: {
      'invoices.view': 'View Invoices',
      'invoices.create': 'Create Invoices',
      'invoices.print': 'Print Invoices',
    },
  },
  payments: {
    label: 'Payments',
    permissions: {
      'payments.view': 'View Payments',
      'payments.record': 'Record Payments',
    },
  },
  suppliers: {
    label: 'Suppliers',
    permissions: {
      'suppliers.view': 'View Suppliers',
      'suppliers.manage': 'Manage Suppliers',
    },
  },
  purchasing: {
    label: 'Purchasing',
    permissions: {
      'purchasing.view': 'View Purchase Orders',
      'purchasing.create': 'Create Purchase Orders',
      'purchasing.approve': 'Approve Purchase Orders',
    },
  },
  requisitions: {
    label: 'Requisitions',
    permissions: {
      'requisitions.view': 'View Requisitions',
      'requisitions.create': 'Create Requisitions',
      'requisitions.approve': 'Approve Requisitions',
    },
  },
  costCenters: {
    label: 'Cost Centers',
    permissions: {
      'cost-centers.view': 'View Cost Centers',
      'cost-centers.manage': 'Manage Cost Centers',
    },
  },
  assets: {
    label: 'Assets',
    permissions: {
      'assets.view': 'View Assets',
      'assets.manage': 'Manage Assets',
    },
  },
  recurring: {
    label: 'Recurring Revenue',
    permissions: {
      'recurring.view': 'View Recurring Revenue',
      'recurring.manage': 'Manage Recurring Revenue',
    },
  },
  reports: {
    label: 'Reports',
    permissions: {
      'reports.view': 'View Reports',
      'reports.export': 'Export Reports',
    },
  },
  forecasting: {
    label: 'Forecasting',
    permissions: {
      'forecasting.view': 'View Forecasting',
    },
  },
  aiAssistant: {
    label: 'AI Assistant',
    permissions: {
      'ai.chat': 'Use AI Chat Assistant',
    },
  },
  settings: {
    label: 'Settings',
    permissions: {
      'settings.view': 'View Settings',
      'settings.edit': 'Edit Settings',
      'settings.users': 'Manage Users & Roles',
      'settings.company': 'Manage Company Settings',
    },
  },
  auditLogs: {
    label: 'Audit Logs',
    permissions: {
      'audit.view': 'View Audit Logs',
      'audit.export': 'Export Audit Logs',
    },
  },
} as const;

/**
 * Get all permission keys
 */
export function getAllPermissions(): string[] {
  const permissions: string[] = [];
  Object.values(PERMISSION_CATEGORIES).forEach((category) => {
    permissions.push(...Object.keys(category.permissions));
  });
  return permissions;
}

/**
 * Role type
 */
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER' | 'CUSTOM';

/**
 * Role configuration with default permissions
 */
export const ROLE_PERMISSIONS: Record<Exclude<UserRole, 'CUSTOM'>, string[]> = {
  ADMIN: getAllPermissions(), // Full access
  MANAGER: [
    'dashboard.view',
    'products.view', 'products.create', 'products.edit',
    'inventory.view', 'inventory.adjust', 'inventory.transfer',
    'warehouses.view', 'warehouses.manage',
    'customers.view', 'customers.create', 'customers.edit',
    'orders.view', 'orders.create', 'orders.edit', 'orders.cancel',
    'invoices.view', 'invoices.create', 'invoices.print',
    'payments.view', 'payments.record',
    'suppliers.view', 'suppliers.manage',
    'purchasing.view', 'purchasing.create', 'purchasing.approve',
    'requisitions.view', 'requisitions.create', 'requisitions.approve',
    'cost-centers.view', 'cost-centers.manage',
    'assets.view', 'assets.manage',
    'recurring.view', 'recurring.manage',
    'reports.view', 'reports.export',
    'forecasting.view',
    'settings.view',
    'audit.view',
  ],
  USER: [
    'dashboard.view',
    'products.view',
    'inventory.view', 'inventory.adjust',
    'warehouses.view',
    'customers.view', 'customers.create', 'customers.edit',
    'orders.view', 'orders.create',
    'invoices.view', 'invoices.print',
    'payments.view',
    'suppliers.view',
    'purchasing.view', 'purchasing.create',
    'requisitions.view', 'requisitions.create',
    'cost-centers.view',
    'assets.view',
    'recurring.view',
    'reports.view',
    'settings.view',
  ],
  VIEWER: [
    'dashboard.view',
    'products.view',
    'inventory.view',
    'warehouses.view',
    'customers.view',
    'orders.view',
    'invoices.view',
    'payments.view',
    'suppliers.view',
    'purchasing.view',
    'requisitions.view',
    'cost-centers.view',
    'assets.view',
    'recurring.view',
    'reports.view',
    'settings.view',
  ],
};

/**
 * Map navigation paths to required permissions
 */
export const PATH_PERMISSIONS: Record<string, string[]> = {
  '/dashboard': ['dashboard.view'],
  '/products': ['products.view'],
  '/products/categories': ['products.view'],
  '/inventory': ['inventory.view'],
  '/inventory/movements': ['inventory.view'],
  '/inventory/adjustments': ['inventory.adjust'],
  '/warehouses': ['warehouses.view'],
  '/customers': ['customers.view'],
  '/orders': ['orders.view'],
  '/orders/sales': ['orders.view'],
  '/orders/purchase': ['purchasing.view'],
  '/invoices': ['invoices.view'],
  '/payments': ['payments.view'],
  '/suppliers': ['suppliers.view'],
  '/requisitions': ['requisitions.view'],
  '/cost-centers': ['cost-centers.view'],
  '/assets': ['assets.view'],
  '/recurring': ['recurring.view'],
  '/reports': ['reports.view'],
  '/reports/sales': ['reports.view'],
  '/reports/inventory': ['reports.view'],
  '/reports/cost-accounting': ['reports.view'],
  '/reports/financial': ['reports.view'],
  '/forecasting': ['forecasting.view'],
  '/ai/chat': ['ai.chat'],
  '/settings': ['settings.view'],
  '/settings/profile': ['settings.view'],
  '/settings/notifications': ['settings.view'],
  '/settings/appearance': ['settings.view'],
  '/settings/company': ['settings.company'],
  '/settings/users': ['settings.users'],
  '/settings/roles': ['settings.users'],
  '/settings/localization': ['settings.view'],
  '/audit': ['audit.view'],
};

/**
 * User with permissions
 */
export interface UserWithPermissions {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  department?: string;
  position?: string;
  lastLogin: string | null;
  createdAt: string;
}

/**
 * Permissions store state
 */
interface PermissionsState {
  users: UserWithPermissions[];
  currentUserPermissions: string[];
}

interface PermissionsActions {
  setCurrentUserPermissions: (permissions: string[]) => void;
  setUsers: (users: UserWithPermissions[]) => void;
  addUser: (user: UserWithPermissions) => void;
  updateUser: (id: string, updates: Partial<UserWithPermissions>) => void;
  deleteUser: (id: string) => void;
  updateUserRole: (id: string, role: UserRole, customPermissions?: string[]) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccessPath: (path: string) => boolean;
  getPermissionsForRole: (role: UserRole) => string[];
}

type PermissionsStore = PermissionsState & PermissionsActions;

// Mock users data
const mockUsers: UserWithPermissions[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@demo-company.com',
    role: 'ADMIN',
    permissions: ROLE_PERMISSIONS.ADMIN,
    isActive: true,
    department: 'Management',
    position: 'System Administrator',
    lastLogin: '2024-12-07T10:30:00Z',
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Manager User',
    email: 'manager@demo-company.com',
    role: 'MANAGER',
    permissions: ROLE_PERMISSIONS.MANAGER,
    isActive: true,
    department: 'Operations',
    position: 'Operations Manager',
    lastLogin: '2024-12-07T09:15:00Z',
    createdAt: '2024-02-15',
  },
  {
    id: '3',
    name: 'Sales Rep',
    email: 'sales@demo-company.com',
    role: 'USER',
    permissions: ROLE_PERMISSIONS.USER,
    isActive: true,
    department: 'Sales',
    position: 'Sales Representative',
    lastLogin: '2024-12-06T16:20:00Z',
    createdAt: '2024-03-20',
  },
  {
    id: '4',
    name: 'Warehouse Staff',
    email: 'warehouse@demo-company.com',
    role: 'CUSTOM',
    permissions: [
      'dashboard.view',
      'products.view',
      'inventory.view', 'inventory.adjust', 'inventory.transfer',
      'warehouses.view',
      'purchasing.view',
    ],
    isActive: true,
    department: 'Warehouse',
    position: 'Warehouse Associate',
    lastLogin: '2024-12-05T14:00:00Z',
    createdAt: '2024-04-10',
  },
  {
    id: '5',
    name: 'Report Viewer',
    email: 'viewer@demo-company.com',
    role: 'VIEWER',
    permissions: ROLE_PERMISSIONS.VIEWER,
    isActive: false,
    department: 'Finance',
    position: 'Financial Analyst',
    lastLogin: '2024-11-20T11:00:00Z',
    createdAt: '2024-05-05',
  },
];

export const usePermissionsStore = create<PermissionsStore>()(
  persist(
    (set, get) => ({
      users: mockUsers,
      currentUserPermissions: ROLE_PERMISSIONS.ADMIN, // Default to admin for demo

      setCurrentUserPermissions: (permissions) => {
        set({ currentUserPermissions: permissions });
      },

      setUsers: (users) => {
        set({ users });
      },

      addUser: (user) => {
        set((state) => ({ users: [...state.users, user] }));
      },

      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, ...updates } : u
          ),
        }));
      },

      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        }));
      },

      updateUserRole: (id, role, customPermissions) => {
        const permissions = role === 'CUSTOM' 
          ? (customPermissions || [])
          : ROLE_PERMISSIONS[role];
        
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, role, permissions } : u
          ),
        }));
      },

      hasPermission: (permission) => {
        const { currentUserPermissions } = get();
        return currentUserPermissions.includes(permission);
      },

      hasAnyPermission: (permissions) => {
        const { currentUserPermissions } = get();
        return permissions.some((p) => currentUserPermissions.includes(p));
      },

      hasAllPermissions: (permissions) => {
        const { currentUserPermissions } = get();
        return permissions.every((p) => currentUserPermissions.includes(p));
      },

      canAccessPath: (path) => {
        const { currentUserPermissions } = get();
        const requiredPermissions = PATH_PERMISSIONS[path];
        
        // If no permissions defined for path, allow access
        if (!requiredPermissions || requiredPermissions.length === 0) {
          return true;
        }
        
        // Check if user has any of the required permissions
        return requiredPermissions.some((p) => currentUserPermissions.includes(p));
      },

      getPermissionsForRole: (role) => {
        if (role === 'CUSTOM') return [];
        return ROLE_PERMISSIONS[role] || [];
      },
    }),
    {
      name: 'erp-permissions',
      partialize: (state) => ({
        users: state.users,
        currentUserPermissions: state.currentUserPermissions,
      }),
    }
  )
);

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(permission: string): boolean {
  return usePermissionsStore((state) => state.hasPermission(permission));
}

/**
 * Hook to check if user can access a path
 */
export function useCanAccessPath(path: string): boolean {
  return usePermissionsStore((state) => state.canAccessPath(path));
}

/**
 * Hook to get all current permissions
 */
export function useCurrentPermissions(): string[] {
  return usePermissionsStore((state) => state.currentUserPermissions);
}
