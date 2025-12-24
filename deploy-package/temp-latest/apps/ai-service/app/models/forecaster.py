"""
Forecasting Models
Provides demand forecasting using statistical and ML methods.
"""

import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class DemandForecaster:
    """
    Demand forecasting engine using statistical methods.
    Uses exponential smoothing and trend analysis for predictions.
    """
    
    def __init__(self, alpha: float = 0.3, beta: float = 0.1):
        """
        Initialize the forecaster.
        
        Args:
            alpha: Level smoothing parameter (0-1)
            beta: Trend smoothing parameter (0-1)
        """
        self.alpha = alpha
        self.beta = beta
    
    def generate_synthetic_history(
        self,
        days: int = 90,
        base_demand: float = 100.0,
        trend: float = 0.5,
        seasonality_amplitude: float = 20.0,
        noise_std: float = 15.0,
        weekly_pattern: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Generate synthetic historical sales data for demonstration.
        
        Args:
            days: Number of days of history
            base_demand: Base daily demand
            trend: Daily trend (positive = increasing)
            seasonality_amplitude: Seasonal variation amplitude
            noise_std: Standard deviation of random noise
            weekly_pattern: Include weekly seasonality
        
        Returns:
            List of historical data points
        """
        history = []
        start_date = datetime.now() - timedelta(days=days)
        
        for i in range(days):
            date = start_date + timedelta(days=i)
            
            # Base demand with trend
            demand = base_demand + (trend * i)
            
            # Add weekly seasonality (higher on weekdays)
            if weekly_pattern:
                day_of_week = date.weekday()
                if day_of_week < 5:  # Weekday
                    demand *= 1.1
                else:  # Weekend
                    demand *= 0.8
            
            # Add monthly seasonality
            day_of_year = date.timetuple().tm_yday
            demand += seasonality_amplitude * np.sin(2 * np.pi * day_of_year / 30)
            
            # Add random noise
            demand += np.random.normal(0, noise_std)
            demand = max(0, demand)  # Ensure non-negative
            
            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "demand": round(demand, 2),
                "day_of_week": day_of_week if weekly_pattern else date.weekday()
            })
        
        return history
    
    def double_exponential_smoothing(
        self,
        data: List[float],
        forecast_periods: int
    ) -> Tuple[List[float], float, float]:
        """
        Apply double exponential smoothing (Holt's method).
        
        Args:
            data: Historical demand values
            forecast_periods: Number of periods to forecast
        
        Returns:
            Tuple of (forecasts, level, trend)
        """
        if len(data) < 2:
            return [data[0] if data else 0] * forecast_periods, data[0] if data else 0, 0
        
        # Initialize
        level = data[0]
        trend = data[1] - data[0]
        
        # Smooth historical data
        for i in range(1, len(data)):
            new_level = self.alpha * data[i] + (1 - self.alpha) * (level + trend)
            trend = self.beta * (new_level - level) + (1 - self.beta) * trend
            level = new_level
        
        # Generate forecasts
        forecasts = []
        for i in range(1, forecast_periods + 1):
            forecast = level + i * trend
            forecasts.append(max(0, forecast))
        
        return forecasts, level, trend
    
    def calculate_confidence_intervals(
        self,
        forecasts: List[float],
        historical_std: float,
        confidence_level: float = 0.95
    ) -> List[Tuple[float, float]]:
        """
        Calculate confidence intervals for forecasts.
        
        Args:
            forecasts: List of forecast values
            historical_std: Standard deviation of historical data
            confidence_level: Confidence level (default 95%)
        
        Returns:
            List of (lower_bound, upper_bound) tuples
        """
        # Z-score for confidence level
        z_scores = {0.90: 1.645, 0.95: 1.96, 0.99: 2.576}
        z = z_scores.get(confidence_level, 1.96)
        
        intervals = []
        for i, forecast in enumerate(forecasts):
            # Uncertainty grows with forecast horizon
            margin = z * historical_std * np.sqrt(1 + i * 0.1)
            lower = max(0, forecast - margin)
            upper = forecast + margin
            intervals.append((round(lower, 2), round(upper, 2)))
        
        return intervals
    
    def forecast(
        self,
        forecast_days: int = 30,
        include_confidence: bool = True,
        history_days: int = 90,
        base_demand: float = 100.0
    ) -> Dict[str, Any]:
        """
        Generate demand forecast.
        
        Args:
            forecast_days: Number of days to forecast
            include_confidence: Whether to include confidence intervals
            history_days: Days of historical data to use
            base_demand: Base demand level
        
        Returns:
            Forecast results dictionary
        """
        # Generate synthetic history
        history = self.generate_synthetic_history(
            days=history_days,
            base_demand=base_demand
        )
        
        # Extract demand values
        demand_values = [h["demand"] for h in history]
        historical_std = np.std(demand_values)
        historical_mean = np.mean(demand_values)
        
        # Generate forecasts
        forecasts, level, trend = self.double_exponential_smoothing(
            demand_values,
            forecast_days
        )
        
        # Calculate confidence intervals
        intervals = self.calculate_confidence_intervals(
            forecasts,
            historical_std
        ) if include_confidence else None
        
        # Build predictions list
        predictions = []
        start_date = datetime.now() + timedelta(days=1)
        
        for i, forecast in enumerate(forecasts):
            date = start_date + timedelta(days=i)
            pred = {
                "date": date.strftime("%Y-%m-%d"),
                "predicted_demand": round(forecast, 2)
            }
            if intervals:
                pred["lower_bound"] = intervals[i][0]
                pred["upper_bound"] = intervals[i][1]
            predictions.append(pred)
        
        # Calculate model metrics (simulated)
        mae = historical_std * 0.7
        mse = mae ** 2
        r2 = 0.75 + np.random.uniform(0, 0.15)  # Simulated R²
        
        return {
            "predictions": predictions,
            "model_metrics": {
                "mae": round(mae, 2),
                "mse": round(mse, 2),
                "r2": round(r2, 3),
                "historical_mean": round(historical_mean, 2),
                "historical_std": round(historical_std, 2),
                "trend": round(trend, 4)
            },
            "history_summary": {
                "days_analyzed": history_days,
                "mean_demand": round(historical_mean, 2),
                "max_demand": round(max(demand_values), 2),
                "min_demand": round(min(demand_values), 2)
            }
        }


class StockOptimizer:
    """
    Stock optimization engine for reorder point and EOQ calculations.
    """
    
    def __init__(self):
        pass
    
    def calculate_safety_stock(
        self,
        daily_demand_std: float,
        lead_time_days: int,
        service_level: float = 0.95
    ) -> float:
        """
        Calculate safety stock based on demand variability.
        
        Args:
            daily_demand_std: Standard deviation of daily demand
            lead_time_days: Lead time in days
            service_level: Desired service level (0-1)
        
        Returns:
            Recommended safety stock
        """
        # Z-score for service level
        z_scores = {
            0.90: 1.28,
            0.95: 1.65,
            0.99: 2.33
        }
        z = z_scores.get(service_level, 1.65)
        
        # Safety stock formula
        safety_stock = z * daily_demand_std * np.sqrt(lead_time_days)
        return round(safety_stock, 0)
    
    def calculate_reorder_point(
        self,
        avg_daily_demand: float,
        lead_time_days: int,
        safety_stock: float
    ) -> float:
        """
        Calculate reorder point.
        
        Args:
            avg_daily_demand: Average daily demand
            lead_time_days: Lead time in days
            safety_stock: Safety stock level
        
        Returns:
            Reorder point
        """
        return round(avg_daily_demand * lead_time_days + safety_stock, 0)
    
    def calculate_eoq(
        self,
        annual_demand: float,
        ordering_cost: float = 50.0,
        holding_cost_rate: float = 0.25,
        unit_cost: float = 10.0
    ) -> float:
        """
        Calculate Economic Order Quantity.
        
        Args:
            annual_demand: Annual demand
            ordering_cost: Cost per order
            holding_cost_rate: Holding cost as percentage of unit cost
            unit_cost: Cost per unit
        
        Returns:
            Economic order quantity
        """
        holding_cost = unit_cost * holding_cost_rate
        eoq = np.sqrt((2 * annual_demand * ordering_cost) / holding_cost)
        return round(eoq, 0)
    
    def optimize(
        self,
        current_stock: float,
        lead_time_days: int = 7,
        service_level: float = 0.95,
        avg_daily_demand: Optional[float] = None,
        demand_std: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Perform stock optimization analysis.
        
        Args:
            current_stock: Current stock level
            lead_time_days: Lead time in days
            service_level: Desired service level
            avg_daily_demand: Average daily demand (optional, will estimate)
            demand_std: Daily demand std (optional, will estimate)
        
        Returns:
            Optimization recommendations
        """
        # Use provided values or estimate
        avg_demand = avg_daily_demand or np.random.uniform(10, 50)
        std_demand = demand_std or avg_demand * 0.3
        
        # Calculate metrics
        safety_stock = self.calculate_safety_stock(
            std_demand, lead_time_days, service_level
        )
        reorder_point = self.calculate_reorder_point(
            avg_demand, lead_time_days, safety_stock
        )
        annual_demand = avg_demand * 365
        eoq = self.calculate_eoq(annual_demand)
        
        # Determine current status
        days_of_stock = current_stock / avg_demand if avg_demand > 0 else 999
        
        if current_stock <= reorder_point * 0.5:
            status = "critical"
            risk_level = "high"
        elif current_stock <= reorder_point:
            status = "reorder_needed"
            risk_level = "medium"
        elif current_stock <= reorder_point * 1.5:
            status = "adequate"
            risk_level = "low"
        else:
            status = "overstocked"
            risk_level = "low"
        
        # Generate suggestions
        suggestions = []
        if status == "critical":
            suggestions.append(f"⚠️ URGENT: Current stock critically low. Order immediately!")
            suggestions.append(f"Recommended order quantity: {eoq} units")
        elif status == "reorder_needed":
            suggestions.append(f"Stock has reached reorder point. Consider ordering soon.")
            suggestions.append(f"Recommended order quantity: {eoq} units")
        elif status == "overstocked":
            suggestions.append("Stock levels are high. Consider reducing next order.")
            suggestions.append("Review demand forecasts for potential changes.")
        else:
            suggestions.append("Stock levels are adequate.")
            suggestions.append(f"Plan next order when stock reaches {reorder_point} units.")
        
        suggestions.append(f"Current days of stock: {round(days_of_stock, 1)} days")
        
        return {
            "recommended_reorder_point": reorder_point,
            "recommended_order_quantity": eoq,
            "safety_stock": safety_stock,
            "current_status": status,
            "risk_level": risk_level,
            "days_of_stock": round(days_of_stock, 1),
            "suggestions": suggestions,
            "metrics": {
                "avg_daily_demand": round(avg_demand, 2),
                "demand_variability": round(std_demand, 2),
                "service_level": service_level,
                "lead_time_days": lead_time_days
            }
        }


class SeasonalAnalyzer:
    """
    Seasonal pattern analyzer for demand data.
    """
    
    def __init__(self):
        pass
    
    def generate_seasonal_data(self, years: int = 2) -> Dict[str, Any]:
        """
        Generate seasonal analysis data.
        
        Args:
            years: Number of years to analyze
        
        Returns:
            Seasonal analysis results
        """
        # Monthly seasonality indices
        monthly_indices = {
            "January": 0.85 + np.random.uniform(-0.05, 0.05),
            "February": 0.88 + np.random.uniform(-0.05, 0.05),
            "March": 0.95 + np.random.uniform(-0.05, 0.05),
            "April": 1.00 + np.random.uniform(-0.05, 0.05),
            "May": 1.02 + np.random.uniform(-0.05, 0.05),
            "June": 0.95 + np.random.uniform(-0.05, 0.05),
            "July": 0.90 + np.random.uniform(-0.05, 0.05),
            "August": 1.10 + np.random.uniform(-0.05, 0.05),
            "September": 1.25 + np.random.uniform(-0.05, 0.05),
            "October": 1.15 + np.random.uniform(-0.05, 0.05),
            "November": 1.20 + np.random.uniform(-0.05, 0.05),
            "December": 1.30 + np.random.uniform(-0.05, 0.05)
        }
        
        # Identify peak and low seasons
        sorted_months = sorted(monthly_indices.items(), key=lambda x: x[1], reverse=True)
        peak_seasons = [
            {"month": m, "index": round(i, 2)} 
            for m, i in sorted_months[:3]
        ]
        low_seasons = [
            {"month": m, "index": round(i, 2)} 
            for m, i in sorted_months[-3:]
        ]
        
        # Weekly patterns
        weekly_pattern = {
            "Monday": 1.05,
            "Tuesday": 1.10,
            "Wednesday": 1.08,
            "Thursday": 1.12,
            "Friday": 1.15,
            "Saturday": 0.75,
            "Sunday": 0.70
        }
        
        # Trend analysis
        yearly_trend = np.random.uniform(0.02, 0.08)  # 2-8% annual growth
        
        return {
            "seasonal_patterns": [
                {
                    "type": "monthly",
                    "description": "Monthly demand patterns",
                    "indices": {k: round(v, 2) for k, v in monthly_indices.items()}
                },
                {
                    "type": "weekly",
                    "description": "Weekly demand patterns",
                    "indices": weekly_pattern
                }
            ],
            "peak_seasons": peak_seasons,
            "low_seasons": low_seasons,
            "seasonality_indices": {k: round(v, 2) for k, v in monthly_indices.items()},
            "trend_analysis": {
                "annual_growth_rate": round(yearly_trend * 100, 1),
                "trend_direction": "increasing" if yearly_trend > 0 else "decreasing"
            },
            "recommendations": [
                f"Peak demand expected in {peak_seasons[0]['month']} (index: {peak_seasons[0]['index']})",
                f"Consider building inventory before {peak_seasons[0]['month']}",
                f"Lowest demand in {low_seasons[0]['month']} - plan promotions",
                f"Annual growth trend: {round(yearly_trend * 100, 1)}%"
            ]
        }

