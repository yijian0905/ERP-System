import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Currency,
  ExchangeRate,
  PredefinedCurrency,
} from '@erp/shared-types';

// ============================================
// TYPES
// ============================================

interface CurrencyState {
  // Data
  currencies: Currency[];
  exchangeRates: ExchangeRate[];
  baseCurrency: Currency | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingRates: boolean;
  error: string | null;
  
  // Cache for conversion rates (code pair -> rate)
  rateCache: Map<string, { rate: number; timestamp: number }>;
}

interface CurrencyActions {
  // Data fetching
  setCurrencies: (currencies: Currency[]) => void;
  setExchangeRates: (rates: ExchangeRate[]) => void;
  setBaseCurrency: (currency: Currency | null) => void;
  
  // CRUD operations
  addCurrency: (currency: Currency) => void;
  updateCurrency: (id: string, updates: Partial<Currency>) => void;
  removeCurrency: (id: string) => void;
  
  addExchangeRate: (rate: ExchangeRate) => void;
  updateExchangeRate: (id: string, updates: Partial<ExchangeRate>) => void;
  removeExchangeRate: (id: string) => void;
  
  // Conversion
  getExchangeRate: (fromCode: string, toCode: string) => number | null;
  convert: (amount: number, fromCode: string, toCode: string) => number | null;
  
  // Cache management
  cacheRate: (fromCode: string, toCode: string, rate: number) => void;
  getCachedRate: (fromCode: string, toCode: string) => number | null;
  clearRateCache: () => void;
  
  // State management
  setLoading: (loading: boolean) => void;
  setLoadingRates: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

type CurrencyStore = CurrencyState & CurrencyActions;

// ============================================
// CONSTANTS
// ============================================

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Predefined currencies list (matching shared-types)
export const PREDEFINED_CURRENCIES: PredefinedCurrency[] = [
  // Major world currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'United States', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, symbolPosition: 'AFTER', country: 'European Union', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, symbolPosition: 'BEFORE', country: 'Japan', flag: '🇯🇵' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Switzerland', flag: '🇨🇭' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Canada', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Australia', flag: '🇦🇺' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'New Zealand', flag: '🇳🇿' },
  
  // Asian currencies
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'China', flag: '🇨🇳' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Hong Kong', flag: '🇭🇰' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', decimalPlaces: 0, symbolPosition: 'BEFORE', country: 'Taiwan', flag: '🇹🇼' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimalPlaces: 0, symbolPosition: 'BEFORE', country: 'South Korea', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Singapore', flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Malaysia', flag: '🇲🇾' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Thailand', flag: '🇹🇭' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimalPlaces: 0, symbolPosition: 'BEFORE', country: 'Indonesia', flag: '🇮🇩' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Philippines', flag: '🇵🇭' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimalPlaces: 0, symbolPosition: 'AFTER', country: 'Vietnam', flag: '🇻🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'India', flag: '🇮🇳' },
  
  // Middle East currencies
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2, symbolPosition: 'AFTER', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', decimalPlaces: 2, symbolPosition: 'AFTER', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Israel', flag: '🇮🇱' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Turkey', flag: '🇹🇷' },
  
  // European currencies
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimalPlaces: 2, symbolPosition: 'AFTER', country: 'Sweden', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimalPlaces: 2, symbolPosition: 'AFTER', country: 'Norway', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimalPlaces: 2, symbolPosition: 'AFTER', country: 'Denmark', flag: '🇩🇰' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', decimalPlaces: 2, symbolPosition: 'AFTER', country: 'Poland', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', decimalPlaces: 2, symbolPosition: 'AFTER', country: 'Czech Republic', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', decimalPlaces: 0, symbolPosition: 'AFTER', country: 'Hungary', flag: '🇭🇺' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimalPlaces: 2, symbolPosition: 'AFTER', country: 'Russia', flag: '🇷🇺' },
  
  // Americas currencies
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Mexico', flag: '🇲🇽' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Brazil', flag: '🇧🇷' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Argentina', flag: '🇦🇷' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', decimalPlaces: 0, symbolPosition: 'BEFORE', country: 'Chile', flag: '🇨🇱' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', decimalPlaces: 0, symbolPosition: 'BEFORE', country: 'Colombia', flag: '🇨🇴' },
  
  // African currencies
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'South Africa', flag: '🇿🇦' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Egypt', flag: '🇪🇬' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Nigeria', flag: '🇳🇬' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', decimalPlaces: 2, symbolPosition: 'BEFORE', country: 'Kenya', flag: '🇰🇪' },
];

// ============================================
// INITIAL STATE
// ============================================

const initialState: CurrencyState = {
  currencies: [],
  exchangeRates: [],
  baseCurrency: null,
  isLoading: false,
  isLoadingRates: false,
  error: null,
  rateCache: new Map(),
};

// ============================================
// STORE
// ============================================

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Data setters
      setCurrencies: (currencies) => set({ currencies }),
      setExchangeRates: (exchangeRates) => set({ exchangeRates }),
      setBaseCurrency: (baseCurrency) => set({ baseCurrency }),

