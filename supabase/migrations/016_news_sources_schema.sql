-- Migration 016: News Sources and Official Communications Module
-- Purpose: Adds news_sources table for automatic and manual RSS/API/HTML collection

CREATE TABLE IF NOT EXISTS public.news_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    url TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'rss', -- 'rss', 'api', 'html'
    ativo BOOLEAN NOT NULL DEFAULT true,
    frequencia VARCHAR(50) NOT NULL DEFAULT 'hourly', -- 'hourly', 'multiple_daily', 'daily', 'weekly', 'manual'
    horarios_configurados JSONB DEFAULT '{}'::jsonb,
    ultima_verificacao TIMESTAMPTZ,
    proxima_verificacao TIMESTAMPTZ,
    categoria_padrao VARCHAR(50) DEFAULT 'Comunicados',
    keywords_incluir TEXT,
    keywords_ignorar TEXT,
    importar_todas BOOLEAN DEFAULT false,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure news_sources table has columns for filters and auto-import
ALTER TABLE public.news_sources ADD COLUMN IF NOT EXISTS categoria_padrao VARCHAR(50) DEFAULT 'Comunicados';
ALTER TABLE public.news_sources ADD COLUMN IF NOT EXISTS keywords_incluir TEXT;
ALTER TABLE public.news_sources ADD COLUMN IF NOT EXISTS keywords_ignorar TEXT;
ALTER TABLE public.news_sources ADD COLUMN IF NOT EXISTS importar_todas BOOLEAN DEFAULT false;

-- Ensure news table has columns for link_original, fonte, source_id, retention and menu settings
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS link_original TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS fonte VARCHAR(255);
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES public.news_sources(id) ON DELETE SET NULL;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS manter_permanente BOOLEAN DEFAULT false;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS exibir_no_menu BOOLEAN DEFAULT true;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS prioridade VARCHAR(20) DEFAULT 'media';
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Enable RLS and permissions
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'news_sources' AND policyname = 'Allow public read on news_sources'
    ) THEN
        CREATE POLICY "Allow public read on news_sources"
            ON public.news_sources FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'news_sources' AND policyname = 'Allow full access for authenticated/service_role on news_sources'
    ) THEN
        CREATE POLICY "Allow full access for authenticated/service_role on news_sources"
            ON public.news_sources FOR ALL
            USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
            WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_news_sources_ativo ON public.news_sources(ativo);
CREATE INDEX IF NOT EXISTS idx_news_link_original ON public.news(link_original);
