import { createFileRoute, Link } from '@tanstack/react-router';
import { Bell, Building2, CircleDollarSign, Globe, Mail, Palette, Settings, Shield, Smartphone, Users } from 'lucide-react';

import { PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings';

export const Route = createFileRoute('/_dashboard/settings/notifications')({
  component: NotificationSettingsPage,
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

const notificationCategories = [
  {
    id: 'orders' as const,
    title: 'Order Updates',
    description: 'Notifications about new orders, status changes, and fulfillment',
  },
  {
    id: 'inventory' as const,
    title: 'Low Stock Alerts',
    description: 'Get notified when products fall below reorder point',
  },
  {
    id: 'payments' as const,
    title: 'Payment Notifications',
    description: 'Alerts for received payments, overdue invoices, and refunds',
  },
  {
    id: 'customers' as const,
    title: 'Customer Activity',
    description: 'New customer registrations and important customer updates',
  },
  {
    id: 'reports' as const,
    title: 'Report Summaries',
    description: 'Daily, weekly, or monthly business summary reports',
  },
  {
    id: 'security' as const,
    title: 'Security Alerts',
    description: 'Login attempts, password changes, and security warnings',
  },
  {
    id: 'system' as const,
    title: 'System Updates',
    description: 'Maintenance notifications and feature announcements',
  },
];

function NotificationSettingsPage() {
  const notifications = useSettingsStore((state) => state.notifications);
  const setNotificationChannel = useSettingsStore((state) => state.setNotificationChannel);
  const setDailyDigest = useSettingsStore((state) => state.setDailyDigest);
  const setWeeklyReport = useSettingsStore((state) => state.setWeeklyReport);

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
                    tab.id === 'notifications'
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
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
              <p className="text-sm text-muted-foreground">
                Choose how you want to receive notifications (changes save automatically)
              </p>
            </div>

            {/* Channel Legend */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center justify-end gap-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bell className="h-4 w-4" />
                  <span>Push</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Smartphone className="h-4 w-4" />
                  <span>SMS</span>
                </div>
              </div>
            </div>

            {/* Settings List */}
            <div className="divide-y">
              {notificationCategories.map((category) => {
                const setting = notifications[category.id];
                if (typeof setting !== 'object') return null;

                return (
                  <div key={category.id} className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{category.title}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    <div className="flex items-center gap-8">
                      {/* Email Toggle */}
                      <button
                        onClick={() => setNotificationChannel(category.id, 'email', !setting.email)}
                        className={cn(
                          'h-6 w-10 rounded-full transition-colors',
                          setting.email ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        <div className={cn(
                          'h-5 w-5 rounded-full bg-white shadow transition-transform',
                          setting.email ? 'translate-x-4' : 'translate-x-0.5'
                        )} />
                      </button>
                      {/* Push Toggle */}
                      <button
                        onClick={() => setNotificationChannel(category.id, 'push', !setting.push)}
                        className={cn(
                          'h-6 w-10 rounded-full transition-colors',
                          setting.push ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        <div className={cn(
                          'h-5 w-5 rounded-full bg-white shadow transition-transform',
                          setting.push ? 'translate-x-4' : 'translate-x-0.5'
                        )} />
                      </button>
                      {/* SMS Toggle */}
                      <button
                        onClick={() => setNotificationChannel(category.id, 'sms', !setting.sms)}
                        className={cn(
                          'h-6 w-10 rounded-full transition-colors',
                          setting.sms ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        <div className={cn(
                          'h-5 w-5 rounded-full bg-white shadow transition-transform',
                          setting.sms ? 'translate-x-4' : 'translate-x-0.5'
                        )} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email Digest */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Email Digest</h2>
              <p className="text-sm text-muted-foreground">
                Configure summary email frequency
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Daily Digest</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive a daily summary of your business activity
                  </p>
                </div>
                <select
                  value={notifications.dailyDigest}
                  onChange={(e) => setDailyDigest(e.target.value as 'off' | 'morning' | 'evening')}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="off">Off</option>
                  <option value="morning">Morning (8 AM)</option>
                  <option value="evening">Evening (6 PM)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Weekly Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Get a weekly summary every Monday morning
                  </p>
                </div>
                <button
                  onClick={() => setWeeklyReport(!notifications.weeklyReport)}
                  className={cn(
                    'h-6 w-10 rounded-full transition-colors',
                    notifications.weeklyReport ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <div className={cn(
                    'h-5 w-5 rounded-full bg-white shadow transition-transform',
                    notifications.weeklyReport ? 'translate-x-4' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> All notification preferences are saved automatically.
              Changes will take effect immediately for new notifications.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
