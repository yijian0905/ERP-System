import { createFileRoute, Link, useLocation } from '@tanstack/react-router';
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Copy,
  Edit,
  Globe,
  Loader2,
  MoreHorizontal,
  Palette,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldPlus,
  Sparkles,
  Trash2,
  UserCog,
  Users,
  Warehouse,
} from 'lucide-react';
import { useState } from 'react';

import { PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { PERMISSION_CATEGORIES } from '@/stores/permissions';

export const Route = createFileRoute('/_dashboard/settings/roles')({
  component: RolesManagementPage,
});

// Settings tabs navigation
const settingsTabs = [
  { id: 'general', title: 'General', href: '/settings', icon: Settings },
  { id: 'profile', title: 'Profile', href: '/settings/profile', icon: Users },
  { id: 'notifications', title: 'Notifications', href: '/settings/notifications', icon: Bell },
  { id: 'appearance', title: 'Appearance', href: '/settings/appearance', icon: Palette },
  { id: 'company', title: 'Company', href: '/settings/company', icon: Building2 },
  { id: 'users', title: 'Users', href: '/settings/users', icon: Users },
  { id: 'roles', title: 'Roles & Permissions', href: '/settings/roles', icon: Shield },
  { id: 'localization', title: 'Localization', href: '/settings/localization', icon: Globe },
  { id: 'currencies', title: 'Currencies', href: '/settings/currencies', icon: CircleDollarSign },
];

// Role color options
const ROLE_COLORS = [
  { name: 'red', label: 'Red', class: 'bg-red-500' },
  { name: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { name: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { name: 'green', label: 'Green', class: 'bg-green-500' },
  { name: 'teal', label: 'Teal', class: 'bg-teal-500' },
  { name: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { name: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { name: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { name: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { name: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { name: 'gray', label: 'Gray', class: 'bg-gray-500' },
];

// Role templates for quick creation
const ROLE_TEMPLATES = {
  warehouse_manager: {
    name: 'warehouse_manager',
    displayName: 'Warehouse Manager',
    description: 'Manages inventory and warehouse operations',
    color: 'orange',
    icon: Warehouse,
    permissions: [
      'dashboard.view',
      'products.view',
      'inventory.view',
      'inventory.adjust',
      'inventory.transfer',
      'warehouses.view',
      'warehouses.manage',
      'suppliers.view',
      'purchasing.view',
      'reports.view',
    ],
  },
  hr_manager: {
    name: 'hr_manager',
    displayName: 'HR Manager',
    description: 'Manages users and access permissions',
    color: 'purple',
    icon: UserCog,
    permissions: [
      'dashboard.view',
      'settings.view',
      'settings.users',
      'audit.view',
    ],
  },
  sales_rep: {
    name: 'sales_rep',
    displayName: 'Sales Representative',
    description: 'Handles sales orders and customer relationships',
    color: 'cyan',
    icon: Users,
    permissions: [
      'dashboard.view',
      'products.view',
      'inventory.view',
      'customers.view',
      'customers.create',
      'customers.edit',
      'orders.view',
      'orders.create',
      'orders.edit',
      'invoices.view',
      'invoices.create',
      'invoices.print',
      'payments.view',
      'reports.view',
    ],
  },
  accountant: {
    name: 'accountant',
    displayName: 'Accountant',
    description: 'Manages invoices, payments, and financial reports',
    color: 'teal',
    icon: Shield,
    permissions: [
      'dashboard.view',
      'customers.view',
      'invoices.view',
      'invoices.create',
      'invoices.print',
      'payments.view',
      'payments.record',
      'reports.view',
      'reports.export',
      'cost-centers.view',
      'cost-centers.manage',
    ],
  },
  purchasing_officer: {
    name: 'purchasing_officer',
    displayName: 'Purchasing Officer',
    description: 'Handles supplier relationships and purchase orders',
    color: 'indigo',
    icon: Shield,
    permissions: [
      'dashboard.view',
      'products.view',
      'inventory.view',
      'suppliers.view',
      'suppliers.manage',
      'purchasing.view',
      'purchasing.create',
      'purchasing.approve',
      'requisitions.view',
      'requisitions.create',
      'reports.view',
    ],
  },
};

// Custom role interface
interface CustomRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

// System roles (cannot be deleted)
const SYSTEM_ROLES: CustomRole[] = [
  {
    id: 'sys-admin',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full access to all system features',
    color: 'red',
    isSystem: true,
    isActive: true,
    permissions: Object.values(PERMISSION_CATEGORIES).flatMap(c => Object.keys(c.permissions)),
    userCount: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'sys-manager',
    name: 'manager',
    displayName: 'Manager',
    description: 'Can manage operations but cannot modify system settings',
    color: 'blue',
    isSystem: true,
    isActive: true,
    permissions: Object.values(PERMISSION_CATEGORIES)
      .flatMap(c => Object.keys(c.permissions))
      .filter(p => !p.startsWith('settings.users') && !p.startsWith('audit.')),
    userCount: 2,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'sys-user',
    name: 'user',
    displayName: 'Standard User',
    description: 'Basic access for day-to-day operations',
    color: 'green',
    isSystem: true,
    isActive: true,
    permissions: [
      'dashboard.view',
      'products.view',
      'inventory.view',
      'customers.view',
      'customers.create',
      'orders.view',
      'orders.create',
      'invoices.view',
      'invoices.create',
      'payments.view',
      'reports.view',
    ],
    userCount: 5,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'sys-viewer',
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access to the system',
    color: 'gray',
    isSystem: true,
    isActive: true,
    permissions: Object.values(PERMISSION_CATEGORIES)
      .flatMap(c => Object.keys(c.permissions))
      .filter(p => p.endsWith('.view')),
    userCount: 3,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

// Mock custom roles
const MOCK_CUSTOM_ROLES: CustomRole[] = [
  {
    id: 'custom-1',
    name: 'warehouse_manager',
    displayName: 'Warehouse Manager',
    description: 'Manages inventory and warehouse operations',
    color: 'orange',
    isSystem: false,
    isActive: true,
    permissions: ROLE_TEMPLATES.warehouse_manager.permissions,
    userCount: 2,
    createdAt: '2024-06-15',
    updatedAt: '2024-11-20',
  },
  {
    id: 'custom-2',
    name: 'hr_manager',
    displayName: 'HR Manager',
    description: 'Manages users and access permissions',
    color: 'purple',
    isSystem: false,
    isActive: true,
    permissions: ROLE_TEMPLATES.hr_manager.permissions,
    userCount: 1,
    createdAt: '2024-07-01',
    updatedAt: '2024-10-15',
  },
];

function RolesManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(MOCK_CUSTOM_ROLES);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    color: 'blue',
    permissions: [] as string[],
  });
  
  // Permission editing
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // All roles combined
  const allRoles = [...SYSTEM_ROLES, ...customRoles];
  
  // Filter roles
  const filteredRoles = allRoles.filter(role => {
    const matchesSearch = 
      role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  
  // Get badge color class for role display
  const getBadgeColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
    return colorMap[color] || colorMap.gray;
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      color: 'blue',
      permissions: [],
    });
    setExpandedCategories([]);
  };
  
  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };
  
  // Open edit modal
  const openEditModal = (role: CustomRole) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      color: role.color,
      permissions: [...role.permissions],
    });
    setExpandedCategories([]);
    setIsEditModalOpen(true);
  };
  
  // Open delete modal
  const openDeleteModal = (role: CustomRole) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };
  
  // Create from template
  const createFromTemplate = (templateKey: keyof typeof ROLE_TEMPLATES) => {
    const template = ROLE_TEMPLATES[templateKey];
    setFormData({
      name: template.name,
      displayName: template.displayName,
      description: template.description,
      color: template.color,
      permissions: [...template.permissions],
    });
    setIsTemplateModalOpen(false);
    setIsCreateModalOpen(true);
  };
  
  // Duplicate role
  const duplicateRole = (role: CustomRole) => {
    setFormData({
      name: `${role.name}_copy`,
      displayName: `${role.displayName} (Copy)`,
      description: role.description,
      color: role.color,
      permissions: [...role.permissions],
    });
    setIsCreateModalOpen(true);
  };
  
  // Handle create
  const handleCreate = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newRole: CustomRole = {
      id: `custom-${Date.now()}`,
      name: formData.name.toLowerCase().replace(/\s+/g, '_'),
      displayName: formData.displayName,
      description: formData.description,
      color: formData.color,
      isSystem: false,
      isActive: true,
      permissions: formData.permissions,
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setCustomRoles(prev => [...prev, newRole]);
    setIsSaving(false);
    setIsCreateModalOpen(false);
    resetForm();
  };
  
  // Handle update
  const handleUpdate = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setCustomRoles(prev => prev.map(role => 
      role.id === selectedRole.id
        ? {
            ...role,
            name: formData.name.toLowerCase().replace(/\s+/g, '_'),
            displayName: formData.displayName,
            description: formData.description,
            color: formData.color,
            permissions: formData.permissions,
            updatedAt: new Date().toISOString(),
          }
        : role
    ));
    
    setIsSaving(false);
    setIsEditModalOpen(false);
    setSelectedRole(null);
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setCustomRoles(prev => prev.filter(role => role.id !== selectedRole.id));
    
    setIsSaving(false);
    setIsDeleteModalOpen(false);
    setSelectedRole(null);
  };
  
  // Toggle permission
  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };
  
  // Toggle all permissions in category
  const toggleCategory = (categoryKey: string) => {
    const category = PERMISSION_CATEGORIES[categoryKey as keyof typeof PERMISSION_CATEGORIES];
    const categoryPermissions = Object.keys(category.permissions);
    const allSelected = categoryPermissions.every(p => formData.permissions.includes(p));
    
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !categoryPermissions.includes(p)),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...categoryPermissions])],
      }));
    }
  };
  
  // Toggle category expansion
  const toggleCategoryExpansion = (categoryKey: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryKey)
        ? prev.filter(c => c !== categoryKey)
        : [...prev, categoryKey]
    );
  };
  
  // Select all permissions
  const selectAllPermissions = () => {
    const allPerms = Object.values(PERMISSION_CATEGORIES).flatMap(c => Object.keys(c.permissions));
    setFormData(prev => ({ ...prev, permissions: allPerms }));
  };
  
  // Clear all permissions
  const clearAllPermissions = () => {
    setFormData(prev => ({ ...prev, permissions: [] }));
  };
  
  // Stats
  const totalRoles = allRoles.length;
  const systemRolesCount = SYSTEM_ROLES.length;
  const customRolesCount = customRoles.length;
  const totalPermissions = Object.values(PERMISSION_CATEGORIES).flatMap(c => Object.keys(c.permissions)).length;

  // Permission editor component
  const PermissionEditor = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Permissions ({formData.permissions.length} selected)</Label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAllPermissions}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={clearAllPermissions}>
            Clear All
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-[300px] border rounded-md p-4">
        <div className="space-y-2">
          {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
            const categoryPermissions = Object.keys(category.permissions);
            const selectedCount = categoryPermissions.filter(p => formData.permissions.includes(p)).length;
            const allSelected = selectedCount === categoryPermissions.length;
            const someSelected = selectedCount > 0 && !allSelected;
            
            return (
              <div key={key} className="border rounded-lg">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleCategoryExpansion(key)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(key);
                      }}
                    />
                    <span className="font-medium">{category.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {selectedCount}/{categoryPermissions.length}
                    </Badge>
                  </div>
                  {expandedCategories.includes(key) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
                
                {expandedCategories.includes(key) && (
                  <div className="px-3 pb-3 pt-1 space-y-2 border-t bg-muted/20">
                    {Object.entries(category.permissions).map(([permKey, permLabel]) => (
                      <div key={permKey} className="flex items-center gap-2 pl-6">
                        <Checkbox
                          id={permKey}
                          checked={formData.permissions.includes(permKey)}
                          onCheckedChange={() => togglePermission(permKey)}
                        />
                        <label
                          htmlFor={permKey}
                          className="text-sm cursor-pointer"
                        >
                          {permLabel}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
  
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences"
      />
      
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar navigation */}
        <nav className="w-full lg:w-64 flex-shrink-0">
          <div className="rounded-lg border bg-card p-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentPath === tab.href;
              
              return (
                <Link
                  key={tab.id}
                  to={tab.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Roles & Permissions</h2>
              <p className="text-sm text-muted-foreground">
                Create and manage custom roles with specific permissions
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsTemplateModalOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Use Template
              </Button>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Roles</CardDescription>
                <CardTitle className="text-2xl">{totalRoles}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>System Roles</CardDescription>
                <CardTitle className="text-2xl">{systemRolesCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Custom Roles</CardDescription>
                <CardTitle className="text-2xl">{customRolesCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Permissions</CardDescription>
                <CardTitle className="text-2xl">{totalPermissions}</CardTitle>
              </CardHeader>
            </Card>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* System Roles */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              System Roles (Read-only)
            </h3>
            <div className="grid gap-4">
              {filteredRoles.filter(r => r.isSystem).map((role) => (
                <Card key={role.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', getBadgeColorClass(role.color))}>
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{role.displayName}</h4>
                            <Badge variant="outline" className="text-xs">System</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{role.permissions.length} permissions</span>
                            <span>•</span>
                            <span>{role.userCount} user{role.userCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => duplicateRole(role)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate as Custom
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Custom Roles */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Custom Roles
            </h3>
            {customRoles.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <ShieldPlus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No custom roles yet</h4>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Create custom roles to give users specific permissions based on their job functions.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsTemplateModalOpen(true)}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                    <Button onClick={openCreateModal}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Role
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredRoles.filter(r => !r.isSystem).map((role) => (
                  <Card key={role.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', getBadgeColorClass(role.color))}>
                            <UserCog className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{role.displayName}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{role.permissions.length} permissions</span>
                              <span>•</span>
                              <span>{role.userCount} user{role.userCount !== 1 ? 's' : ''}</span>
                              <span>•</span>
                              <span>Updated {new Date(role.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModal(role)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateRole(role)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openDeleteModal(role)}
                              disabled={role.userCount > 0}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Role Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions for your team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Role Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    displayName: e.target.value,
                    name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                  }))}
                  placeholder="e.g., Warehouse Manager"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {ROLE_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      className={cn(
                        'w-6 h-6 rounded-full transition-all',
                        color.class,
                        formData.color === color.name && 'ring-2 ring-offset-2 ring-primary'
                      )}
                      onClick={() => setFormData(prev => ({ ...prev, color: color.name }))}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this role can do..."
                rows={2}
              />
            </div>
            
            <Separator />
            
            <PermissionEditor />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isSaving || !formData.displayName || formData.permissions.length === 0}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Role Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Modify the role name, description, or permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-displayName">Role Name</Label>
                <Input
                  id="edit-displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    displayName: e.target.value,
                    name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {ROLE_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      className={cn(
                        'w-6 h-6 rounded-full transition-all',
                        color.class,
                        formData.color === color.name && 'ring-2 ring-offset-2 ring-primary'
                      )}
                      onClick={() => setFormData(prev => ({ ...prev, color: color.name }))}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            
            <Separator />
            
            <PermissionEditor />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={isSaving || !formData.displayName || formData.permissions.length === 0}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Template Modal */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose a Role Template</DialogTitle>
            <DialogDescription>
              Start with a pre-configured template and customize it for your needs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {Object.entries(ROLE_TEMPLATES).map(([key, template]) => {
              const Icon = template.icon;
              return (
                <Card
                  key={key}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => createFromTemplate(key as keyof typeof ROLE_TEMPLATES)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', getBadgeColorClass(template.color))}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{template.displayName}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.permissions.length} permissions
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the &quot;{selectedRole?.displayName}&quot; role? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRole && selectedRole.userCount > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 text-sm">
              <p className="font-medium text-destructive">Cannot delete this role</p>
              <p className="text-muted-foreground mt-1">
                This role is currently assigned to {selectedRole.userCount} user(s). 
                Please reassign these users to a different role first.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving || (selectedRole?.userCount ?? 0) > 0}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

