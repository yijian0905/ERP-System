import { createFileRoute, Link } from '@tanstack/react-router';
import { Bell, Building2, CircleDollarSign, Globe, Languages, Palette, Settings, Shield, Users } from 'lucide-react';

import { PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  type DateFormat,
  type NumberFormat,
  type TimeFormat,
  useSettingsStore,
} from '@/stores/settings';

export const Route = createFileRoute('/_dashboard/settings/localization')({
  component: LocalizationSettingsPage,
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

const languages = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'zh-TW', name: 'Traditional Chinese', native: '繁體中文', flag: '🇹🇼' },
  { code: 'zh-CN', name: 'Simplified Chinese', native: '简体中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
];

const timezones = [
  { id: 'America/New_York', name: 'Eastern Time (ET)', offset: 'UTC-5' },
  { id: 'America/Chicago', name: 'Central Time (CT)', offset: 'UTC-6' },
  { id: 'America/Denver', name: 'Mountain Time (MT)', offset: 'UTC-7' },
  { id: 'America/Los_Angeles', name: 'Pacific Time (PT)', offset: 'UTC-8' },
  { id: 'Europe/London', name: 'Greenwich Mean Time (GMT)', offset: 'UTC+0' },
  { id: 'Europe/Paris', name: 'Central European Time (CET)', offset: 'UTC+1' },
  { id: 'Asia/Taipei', name: 'Taipei Time', offset: 'UTC+8' },
  { id: 'Asia/Tokyo', name: 'Japan Standard Time (JST)', offset: 'UTC+9' },
  { id: 'Asia/Shanghai', name: 'China Standard Time (CST)', offset: 'UTC+8' },
  { id: 'Australia/Sydney', name: 'Australian Eastern Time (AET)', offset: 'UTC+10' },
];

function LocalizationSettingsPage() {
  const localization = useSettingsStore((state) => state.localization);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setTimezone = useSettingsStore((state) => state.setTimezone);
  const setDateFormat = useSettingsStore((state) => state.setDateFormat);
  const setTimeFormat = useSettingsStore((state) => state.setTimeFormat);
  const setNumberFormat = useSettingsStore((state) => state.setNumberFormat);
  const setFirstDayOfWeek = useSettingsStore((state) => state.setFirstDayOfWeek);

  // Format preview based on current settings
  const formatDate = (date: Date): string => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const monthName = date.toLocaleString('en', { month: 'short' });

    switch (localization.dateFormat) {
      case 'DD/MM/YYYY': return `${d}/${m}/${y}`;
      case 'YYYY-MM-DD': return `${y}-${m}-${d}`;
      case 'DD MMM YYYY': return `${d} ${monthName} ${y}`;
      default: return `${m}/${d}/${y}`;
    }
  };

  const formatTime = (date: Date): string => {
    if (localization.timeFormat === '24h') {
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString(localization.numberFormat);
  };

  const now = new Date();

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
                    tab.id === 'localization'
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
          {/* Language */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">
                <Languages className="inline h-5 w-5 mr-2" />
                Language
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose your preferred language for the interface
              </p>
            </div>
            <div className="p-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
                      localization.language === lang.code
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/50'
                    )}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <p className="font-medium">{lang.native}</p>
                      <p className="text-xs text-muted-foreground">{lang.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Currency - Link to dedicated page */}
          <div className="rounded-lg border bg-card">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CircleDollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Currency Settings</h2>
                    <p className="text-sm text-muted-foreground">
                      Current: {localization.currency} • Manage currencies and exchange rates
                    </p>
                  </div>
                </div>
                <Link
                  to="/settings/currencies"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Manage Currencies →
                </Link>
              </div>
            </div>
          </div>

          {/* Timezone */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Timezone</h2>
              <p className="text-sm text-muted-foreground">
                Set your local timezone for dates and times
              </p>
            </div>
            <div className="p-4">
              <select
                value={localization.timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm"
              >
                {timezones.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.name} ({tz.offset})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time Format */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Date & Time Format</h2>
              <p className="text-sm text-muted-foreground">
                How dates and times are displayed
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <select
                    id="dateFormat"
                    value={localization.dateFormat}
                    onChange={(e) => setDateFormat(e.target.value as DateFormat)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/07/2024)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (07/12/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-07)</option>
                    <option value="DD MMM YYYY">DD MMM YYYY (07 Dec 2024)</option>
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
                    <option value="12h">12-hour (2:30 PM)</option>
                    <option value="24h">24-hour (14:30)</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="numberFormat">Number Format</Label>
                  <select
                    id="numberFormat"
                    value={localization.numberFormat}
                    onChange={(e) => setNumberFormat(e.target.value as NumberFormat)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="en-US">1,234.56 (US)</option>
                    <option value="de-DE">1.234,56 (EU)</option>
                    <option value="fr-FR">1 234,56 (French)</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="firstDayOfWeek">First Day of Week</Label>
                  <select
                    id="firstDayOfWeek"
                    value={localization.firstDayOfWeek}
                    onChange={(e) => setFirstDayOfWeek(e.target.value as 'sunday' | 'monday' | 'saturday')}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="sunday">Sunday</option>
                    <option value="monday">Monday</option>
                    <option value="saturday">Saturday</option>
                  </select>
                </div>
              </div>

              {/* Live Preview */}
              <div className="mt-4 p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Preview</p>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p>Date: <span className="text-foreground font-medium">{formatDate(now)}</span></p>
                  <p>Time: <span className="text-foreground font-medium">{formatTime(now)}</span></p>
                  <p>Number: <span className="text-foreground font-medium">{formatNumber(1234567.89)}</span></p>
                  <p>Currency: <span className="text-foreground font-medium">{localization.currency}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> All localization preferences are saved automatically.
              Changes will be reflected throughout the application immediately.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
