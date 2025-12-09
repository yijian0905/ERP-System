import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type Theme = 'light' | 'dark' | 'system';
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red';
export type FontSize = 'small' | 'medium' | 'large';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY';
export type TimeFormat = '12h' | '24h';
export type NumberFormat = 'en-US' | 'de-DE' | 'fr-FR';

// Accent color HSL values
export const accentColorValues: Record<AccentColor, { hue: number; sat: number; light: number }> = {
  blue: { hue: 221, sat: 83, light: 53 },
  purple: { hue: 262, sat: 83, light: 58 },
  green: { hue: 142, sat: 76, light: 36 },
  orange: { hue: 24, sat: 95, light: 53 },
  pink: { hue: 336, sat: 80, light: 58 },
  red: { hue: 0, sat: 84, light: 60 },
};

// Font size scale
export const fontSizeScale: Record<FontSize, number> = {
  small: 0.875,
  medium: 1,
  large: 1.125,
};

// Appearance Settings
interface AppearanceSettings {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  compactMode: boolean;
  animations: boolean;
  sidebarCollapsed: boolean;
}

// Notification Settings
interface NotificationChannel {
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface NotificationSettings {
  orders: NotificationChannel;
  inventory: NotificationChannel;
  payments: NotificationChannel;
  customers: NotificationChannel;
  reports: NotificationChannel;
  security: NotificationChannel;
  system: NotificationChannel;
  dailyDigest: 'off' | 'morning' | 'evening';
  weeklyReport: boolean;
}

// Localization Settings
interface LocalizationSettings {
  language: string;
  currency: string;
  timezone: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  numberFormat: NumberFormat;
  firstDayOfWeek: 'sunday' | 'monday' | 'saturday';
}

// General Settings
interface GeneralSettings {
  appName: string;
  itemsPerPage: number;
  autoSave: boolean;
  confirmDelete: boolean;
}

// Full Settings State
interface SettingsState {
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  localization: LocalizationSettings;
  general: GeneralSettings;
}

interface SettingsActions {
  // Appearance
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  setFontSize: (size: FontSize) => void;
  setCompactMode: (enabled: boolean) => void;
  setAnimations: (enabled: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Notifications
  setNotificationChannel: (
    category: keyof NotificationSettings,
    channel: 'email' | 'push' | 'sms',
    enabled: boolean
  ) => void;
  setDailyDigest: (value: 'off' | 'morning' | 'evening') => void;
  setWeeklyReport: (enabled: boolean) => void;
  
  // Localization
  setLanguage: (lang: string) => void;
  setCurrency: (currency: string) => void;
  setTimezone: (tz: string) => void;
  setDateFormat: (format: DateFormat) => void;
  setTimeFormat: (format: TimeFormat) => void;
  setNumberFormat: (format: NumberFormat) => void;
  setFirstDayOfWeek: (day: 'sunday' | 'monday' | 'saturday') => void;
  
  // General
  setAppName: (name: string) => void;
  setItemsPerPage: (count: number) => void;
  setAutoSave: (enabled: boolean) => void;
  setConfirmDelete: (enabled: boolean) => void;
  
  // Bulk updates
  updateAppearance: (settings: Partial<AppearanceSettings>) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  updateLocalization: (settings: Partial<LocalizationSettings>) => void;
  updateGeneral: (settings: Partial<GeneralSettings>) => void;
  
  // Reset
  resetToDefaults: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const defaultSettings: SettingsState = {
  appearance: {
    theme: 'system',
    accentColor: 'blue',
    fontSize: 'medium',
    compactMode: false,
    animations: true,
    sidebarCollapsed: false,
  },
  notifications: {
    orders: { email: true, push: true, sms: false },
    inventory: { email: true, push: true, sms: true },
    payments: { email: true, push: false, sms: false },
    customers: { email: true, push: false, sms: false },
    reports: { email: true, push: false, sms: false },
    security: { email: true, push: true, sms: true },
    system: { email: true, push: false, sms: false },
    dailyDigest: 'off',
    weeklyReport: true,
  },
  localization: {
    language: 'en',
    currency: 'USD',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: 'en-US',
    firstDayOfWeek: 'sunday',
  },
  general: {
    appName: 'ERP System',
    itemsPerPage: 25,
    autoSave: true,
    confirmDelete: true,
  },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      // Appearance actions
      setTheme: (theme) => set((state) => ({
        appearance: { ...state.appearance, theme },
      })),
      
      setAccentColor: (accentColor) => set((state) => ({
        appearance: { ...state.appearance, accentColor },
      })),
      
      setFontSize: (fontSize) => set((state) => ({
        appearance: { ...state.appearance, fontSize },
      })),
      
      setCompactMode: (compactMode) => set((state) => ({
        appearance: { ...state.appearance, compactMode },
      })),
      
      setAnimations: (animations) => set((state) => ({
        appearance: { ...state.appearance, animations },
      })),
      
      setSidebarCollapsed: (sidebarCollapsed) => set((state) => ({
        appearance: { ...state.appearance, sidebarCollapsed },
      })),

      // Notification actions
      setNotificationChannel: (category, channel, enabled) => set((state) => {
        if (category === 'dailyDigest' || category === 'weeklyReport') return state;
        const current = state.notifications[category] as NotificationChannel;
        return {
          notifications: {
            ...state.notifications,
            [category]: { ...current, [channel]: enabled },
          },
        };
      }),
      
      setDailyDigest: (dailyDigest) => set((state) => ({
        notifications: { ...state.notifications, dailyDigest },
      })),
      
      setWeeklyReport: (weeklyReport) => set((state) => ({
        notifications: { ...state.notifications, weeklyReport },
      })),

      // Localization actions
      setLanguage: (language) => set((state) => ({
        localization: { ...state.localization, language },
      })),
      
      setCurrency: (currency) => set((state) => ({
        localization: { ...state.localization, currency },
      })),
      
      setTimezone: (timezone) => set((state) => ({
        localization: { ...state.localization, timezone },
      })),
      
      setDateFormat: (dateFormat) => set((state) => ({
        localization: { ...state.localization, dateFormat },
      })),
      
      setTimeFormat: (timeFormat) => set((state) => ({
        localization: { ...state.localization, timeFormat },
      })),
      
      setNumberFormat: (numberFormat) => set((state) => ({
        localization: { ...state.localization, numberFormat },
      })),
      
      setFirstDayOfWeek: (firstDayOfWeek) => set((state) => ({
        localization: { ...state.localization, firstDayOfWeek },
      })),

      // General actions
      setAppName: (appName) => set((state) => ({
        general: { ...state.general, appName },
      })),
      
      setItemsPerPage: (itemsPerPage) => set((state) => ({
        general: { ...state.general, itemsPerPage },
      })),
      
      setAutoSave: (autoSave) => set((state) => ({
        general: { ...state.general, autoSave },
      })),
      
      setConfirmDelete: (confirmDelete) => set((state) => ({
        general: { ...state.general, confirmDelete },
      })),

      // Bulk updates
      updateAppearance: (settings) => set((state) => ({
        appearance: { ...state.appearance, ...settings },
      })),
      
      updateNotifications: (settings) => set((state) => ({
        notifications: { ...state.notifications, ...settings },
      })),
      
      updateLocalization: (settings) => set((state) => ({
        localization: { ...state.localization, ...settings },
      })),
      
      updateGeneral: (settings) => set((state) => ({
        general: { ...state.general, ...settings },
      })),

      // Reset
      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'erp-settings',
    }
  )
);

// Convenience hooks
export function useTheme() {
  return useSettingsStore((state) => state.appearance.theme);
}

export function useAccentColor() {
  return useSettingsStore((state) => state.appearance.accentColor);
}

export function useFontSize() {
  return useSettingsStore((state) => state.appearance.fontSize);
}

export function useAppearance() {
  return useSettingsStore((state) => state.appearance);
}

export function useLocalization() {
  return useSettingsStore((state) => state.localization);
}

export function useNotificationSettings() {
  return useSettingsStore((state) => state.notifications);
}

export function useGeneralSettings() {
  return useSettingsStore((state) => state.general);
}
