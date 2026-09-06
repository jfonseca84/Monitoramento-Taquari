-- Migration 021: Weather readings & forecasts (rainfall, soil moisture)
-- Purpose: Foundation for the Central de Análises redesign — real accumulated
-- rainfall, soil moisture and short-term rainfall forecast per city, collected
-- from Open-Meteo. Feeds the future historical-analog flood risk engine.

CREATE TABLE IF NOT EXISTS public.weather_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL,
    precipitation_mm NUMERIC(6,2),
    rain_24h_mm NUMERIC(7,2),
    rain_72h_mm NUMERIC(7,2),
    soil_moisture_0_1cm NUMERIC(5,3),
    soil_moisture_1_3cm NUMERIC(5,3),
    soil_moisture_3_9cm NUMERIC(5,3),
    soil_moisture_9_27cm NUMERIC(5,3),
    temperature NUMERIC(4,1),
    humidity NUMERIC(5,2),
    wind_speed NUMERIC(5,2),
    source TEXT DEFAULT 'open-meteo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_weather_readings_city_time
    ON public.weather_readings (city_id, recorded_at);

CREATE INDEX IF NOT EXISTS idx_weather_readings_city_date
    ON public.weather_readings (city_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS public.weather_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    forecast_for TIMESTAMPTZ NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    precipitation_mm NUMERIC(6,2),
    precipitation_probability NUMERIC(5,2),
    source TEXT DEFAULT 'open-meteo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_weather_forecasts_city_target
    ON public.weather_forecasts (city_id, forecast_for);

CREATE INDEX IF NOT EXISTS idx_weather_forecasts_city_date
    ON public.weather_forecasts (city_id, forecast_for);

ALTER TABLE public.weather_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_forecasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read weather readings" ON public.weather_readings;
CREATE POLICY "Public read weather readings" ON public.weather_readings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read weather forecasts" ON public.weather_forecasts;
CREATE POLICY "Public read weather forecasts" ON public.weather_forecasts FOR SELECT USING (true);

-- Matches the is_admin()-based hardened write policy pattern from migration 017
-- (service_role, used by the worker, always passes is_admin()).
DROP POLICY IF EXISTS "Admin write weather readings" ON public.weather_readings;
CREATE POLICY "Admin write weather readings" ON public.weather_readings
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin write weather forecasts" ON public.weather_forecasts;
CREATE POLICY "Admin write weather forecasts" ON public.weather_forecasts
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
