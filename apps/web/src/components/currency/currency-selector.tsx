import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getCurrencyFlag } from '@/lib/currency';
import { useCurrencyStore, PREDEFINED_CURRENCIES } from '@/stores/currency';
import type { Currency } from '@erp/shared-types';

// ============================================
// TYPES
// ============================================

interface CurrencySelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showFlag?: boolean;
  showSymbol?: boolean;
  className?: string;
  currencies?: Currency[];
  /** Use predefined currencies instead of store */
  usePredefined?: boolean;
}

// ============================================
// CURRENCY SELECTOR COMPONENT
// ============================================

export function CurrencySelector({
  value,
  onChange,
  placeholder = 'Select currency',
  disabled = false,
  showFlag = true,
  showSymbol = true,
  className,
  currencies: propCurrencies,
  usePredefined = false,
}: CurrencySelectorProps) {
  const storeCurrencies = useCurrencyStore((state) => state.currencies);
  
  // Use prop currencies, store currencies, or predefined currencies
  const currencies = propCurrencies || (usePredefined 
    ? PREDEFINED_CURRENCIES.map((p) => ({
        id: p.code,
        tenantId: '',
        code: p.code,
        name: p.name,
        symbol: p.symbol,
        decimalPlaces: p.decimalPlaces,
        symbolPosition: p.symbolPosition,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        isBaseCurrency: false,
        isActive: true,
        sortOrder: 0,
        createdAt: '',
        updatedAt: '',
      }))
    : storeCurrencies);

  const selectedCurrency = currencies.find((c) => c.code === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder}>
          {selectedCurrency && (
            <span className="flex items-center gap-2">
              {showFlag && <span>{getCurrencyFlag(selectedCurrency.code)}</span>}
              <span className="font-medium">{selectedCurrency.code}</span>
              {showSymbol && (
                <span className="text-muted-foreground">
                  ({selectedCurrency.symbol})
                </span>
              )}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <span className="flex items-center gap-2">
              {showFlag && <span>{getCurrencyFlag(currency.code)}</span>}
              <span className="font-medium">{currency.code}</span>
              <span className="text-muted-foreground">- {currency.name}</span>
              {showSymbol && (
                <span className="text-muted-foreground ml-1">
                  ({currency.symbol})
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ============================================
// CURRENCY DISPLAY COMPONENT
// ============================================

interface CurrencyDisplayProps {
  code: string;
  showFlag?: boolean;
  showName?: boolean;
  showSymbol?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  code,
  showFlag = true,
  showName = false,
  showSymbol = true,
  className,
}: CurrencyDisplayProps) {
  const currencies = useCurrencyStore((state) => state.currencies);
  const currency = currencies.find((c) => c.code === code);
  const predefined = PREDEFINED_CURRENCIES.find((p) => p.code === code);

  const displayCurrency = currency || predefined;

  if (!displayCurrency) {
    return <span className={className}>{code}</span>;
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {showFlag && <span>{getCurrencyFlag(code)}</span>}
      <span className="font-medium">{code}</span>
      {showName && <span className="text-muted-foreground">- {displayCurrency.name}</span>}
      {showSymbol && <span className="text-muted-foreground">({displayCurrency.symbol})</span>}
    </span>
  );
}

// ============================================
// CURRENCY AMOUNT INPUT
// ============================================

interface CurrencyAmountInputProps {
  amount: number | string;
  currency: string;
  onAmountChange?: (amount: number) => void;
  onCurrencyChange?: (currency: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showCurrencySelector?: boolean;
  className?: string;
}

export function CurrencyAmountInput({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  placeholder = '0.00',
  disabled = false,
  showCurrencySelector = true,
  className,
}: CurrencyAmountInputProps) {
  const currencies = useCurrencyStore((state) => state.currencies);
  const selectedCurrency = currencies.find((c) => c.code === currency);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && onAmountChange) {
      onAmountChange(value);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {selectedCurrency?.symbol || '$'}
        </span>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={handleAmountChange}
          placeholder={placeholder}
          disabled={disabled}
          className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm"
        />
      </div>
      {showCurrencySelector && (
        <CurrencySelector
          value={currency}
          onChange={onCurrencyChange}
          disabled={disabled}
          showFlag={false}
          showSymbol={false}
          className="w-24"
        />
      )}
    </div>
  );
}

// ============================================
// CURRENCY EXCHANGE DISPLAY
// ============================================

interface CurrencyExchangeDisplayProps {
  fromCode: string;
  toCode: string;
  rate?: number | null;
  className?: string;
  compact?: boolean;
}

export function CurrencyExchangeDisplay({
  fromCode,
  toCode,
  rate,
  className,
  compact = false,
}: CurrencyExchangeDisplayProps) {
  const getExchangeRate = useCurrencyStore((state) => state.getExchangeRate);
  const displayRate = rate ?? getExchangeRate(fromCode, toCode);

  if (displayRate === null) {
    return (
      <span className={cn('text-muted-foreground text-sm', className)}>
        No rate available
      </span>
    );
  }

  if (compact) {
    return (
      <span className={cn('font-mono text-sm', className)}>
        {displayRate.toFixed(4)}
      </span>
    );
  }

  return (
    <span className={cn('text-sm', className)}>
      <span className="inline-flex items-center gap-1">
        <span>{getCurrencyFlag(fromCode)}</span>
        <span>1 {fromCode}</span>
      </span>
      <span className="mx-2 text-muted-foreground">=</span>
      <span className="inline-flex items-center gap-1">
        <span className="font-mono font-medium">{displayRate.toFixed(4)}</span>
        <span>{getCurrencyFlag(toCode)}</span>
        <span>{toCode}</span>
      </span>
    </span>
  );
}

// ============================================
// MULTI-CURRENCY AMOUNT
// ============================================

interface MultiCurrencyAmountProps {
  amount: number;
  primaryCurrency: string;
  secondaryCurrency?: string;
  exchangeRate?: number;
  showSecondary?: boolean;
  className?: string;
}

export function MultiCurrencyAmount({
  amount,
  primaryCurrency,
  secondaryCurrency,
  exchangeRate,
  showSecondary = true,
  className,
}: MultiCurrencyAmountProps) {
  const currencies = useCurrencyStore((state) => state.currencies);
  const getRate = useCurrencyStore((state) => state.getExchangeRate);

  const primaryCurrencyData = currencies.find((c) => c.code === primaryCurrency);
  const secondaryCurrencyData = currencies.find((c) => c.code === secondaryCurrency);

  const rate = exchangeRate ?? (secondaryCurrency ? getRate(primaryCurrency, secondaryCurrency) : null);
  const convertedAmount = rate && secondaryCurrency ? amount * rate : null;

  const formatAmount = (value: number, curr: Currency | undefined) => {
    if (!curr) return value.toFixed(2);
    const decimals = curr.decimalPlaces;
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className={cn('space-y-0.5', className)}>
      <div className="flex items-center gap-1">
        <span className="text-lg">{getCurrencyFlag(primaryCurrency)}</span>
        <span className="font-mono font-medium">
          {primaryCurrencyData?.symbol}
          {formatAmount(amount, primaryCurrencyData)}
        </span>
        <span className="text-muted-foreground">{primaryCurrency}</span>
      </div>
      {showSecondary && secondaryCurrency && convertedAmount !== null && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>≈</span>
          <span>{getCurrencyFlag(secondaryCurrency)}</span>
          <span className="font-mono">
            {secondaryCurrencyData?.symbol}
            {formatAmount(convertedAmount, secondaryCurrencyData)}
          </span>
          <span>{secondaryCurrency}</span>
        </div>
      )}
    </div>
  );
}

