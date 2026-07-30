-- Migration 003: Full Production Architecture Schema for Rio Taquari Hydrological Monitoring
-- Target: Supabase / PostgreSQL (100% Idempotent Migration)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CITIES TABLE
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    river VARCHAR(100) DEFAULT 'Rio Taquari',
    estacao_ana VARCHAR(50),
    description TEXT,
    image TEXT,
    camera_image TEXT,
    camera_url TEXT,
    latitude NUMERIC(10, 6) NOT NULL DEFAULT -29.4678,
    longitude NUMERIC(10, 6) NOT NULL DEFAULT -51.9614,
    ordem INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    current_level NUMERIC(5,2) DEFAULT 3.00,
    trend VARCHAR(20) DEFAULT 'estavel',
    rate_of_change NUMERIC(5,2) DEFAULT 0.0,
    status_level VARCHAR(20) DEFAULT 'normal',
    normal_level NUMERIC(5,2) DEFAULT 3.00,
    attention_level NUMERIC(5,2) DEFAULT 3.00,
    alert_level NUMERIC(5,2) DEFAULT 6.00,
    flood_level NUMERIC(5,2) DEFAULT 8.50,
    last_updated TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if table was created in an earlier migration
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS river VARCHAR(100) DEFAULT 'Rio Taquari';
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS estacao_ana VARCHAR(50);
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS current_level NUMERIC(5,2) DEFAULT 3.00;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS trend VARCHAR(20) DEFAULT 'estavel';
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS rate_of_change NUMERIC(5,2) DEFAULT 0.0;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS status_level VARCHAR(20) DEFAULT 'normal';
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS normal_level NUMERIC(5,2) DEFAULT 3.00;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS attention_level NUMERIC(5,2) DEFAULT 3.00;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS alert_level NUMERIC(5,2) DEFAULT 6.00;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS flood_level NUMERIC(5,2) DEFAULT 8.50;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS last_updated TEXT;

-- 2. STATIONS TABLE
CREATE TABLE IF NOT EXISTS public.stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(50) UNIQUE,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    normal_level NUMERIC(5,2) DEFAULT 3.00,
    attention_level NUMERIC(5,2) DEFAULT 3.00,
    alert_level NUMERIC(5,2) DEFAULT 6.00,
    flood_level NUMERIC(5,2) DEFAULT 8.50,
    sensor_type VARCHAR(100) DEFAULT 'Radar Hidrométrico',
    precision_cm NUMERIC(4,2) DEFAULT 1.0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RIVER LEVELS TABLE (TELEMETRY HISTORY)
CREATE TABLE IF NOT EXISTS public.river_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    level NUMERIC(5,2) NOT NULL,
    trend VARCHAR(20) CHECK (trend IN ('subindo', 'descendo', 'estavel')),
    rate_of_change NUMERIC(5,2) DEFAULT 0.0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure station_id and city_id columns exist if table was created in 001
ALTER TABLE public.river_levels ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE;
ALTER TABLE public.river_levels ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE;

-- 4. SPONSORS TABLE (PATROCINADORES)
CREATE TABLE IF NOT EXISTS public.sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    logo_url TEXT NOT NULL,
    website TEXT,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CAMERAS TABLE (LIVE CAMERAS PER CITY)
CREATE TABLE IF NOT EXISTS public.cameras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    url TEXT NOT NULL,
    online BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. NEWS TABLE
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Defesa Civil',
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT,
    image TEXT,
    author VARCHAR(100) DEFAULT 'Defesa Civil',
    date TIMESTAMPTZ DEFAULT NOW(),
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'hidrologico',
    title VARCHAR(150) NOT NULL,
    description TEXT,
    level VARCHAR(20) CHECK (level IN ('normal', 'atencao', 'alerta', 'inundacao')) DEFAULT 'atencao',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'hidrologico';

