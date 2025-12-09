/**
 * Forecasting API Client
 * Handles communication with the forecasting API endpoints
 */

import { get, post } from '../api-client';

// Types
export interface ForecastPrediction {
  date: string;
  predicted_demand: number;
  lower_bound?: number;
  upper_bound?: number;
}

export interface DemandForecastResponse {
  product_id: string;
  forecast_days: number;
  predictions: ForecastPrediction[];
  model_metrics?: {
    mae?: number;
    mse?: number;
    r2?: number;
    historical_mean?: number;
    historical_std?: number;
    trend?: number;
  };
  history_summary?: {
    days_analyzed: number;
    mean_demand: number;
    max_demand: number;
    min_demand: number;
  };
}

export interface StockOptimizationResponse {
  product_id: string;
  recommended_reorder_point: number;
  recommended_order_quantity: number;
  safety_stock?: number;
  current_status: string;
  risk_level: string;
  days_of_stock?: number;
  suggestions: string[];
  metrics?: {
    avg_daily_demand?: number;
    demand_variability?: number;
    service_level?: number;
    lead_time_days?: number;
  };
}

export interface SeasonalPatternResponse {
  product_id: string;
  analysis_period_years: number;
  seasonal_patterns: Array<{
    type: string;
    description: string;
    indices: Record<string, number>;
  }>;
  peak_seasons: Array<{ month: string; index: number }>;
  low_seasons?: Array<{ month: string; index: number }>;
  seasonality_indices: Record<string, number>;
  trend_analysis?: {
    annual_growth_rate: number;
    trend_direction: string;
  };
  recommendations?: string[];
}

export interface AIInsight {
  type: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export interface AIInsightsResponse {
  generated_at: string;
  insights_count: number;
  insights: AIInsight[];
  summary: {
    high_priority: number;
    medium_priority: number;
    low_priority: number;
  };
  fallback?: boolean;
}

export interface BulkForecastResult {
  product_id: string;
  status: string;
  total_forecasted_demand?: number;
  avg_daily_demand?: number;
  trend?: number;
  error?: string;
}

export interface BulkForecastResponse {
  tenant_id: string;
  forecast_days: number;
  total_products: number;
  successful: number;
  failed: number;
  results: BulkForecastResult[];
}

export interface ForecastingHealthResponse {
  available: boolean;
  service_url: string;
}

/**
 * Forecasting API functions
 */
export const forecastingApi = {
  /**
   * Check AI service health
   */
  async checkHealth(): Promise<ForecastingHealthResponse> {
    const response = await get<ForecastingHealthResponse>('/api/v1/forecasting/health');
    if (!response.data) throw new Error('No data received');
    return response.data;
  },

  /**
   * Get demand forecast for a product
   */
  async getDemandForecast(
    productId: string,
    forecastDays: number = 30,
    includeConfidence: boolean = true
  ): Promise<DemandForecastResponse> {
    const response = await post<DemandForecastResponse>('/api/v1/forecasting/demand', {
      product_id: productId,
      forecast_days: forecastDays,
      include_confidence: includeConfidence,
    });
    if (!response.data) throw new Error('No data received');
    return response.data;
  },

  /**
   * Get stock optimization recommendations
   */
  async getStockOptimization(
    productId: string,
    currentStock: number,
    leadTimeDays: number = 7,
    serviceLevel: number = 0.95
  ): Promise<StockOptimizationResponse> {
    const response = await post<StockOptimizationResponse>('/api/v1/forecasting/stock-optimization', {
      product_id: productId,
      current_stock: currentStock,
      lead_time_days: leadTimeDays,
      service_level: serviceLevel,
    });
    if (!response.data) throw new Error('No data received');
    return response.data;
  },

  /**
   * Get seasonal pattern analysis
   */
  async getSeasonalPatterns(
    productId: string,
    years: number = 2
  ): Promise<SeasonalPatternResponse> {
    const response = await post<SeasonalPatternResponse>('/api/v1/forecasting/seasonal-patterns', {
      product_id: productId,
      years,
    });
    if (!response.data) throw new Error('No data received');
    return response.data;
  },

  /**
   * Get AI-generated insights
   */
  async getInsights(): Promise<AIInsightsResponse> {
    const response = await get<AIInsightsResponse>('/api/v1/forecasting/insights');
    if (!response.data) throw new Error('No data received');
    return response.data;
  },

  /**
   * Bulk forecast for multiple products
   */
  async bulkForecast(
    productIds: string[],
    forecastDays: number = 30
  ): Promise<BulkForecastResponse> {
    const response = await post<BulkForecastResponse>('/api/v1/forecasting/bulk', {
      product_ids: productIds,
      forecast_days: forecastDays,
    });
    if (!response.data) throw new Error('No data received');
    return response.data;
  },

  /**
   * Get product forecast (via products endpoint)
   */
  async getProductForecast(
    productId: string,
    days: number = 30,
    includeConfidence: boolean = false
  ): Promise<{
    forecast: Array<{
      date: string;
      predicted_demand: number;
      lower_bound?: number;
      upper_bound?: number;
    }>;
    confidence?: number;
    model_metrics?: Record<string, number>;
  }> {
    const response = await get<any>(
      `/api/v1/products/${productId}/forecast?days=${days}&includeConfidence=${includeConfidence}`
    );
    if (!response.data) throw new Error('No data received');
    return response.data;
  },
};

export default forecastingApi;

