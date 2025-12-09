import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Edit,
  Eye,
  Globe,
  Loader2,
  Mail,
  MoreHorizontal,
  Palette,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserCog,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import {
  PERMISSION_CATEGORIES,
  ROLE_PERMISSIONS,
  type UserRole,
  type UserWithPermissions,
  usePermissionsStore,
} from '@/stores/permissions';

export const Route = createFileRoute('/_dashboard/settings/users')({
  component: UsersSettingsPage,
});

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

const roleConfig: Record<UserRole, { label: string; color: string; icon: typeof Shield; description: string }> = {
  ADMIN: {
    label: 'Admin',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: ShieldAlert,
    description: 'Full access to all features and settings',
  },
  MANAGER: {
    label: 'Manager',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: ShieldCheck,
    description: 'Can manage orders, inventory, and view reports',
  },
  USER: {
    label: 'User',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: User,
    description: 'Standard access to daily operations',
  },
  VIEWER: {
    label: 'Viewer',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: Shield,
    description: 'Read-only access to view data',
  },
  CUSTOM: {
    label: 'Custom',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: UserCog,
    description: 'Custom permissions configured by admin',
  },
};

function UsersSettingsPage() {
  const { users, addUser, updateUser, deleteUser, updateUserRole, setCurrentUserPermissions } = usePermissionsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER' as UserRole,
    department: '',
    position: '',
  });

  // Permission editing
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Stats
  const activeUsers = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  // Handle invite user
  const handleInvite = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newUser: UserWithPermissions = {
      id: String(Date.now()),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      permissions: formData.role === 'CUSTOM' ? [] : ROLE_PERMISSIONS[formData.role],
      isActive: true,
      department: formData.department || undefined,
      position: formData.position || undefined,
      lastLogin: null,
      createdAt: new Date().toISOString(),
    };

    addUser(newUser);
    setIsSaving(false);
    setIsInviteModalOpen(false);
    setFormData({ name: '', email: '', role: 'USER', department: '', position: '' });
  };

  // Handle edit user
  const handleEditUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    updateUser(selectedUser.id, {
      name: formData.name,
      email: formData.email,
      department: formData.department || undefined,
      position: formData.position || undefined,
    });

    setIsSaving(false);
    setIsEditModalOpen(false);
  };

  // Handle role change
  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (newRole === 'CUSTOM') {
      const user = users.find((u) => u.id === userId);
      if (user) {
        setSelectedUser(user);
        setEditingPermissions([...user.permissions]);
        setIsPermissionsModalOpen(true);
      }
    } else {
      updateUserRole(userId, newRole);
    }
  };

  // Handle save custom permissions
  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    updateUserRole(selectedUser.id, 'CUSTOM', editingPermissions);
    setIsSaving(false);
    setIsPermissionsModalOpen(false);
  };

  // Handle delete user
  const handleDeleteUser = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (user?.role === 'ADMIN' && adminCount <= 1) {
      alert('Cannot delete the last admin user');
      return;
    }
    if (confirm('Are you sure you want to remove this user?')) {
      deleteUser(id);
    }
  };

  // Handle toggle active
  const handleToggleActive = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      updateUser(id, { isActive: !user.isActive });
    }
  };

  // Handle open edit modal
  const openEditModal = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      position: user.position || '',
    });
    setIsEditModalOpen(true);
  };

  // Handle open permissions modal
  const openPermissionsModal = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setEditingPermissions([...user.permissions]);
    setExpandedCategories([]);
    setIsPermissionsModalOpen(true);
  };

  // Toggle permission
  const togglePermission = (permission: string) => {
    setEditingPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  // Toggle all permissions in category
  const toggleCategory = (categoryKey: string) => {
    const category = PERMISSION_CATEGORIES[categoryKey as keyof typeof PERMISSION_CATEGORIES];
    const categoryPermissions = Object.keys(category.permissions);
    const allSelected = categoryPermissions.every((p) => editingPermissions.includes(p));

    if (allSelected) {
      setEditingPermissions((prev) => prev.filter((p) => !categoryPermissions.includes(p)));
    } else {
      setEditingPermissions((prev) => [...new Set([...prev, ...categoryPermissions])]);
    }
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryKey: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryKey) ? prev.filter((c) => c !== categoryKey) : [...prev, categoryKey]
    );
  };


  // Switch to user (for testing)
  const handleSwitchToUser = (user: UserWithPermissions) => {
    setCurrentUserPermissions(user.permissions);
    alert(`Switched to ${user.name}'s permissions. Refresh the page to see the navigation changes.`);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences"
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <nav className="w-full lg:w-64 flex-shrink-0">
          <div className="rounded-lg border bg-card p-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.id}
                  to={tab.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    tab.id === 'users'
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

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeUsers}</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{adminCount}</p>
                  <p className="text-sm text-muted-foreground">Administrators</p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Team Members</h2>
                <p className="text-sm text-muted-foreground">
                  Manage users and their access levels
                </p>
              </div>
              <Button onClick={() => setIsInviteModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </div>

            {/* Search & Filters */}
            <div className="p-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All Roles</option>
                {Object.entries(roleConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Users List */}
            <div className="divide-y">
              {filteredUsers.map((user) => {
                const roleInfo = roleConfig[user.role];
                const RoleIcon = roleInfo.icon;
                return (
                  <div key={user.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name}</span>
                          {!user.isActive && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                          {user.department && (
                            <>
                              <span>•</span>
                              <span>{user.department}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            roleInfo.color
                          )}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {roleInfo.label}
                        </span>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Last login: {formatDate(user.lastLogin)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openEditModal(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPermissionsModal(user)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Edit Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSwitchToUser(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Test as User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'ADMIN')}>
                            Set as Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'MANAGER')}>
                            Set as Manager
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'USER')}>
                            Set as User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'VIEWER')}>
                            Set as Viewer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleActive(user.id)}>
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredUsers.length === 0 && (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="mt-4 font-semibold">No users found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || roleFilter ? 'Try adjusting your filters' : 'Invite your first user'}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Invite User Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invitation to join your organization</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData((f) => ({ ...f, department: e.target.value }))}
                  placeholder="e.g., Sales"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData((f) => ({ ...f, position: e.target.value }))}
                  placeholder="e.g., Sales Rep"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData((f) => ({ ...f, role: e.target.value as UserRole }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(roleConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{roleConfig[formData.role].description}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isSaving || !formData.name || !formData.email}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {isSaving ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData((f) => ({ ...f, department: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-position">Position</Label>
                <Input
                  id="edit-position"
                  value={formData.position}
                  onChange={(e) => setFormData((f) => ({ ...f, position: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={isSaving || !formData.name || !formData.email}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      <Dialog open={isPermissionsModalOpen} onOpenChange={setIsPermissionsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Edit Permissions - {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              Configure which features and actions this user can access
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6">
            <div className="space-y-3 pb-4">
              {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => {
                const permissions = Object.entries(category.permissions);
                const selectedCount = permissions.filter(([key]) => editingPermissions.includes(key)).length;
                const isExpanded = expandedCategories.includes(categoryKey);
                const allSelected = selectedCount === permissions.length;
                const someSelected = selectedCount > 0 && selectedCount < permissions.length;

                return (
                  <div key={categoryKey} className="rounded-lg border">
                    {/* Category Header */}
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleCategoryExpansion(categoryKey)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={allSelected}
                          // @ts-ignore - indeterminate is valid but not typed
                          indeterminate={someSelected}
                          onCheckedChange={() => toggleCategory(categoryKey)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <span className="font-medium">{category.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({selectedCount}/{permissions.length})
                          </span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Permissions List */}
                    {isExpanded && (
                      <div className="border-t bg-muted/20 p-3 space-y-2">
                        {permissions.map(([permKey, permLabel]) => (
                          <label
                            key={permKey}
                            className="flex items-center gap-3 cursor-pointer py-1 px-2 rounded hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={editingPermissions.includes(permKey)}
                              onCheckedChange={() => togglePermission(permKey)}
                            />
                            <span className="text-sm">{permLabel}</span>
                            <span className="text-xs text-muted-foreground font-mono ml-auto">
                              {permKey}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t px-6 py-4 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {editingPermissions.length} permission{editingPermissions.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingPermissions([])}>
                  Clear All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPermissions(ROLE_PERMISSIONS.VIEWER)}
                >
                  Viewer Preset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPermissions(ROLE_PERMISSIONS.USER)}
                >
                  User Preset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPermissions(ROLE_PERMISSIONS.MANAGER)}
                >
                  Manager Preset
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPermissionsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePermissions} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Permissions'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
