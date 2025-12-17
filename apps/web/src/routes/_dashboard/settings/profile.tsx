import { createFileRoute, Link } from '@tanstack/react-router';
import { Bell, Building2, Camera, CircleDollarSign, Globe, KeyRound, Mail, Palette, Phone, Settings, Shield, User, Users } from 'lucide-react';
import { useState } from 'react';

import { PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { patch, post } from '@/lib/api-client';

export const Route = createFileRoute('/_dashboard/settings/profile')({
  component: ProfileSettingsPage,
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

function ProfileSettingsPage() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    avatar: user?.avatar || '',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleProfileChange = (key: string, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await patch<{ id: string; name: string; email: string }>('/auth/profile', {
        name: profile.name,
        phone: profile.phone,
      });
      if (response.success && response.data) {
        // Update local auth store with new name
        useAuthStore.getState().updateUser({ name: response.data.name });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      alert('Passwords do not match');
      return;
    }
    if (passwords.new.length < 8) {
      alert('New password must be at least 8 characters');
      return;
    }
    setIsSaving(true);
    try {
      const response = await post<{ message: string }>('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      if (response.success) {
        alert('Password changed successfully');
        setIsChangingPassword(false);
        setPasswords({ current: '', new: '', confirm: '' });
      }
    } catch (error: unknown) {
      console.error('Failed to change password:', error);
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      const message = axiosError.response?.data?.error?.message || 'Failed to change password';
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'USER':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

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
              const isActive = tab.id === 'profile';
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

        {/* Main content */}
        <div className="flex-1 space-y-6">
          {/* Profile Card */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Profile Information</h2>
                <p className="text-sm text-muted-foreground">
                  Update your personal information
                </p>
              </div>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
            <div className="p-4">
              {/* Avatar section */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-primary" />
                    )}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-lg hover:bg-primary/90">
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{user?.name || 'User'}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <span className={cn(
                    'mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    getRoleColor(user?.role)
                  )}>
                    <Shield className="h-3 w-3" />
                    {user?.role || 'USER'}
                  </span>
                </div>
              </div>

              {/* Profile form */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      <User className="inline h-4 w-4 mr-1" />
                      Full Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm py-2">{profile.name || 'Not set'}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email Address
                    </Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm py-2">{profile.email || 'Not set'}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-2 sm:max-w-[50%]">
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Phone Number
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  ) : (
                    <p className="text-sm py-2">{profile.phone || 'Not set'}</p>
                  )}
                </div>
              </div>

              {/* Save buttons */}
              {isEditing && (
                <div className="mt-6 flex gap-2 justify-end border-t pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Password Card */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  <KeyRound className="inline h-5 w-5 mr-2" />
                  Change Password
                </h2>
                <p className="text-sm text-muted-foreground">
                  Update your password to keep your account secure
                </p>
              </div>
              {!isChangingPassword && (
                <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                  Change Password
                </Button>
              )}
            </div>

            {isChangingPassword && (
              <div className="p-4 space-y-4">
                <div className="grid gap-2 max-w-md">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="grid gap-2 max-w-md">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="grid gap-2 max-w-md">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsChangingPassword(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleChangePassword} disabled={isSaving}>
                    {isSaving ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Session Info Card */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Active Sessions</h2>
              <p className="text-sm text-muted-foreground">
                Manage your active login sessions
              </p>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">
                      Windows • Chrome • Last active: Now
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
              </div>
              <Button variant="outline" className="mt-4" size="sm">
                Sign Out All Other Sessions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
