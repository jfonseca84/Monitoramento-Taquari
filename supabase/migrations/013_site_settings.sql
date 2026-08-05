-- Migration 013: Site Settings Table and RLS Policies
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    site_name TEXT NOT NULL DEFAULT 'Monitoramento Rio Taquari',
    site_subtitle TEXT NOT NULL DEFAULT 'Informação e prevenção para o Vale do Taquari',
    site_description TEXT NOT NULL DEFAULT 'Plataforma oficial de monitoramento hidrológico e prevenção de cheias.',
    logo_url TEXT,
    favicon_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Public read access for site_settings" ON public.site_settings;
CREATE POLICY "Public read access for site_settings"
    ON public.site_settings FOR SELECT
    USING (true);

-- Authenticated write access
DROP POLICY IF EXISTS "Admin write access for site_settings" ON public.site_settings;
CREATE POLICY "Admin write access for site_settings"
    ON public.site_settings FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Default row insert
INSERT INTO public.site_settings (id, site_name, site_subtitle, site_description, logo_url, favicon_url)
VALUES (
    'default',
    'Monitoramento Rio Taquari',
    'Informação e prevenção para o Vale do Taquari',
    'Plataforma oficial de monitoramento hidrológico e prevenção de cheias.',
    NULL,
    NULL
)
ON CONFLICT (id) DO NOTHING;