-- 8. SYNC LOGS TABLE (TELEMETRY SYNC HISTORY)
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_time TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER,
    updated_count INTEGER DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('sucesso', 'erro', 'warning')),
    message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_email VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_river_levels_city_date ON public.river_levels (city_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_river_levels_station_date ON public.river_levels (station_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_cities_slug ON public.cities (slug);
CREATE INDEX IF NOT EXISTS idx_sponsors_order ON public.sponsors (display_order, active);
CREATE INDEX IF NOT EXISTS idx_cameras_city ON public.cameras (city_id, display_order);
CREATE INDEX IF NOT EXISTS idx_news_published ON public.news (published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts (active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_time ON public.sync_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON public.audit_logs (created_at DESC);

-- STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public) VALUES
  ('cidades', 'cidades', true),
  ('patrocinadores', 'patrocinadores', true),
  ('noticias', 'noticias', true),
  ('logos', 'logos', true),
  ('cameras', 'cameras', true)
ON CONFLICT (id) DO NOTHING;

-- ROW LEVEL SECURITY (RLS) ENABLEMENT
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.river_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- SAFE RLS POLICIES (DROP IF EXISTS BEFORE CREATE)

-- 1. Public Read Policies
DROP POLICY IF EXISTS "Public read cities" ON public.cities;
DROP POLICY IF EXISTS "Leitura pública de cidades" ON public.cities;
CREATE POLICY "Public read cities" ON public.cities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read stations" ON public.stations;
DROP POLICY IF EXISTS "Leitura pública de estações" ON public.stations;
CREATE POLICY "Public read stations" ON public.stations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read river levels" ON public.river_levels;
DROP POLICY IF EXISTS "Public read river_levels" ON public.river_levels;
CREATE POLICY "Public read river levels" ON public.river_levels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read sponsors" ON public.sponsors;
CREATE POLICY "Public read sponsors" ON public.sponsors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read cameras" ON public.cameras;
CREATE POLICY "Public read cameras" ON public.cameras FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read news" ON public.news;
CREATE POLICY "Public read news" ON public.news FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read alerts" ON public.alerts;
CREATE POLICY "Public read alerts" ON public.alerts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read sync_logs" ON public.sync_logs;
CREATE POLICY "Public read sync_logs" ON public.sync_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read settings" ON public.settings;
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

-- 2. Write Policies (Authenticated + Service Role)
DROP POLICY IF EXISTS "Admin write cities" ON public.cities;
CREATE POLICY "Admin write cities" ON public.cities FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin write stations" ON public.stations;
CREATE POLICY "Admin write stations" ON public.stations FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin write river levels" ON public.river_levels;
DROP POLICY IF EXISTS "Admin write river_levels" ON public.river_levels;
CREATE POLICY "Admin write river levels" ON public.river_levels FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin write sponsors" ON public.sponsors;
CREATE POLICY "Admin write sponsors" ON public.sponsors FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin write cameras" ON public.cameras;
CREATE POLICY "Admin write cameras" ON public.cameras FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin write news" ON public.news;
CREATE POLICY "Admin write news" ON public.news FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin write alerts" ON public.alerts;
CREATE POLICY "Admin write alerts" ON public.alerts FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin write sync_logs" ON public.sync_logs;
CREATE POLICY "Admin write sync_logs" ON public.sync_logs FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin write audit_logs" ON public.audit_logs;
CREATE POLICY "Admin write audit_logs" ON public.audit_logs FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin write settings" ON public.settings;
CREATE POLICY "Admin write settings" ON public.settings FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 3. Storage Objects Policies
DROP POLICY IF EXISTS "Public bucket object access" ON storage.objects;
DROP POLICY IF EXISTS "Admin bucket object write" ON storage.objects;
DROP POLICY IF EXISTS "Admin bucket object update" ON storage.objects;
DROP POLICY IF EXISTS "Admin bucket object delete" ON storage.objects;

CREATE POLICY "Public bucket object access" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Admin bucket object write" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Admin bucket object update" ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Admin bucket object delete" ON storage.objects FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
