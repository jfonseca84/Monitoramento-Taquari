-- Migration 004: Enhancements for Stations and Telemetry Synchronization
-- Target: Supabase / PostgreSQL

-- 1. Ensure indexes for station lookups and telemetry query performance
CREATE INDEX IF NOT EXISTS idx_stations_city_id ON public.stations (city_id);
CREATE INDEX IF NOT EXISTS idx_stations_code ON public.stations (code);
CREATE INDEX IF NOT EXISTS idx_river_levels_station_id_recorded ON public.river_levels (station_id, recorded_at DESC);

-- 2. Populate default stations for any existing cities that do not have a station yet
INSERT INTO public.stations (id, city_id, name, code, latitude, longitude, normal_level, attention_level, alert_level, flood_level, active)
SELECT 
    uuid_generate_v4(),
    c.id,
    c.name || ' - Estação Central',
    LOWER(REGEXP_REPLACE(c.slug, '[^a-zA-Z0-9]', '', 'g')) || '-st1',
    c.latitude,
    c.longitude,
    COALESCE(c.normal_level, 3.00),
    COALESCE(c.attention_level, 3.00),
    COALESCE(c.alert_level, 6.00),
    COALESCE(c.flood_level, 8.50),
    true
FROM public.cities c
WHERE NOT EXISTS (
    SELECT 1 FROM public.stations s WHERE s.city_id = c.id
)
ON CONFLICT (code) DO NOTHING;

-- 3. Ensure RLS policies explicitly allow service_role and authenticated roles full access
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.river_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role write stations" ON public.stations;
DROP POLICY IF EXISTS "Admin write stations" ON public.stations;
CREATE POLICY "Service role write stations" ON public.stations FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role write river_levels" ON public.river_levels;
DROP POLICY IF EXISTS "Admin write river levels" ON public.river_levels;
DROP POLICY IF EXISTS "Admin write river_levels" ON public.river_levels;
CREATE POLICY "Service role write river_levels" ON public.river_levels FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role write sync_logs" ON public.sync_logs;
DROP POLICY IF EXISTS "Admin write sync_logs" ON public.sync_logs;
CREATE POLICY "Service role write sync_logs" ON public.sync_logs FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
