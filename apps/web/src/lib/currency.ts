/**
 * Currency Utility Functions
 * 
 * Provides formatting, conversion, and parsing utilities for multi-currency support.
 */

import type { Currency } from '@erp/shared-types';

// ============================================
// FORMATTING FUNCTIONS
// ============================================

export interface FormatCurrencyOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  useGrouping?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Format a number as currency with full currency configuration
 */
export function formatMoney(
  amount: number,
  currency: Currency,
  options: FormatCurrencyOptions = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    useGrouping = true,
    minimumFractionDigits,
    maximumFractionDigits,
  } = options;

  const decimals = maximumFractionDigits ?? minimumFractionDigits ?? currency.decimalPlaces;
  
  // Format the number
  const parts = Math.abs(amount).toFixed(decimals).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] || '';

  // Apply thousands separator
  if (useGrouping && currency.thousandsSeparator) {
    integerPart = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      currency.thousandsSeparator
    );
  }

  // Combine integer and decimal parts
  let formattedAmount = decimals > 0
    ? `${integerPart}${currency.decimalSeparator}${decimalPart}`
    : integerPart;

  // Handle negative numbers
  if (amount < 0) {
    formattedAmount = `-${formattedAmount}`;
  }

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
 * Simple currency formatter using Intl.NumberFormat
 */
export function formatCurrencySimple(
  amount: number,
  currencyCode: string,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

/**
 * Format a number with custom separators
 */
export function formatNumber(
  value: number,
  options: {
    decimalPlaces?: number;
    thousandsSeparator?: string;
    decimalSeparator?: string;
  } = {}
): string {
  const {
    decimalPlaces = 2,
    thousandsSeparator = ',',
    decimalSeparator = '.',
  } = options;

  const parts = Math.abs(value).toFixed(decimalPlaces).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Apply thousands separator
  if (thousandsSeparator) {
    integerPart = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      thousandsSeparator
    );
  }

  let result = decimalPlaces > 0
    ? `${integerPart}${decimalSeparator}${decimalPart}`
    : integerPart;

  if (value < 0) {
    result = `-${result}`;
  }

  return result;
}

// ============================================
// PARSING FUNCTIONS
// ============================================

/**
 * Parse a formatted currency string back to a number
 */
export function parseCurrencyString(
  value: string,
  currency?: Currency
): number | null {
  if (!value || typeof value !== 'string') return null;

  // Remove currency symbol and code
  let cleanValue = value.trim();
  
  if (currency) {
    cleanValue = cleanValue
      .replace(currency.symbol, '')
      .replace(currency.code, '')
      .trim();

    // Handle different decimal separators
    if (currency.decimalSeparator !== '.') {
      // Remove thousands separator first
      cleanValue = cleanValue.replace(
        new RegExp(`\\${currency.thousandsSeparator}`, 'g'),
        ''
      );
      // Then replace decimal separator with standard dot
      cleanValue = cleanValue.replace(currency.decimalSeparator, '.');
    } else {
      // Remove thousands separator
      cleanValue = cleanValue.replace(
        new RegExp(`\\${currency.thousandsSeparator}`, 'g'),
        ''
      );
    }
  } else {
    // Default: remove common symbols and separators
    cleanValue = cleanValue
      .replace(/[^0-9.,\-]/g, '')
      .replace(/,/g, '');
  }

  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? null : parsed;
}

// ============================================
// CONVERSION FUNCTIONS
// ============================================

export interface ExchangeRateInfo {
  rate: number;
  inverseRate: number;
  effectiveDate: string;
  source: string;
}

/**
 * Convert an amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  rate: number,
  targetDecimalPlaces: number = 2
): number {
  return Number((amount * rate).toFixed(targetDecimalPlaces));
}

/**
 * Calculate the inverse exchange rate
 */
export function calculateInverseRate(rate: number): number {
  if (rate === 0) return 0;
  return Number((1 / rate).toFixed(8));
}

