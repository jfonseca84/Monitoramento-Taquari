-- Migration 012: AI Telemetry & Immutable History Enhancements
-- Prepares river_levels table for advanced analytics, statistics, and AI model training

ALTER TABLE public.river_levels
  ADD COLUMN IF NOT EXISTS flow NUMERIC(8,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rainfall NUMERIC(6,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS temperature NUMERIC(4,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS humidity NUMERIC(4,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_origin TEXT DEFAULT 'ANA/Rede Telemétrica',
  ADD COLUMN IF NOT EXISTS basin TEXT DEFAULT 'Bacia do Rio Taquari-Antas',
  ADD COLUMN IF NOT EXISTS river_name TEXT DEFAULT 'Rio Taquari';

-- Indexes for ultra-fast time-series queries (AI training & high-speed chart rendering)
CREATE INDEX IF NOT EXISTS idx_river_levels_city_recorded_at ON public.river_levels (city_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_river_levels_station_recorded_at ON public.river_levels (station_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_river_levels_recorded_at ON public.river_levels (recorded_at DESC);

-- View for latest river readings per station/city (Fast state lookup)
DROP VIEW IF EXISTS public.v_latest_river_levels CASCADE;
CREATE OR REPLACE VIEW public.v_latest_river_levels AS
SELECT DISTINCT ON (rl.city_id)
    rl.id,
    rl.city_id,
    rl.station_id,
    rl.level,
    rl.trend,
    rl.rate_of_change,
    rl.flow,
    rl.rainfall,
    rl.temperature,
    rl.humidity,
    rl.source_origin,
    rl.recorded_at,
    c.name AS city_name,
    c.slug AS city_slug
FROM public.river_levels rl
JOIN public.cities c ON c.id = rl.city_id
ORDER BY rl.city_id, rl.recorded_at DESC;

COMMENT ON TABLE public.river_levels IS 'Tabela imutável de histórico telemétrico hidrológico para análise, estatísticas e treinamento de IA.';
