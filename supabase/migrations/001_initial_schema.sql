-- Migration 001: Initial Schema for Rio Taquari Hydrological Monitoring System
-- Target: Supabase / PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CITIES TABLE
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image TEXT,
    camera_image TEXT,
    camera_url TEXT,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 3. RIVER LEVELS TABLE
CREATE TABLE IF NOT EXISTS public.river_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE,
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    level NUMERIC(5,2) NOT NULL,
    trend VARCHAR(20) CHECK (trend IN ('subindo', 'descendo', 'estavel')),
    rate_of_change NUMERIC(5,2) DEFAULT 0.0, -- meters per hour
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    level VARCHAR(20) CHECK (level IN ('normal', 'atencao', 'alerta', 'inundacao')) DEFAULT 'atencao',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 5. USERS PROFILE TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY, -- references auth.users(id)
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    role VARCHAR(20) CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
    avatar_url TEXT,
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

-- 7. GALLERY TABLE
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. LOGS TABLE
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warn', 'error')),
    service VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_river_levels_station_date ON public.river_levels (station_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_river_levels_city_date ON public.river_levels (city_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_cities_slug ON public.cities (slug);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts (active, expires_at);
CREATE INDEX IF NOT EXISTS idx_logs_created ON public.logs (created_at DESC);

-- LATEST LEVELS VIEW
CREATE OR REPLACE VIEW public.v_latest_river_levels AS
SELECT DISTINCT ON (rl.station_id)
    rl.id,
    rl.station_id,
    rl.city_id,
    rl.level,
    rl.trend,
    rl.rate_of_change,
    rl.recorded_at,
    c.name as city_name,
    c.slug as city_slug,
    s.name as station_name,
    s.normal_level,
    s.attention_level,
    s.alert_level,
    s.flood_level,
    CASE
        WHEN rl.level >= s.flood_level THEN 'inundacao'
        WHEN rl.level >= s.alert_level THEN 'alerta'
        WHEN rl.level >= s.attention_level THEN 'atencao'
        ELSE 'normal'
    END as status_level
FROM public.river_levels rl
JOIN public.stations s ON s.id = rl.station_id
JOIN public.cities c ON c.id = rl.city_id
ORDER BY rl.station_id, rl.recorded_at DESC;

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.river_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (Public read, Authenticated admin write)
CREATE POLICY "Public read cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Public read stations" ON public.stations FOR SELECT USING (true);
CREATE POLICY "Public read river levels" ON public.river_levels FOR SELECT USING (true);
CREATE POLICY "Public read alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Public read news" ON public.news FOR SELECT USING (true);
CREATE POLICY "Public read gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

-- Admin write policies
CREATE POLICY "Admin write cities" ON public.cities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write stations" ON public.stations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write river levels" ON public.river_levels FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write alerts" ON public.alerts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write news" ON public.news FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write settings" ON public.settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin write logs" ON public.logs FOR ALL USING (auth.role() = 'authenticated');

-- INITIAL SEED DATA
INSERT INTO public.cities (id, name, slug, description, image, camera_image, camera_url, latitude, longitude, active)
VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lajeado', 'lajeado', 'Estação principal de medição no Porto de Lajeado.', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/embed/live_stream?channel=lajeado_cam', -29.4678, -51.9614, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Estrela', 'estrela', 'Estação no trecho urbano de Estrela.', 'https://images.unsplash.com/photo-1511497584788-876761c11969?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1511497584788-876761c11969?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/embed/live_stream?channel=estrela_cam', -29.5019, -51.9619, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Encantado', 'encantado', 'Monitoramento da ponte de Encantado.', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/embed/live_stream?channel=encantado_cam', -29.2372, -51.8708, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Arroio do Meio', 'arroio-do-meio', 'Ponte sobre o Rio Forqueta / Taquari.', 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/embed/live_stream?channel=arroio_cam', -29.4011, -51.9442, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Muçum', 'mucum', 'Estação montante no Rio Taquari.', 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/embed/live_stream?channel=mucum_cam', -29.1672, -51.8661, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Taquari', 'taquari', 'Ponte da RS-287 e centro urbano.', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/embed/live_stream?channel=taquari_cam', -29.7992, -51.8631, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Venâncio Aires', 'venancio-aires', 'Estação Mariante / Taquari.', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80', 'https://www.youtube.com/embed/live_stream?channel=venancio_cam', -29.6083, -52.1931, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stations (id, city_id, name, code, latitude, longitude, normal_level, attention_level, alert_level, flood_level)
VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lajeado - Porto', 'LAJ-01', -29.4678, -51.9614, 3.00, 3.00, 6.00, 8.50),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Estrela - Ponte', 'EST-01', -29.5019, -51.9619, 3.00, 3.00, 6.00, 8.50),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Encantado - Montante', 'ENC-01', -29.2372, -51.8708, 3.00, 3.00, 6.00, 8.50),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Arroio do Meio - Centro', 'ADM-01', -29.4011, -51.9442, 3.00, 3.00, 6.00, 8.50),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Muçum - Jusante', 'MUC-01', -29.1672, -51.8661, 3.00, 3.00, 6.00, 8.50),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Taquari - Cais', 'TAQ-01', -29.7992, -51.8631, 3.00, 3.00, 6.00, 8.50),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Venâncio Aires - Mariante', 'VEN-01', -29.6083, -52.1931, 3.00, 3.00, 6.00, 8.50)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.settings (key, value, description)
VALUES
('sync_interval_minutes', '5', 'Frequência de sincronização automática com fonte oficial'),
('official_source_url', '"https://niveldosrios.guerreirosdohumaita.com.br/"', 'URL da fonte oficial de monitoramento'),
('system_alert_level', '"atencao"', 'Nível de alerta geral do sistema'),
('contact_emergency', '{"defesa_civil": "199", "bombeiros": "193", "brigada": "190"}', 'Telefones de emergência da Defesa Civil')
ON CONFLICT (key) DO NOTHING;
