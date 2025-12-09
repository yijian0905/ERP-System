import { createFileRoute, Link } from '@tanstack/react-router';
import { Bell, Building2, Check, CircleDollarSign, Globe, Monitor, Moon, Palette, RotateCcw, Settings, Shield, Sun, Users } from 'lucide-react';

import { PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  accentColorValues,
  type AccentColor,
  type FontSize,
  type Theme,
  useSettingsStore,
} from '@/stores/settings';

export const Route = createFileRoute('/_dashboard/settings/appearance')({
  component: AppearanceSettingsPage,
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

const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

const accentColors: { id: AccentColor; label: string }[] = [
  { id: 'blue', label: 'Blue' },
  { id: 'purple', label: 'Purple' },
  { id: 'green', label: 'Green' },
  { id: 'orange', label: 'Orange' },
  { id: 'pink', label: 'Pink' },
  { id: 'red', label: 'Red' },
];

const fontSizes: { id: FontSize; label: string }[] = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

function AppearanceSettingsPage() {
  // Get settings from store - changes apply immediately
  const appearance = useSettingsStore((state) => state.appearance);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setAccentColor = useSettingsStore((state) => state.setAccentColor);
  const setFontSize = useSettingsStore((state) => state.setFontSize);
  const setCompactMode = useSettingsStore((state) => state.setCompactMode);
  const setAnimations = useSettingsStore((state) => state.setAnimations);
  const setSidebarCollapsed = useSettingsStore((state) => state.setSidebarCollapsed);
  const resetToDefaults = useSettingsStore((state) => state.resetToDefaults);

  const getColorHsl = (color: AccentColor) => {
    const val = accentColorValues[color];
    return `hsl(${val.hue}, ${val.sat}%, ${val.light}%)`;
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
                    tab.id === 'appearance'
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
          {/* Theme */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Theme</h2>
              <p className="text-sm text-muted-foreground">
                Select your preferred color scheme
              </p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4">
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon;
                  return (
                    <button
                      key={themeOption.id}
                      onClick={() => setTheme(themeOption.id)}
                      className={cn(
                        'relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                        appearance.theme === themeOption.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/50'
                      )}
                    >
                      {appearance.theme === themeOption.id && (
                        <div className="absolute top-2 right-2 rounded-full bg-primary p-1">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{themeOption.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Accent Color */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Accent Color</h2>
              <p className="text-sm text-muted-foreground">
                Choose your preferred accent color (changes apply instantly)
              </p>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-3">
                {accentColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setAccentColor(color.id)}
                    className={cn(
                      'relative flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-110',
                      appearance.accentColor === color.id && 'ring-2 ring-offset-2 ring-offset-background'
                    )}
                    style={{ 
                      backgroundColor: getColorHsl(color.id), 
                      '--tw-ring-color': getColorHsl(color.id),
                    } as React.CSSProperties}
                    title={color.label}
                  >
                    {appearance.accentColor === color.id && (
                      <Check className="h-5 w-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Current: <span className="font-medium capitalize">{appearance.accentColor}</span>
              </p>
            </div>
          </div>

          {/* Font Size */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Font Size</h2>
              <p className="text-sm text-muted-foreground">
                Adjust the text size for better readability
              </p>
            </div>
            <div className="p-4">
              <div className="flex gap-4">
                {fontSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setFontSize(size.id)}
                    className={cn(
                      'flex-1 rounded-lg border-2 p-3 text-center transition-all',
                      appearance.fontSize === size.id
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/50'
                    )}
                  >
                    <span className={cn(
                      'font-medium',
                      size.id === 'small' && 'text-sm',
                      size.id === 'medium' && 'text-base',
                      size.id === 'large' && 'text-lg'
                    )}>
                      {size.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Other Options */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Display Options</h2>
              <p className="text-sm text-muted-foreground">
                Additional display preferences
              </p>
            </div>
            <div className="divide-y">
              <div className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-medium">Compact Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing for more content on screen
                  </p>
                </div>
                <button
                  onClick={() => setCompactMode(!appearance.compactMode)}
                  className={cn(
                    'h-6 w-10 rounded-full transition-colors',
                    appearance.compactMode ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <div className={cn(
                    'h-5 w-5 rounded-full bg-white shadow transition-transform',
                    appearance.compactMode ? 'translate-x-4' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-medium">Animations</h3>
                  <p className="text-sm text-muted-foreground">
                    Enable smooth transitions and animations
                  </p>
                </div>
                <button
                  onClick={() => setAnimations(!appearance.animations)}
                  className={cn(
                    'h-6 w-10 rounded-full transition-colors',
                    appearance.animations ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <div className={cn(
                    'h-5 w-5 rounded-full bg-white shadow transition-transform',
                    appearance.animations ? 'translate-x-4' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-medium">Collapsed Sidebar</h3>
                  <p className="text-sm text-muted-foreground">
                    Start with sidebar collapsed by default
                  </p>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(!appearance.sidebarCollapsed)}
                  className={cn(
                    'h-6 w-10 rounded-full transition-colors',
                    appearance.sidebarCollapsed ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <div className={cn(
                    'h-5 w-5 rounded-full bg-white shadow transition-transform',
                    appearance.sidebarCollapsed ? 'translate-x-4' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
            </div>
          </div>

          {/* Reset */}
          <div className="rounded-lg border border-destructive/50 bg-card">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-destructive">Reset to Defaults</h3>
                  <p className="text-sm text-muted-foreground">
                    Restore all appearance settings to their default values
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all settings to defaults?')) {
                      resetToDefaults();
                    }
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> All appearance changes are saved automatically and applied instantly. 
              Your preferences are stored locally and will persist across sessions.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
