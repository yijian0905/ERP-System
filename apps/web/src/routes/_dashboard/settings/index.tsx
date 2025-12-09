import { createFileRoute, Link, useLocation } from '@tanstack/react-router';
import { Bell, Building2, CircleDollarSign, Globe, Palette, Settings, Shield, Users } from 'lucide-react';

import { PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  type DateFormat,
  type TimeFormat,
  useSettingsStore,
} from '@/stores/settings';

export const Route = createFileRoute('/_dashboard/settings/')({
  component: SettingsLayout,
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

function SettingsLayout() {
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
              const isActive = currentPath === tab.href || 
                (tab.href === '/settings' && currentPath === '/settings/');
              
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
        <div className="flex-1">
          <GeneralSettingsContent />
        </div>
      </div>
    </PageContainer>
  );
}

function GeneralSettingsContent() {
  // Use settings from store
  const general = useSettingsStore((state) => state.general);
  const localization = useSettingsStore((state) => state.localization);
  const setAppName = useSettingsStore((state) => state.setAppName);
  const setItemsPerPage = useSettingsStore((state) => state.setItemsPerPage);
  const setAutoSave = useSettingsStore((state) => state.setAutoSave);
  const setConfirmDelete = useSettingsStore((state) => state.setConfirmDelete);
  const setDateFormat = useSettingsStore((state) => state.setDateFormat);
  const setTimeFormat = useSettingsStore((state) => state.setTimeFormat);
  const setTimezone = useSettingsStore((state) => state.setTimezone);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">General Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure basic application settings (changes save automatically)
          </p>
        </div>
        <div className="p-4 space-y-4">
          {/* App Name */}
          <div className="grid gap-2">
            <Label htmlFor="appName">Application Name</Label>
            <Input
              id="appName"
              value={general.appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Enter application name"
            />
            <p className="text-xs text-muted-foreground">
              This name appears in the header and browser tab
            </p>
          </div>

          {/* Date & Time Format */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <select
                id="dateFormat"
                value={localization.dateFormat}
                onChange={(e) => setDateFormat(e.target.value as DateFormat)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD MMM YYYY">DD MMM YYYY</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timeFormat">Time Format</Label>
              <select
                id="timeFormat"
                value={localization.timeFormat}
                onChange={(e) => setTimeFormat(e.target.value as TimeFormat)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            </div>
          </div>

          {/* Timezone */}
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={localization.timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm max-w-xs"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Asia/Taipei">Taipei (GMT+8)</option>
              <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
              <option value="Europe/London">London (GMT)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Your local timezone for dates and times
            </p>
          </div>

          {/* Items per page */}
          <div className="grid gap-2">
            <Label htmlFor="itemsPerPage">Default Items Per Page</Label>
            <select
              id="itemsPerPage"
              value={general.itemsPerPage.toString()}
              onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm max-w-xs"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Number of items to display in tables by default
            </p>
          </div>
        </div>
      </div>

      {/* Behavior Settings */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Behavior</h2>
          <p className="text-sm text-muted-foreground">
            Configure application behavior preferences
          </p>
        </div>
        <div className="divide-y">
          <div className="flex items-center justify-between p-4">
            <div>
              <h3 className="font-medium">Auto Save</h3>
              <p className="text-sm text-muted-foreground">
                Automatically save changes as you type
              </p>
            </div>
            <button
              onClick={() => setAutoSave(!general.autoSave)}
              className={cn(
                'h-6 w-10 rounded-full transition-colors',
                general.autoSave ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div className={cn(
                'h-5 w-5 rounded-full bg-white shadow transition-transform',
                general.autoSave ? 'translate-x-4' : 'translate-x-0.5'
              )} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <h3 className="font-medium">Confirm Before Delete</h3>
              <p className="text-sm text-muted-foreground">
                Show confirmation dialog before deleting items
              </p>
            </div>
            <button
              onClick={() => setConfirmDelete(!general.confirmDelete)}
              className={cn(
                'h-6 w-10 rounded-full transition-colors',
                general.confirmDelete ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div className={cn(
                'h-5 w-5 rounded-full bg-white shadow transition-transform',
                general.confirmDelete ? 'translate-x-4' : 'translate-x-0.5'
              )} />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-destructive/50 bg-card">
        <div className="border-b border-destructive/50 p-4">
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
          <p className="text-sm text-muted-foreground">
            Irreversible and destructive actions
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Export All Data</h3>
              <p className="text-sm text-muted-foreground">
                Download all your data as a JSON file
              </p>
            </div>
            <Button variant="outline">Export Data</Button>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
      <div>
              <h3 className="font-medium text-destructive">Delete Account</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> All settings are saved automatically and persist across sessions.
        </p>
      </div>
    </div>
  );
}
