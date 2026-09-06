-- Migration 023: Add temperature to weather_forecasts
-- Purpose: Support a real 5-day forecast card (max/min temp per day) in the
-- Central de Análises meteorológico tab, replacing the hardcoded fiveDayForecast.

ALTER TABLE public.weather_forecasts ADD COLUMN IF NOT EXISTS temperature_2m NUMERIC(4,1);