/**
 * Apply exchange rate with rounding
 */
export function applyExchangeRate(
  amount: number,
  rate: number,
  roundingMode: 'up' | 'down' | 'nearest' = 'nearest',
  decimalPlaces: number = 2
): number {
  const converted = amount * rate;
  const multiplier = Math.pow(10, decimalPlaces);

  switch (roundingMode) {
    case 'up':
      return Math.ceil(converted * multiplier) / multiplier;
    case 'down':
      return Math.floor(converted * multiplier) / multiplier;
    case 'nearest':
    default:
      return Math.round(converted * multiplier) / multiplier;
  }
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate a currency code (ISO 4217 format)
 */
export function isValidCurrencyCode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code);
}

/**
 * Check if an amount is valid for a currency
 */
export function isValidAmount(
  amount: number,
  currency: Currency
): boolean {
  if (isNaN(amount) || !isFinite(amount)) return false;

  // Check decimal places
  const decimalStr = amount.toString().split('.')[1] || '';
  return decimalStr.length <= currency.decimalPlaces;
}

/**
 * Round amount to currency's decimal places
 */
export function roundToCurrency(
  amount: number,
  currency: Currency,
  roundingMode: 'up' | 'down' | 'nearest' = 'nearest'
): number {
  const multiplier = Math.pow(10, currency.decimalPlaces);

  switch (roundingMode) {
    case 'up':
      return Math.ceil(amount * multiplier) / multiplier;
    case 'down':
      return Math.floor(amount * multiplier) / multiplier;
    case 'nearest':
    default:
      return Math.round(amount * multiplier) / multiplier;
  }
}

// ============================================
// DISPLAY HELPERS
// ============================================

/**
 * Get display string for exchange rate
 */
export function formatExchangeRate(
  fromCode: string,
  toCode: string,
  rate: number,
  precision: number = 4
): string {
  return `1 ${fromCode} = ${rate.toFixed(precision)} ${toCode}`;
}

/**
 * Get display string for conversion
 */
export function formatConversion(
  fromAmount: number,
  fromCurrency: Currency,
  toAmount: number,
  toCurrency: Currency
): string {
  return `${formatMoney(fromAmount, fromCurrency)} = ${formatMoney(toAmount, toCurrency)}`;
}

/**
 * Get currency flag emoji by code
 */
export function getCurrencyFlag(code: string): string {
  const flagMap: Record<string, string> = {
    USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CHF: '🇨🇭',
    CAD: '🇨🇦', AUD: '🇦🇺', NZD: '🇳🇿', CNY: '🇨🇳', HKD: '🇭🇰',
    TWD: '🇹🇼', KRW: '🇰🇷', SGD: '🇸🇬', MYR: '🇲🇾', THB: '🇹🇭',
    IDR: '🇮🇩', PHP: '🇵🇭', VND: '🇻🇳', INR: '🇮🇳', AED: '🇦🇪',
    SAR: '🇸🇦', ILS: '🇮🇱', TRY: '🇹🇷', SEK: '🇸🇪', NOK: '🇳🇴',
    DKK: '🇩🇰', PLN: '🇵🇱', CZK: '🇨🇿', HUF: '🇭🇺', RUB: '🇷🇺',
    MXN: '🇲🇽', BRL: '🇧🇷', ARS: '🇦🇷', CLP: '🇨🇱', COP: '🇨🇴',
    ZAR: '🇿🇦', EGP: '🇪🇬', NGN: '🇳🇬', KES: '🇰🇪',
  };
  return flagMap[code] || '💱';
}

/**
 * Get commonly used currency pairs
 */
export function getCommonCurrencyPairs(): Array<[string, string]> {
  return [
    ['USD', 'EUR'],
    ['USD', 'GBP'],
    ['USD', 'JPY'],
    ['USD', 'CHF'],
    ['EUR', 'GBP'],
    ['EUR', 'JPY'],
    ['GBP', 'JPY'],
    ['USD', 'CNY'],
    ['USD', 'MYR'],
    ['USD', 'SGD'],
  ];
}

