/**
 * Currencies API functions
 */

import type { ApiResponse, PaginationMeta, Currency, ExchangeRate } from '@erp/shared-types';
import { get, post, patch, del } from '../api-client';

export interface CurrencyListParams {
    page?: number;
    limit?: number;
    search?: string;
    activeOnly?: boolean;
}

export interface ExchangeRateListParams {
    page?: number;
    limit?: number;
    fromCurrencyId?: string;
    toCurrencyId?: string;
    activeOnly?: boolean;
}

export interface CreateCurrencyData {
    code: string;
    name: string;
    symbol: string;
    decimalPlaces?: number;
    symbolPosition?: 'BEFORE' | 'AFTER';
    thousandsSeparator?: string;
    decimalSeparator?: string;
    isBaseCurrency?: boolean;
    sortOrder?: number;
}

export interface UpdateCurrencyData {
    code?: string;
    name?: string;
    symbol?: string;
    decimalPlaces?: number;
    symbolPosition?: 'BEFORE' | 'AFTER';
    thousandsSeparator?: string;
    decimalSeparator?: string;
    isBaseCurrency?: boolean;
    sortOrder?: number;
    isActive?: boolean;
}

export interface CreateExchangeRateData {
    fromCurrencyId: string;
    toCurrencyId: string;
    rate: number;
    source?: 'MANUAL' | 'API' | 'BANK';
    sourceReference?: string;
}

export interface UpdateExchangeRateData {
    rate?: number;
    source?: 'MANUAL' | 'API' | 'BANK';
    sourceReference?: string;
    isActive?: boolean;
}

export const currenciesApi = {
    /**
     * Get list of currencies
     */
    async list(params?: CurrencyListParams): Promise<ApiResponse<Currency[]> & { meta?: PaginationMeta }> {
        return get<Currency[]>('/v1/currencies', { params });
    },

    /**
     * Get a single currency by ID
     */
    async getById(id: string): Promise<ApiResponse<Currency>> {
        return get<Currency>(`/v1/currencies/${id}`);
    },

    /**
     * Create a new currency
     */
    async create(data: CreateCurrencyData): Promise<ApiResponse<Currency>> {
        return post<Currency>('/v1/currencies', data);
    },

    /**
     * Update a currency
     */
    async update(id: string, data: UpdateCurrencyData): Promise<ApiResponse<Currency>> {
        return patch<Currency>(`/v1/currencies/${id}`, data);
    },

    /**
     * Delete a currency
     */
    async delete(id: string): Promise<ApiResponse<{ message: string }>> {
        return del<{ message: string }>(`/v1/currencies/${id}`);
    },

    /**
     * Set a currency as base
     */
    async setAsBase(id: string): Promise<ApiResponse<Currency>> {
        return post<Currency>(`/v1/currencies/${id}/set-base`);
    },

    /**
     * Get list of exchange rates
     */
    async listExchangeRates(params?: ExchangeRateListParams): Promise<ApiResponse<ExchangeRate[]> & { meta?: PaginationMeta }> {
        return get<ExchangeRate[]>('/v1/currencies/exchange-rates', { params });
    },

    /**
     * Create a new exchange rate
     */
    async createExchangeRate(data: CreateExchangeRateData): Promise<ApiResponse<ExchangeRate>> {
        return post<ExchangeRate>('/v1/currencies/exchange-rates', data);
    },

    /**
     * Update an exchange rate
     */
    async updateExchangeRate(id: string, data: UpdateExchangeRateData): Promise<ApiResponse<ExchangeRate>> {
        return patch<ExchangeRate>(`/v1/currencies/exchange-rates/${id}`, data);
    },

    /**
     * Delete an exchange rate
     */
    async deleteExchangeRate(id: string): Promise<ApiResponse<{ message: string }>> {
        return del<{ message: string }>(`/v1/currencies/exchange-rates/${id}`);
    },
};
