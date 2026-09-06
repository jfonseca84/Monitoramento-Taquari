-- Migration 019: Add missing site_settings columns
-- Target: Supabase / PostgreSQL
-- Purpose: The frontend (SiteSettings type / saveSiteSettings) reads and writes
-- about_* fields and the centro_analises_public_mode / alertas_public_mode
-- maintenance-screen toggles, but no prior migration ever added these columns
-- to public.site_settings (013 only created site_name/site_subtitle/
-- site_description/logo_url/favicon_url/updated_at). Because the table has no
-- such columns, every upsert() from the admin panel that included them was
-- rejected by PostgREST, the frontend silently fell back to a local-only save,
-- and admins saw a "success" message while nothing was actually persisted for
-- other visitors. This adds the missing columns with the same defaults used
-- client-side in DEFAULT_SITE_SETTINGS.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS about_badge TEXT DEFAULT 'CENTRO DE OPERAÇÕES HIDROLÓGICAS',
  ADD COLUMN IF NOT EXISTS about_title TEXT DEFAULT 'Portal Profissional de Monitoramento Hidrológico',
  ADD COLUMN IF NOT EXISTS about_text TEXT DEFAULT 'Desenvolvido para oferecer previsibilidade, segurança e transparência em tempo real. Sincronizado a cada 5 minutos com dados da rede telemétrica oficial.',
  ADD COLUMN IF NOT EXISTS about_feature1_title TEXT DEFAULT 'Sensores de Precisão Radar',
  ADD COLUMN IF NOT EXISTS about_feature1_text TEXT DEFAULT 'Medição sem contato físico por micro-ondas com margem de erro de ±1cm e amostragem contínua.',
  ADD COLUMN IF NOT EXISTS about_feature2_title TEXT DEFAULT 'Sincronização Supabase',
  ADD COLUMN IF NOT EXISTS about_feature2_text TEXT DEFAULT 'Arquitetura desacoplada com tolerância a falhas, cache de alta performance e histórico auditável.',
  ADD COLUMN IF NOT EXISTS about_feature3_title TEXT DEFAULT 'Alertas Automatizados',
  ADD COLUMN IF NOT EXISTS about_feature3_text TEXT DEFAULT 'Emissão direta para prefeituras e órgãos de segurança comunitária assim que o nível atinge a cota de atenção.',
  ADD COLUMN IF NOT EXISTS centro_analises_public_mode TEXT NOT NULL DEFAULT 'original',
  ADD COLUMN IF NOT EXISTS alertas_public_mode TEXT NOT NULL DEFAULT 'original';

-- Keep the toggle columns constrained to the two values the frontend understands
ALTER TABLE public.site_settings
  DROP CONSTRAINT IF EXISTS site_settings_centro_analises_public_mode_check,
  DROP CONSTRAINT IF EXISTS site_settings_alertas_public_mode_check;

ALTER TABLE public.site_settings
  ADD CONSTRAINT site_settings_centro_analises_public_mode_check
    CHECK (centro_analises_public_mode IN ('original', 'construcao')),
  ADD CONSTRAINT site_settings_alertas_public_mode_check
    CHECK (alertas_public_mode IN ('original', 'construcao'));
