-- Migration 022: Extra weather fields for the real "Condições Meteorológicas" panel
-- Purpose: Open-Meteo already provides these hourly variables at no extra cost;
-- this adds the columns so the Centro de Análises meteorológico tab (today showing
-- hardcoded placeholder numbers) can be wired to real per-city data without
-- changing its layout.

ALTER TABLE public.weather_readings ADD COLUMN IF NOT EXISTS apparent_temperature NUMERIC(4,1);
ALTER TABLE public.weather_readings ADD COLUMN IF NOT EXISTS dew_point NUMERIC(4,1);
ALTER TABLE public.weather_readings ADD COLUMN IF NOT EXISTS pressure_msl NUMERIC(6,1);
ALTER TABLE public.weather_readings ADD COLUMN IF NOT EXISTS wind_direction NUMERIC(5,1);
ALTER TABLE public.weather_readings ADD COLUMN IF NOT EXISTS wind_gusts NUMERIC(5,2);
ALTER TABLE public.weather_readings ADD COLUMN IF NOT EXISTS uv_index NUMERIC(4,2);
ALTER TABLE public.weather_readings ADD COLUMN IF NOT EXISTS solar_radiation NUMERIC(7,2);
ALTER TABLE public.weather_readings ADD COLUMN IF NOT EXISTS visibility_m NUMERIC(8,1);
ALTER TABLE public.weather_readings ADD COLUMN IF NOT EXISTS rain_1h_mm NUMERIC(6,2);
ALTER TABLE public.weather_readings ADD COLUMN IF NOT EXISTS rain_6h_mm NUMERIC(6,2);
ALTER TABLE public.weather_readings ADD COLUMN IF NOT EXISTS rain_7d_mm NUMERIC(7,2);
