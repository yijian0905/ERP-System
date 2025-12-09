import { createFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowRightLeft,
  Bell,
  Building2,
  CircleDollarSign,
  Coins,
  Edit,
  Globe,
  MoreHorizontal,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { get, patch, post, del } from '@/lib/api-client';
import {
  formatCurrency,
  PREDEFINED_CURRENCIES,
} from '@/stores/currency';
import { useSettingsStore } from '@/stores/settings';
import type { Currency, ExchangeRate, PredefinedCurrency, UpdateCurrencyRequest, CreateCurrencyRequest, CreateExchangeRateRequest } from '@erp/shared-types';

export const Route = createFileRoute('/_dashboard/settings/currencies')({
  component: CurrencySettingsPage,
});

// Settings navigation tabs
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

// Detect user's default currency based on locale/timezone
const detectDefaultCurrency = (): string => {
  try {
    // Get user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Get user's locale
    const locale = navigator.language || 'en-US';
    
    // Map timezone/locale to currency
    if (timezone.includes('Asia/Kuala_Lumpur') || locale.includes('ms-MY') || locale.includes('en-MY')) {
      return 'MYR';
    }
    if (timezone.includes('Asia/Singapore') || locale.includes('en-SG') || locale.includes('zh-SG')) {
      return 'SGD';
    }
    if (timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Hong_Kong') || 
        locale.includes('zh-CN') || locale.includes('zh-HK')) {
      return 'CNY';
    }
    if (timezone.includes('Asia/Taipei') || locale.includes('zh-TW')) {
      return 'TWD';
    }
    // Default to USD
    return 'USD';
  } catch {
    return 'USD';
  }
};

// Mock data for demonstration - USD, MYR, SGD, CNY, TWD
const mockCurrencies: Currency[] = [
  {
    id: '1',
    tenantId: '1',
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2,
    symbolPosition: 'BEFORE',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isBaseCurrency: true,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    tenantId: '1',
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    decimalPlaces: 2,
    symbolPosition: 'BEFORE',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isBaseCurrency: false,
    isActive: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    tenantId: '1',
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    decimalPlaces: 2,
    symbolPosition: 'BEFORE',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isBaseCurrency: false,
    isActive: true,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    tenantId: '1',
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    decimalPlaces: 2,
    symbolPosition: 'BEFORE',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isBaseCurrency: false,
    isActive: true,
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    tenantId: '1',
    code: 'TWD',
    name: 'Taiwan Dollar',
    symbol: 'NT$',
    decimalPlaces: 0,
    symbolPosition: 'BEFORE',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isBaseCurrency: false,
    isActive: true,
    sortOrder: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Exchange rates: USD to MYR, SGD, CNY, TWD
const mockExchangeRates: (ExchangeRate & { fromCurrency?: Currency; toCurrency?: Currency })[] = [
  {
    id: '1',
    tenantId: '1',
    fromCurrencyId: '1', // USD
    toCurrencyId: '2',   // MYR
    rate: 4.47,
    inverseRate: 0.2237,
    effectiveDate: new Date().toISOString(),
    source: 'MANUAL',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fromCurrency: mockCurrencies[0],
    toCurrency: mockCurrencies[1],
  },
  {
    id: '2',
    tenantId: '1',
    fromCurrencyId: '1', // USD
    toCurrencyId: '3',   // SGD
    rate: 1.34,
    inverseRate: 0.746,
    effectiveDate: new Date().toISOString(),
    source: 'MANUAL',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fromCurrency: mockCurrencies[0],
    toCurrency: mockCurrencies[2],
  },
  {
    id: '3',
    tenantId: '1',
    fromCurrencyId: '1', // USD
    toCurrencyId: '4',   // CNY
    rate: 7.24,
    inverseRate: 0.1381,
    effectiveDate: new Date().toISOString(),
    source: 'MANUAL',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fromCurrency: mockCurrencies[0],
    toCurrency: mockCurrencies[3],
  },
  {
    id: '4',
    tenantId: '1',
    fromCurrencyId: '1', // USD
    toCurrencyId: '5',   // TWD
    rate: 32.1,
    inverseRate: 0.0311,
    effectiveDate: new Date().toISOString(),
    source: 'MANUAL',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fromCurrency: mockCurrencies[0],
    toCurrency: mockCurrencies[4],
  },
];

function CurrencySettingsPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<(ExchangeRate & { fromCurrency?: Currency; toCurrency?: Currency })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'currencies' | 'rates' | 'converter'>('currencies');
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingBase, setIsSettingBase] = useState<string | null>(null);
  
  // Global settings store for currency
  const setGlobalCurrency = useSettingsStore((state) => state.setCurrency);
  
  // Dialog states
  const [isAddCurrencyOpen, setIsAddCurrencyOpen] = useState(false);
  const [isEditCurrencyOpen, setIsEditCurrencyOpen] = useState(false);
  const [isAddRateOpen, setIsAddRateOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  
  // Currency form state
  const [currencyForm, setCurrencyForm] = useState({
    code: '',
    name: '',
    symbol: '',
    decimalPlaces: 2,
    symbolPosition: 'BEFORE' as 'BEFORE' | 'AFTER',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isBaseCurrency: false,
  });

  // Exchange rate form state
  const [rateForm, setRateForm] = useState({
    fromCurrencyId: '',
    toCurrencyId: '',
    rate: '',
  });

  // Detected default currency based on user location
  const detectedCurrency = detectDefaultCurrency();

  // Converter state - use detected currency as default
  const [converterState, setConverterState] = useState({
    amount: '1000',
    fromCurrency: 'USD',
    toCurrency: detectedCurrency === 'USD' ? 'MYR' : detectedCurrency,
  });

  // Load currencies and exchange rates on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load currencies
        const currenciesResponse = await get<Currency[]>('/v1/currencies', {
          params: { limit: 100, activeOnly: false },
        });
        
        let loadedCurrencies: Currency[] = [];
        if (currenciesResponse.success && currenciesResponse.data) {
          loadedCurrencies = currenciesResponse.data;
          setCurrencies(loadedCurrencies);
          
          // Auto-set global currency based on detected location if currency exists
          const detectedCode = detectDefaultCurrency();
          const detectedCurrencyExists = loadedCurrencies.find((c) => c.code === detectedCode);
          if (detectedCurrencyExists) {
            setGlobalCurrency(detectedCode);
          }
        }

        // Load exchange rates
        const ratesResponse = await get<ExchangeRate[]>('/v1/currencies/exchange-rates', {
          params: { limit: 100, activeOnly: false },
        });
        if (ratesResponse.success && ratesResponse.data) {
          // Enrich rates with currency data
          const enrichedRates = ratesResponse.data.map((rate) => {
            const fromCurrency = loadedCurrencies.find((c) => c.id === rate.fromCurrencyId);
            const toCurrency = loadedCurrencies.find((c) => c.id === rate.toCurrencyId);
            return {
              ...rate,
              fromCurrency,
              toCurrency,
            };
          });
          setExchangeRates(enrichedRates);
        }
      } catch (error) {
        console.error('Failed to load currencies:', error);
        // Fallback to mock data for development
        // Apply detected currency as base for mock data
        const detectedCode = detectDefaultCurrency();
        const updatedMockCurrencies = mockCurrencies.map((c) => ({
          ...c,
          isBaseCurrency: c.code === detectedCode,
        }));
        setCurrencies(updatedMockCurrencies);
        setExchangeRates(mockExchangeRates);
        setGlobalCurrency(detectedCode);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [setGlobalCurrency]);

  const baseCurrency = currencies.find((c) => c.isBaseCurrency);

  // Filter currencies based on search
  const filteredCurrencies = currencies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get exchange rate between two currencies
  const getRate = useCallback(
    (fromCode: string, toCode: string): number | null => {
      if (fromCode === toCode) return 1;

      const fromCurrency = currencies.find((c) => c.code === fromCode);
      const toCurrency = currencies.find((c) => c.code === toCode);

      if (!fromCurrency || !toCurrency) return null;

      // Find direct rate
      const directRate = exchangeRates.find(
        (r) =>
          r.fromCurrencyId === fromCurrency.id &&
          r.toCurrencyId === toCurrency.id &&
          r.isActive
      );
      if (directRate) return Number(directRate.rate);

      // Find inverse rate
      const inverseRate = exchangeRates.find(
        (r) =>
          r.fromCurrencyId === toCurrency.id &&
          r.toCurrencyId === fromCurrency.id &&
          r.isActive
      );
      if (inverseRate) return Number(inverseRate.inverseRate);

      return null;
    },
    [currencies, exchangeRates]
  );

  // Convert amount
  const convertAmount = useCallback(
    (amount: number, fromCode: string, toCode: string): number | null => {
      const rate = getRate(fromCode, toCode);
      if (rate === null) return null;

      const toCurrency = currencies.find((c) => c.code === toCode);
      const decimals = toCurrency?.decimalPlaces ?? 2;

      return Number((amount * rate).toFixed(decimals));
    },
    [currencies, getRate]
  );

  // Handle setting base currency (click on card)
  const handleSetBaseCurrency = async (currency: Currency) => {
    if (currency.isBaseCurrency || isSettingBase) return;
    
    setIsSettingBase(currency.id);
    
    try {
      // Call API to set as base currency
      const response = await patch<Currency>(
        `/v1/currencies/${currency.id}`,
        { isBaseCurrency: true }
      );

      if (response.success && response.data) {
        // Reload all currencies to get updated base currency status
        const currenciesResponse = await get<Currency[]>('/v1/currencies', {
          params: { limit: 100, activeOnly: false },
        });
        
        if (currenciesResponse.success && currenciesResponse.data) {
          setCurrencies(currenciesResponse.data);
        } else {
          // Fallback: update local state with API response
          setCurrencies((prev) =>
            prev.map((c) =>
              c.id === currency.id
                ? response.data!
                : { ...c, isBaseCurrency: false }
            )
          );
        }
        
        // Update global settings store with new base currency
        setGlobalCurrency(currency.code);
      }
    } catch (error) {
      console.error('Failed to set base currency:', error);
      alert('Failed to set base currency. Please try again.');
    } finally {
      setIsSettingBase(null);
    }
  };

  // Handle adding a currency from predefined list
  const handleSelectPredefinedCurrency = (predefined: PredefinedCurrency) => {
    setCurrencyForm({
      code: predefined.code,
      name: predefined.name,
      symbol: predefined.symbol,
      decimalPlaces: predefined.decimalPlaces,
      symbolPosition: predefined.symbolPosition,
      thousandsSeparator: ',',
      decimalSeparator: '.',
      isBaseCurrency: false,
    });
  };

  // Handle add currency
  const handleAddCurrency = async () => {
    try {
      const createData: CreateCurrencyRequest = {
        ...currencyForm,
      };

      // Call API to create currency
      const response = await post<Currency>('/v1/currencies', createData);

      if (response.success && response.data) {
        // Update local state with API response
        setCurrencies((prev) => [...prev, response.data!]);
        setIsAddCurrencyOpen(false);
        resetCurrencyForm();
      }
    } catch (error) {
      console.error('Failed to create currency:', error);
      alert('Failed to create currency. Please try again.');
    }
  };

  // Handle edit currency
  const handleEditCurrency = async () => {
    if (!selectedCurrency) return;

    try {
      const updateData: UpdateCurrencyRequest = {
        ...currencyForm,
      };

      // Call API to update currency
      const response = await patch<Currency>(
        `/v1/currencies/${selectedCurrency.id}`,
        updateData
      );

      if (response.success && response.data) {
        // Update local state with API response
        setCurrencies((prev) =>
          prev.map((c) =>
            c.id === selectedCurrency.id ? response.data! : c
          )
        );
      }

      setIsEditCurrencyOpen(false);
      setSelectedCurrency(null);
      resetCurrencyForm();
    } catch (error) {
      console.error('Failed to update currency:', error);
      alert('Failed to update currency. Please try again.');
    }
  };

  // Handle delete currency
  const handleDeleteCurrency = async (id: string) => {
    const currency = currencies.find((c) => c.id === id);
    if (currency?.isBaseCurrency) {
      alert('Cannot delete base currency. Set another currency as base first.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${currency?.name} (${currency?.code})?`)) {
      return;
    }

    try {
      // Call API to delete currency
      const response = await del<{ message: string }>(`/v1/currencies/${id}`);

      if (response.success) {
        // Update local state
        setCurrencies((prev) => prev.filter((c) => c.id !== id));
        setExchangeRates((prev) =>
          prev.filter((r) => r.fromCurrencyId !== id && r.toCurrencyId !== id)
        );
      }
    } catch (error) {
      console.error('Failed to delete currency:', error);
      alert('Failed to delete currency. Please try again.');
    }
  };

  // Handle add exchange rate
  const handleAddExchangeRate = async () => {
    if (!rateForm.fromCurrencyId || !rateForm.toCurrencyId || !rateForm.rate) {
      return;
    }

    const rate = parseFloat(rateForm.rate);
    if (isNaN(rate) || rate <= 0) return;

    try {
      const createData: CreateExchangeRateRequest = {
        fromCurrencyId: rateForm.fromCurrencyId,
        toCurrencyId: rateForm.toCurrencyId,
        rate,
        source: 'MANUAL',
      };

      // Call API to create exchange rate
      const response = await post<ExchangeRate>('/v1/currencies/exchange-rates', createData);

      if (response.success && response.data) {
        // Enrich with currency data
        const fromCurrency = currencies.find((c) => c.id === rateForm.fromCurrencyId);
        const toCurrency = currencies.find((c) => c.id === rateForm.toCurrencyId);
        const enrichedRate = {
          ...response.data,
          fromCurrency,
          toCurrency,
        };

        // Update local state
        setExchangeRates((prev) => [...prev, enrichedRate]);
        setIsAddRateOpen(false);
        setRateForm({ fromCurrencyId: '', toCurrencyId: '', rate: '' });
      }
    } catch (error) {
      console.error('Failed to create exchange rate:', error);
      alert('Failed to create exchange rate. Please try again.');
    }
  };

  // Handle delete exchange rate
  const handleDeleteRate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exchange rate?')) {
      return;
    }

    try {
      // Call API to delete exchange rate
      const response = await del<{ message: string }>(`/v1/currencies/exchange-rates/${id}`);

      if (response.success) {
        // Update local state
        setExchangeRates((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete exchange rate:', error);
      alert('Failed to delete exchange rate. Please try again.');
    }
  };

  // Reset currency form
  const resetCurrencyForm = () => {
    setCurrencyForm({
      code: '',
      name: '',
      symbol: '',
      decimalPlaces: 2,
      symbolPosition: 'BEFORE',
      thousandsSeparator: ',',
      decimalSeparator: '.',
      isBaseCurrency: false,
    });
  };

  // Open edit dialog
  const openEditDialog = (currency: Currency) => {
    setSelectedCurrency(currency);
    setCurrencyForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      decimalPlaces: currency.decimalPlaces,
      symbolPosition: currency.symbolPosition,
      thousandsSeparator: currency.thousandsSeparator,
      decimalSeparator: currency.decimalSeparator,
      isBaseCurrency: currency.isBaseCurrency,
    });
    setIsEditCurrencyOpen(true);
  };

  // Get flag for currency
  const getCurrencyFlag = (code: string): string => {
    const predefined = PREDEFINED_CURRENCIES.find((c) => c.code === code);
    return predefined?.flag || '💱';
  };

  // Computed converter result
  const converterResult = convertAmount(
    parseFloat(converterState.amount) || 0,
    converterState.fromCurrency,
    converterState.toCurrency
  );

  const converterRate = getRate(
    converterState.fromCurrency,
    converterState.toCurrency
  );

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
                    tab.id === 'currencies'
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
          {/* Header with Tabs */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5" />
                Currency Management
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage currencies and exchange rates for multi-currency transactions
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b px-4">
              <nav className="flex gap-4">
                <button
                  onClick={() => setActiveTab('currencies')}
                  className={cn(
                    'py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'currencies'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Coins className="inline h-4 w-4 mr-2" />
                  Currencies
                </button>
                <button
                  onClick={() => setActiveTab('rates')}
                  className={cn(
                    'py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'rates'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <TrendingUp className="inline h-4 w-4 mr-2" />
                  Exchange Rates
                </button>
                <button
                  onClick={() => setActiveTab('converter')}
                  className={cn(
                    'py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'converter'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ArrowRightLeft className="inline h-4 w-4 mr-2" />
                  Converter
                </button>
              </nav>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading currencies...</p>
                  </div>
                </div>
              ) : (
                <>
              {/* Currencies Tab */}
              {activeTab === 'currencies' && (
                <div className="space-y-4">
                  {/* Actions Row */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search currencies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={() => setIsAddCurrencyOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Currency
                    </Button>
                  </div>

                  {/* Base Currency Info */}
                  {baseCurrency && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCurrencyFlag(baseCurrency.code)}</span>
                        <div>
                          <p className="text-sm font-medium">Base Currency</p>
                          <p className="text-lg font-bold">
                            {baseCurrency.name} ({baseCurrency.code})
                          </p>
                        </div>
                        <Badge className="ml-auto bg-primary">Base</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        All exchange rates are calculated relative to this currency.
                        Sample: {formatCurrency(1234.56, baseCurrency)}
                      </p>
                    </div>
                  )}

                  {/* Currencies Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCurrencies.map((currency) => (
                      <Card
                        key={currency.id}
                        onClick={() => handleSetBaseCurrency(currency)}
                        className={cn(
                          'p-4 transition-all relative group',
                          currency.isBaseCurrency
                            ? 'ring-2 ring-primary bg-primary/5 cursor-default'
                            : 'cursor-pointer hover:ring-2 hover:ring-primary/50 hover:shadow-md',
                          isSettingBase === currency.id && 'opacity-70 pointer-events-none'
                        )}
                      >
                        {/* Loading overlay */}
                        {isSettingBase === currency.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg z-10">
                            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        )}

                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {getCurrencyFlag(currency.code)}
                            </span>
                            <div>
                              <p className="font-medium">{currency.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {currency.code} • {currency.symbol}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(currency)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {!currency.isBaseCurrency && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteCurrency(currency.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {currency.isBaseCurrency && (
                            <Badge variant="default">Base</Badge>
                          )}
                          {currency.isActive ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {currency.decimalPlaces} decimals
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-muted-foreground">
                          Format: {formatCurrency(1234.56, currency)}
                        </p>

                        {!currency.isBaseCurrency && baseCurrency && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Rate: 1 {baseCurrency.code} ={' '}
                            {getRate(baseCurrency.code, currency.code)?.toFixed(4) || 'N/A'}{' '}
                            {currency.code}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Exchange Rates Tab */}
              {activeTab === 'rates' && (
                <div className="space-y-4">
                  {/* Actions Row */}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Manage exchange rates between currencies
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Rates
                      </Button>
                      <Button size="sm" onClick={() => setIsAddRateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Rate
                      </Button>
                    </div>
                  </div>

                  {/* Rates Table */}
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">
                            From
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium">
                            To
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium">
                            Rate
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium">
                            Inverse
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-medium">
                            Source
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium">
                            Effective
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {exchangeRates.map((rate) => (
                          <tr key={rate.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span>{getCurrencyFlag(rate.fromCurrency?.code || '')}</span>
                                <span className="font-medium">
                                  {rate.fromCurrency?.code}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span>{getCurrencyFlag(rate.toCurrency?.code || '')}</span>
                                <span className="font-medium">
                                  {rate.toCurrency?.code}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {Number(rate.rate).toFixed(6)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                              {Number(rate.inverseRate).toFixed(6)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className="text-xs">
                                {rate.source}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(rate.effectiveDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteRate(rate.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {exchangeRates.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                              No exchange rates configured. Add a rate to get started.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Converter Tab */}
              {activeTab === 'converter' && (
                <div className="max-w-xl mx-auto space-y-6">
                  <div className="rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <ArrowRightLeft className="h-5 w-5" />
                      Currency Converter
                    </h3>

                    <div className="space-y-4">
                      {/* Amount Input */}
                      <div className="grid gap-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={converterState.amount}
                          onChange={(e) =>
                            setConverterState((prev) => ({
                              ...prev,
                              amount: e.target.value,
                            }))
                          }
                          className="text-2xl font-bold h-14"
                        />
                      </div>

                      {/* Currency Selection */}
                      <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
                        <div className="grid gap-2">
                          <Label>From</Label>
                          <Select
                            value={converterState.fromCurrency}
                            onValueChange={(value) =>
                              setConverterState((prev) => ({
                                ...prev,
                                fromCurrency: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map((c) => (
                                <SelectItem key={c.id} value={c.code}>
                                  <span className="flex items-center gap-2">
                                    <span>{getCurrencyFlag(c.code)}</span>
                                    <span>{c.code}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-12 w-12 rounded-full"
                          onClick={() =>
                            setConverterState((prev) => ({
                              ...prev,
                              fromCurrency: prev.toCurrency,
                              toCurrency: prev.fromCurrency,
                            }))
                          }
                        >
                          <ArrowRightLeft className="h-5 w-5" />
                        </Button>

                        <div className="grid gap-2">
                          <Label>To</Label>
                          <Select
                            value={converterState.toCurrency}
                            onValueChange={(value) =>
                              setConverterState((prev) => ({
                                ...prev,
                                toCurrency: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map((c) => (
                                <SelectItem key={c.id} value={c.code}>
                                  <span className="flex items-center gap-2">
                                    <span>{getCurrencyFlag(c.code)}</span>
                                    <span>{c.code}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Result */}
                      <div className="rounded-lg bg-background border p-4 mt-4">
                        {converterResult !== null ? (
                          <>
                            <p className="text-sm text-muted-foreground mb-1">
                              Converted Amount
                            </p>
                            <p className="text-3xl font-bold">
                              {formatCurrency(
                                converterResult,
                                currencies.find(
                                  (c) => c.code === converterState.toCurrency
                                ) || null
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              1 {converterState.fromCurrency} = {converterRate?.toFixed(6)}{' '}
                              {converterState.toCurrency}
                            </p>
                          </>
                        ) : (
                          <p className="text-center text-muted-foreground py-4">
                            No exchange rate available for this pair.
                            <br />
                            Please add an exchange rate first.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Rates Reference */}
                  {baseCurrency && (
                    <div className="rounded-lg border p-4">
                      <h4 className="font-medium mb-3">
                        Quick Rates (Base: {baseCurrency.code})
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {currencies
                          .filter((c) => !c.isBaseCurrency)
                          .map((c) => {
                            const rate = getRate(baseCurrency.code, c.code);
                            return (
                              <div
                                key={c.id}
                                className="flex justify-between text-sm p-2 rounded bg-muted/50"
                              >
                                <span className="flex items-center gap-1">
                                  <span>{getCurrencyFlag(c.code)}</span>
                                  {c.code}
                                </span>
                                <span className="font-mono">
                                  {rate?.toFixed(4) || 'N/A'}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
                </>
              )}

          {/* Info Box */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Click on any currency card to set it as the base currency. 
              The base currency is used for all exchange rate calculations and will be applied globally across the system.
            </p>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Currency Dialog */}
      <Dialog open={isAddCurrencyOpen} onOpenChange={setIsAddCurrencyOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Currency</DialogTitle>
            <DialogDescription>
              Select a predefined currency or enter custom details.
            </DialogDescription>
          </DialogHeader>

          {/* Predefined Currencies Grid */}
          <div className="space-y-4">
            <Label>Quick Select</Label>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
              {PREDEFINED_CURRENCIES.filter(
                (p) => !currencies.some((c) => c.code === p.code)
              ).map((predefined) => (
                <button
                  key={predefined.code}
                  onClick={() => handleSelectPredefinedCurrency(predefined)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors text-sm',
                    currencyForm.code === predefined.code
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-muted'
                  )}
                >
                  <span className="text-lg">{predefined.flag}</span>
                  <span className="font-medium">{predefined.code}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Currency Code</Label>
                <Input
                  id="code"
                  value={currencyForm.code}
                  onChange={(e) =>
                    setCurrencyForm((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase().slice(0, 3),
                    }))
                  }
                  placeholder="USD"
                  maxLength={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  value={currencyForm.symbol}
                  onChange={(e) =>
                    setCurrencyForm((prev) => ({
                      ...prev,
                      symbol: e.target.value,
                    }))
                  }
                  placeholder="$"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Currency Name</Label>
              <Input
                id="name"
                value={currencyForm.name}
                onChange={(e) =>
                  setCurrencyForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="US Dollar"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="decimals">Decimal Places</Label>
                <Select
                  value={String(currencyForm.decimalPlaces)}
                  onValueChange={(value) =>
                    setCurrencyForm((prev) => ({
                      ...prev,
                      decimalPlaces: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="position">Symbol Position</Label>
                <Select
                  value={currencyForm.symbolPosition}
                  onValueChange={(value: 'BEFORE' | 'AFTER') =>
                    setCurrencyForm((prev) => ({
                      ...prev,
                      symbolPosition: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEFORE">Before ($100)</SelectItem>
                    <SelectItem value="AFTER">After (100€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isBase"
                checked={currencyForm.isBaseCurrency}
                onChange={(e) =>
                  setCurrencyForm((prev) => ({
                    ...prev,
                    isBaseCurrency: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <Label htmlFor="isBase" className="cursor-pointer">
                Set as base currency
              </Label>
            </div>

            {currencyForm.code && currencyForm.symbol && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">Preview:</p>
                <p className="text-lg font-medium">
                  {currencyForm.symbolPosition === 'BEFORE'
                    ? `${currencyForm.symbol}1,234.56`
                    : `1,234.56${currencyForm.symbol}`}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddCurrencyOpen(false);
                resetCurrencyForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCurrency}
              disabled={!currencyForm.code || !currencyForm.name || !currencyForm.symbol}
            >
              Add Currency
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Currency Dialog */}
      <Dialog open={isEditCurrencyOpen} onOpenChange={setIsEditCurrencyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Currency</DialogTitle>
            <DialogDescription>
              Update currency details for {selectedCurrency?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-code">Currency Code</Label>
                <Input
                  id="edit-code"
                  value={currencyForm.code}
                  onChange={(e) =>
                    setCurrencyForm((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase().slice(0, 3),
                    }))
                  }
                  maxLength={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-symbol">Symbol</Label>
                <Input
                  id="edit-symbol"
                  value={currencyForm.symbol}
                  onChange={(e) =>
                    setCurrencyForm((prev) => ({
                      ...prev,
                      symbol: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-name">Currency Name</Label>
              <Input
                id="edit-name"
                value={currencyForm.name}
                onChange={(e) =>
                  setCurrencyForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Decimal Places</Label>
                <Select
                  value={String(currencyForm.decimalPlaces)}
                  onValueChange={(value) =>
                    setCurrencyForm((prev) => ({
                      ...prev,
                      decimalPlaces: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Symbol Position</Label>
                <Select
                  value={currencyForm.symbolPosition}
                  onValueChange={(value: 'BEFORE' | 'AFTER') =>
                    setCurrencyForm((prev) => ({
                      ...prev,
                      symbolPosition: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEFORE">Before ($100)</SelectItem>
                    <SelectItem value="AFTER">After (100€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-isBase"
                checked={currencyForm.isBaseCurrency}
                onChange={(e) =>
                  setCurrencyForm((prev) => ({
                    ...prev,
                    isBaseCurrency: e.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <Label htmlFor="edit-isBase" className="cursor-pointer">
                Set as base currency
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditCurrencyOpen(false);
                setSelectedCurrency(null);
                resetCurrencyForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditCurrency}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Exchange Rate Dialog */}
      <Dialog open={isAddRateOpen} onOpenChange={setIsAddRateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Exchange Rate</DialogTitle>
            <DialogDescription>
              Define the exchange rate between two currencies.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
              <div className="grid gap-2">
                <Label>From Currency</Label>
                <Select
                  value={rateForm.fromCurrencyId}
                  onValueChange={(value) =>
                    setRateForm((prev) => ({ ...prev, fromCurrencyId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <span>{getCurrencyFlag(c.code)}</span>
                          <span>{c.code}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />

              <div className="grid gap-2">
                <Label>To Currency</Label>
                <Select
                  value={rateForm.toCurrencyId}
                  onValueChange={(value) =>
                    setRateForm((prev) => ({ ...prev, toCurrencyId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies
                      .filter((c) => c.id !== rateForm.fromCurrencyId)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            <span>{getCurrencyFlag(c.code)}</span>
                            <span>{c.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rate">Exchange Rate</Label>
              <Input
                id="rate"
                type="number"
                step="0.000001"
                value={rateForm.rate}
                onChange={(e) =>
                  setRateForm((prev) => ({ ...prev, rate: e.target.value }))
                }
                placeholder="1.0"
              />
              {rateForm.rate && parseFloat(rateForm.rate) > 0 && (
                <p className="text-sm text-muted-foreground">
                  1{' '}
                  {currencies.find((c) => c.id === rateForm.fromCurrencyId)?.code ||
                    'FROM'}{' '}
                  = {rateForm.rate}{' '}
                  {currencies.find((c) => c.id === rateForm.toCurrencyId)?.code ||
                    'TO'}
                  <br />
                  Inverse: 1{' '}
                  {currencies.find((c) => c.id === rateForm.toCurrencyId)?.code ||
                    'TO'}{' '}
                  = {(1 / parseFloat(rateForm.rate)).toFixed(6)}{' '}
                  {currencies.find((c) => c.id === rateForm.fromCurrencyId)?.code ||
                    'FROM'}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddRateOpen(false);
                setRateForm({ fromCurrencyId: '', toCurrencyId: '', rate: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddExchangeRate}
              disabled={
                !rateForm.fromCurrencyId ||
                !rateForm.toCurrencyId ||
                !rateForm.rate ||
                parseFloat(rateForm.rate) <= 0
              }
            >
              Add Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

