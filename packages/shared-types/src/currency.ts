/**
 * Currency Management Types
 * For multi-currency support in multinational enterprises
 */

import type { BaseEntity } from './entities.js';

// ============================================
// ENUMS
// ============================================

export type CurrencySymbolPosition = 'BEFORE' | 'AFTER';
export type ExchangeRateSource = 
  | 'MANUAL' 
  | 'API_OPENEXCHANGE' 
  | 'API_FIXER' 
  | 'API_CURRENCYLAYER' 
  | 'API_XE' 
  | 'BANK_FEED';

// ============================================
// CURRENCY
// ============================================

export interface Currency extends BaseEntity {
  code: string; // ISO 4217 currency code (e.g., USD, EUR, MYR)
  name: string;
  symbol: string;
  decimalPlaces: number;
  symbolPosition: CurrencySymbolPosition;
  thousandsSeparator: string;
  decimalSeparator: string;
  isBaseCurrency: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateCurrencyRequest {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces?: number;
  symbolPosition?: CurrencySymbolPosition;
  thousandsSeparator?: string;
  decimalSeparator?: string;
  isBaseCurrency?: boolean;
  sortOrder?: number;
}

export interface UpdateCurrencyRequest extends Partial<CreateCurrencyRequest> {
  isActive?: boolean;
}

// ============================================
// EXCHANGE RATE
// ============================================

export interface ExchangeRate {
  id: string;
  tenantId: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
  inverseRate: number;
  effectiveDate: string;
  expiresAt?: string | null;
  source: ExchangeRateSource;
  sourceReference?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fromCurrency?: Currency;
  toCurrency?: Currency;
}

export interface CreateExchangeRateRequest {
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
  effectiveDate?: string;
  expiresAt?: string;
  source?: ExchangeRateSource;
  sourceReference?: string;
}

export interface UpdateExchangeRateRequest {
  rate?: number;
  effectiveDate?: string;
  expiresAt?: string;
  source?: ExchangeRateSource;
  sourceReference?: string;
  isActive?: boolean;
}

// ============================================
// CURRENCY CONVERSION
// ============================================

export interface CurrencyConversionRequest {
  amount: number;
  fromCurrency: string; // Currency code
  toCurrency: string; // Currency code
  date?: string; // Optional date for historical rate
}

export interface CurrencyConversionResult {
  originalAmount: number;
  convertedAmount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  inverseRate: number;
  effectiveDate: string;
  source: ExchangeRateSource;
}

// ============================================
// PREDEFINED CURRENCIES
// ============================================

export interface PredefinedCurrency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  symbolPosition: CurrencySymbolPosition;
  country?: string;
  flag?: string;
}

/**
 * Common world currencies with ISO 4217 codes
 */
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
// UTILITY TYPES
// ============================================

/**
 * Currency format options for displaying monetary values
 */
export interface CurrencyFormatOptions {
  currency: Currency;
  showSymbol?: boolean;
  showCode?: boolean;
  useGrouping?: boolean;
}

/**
 * Multi-currency amount representation
 */
export interface MoneyAmount {
  amount: number;
  currencyCode: string;
  baseCurrencyAmount?: number; // Amount in base currency for reporting
  exchangeRate?: number;
}

