-- Migration 011: Independent City Cameras
CREATE TABLE IF NOT EXISTS public.city_cameras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_slug TEXT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    url_stream TEXT NOT NULL,
    url_thumbnail TEXT,
    tipo TEXT DEFAULT 'YouTube',
    localizacao TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    ordem_exibicao INTEGER DEFAULT 1,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_city_cameras_city_slug ON public.city_cameras(city_slug);

-- RLS Policies
ALTER TABLE public.city_cameras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read city_cameras" ON public.city_cameras;
CREATE POLICY "Public read city_cameras" ON public.city_cameras FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write city_cameras" ON public.city_cameras;
CREATE POLICY "Admin write city_cameras" ON public.city_cameras 
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