      // Currency CRUD
      addCurrency: (currency) =>
        set((state) => ({
          currencies: [...state.currencies, currency],
        })),

      updateCurrency: (id, updates) =>
        set((state) => ({
          currencies: state.currencies.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
          baseCurrency:
            state.baseCurrency?.id === id
              ? { ...state.baseCurrency, ...updates }
              : state.baseCurrency,
        })),

      removeCurrency: (id) =>
        set((state) => ({
          currencies: state.currencies.filter((c) => c.id !== id),
          baseCurrency:
            state.baseCurrency?.id === id ? null : state.baseCurrency,
        })),

      // Exchange Rate CRUD
      addExchangeRate: (rate) =>
        set((state) => ({
          exchangeRates: [...state.exchangeRates, rate],
        })),

      updateExchangeRate: (id, updates) =>
        set((state) => ({
          exchangeRates: state.exchangeRates.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      removeExchangeRate: (id) =>
        set((state) => ({
          exchangeRates: state.exchangeRates.filter((r) => r.id !== id),
        })),

      // Conversion helpers
      getExchangeRate: (fromCode, toCode) => {
        const state = get();
        
        if (fromCode === toCode) return 1;

        // Check cache first
        const cachedRate = state.getCachedRate(fromCode, toCode);
        if (cachedRate !== null) return cachedRate;

        // Find currencies
        const fromCurrency = state.currencies.find(
          (c) => c.code === fromCode && c.isActive
        );
        const toCurrency = state.currencies.find(
          (c) => c.code === toCode && c.isActive
        );

        if (!fromCurrency || !toCurrency) return null;

        // Find direct rate
        const directRate = state.exchangeRates.find(
          (r) =>
            r.fromCurrencyId === fromCurrency.id &&
            r.toCurrencyId === toCurrency.id &&
            r.isActive
        );

        if (directRate) {
          state.cacheRate(fromCode, toCode, Number(directRate.rate));
          return Number(directRate.rate);
        }

        // Try inverse rate
        const inverseRate = state.exchangeRates.find(
          (r) =>
            r.fromCurrencyId === toCurrency.id &&
            r.toCurrencyId === fromCurrency.id &&
            r.isActive
        );

        if (inverseRate) {
          const rate = Number(inverseRate.inverseRate);
          state.cacheRate(fromCode, toCode, rate);
          return rate;
        }

        return null;
      },

      convert: (amount, fromCode, toCode) => {
        const state = get();
        const rate = state.getExchangeRate(fromCode, toCode);
        
        if (rate === null) return null;

        const toCurrency = state.currencies.find(
          (c) => c.code === toCode && c.isActive
        );
        const decimalPlaces = toCurrency?.decimalPlaces ?? 2;

        return Number((amount * rate).toFixed(decimalPlaces));
      },

      // Cache management
      cacheRate: (fromCode, toCode, rate) => {
        const state = get();
        const key = `${fromCode}-${toCode}`;
        const newCache = new Map(state.rateCache);
        newCache.set(key, { rate, timestamp: Date.now() });
        set({ rateCache: newCache });
      },

      getCachedRate: (fromCode, toCode) => {
        const state = get();
        const key = `${fromCode}-${toCode}`;
        const cached = state.rateCache.get(key);

        if (!cached) return null;

        // Check if cache is expired
        if (Date.now() - cached.timestamp > CACHE_TTL) {
          const newCache = new Map(state.rateCache);
          newCache.delete(key);
          set({ rateCache: newCache });
          return null;
        }

        return cached.rate;
      },

      clearRateCache: () => set({ rateCache: new Map() }),

      // State management
      setLoading: (isLoading) => set({ isLoading }),
      setLoadingRates: (isLoadingRates) => set({ isLoadingRates }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
    }),
    {
      name: 'erp-currency',
      partialize: (state) => ({
        currencies: state.currencies,
        exchangeRates: state.exchangeRates,
        baseCurrency: state.baseCurrency,
        // Don't persist loading states or cache
      }),
    }
  )
);

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Get the base currency
 */
export function useBaseCurrency() {
  return useCurrencyStore((state) => state.baseCurrency);
}

/**
 * Get all active currencies
 */
export function useActiveCurrencies() {
  return useCurrencyStore((state) =>
    state.currencies.filter((c) => c.isActive)
  );
}

/**
 * Get a currency by code
 */
export function useCurrencyByCode(code: string) {
  return useCurrencyStore((state) =>
    state.currencies.find((c) => c.code === code)
  );
}

/**
 * Hook for currency conversion
 */
export function useCurrencyConversion() {
  const convert = useCurrencyStore((state) => state.convert);
  const getExchangeRate = useCurrencyStore((state) => state.getExchangeRate);

  return { convert, getExchangeRate };
}

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format a monetary amount with currency settings
 */
export function formatCurrency(
  amount: number,
  currency: Currency | null,
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    useGrouping?: boolean;
  }
): string {
  const {
    showSymbol = true,
    showCode = false,
    useGrouping = true,
  } = options || {};

  if (!currency) {
    return amount.toFixed(2);
  }

  // Format the number
  const parts = amount.toFixed(currency.decimalPlaces).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Apply thousands separator
  if (useGrouping && currency.thousandsSeparator) {
    integerPart = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      currency.thousandsSeparator
    );
  }

  // Combine integer and decimal parts
  let formattedAmount =
    currency.decimalPlaces > 0
      ? `${integerPart}${currency.decimalSeparator}${decimalPart}`
      : integerPart;

  // Add symbol
  if (showSymbol) {
    if (currency.symbolPosition === 'BEFORE') {
      formattedAmount = `${currency.symbol}${formattedAmount}`;
    } else {
      formattedAmount = `${formattedAmount}${currency.symbol}`;
    }
  }

  // Add code
  if (showCode) {
    formattedAmount = `${formattedAmount} ${currency.code}`;
  }

  return formattedAmount;
}

/**
 * Format currency using currency code (looks up currency from store)
 */
export function formatCurrencyByCode(
  amount: number,
  currencyCode: string,
  options?: {
    showSymbol?: boolean;
    showCode?: boolean;
    useGrouping?: boolean;
  }
): string {
  const currency = useCurrencyStore
    .getState()
    .currencies.find((c) => c.code === currencyCode);

  return formatCurrency(amount, currency || null, options);
}

/**
 * Get predefined currency info by code
 */
export function getPredefinedCurrency(code: string): PredefinedCurrency | undefined {
  return PREDEFINED_CURRENCIES.find((c) => c.code === code);
}

