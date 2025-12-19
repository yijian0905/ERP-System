import type { LicenseFeatures, LicenseTier } from '@erp/shared-types';
import {
  BarChart3,
  Building2,
  ClipboardList,
  Computer,
  CreditCard,
  DollarSign,
  History,
  Home,
  type LucideIcon,
  Package,
  PieChart,
  Send,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';

/**
 * Navigation item definition
 */
export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  /** Required tier to see this item */
  requiredTier?: LicenseTier;
  /** Required feature to see this item */
  requiredFeature?: keyof LicenseFeatures;
  /** Required permission(s) to see this item - any match grants access */
  requiredPermissions?: string[];
  /** Child items for nested navigation */
  children?: NavItem[];
}

/**
 * Navigation group definition
 */
export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

/**
 * Main navigation configuration
 * Reorganized to follow logical business flow:
 * 1. Dashboard (Overview)
 * 2. Core Business Operations (Inventory, Sales, Purchasing)
 * 3. Operational Management (Requisitions, Cost Centers, Assets)
 * 4. Analytics & Intelligence (Reports, Forecasting, AI)
 * 5. Compliance & Settings (E-Invoice, Audit, Settings)
 */
export const navigationConfig: NavGroup[] = [
  // ========== OVERVIEW ==========
  {
    id: 'main',
    title: 'Main',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        requiredPermissions: ['dashboard.view'],
      },
    ],
  },

  // ========== INVENTORY MANAGEMENT ==========
  {
    id: 'inventory',
    title: 'Inventory Management',
    items: [
      {
        id: 'products',
        title: 'Products',
        href: '/products',
        icon: Package,
        requiredPermissions: ['products.view'],
      },
      {
        id: 'inventory',
        title: 'Stock',
        href: '/inventory',
        icon: Warehouse,
        requiredPermissions: ['inventory.view'],
        children: [
          {
            id: 'inventory-overview',
            title: 'Overview',
            href: '/inventory',
            icon: Warehouse,
            requiredPermissions: ['inventory.view'],
          },
          {
            id: 'inventory-movements',
            title: 'Movements',
            href: '/inventory/movements',
            icon: Truck,
            requiredPermissions: ['inventory.view'],
          },
          {
            id: 'inventory-adjustments',
            title: 'Adjustments',
            href: '/inventory/adjustments',
            icon: ClipboardList,
            requiredPermissions: ['inventory.adjust'],
          },
        ],
      },
      {
        id: 'warehouses',
        title: 'Warehouses',
        href: '/warehouses',
        icon: Building2,
        requiredFeature: 'multiWarehouse',
        requiredPermissions: ['warehouses.view'],
      },
    ],
  },

  // ========== SALES & CUSTOMER MANAGEMENT ==========
  {
    id: 'sales',
    title: 'Sales & Customer',
    items: [
      {
        id: 'customers',
        title: 'Customers',
        href: '/customers',
        icon: Users,
        requiredPermissions: ['customers.view'],
      },
      {
        id: 'orders',
        title: 'Orders',
        href: '/orders',
        icon: ShoppingCart,
        requiredPermissions: ['orders.view', 'purchasing.view'],
      },
      {
        id: 'payments',
        title: 'Payments',
        href: '/payments',
        icon: CreditCard,
        requiredPermissions: ['payments.view'],
      },
    ],
  },

  // ========== PURCHASING & SUPPLIER MANAGEMENT ==========
  {
    id: 'purchasing',
    title: 'Purchasing & Supplier',
    items: [
      {
        id: 'suppliers',
        title: 'Suppliers',
        href: '/suppliers',
        icon: Truck,
        requiredPermissions: ['suppliers.view'],
      },
    ],
  },

  // ========== OPERATIONS ==========
  {
    id: 'operations',
    title: 'Operations',
    items: [
      {
        id: 'requisitions',
        title: 'Requisitions',
        href: '/requisitions',
        icon: Send,
        requiredPermissions: ['requisitions.view'],
      },
      {
        id: 'cost-centers',
        title: 'Cost Centers',
        href: '/cost-centers',
        icon: PieChart,
        requiredPermissions: ['cost-centers.view'],
      },
      {
        id: 'assets',
        title: 'Assets',
        href: '/assets',
        icon: Computer,
        requiredPermissions: ['assets.view'],
      },
    ],
  },

  // ========== ANALYTICS & INTELLIGENCE ==========
  {
    id: 'analytics',
    title: 'Analytics & Intelligence',
    items: [
      {
        id: 'reports',
        title: 'Reports',
        href: '/reports',
        icon: BarChart3,
        requiredPermissions: ['reports.view'],
        children: [
          {
            id: 'reports-sales',
            title: 'Sales Report',
            href: '/reports/sales',
            icon: BarChart3,
            requiredPermissions: ['reports.view'],
          },
          {
            id: 'reports-inventory',
            title: 'Inventory Report',
            href: '/reports/inventory',
            icon: BarChart3,
            requiredPermissions: ['reports.view'],
          },
          {
            id: 'reports-cost-accounting',
            title: 'Cost Accounting',
            href: '/reports/cost-accounting',
            icon: DollarSign,
            requiredPermissions: ['reports.view'],
          },
          {
            id: 'reports-financial',
            title: 'Financial Report',
            href: '/reports/financial',
            icon: BarChart3,
            requiredFeature: 'advancedReports',
            requiredPermissions: ['reports.view'],
          },
        ],
      },
      {
        id: 'forecasting',
        title: 'Forecasting',
        href: '/forecasting',
        icon: Sparkles,
        requiredTier: 'L2',
        requiredFeature: 'demandForecasting',
        requiredPermissions: ['forecasting.view'],
      },
      {
        id: 'ai-chat',
        title: 'AI Assistant',
        href: '/ai/chat',
        icon: Sparkles,
        requiredTier: 'L3',
        requiredFeature: 'aiChatAssistant',
        requiredPermissions: ['ai.chat'],
      },
    ],
  },

  // ========== COMPLIANCE & ADMINISTRATION ==========
  {
    id: 'compliance',
    title: 'Compliance & Admin',
    items: [
      {
        id: 'audit-logs',
        title: 'Audit Logs',
        href: '/audit',
        icon: History,
        requiredTier: 'L3',
        requiredPermissions: ['audit.view'],
      },
    ],
  },
];

