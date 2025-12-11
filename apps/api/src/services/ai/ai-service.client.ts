/**
 * AI Service Client
 * Handles communication with the Python AI Service for predictive analytics
 */

import { logger } from '../../lib/logger.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_TIMEOUT = 30000; // 30 seconds

interface DemandForecastRequest {
  product_id: string;
  tenant_id: string;
  forecast_days: number;
  include_confidence?: boolean;
}

interface DemandForecastResponse {
  product_id: string;
  forecast_days: number;
  predictions: Array<{
    date: string;
    predicted_demand: number;
    lower_bound?: number;
    upper_bound?: number;
  }>;
  confidence_intervals?: Array<{
    date: string;
    lower_bound: number;
    upper_bound: number;
  }>;
  model_metrics?: {
    mse?: number;
    mae?: number;
    r2?: number;
  };
}

interface StockOptimizationRequest {
  product_id: string;
  tenant_id: string;
  current_stock: number;
  lead_time_days?: number;
  service_level?: number;
}

interface StockOptimizationResponse {
  product_id: string;
  recommended_reorder_point: number;
  recommended_order_quantity: number;
  current_status: string;
  risk_level: string;
  suggestions: string[];
}

interface SeasonalPatternRequest {
  product_id: string;
  tenant_id: string;
  years: number;
}

interface SeasonalPatternResponse {
  product_id: string;
  analysis_period_years: number;
  seasonal_patterns: any[];
  peak_seasons: any[];
  low_seasons?: any[];
  seasonality_indices: Record<string, number>;
  trend_analysis?: Record<string, any>;
  recommendations?: string[];
}

interface AIInsightsResponse {
  generated_at: string;
  insights_count: number;
  insights: Array<{
    type: string;
    title: string;
    message: string;
    priority: string;
    category: string;
  }>;
  summary: {
    high_priority: number;
    medium_priority: number;
    low_priority: number;
  };
}

interface BulkForecastRequest {
  product_ids: string[];
  tenant_id: string;
  forecast_days: number;
}

interface BulkForecastResponse {
  tenant_id: string;
  forecast_days: number;
  total_products: number;
  successful: number;
  failed: number;
  results: Array<{
    product_id: string;
    status: string;
    total_forecasted_demand?: number;
    avg_daily_demand?: number;
    trend?: number;
    error?: string;
  }>;
}

/**
 * Check if AI service is available
 */
export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${AI_SERVICE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    logger.warn('AI service health check failed', { error });
    return false;
  }
}

/**
 * Forecast product demand
 */
export async function forecastDemand(
  request: DemandForecastRequest
): Promise<DemandForecastResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT);

    const response = await fetch(`${AI_SERVICE_URL}/api/v1/forecast/demand`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Failed to forecast demand', { error, request });
    throw error;
  }
}

/**
 * Get stock optimization recommendations
 */
export async function optimizeStock(
  request: StockOptimizationRequest
): Promise<StockOptimizationResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT);

    const response = await fetch(
      `${AI_SERVICE_URL}/api/v1/forecast/stock-optimization`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Failed to optimize stock', { error, request });
    throw error;
  }
}

/**
 * Analyze seasonal patterns
 */
export async function analyzeSeasonalPatterns(
  request: SeasonalPatternRequest
): Promise<SeasonalPatternResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT);

    const response = await fetch(
      `${AI_SERVICE_URL}/api/v1/forecast/seasonal-patterns`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Failed to analyze seasonal patterns', { error, request });
    throw error;
  }
}

/**
 * Get AI-generated insights
 */
export async function getAIInsights(): Promise<AIInsightsResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT);

    const response = await fetch(`${AI_SERVICE_URL}/api/v1/forecast/insights`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Failed to get AI insights', { error });
    throw error;
  }
}

/**
 * Bulk forecast for multiple products
 */
export async function bulkForecast(
  request: BulkForecastRequest
): Promise<BulkForecastResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT * 2);

    const response = await fetch(`${AI_SERVICE_URL}/api/v1/forecast/bulk-forecast`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Failed to bulk forecast', { error, request });
    throw error;
  }
}