// ============================================
// COMPARISON FUNCTIONS
// ============================================

/**
 * Compare two monetary amounts in potentially different currencies
 */
export function compareCurrencyAmounts(
  amount1: number,
  currency1Code: string,
  amount2: number,
  currency2Code: string,
  getRate: (from: string, to: string) => number | null,
  baseCurrencyCode: string = 'USD'
): number {
  // Convert both to base currency for comparison
  const rate1 = currency1Code === baseCurrencyCode 
    ? 1 
    : getRate(currency1Code, baseCurrencyCode) || 1;
  const rate2 = currency2Code === baseCurrencyCode 
    ? 1 
    : getRate(currency2Code, baseCurrencyCode) || 1;

  const baseAmount1 = amount1 * rate1;
  const baseAmount2 = amount2 * rate2;

  if (baseAmount1 < baseAmount2) return -1;
  if (baseAmount1 > baseAmount2) return 1;
  return 0;
}

/**
 * Calculate percentage change between two amounts
 */
export function calculatePercentageChange(
  oldAmount: number,
  newAmount: number
): number {
  if (oldAmount === 0) return newAmount === 0 ? 0 : 100;
  return Number((((newAmount - oldAmount) / oldAmount) * 100).toFixed(2));
}

// ============================================
// BATCH OPERATIONS
// ============================================

export interface BatchConversionItem {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

export interface BatchConversionResult extends BatchConversionItem {
  convertedAmount: number | null;
  rate: number | null;
  error?: string;
}

/**
 * Batch convert multiple amounts
 */
export function batchConvert(
  items: BatchConversionItem[],
  getRate: (from: string, to: string) => number | null,
  currencies: Currency[]
): BatchConversionResult[] {
  return items.map((item) => {
    const rate = getRate(item.fromCurrency, item.toCurrency);
    
    if (rate === null) {
      return {
        ...item,
        convertedAmount: null,
        rate: null,
        error: `No exchange rate found for ${item.fromCurrency} to ${item.toCurrency}`,
      };
    }

    const toCurrency = currencies.find((c) => c.code === item.toCurrency);
    const decimalPlaces = toCurrency?.decimalPlaces ?? 2;
    
    return {
      ...item,
      convertedAmount: Number((item.amount * rate).toFixed(decimalPlaces)),
      rate,
    };
  });
}

// ============================================
// FORMATTING SHORTCUTS
// ============================================

/**
 * Format amount in compact notation (1.2K, 1.5M, etc.)
 */
export function formatCompact(
  amount: number,
  currency?: Currency
): string {
  const absAmount = Math.abs(amount);
  let suffix = '';
  let value = absAmount;

  if (absAmount >= 1e9) {
    value = absAmount / 1e9;
    suffix = 'B';
  } else if (absAmount >= 1e6) {
    value = absAmount / 1e6;
    suffix = 'M';
  } else if (absAmount >= 1e3) {
    value = absAmount / 1e3;
    suffix = 'K';
  }

  const formattedValue = value.toFixed(1).replace(/\.0$/, '');
  const sign = amount < 0 ? '-' : '';
  const symbol = currency?.symbol || '';
  const position = currency?.symbolPosition || 'BEFORE';

  if (position === 'BEFORE') {
    return `${sign}${symbol}${formattedValue}${suffix}`;
  }
  return `${sign}${formattedValue}${suffix}${symbol}`;
}

/**
 * Format amount as accounting style (negative in parentheses)
 */
export function formatAccounting(
  amount: number,
  currency: Currency
): string {
  const isNegative = amount < 0;
  const formatted = formatMoney(Math.abs(amount), currency);
  
  return isNegative ? `(${formatted})` : formatted;
}

