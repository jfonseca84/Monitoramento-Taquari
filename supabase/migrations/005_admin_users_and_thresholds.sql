-- Migration 005: Admin Users Table, RLS Policies, Auth Trigger & Cities Threshold Sync
-- Target: Supabase / PostgreSQL (100% Idempotent Migration)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CREATE ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nivel_acesso VARCHAR(50) NOT NULL DEFAULT 'administrador' CHECK (nivel_acesso IN ('administrador', 'editor')),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all required columns exist if table was already created
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS nome VARCHAR(150);
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS nivel_acesso VARCHAR(50) DEFAULT 'administrador';
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT NOW();

-- Create index on email and user_id for quick authentication lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users (email);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users (user_id);

-- 2. ENSURE CITIES AND STATIONS HAVE THRESHOLD COLUMNS
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS normal_level NUMERIC(5,2) DEFAULT 3.00;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS attention_level NUMERIC(5,2) DEFAULT 6.00;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS alert_level NUMERIC(5,2) DEFAULT 8.00;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS flood_level NUMERIC(5,2) DEFAULT 10.00;

ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS normal_level NUMERIC(5,2) DEFAULT 3.00;
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS attention_level NUMERIC(5,2) DEFAULT 6.00;
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS alert_level NUMERIC(5,2) DEFAULT 8.00;
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS flood_level NUMERIC(5,2) DEFAULT 10.00;

-- 3. ENABLE ROW LEVEL SECURITY (RLS) FOR ADMIN_USERS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop previous policies to avoid conflicts
DROP POLICY IF EXISTS "Public read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin write admin_users" ON public.admin_users;

-- Public read access so frontend can inspect role details
CREATE POLICY "Public read admin_users" ON public.admin_users FOR SELECT USING (true);

-- Authenticated and service_role full write permissions
CREATE POLICY "Admin write admin_users" ON public.admin_users FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 4. AUTH TRIGGER: AUTOMATICALLY SYNC NEW SUPABASE AUTH USERS TO ADMIN_USERS
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_users (id, user_id, nome, email, nivel_acesso)
  VALUES (
    uuid_generate_v4(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nivel_acesso', 'administrador')
  )
  ON CONFLICT (email) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      nome = EXCLUDED.nome,
      nivel_acesso = EXCLUDED.nivel_acesso;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();

-- 5. INITIAL SEED FOR DEFAULT OPERATOR (IF NOT EXISTS)
INSERT INTO public.admin_users (id, user_id, nome, email, nivel_acesso)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Administrador Geral',
    'admin@taquari.gov.br',
    'administrador'
)
ON CONFLICT (email) DO NOTHING;

-- 6. SYNC DEFAULT HYDROLOGICAL THRESHOLDS (COTAS HIDROLÓGICAS DAS 17 CIDADES)
UPDATE public.cities SET normal_level = 4.00, attention_level = 6.00, alert_level = 8.00, flood_level = 10.00 WHERE slug = 'santa-tereza';
UPDATE public.cities SET normal_level = 12.00, attention_level = 14.00, alert_level = 16.00, flood_level = 18.00 WHERE slug = 'mucum';
UPDATE public.cities SET normal_level = 6.00, attention_level = 8.00, alert_level = 10.00, flood_level = 12.00 WHERE slug = 'encantado';
UPDATE public.cities SET normal_level = 12.00, attention_level = 14.00, alert_level = 16.00, flood_level = 18.00 WHERE slug = 'roca-sales';
UPDATE public.cities SET normal_level = 13.00, attention_level = 15.00, alert_level = 17.00, flood_level = 19.00 WHERE slug = 'lajeado';
UPDATE public.cities SET normal_level = 13.00, attention_level = 15.00, alert_level = 17.00, flood_level = 19.00 WHERE slug = 'estrela';
UPDATE public.cities SET normal_level = 13.00, attention_level = 15.00, alert_level = 17.00, flood_level = 19.00 WHERE slug = 'bom-retiro-do-sul';
UPDATE public.cities SET normal_level = 1.50, attention_level = 2.10, alert_level = 2.50, flood_level = 3.00 WHERE slug = 'porto-alegre';
UPDATE public.cities SET normal_level = 2.50, attention_level = 3.20, alert_level = 3.80, flood_level = 4.50 WHERE slug = 'sao-leopoldo';
UPDATE public.cities SET normal_level = 3.00, attention_level = 4.00, alert_level = 5.00, flood_level = 6.00 WHERE slug = 'taquara';
UPDATE public.cities SET normal_level = 4.50, attention_level = 6.00, alert_level = 7.50, flood_level = 9.00 WHERE slug = 'feliz';
UPDATE public.cities SET normal_level = 5.50, attention_level = 7.00, alert_level = 8.50, flood_level = 10.00 WHERE slug = 'sao-sebastiao-do-cai';
UPDATE public.cities SET normal_level = 2.50, attention_level = 3.25, alert_level = 4.00, flood_level = 4.75 WHERE slug = 'gravatai';
UPDATE public.cities SET normal_level = 12.00, attention_level = 14.00, alert_level = 16.00, flood_level = 18.00 WHERE slug = 'cachoeira-do-sul';
UPDATE public.cities SET normal_level = 4.00, attention_level = 5.50, alert_level = 6.50, flood_level = 7.50 WHERE slug = 'dona-francisca';
UPDATE public.cities SET normal_level = 4.50, attention_level = 6.00, alert_level = 7.00, flood_level = 8.00 WHERE slug = 'montenegro';
UPDATE public.cities SET normal_level = 5.00, attention_level = 7.00, alert_level = 9.00, flood_level = 11.00 WHERE slug = 'taquari';