/**
 * Get flat list of all navigation items
 */
export function getAllNavItems(): NavItem[] {
  const items: NavItem[] = [];

  function collectItems(navItems: NavItem[]) {
    for (const item of navItems) {
      items.push(item);
      if (item.children) {
        collectItems(item.children);
      }
    }
  }

  for (const group of navigationConfig) {
    collectItems(group.items);
  }

  return items;
}

/**
 * Find navigation item by href
 */
export function findNavItemByHref(href: string): NavItem | undefined {
  return getAllNavItems().find((item) => item.href === href);
}

/**
 * Check if user can access a navigation item based on tier/features
 */
export function canAccessNavItem(
  item: NavItem,
  tier: LicenseTier,
  features: Partial<LicenseFeatures>,
  userPermissions?: string[]
): boolean {
  // Check tier requirement
  if (item.requiredTier) {
    const tierHierarchy: Record<LicenseTier, number> = { L1: 1, L2: 2, L3: 3 };
    if (tierHierarchy[tier] < tierHierarchy[item.requiredTier]) {
      return false;
    }
  }

  // Check feature requirement
  if (item.requiredFeature && !features[item.requiredFeature]) {
    return false;
  }

  // Check permission requirement
  if (item.requiredPermissions && item.requiredPermissions.length > 0 && userPermissions) {
    // User needs at least one of the required permissions
    const hasPermission = item.requiredPermissions.some((p) => userPermissions.includes(p));
    if (!hasPermission) {
      return false;
    }
  }

  return true;
}

/**
 * Filter navigation config based on user access
 */
export function filterNavigationByPermissions(
  config: NavGroup[],
  tier: LicenseTier,
  features: Partial<LicenseFeatures>,
  userPermissions: string[]
): NavGroup[] {
  return config
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => canAccessNavItem(item, tier, features, userPermissions))
        .map((item) => ({
          ...item,
          children: item.children?.filter((child) =>
            canAccessNavItem(child, tier, features, userPermissions)
          ),
        }))
        .filter((item) => !item.children || item.children.length > 0),
    }))
    .filter((group) => group.items.length > 0);
}
