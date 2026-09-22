-- Migration 027: Dam/reservoir reference data and readings (Bacia do Taquari)
-- Purpose: scaffolding for "vazão das barragens" (dam discharge), to be displayed later in the
-- Centro de Análises tab. Only creates the schema and seeds the known dams as reference rows —
-- there are no readings yet, because no live public data source for real-time dam discharge in
-- this basin was found. Fill dam_readings later (manual entry via admin, or a future collector).
--
-- Pesquisa feita em 22/09/2026, para constar:
--   - CERAN (Cia Energética Rio das Antas) opera 3 usinas a fio d'água no Rio das Antas, a
--     montante de Santa Tereza: Castro Alves (130 MW), Monte Claro (130 MW) e 14 de Julho (100
--     MW). O site ceran.com.br diz que publica dados de nível e vazão do reservatório, mas não
--     foi localizada uma API pública em tempo real para consumir automaticamente.
--   - A API de telemetria da ANA tem um campo <Vazao> no esquema, mas ele está vazio/não
--     definido em toda estação que este projeto já lê (ex.: Santa Tereza, código 86472600) — não
--     há curva-chave publicada para essas réguas, então a vazão não é calculável a partir do
--     nível nelas.
--   - Nenhuma barragem de acumulação relevante foi encontrada no curso principal do Rio Taquari
--     ou nos demais afluentes cobertos por este site (Carreiro, Guaporé, Tainhas, Forqueta).

CREATE TABLE IF NOT EXISTS public.dams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    river TEXT NOT NULL,
    operator TEXT,
    dam_type TEXT DEFAULT 'fio_dagua', -- 'fio_dagua' (a fio d'água) | 'acumulacao' (com reservatório de acumulação)
    installed_capacity_mw NUMERIC(7,2),
    nearest_downstream_city_id UUID REFERENCES public.cities(id),
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dam_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dam_id UUID REFERENCES public.dams(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL,
    inflow_m3s NUMERIC(8,2),       -- vazão afluente (chegando ao reservatório)
    outflow_m3s NUMERIC(8,2),      -- vazão defluente/turbinada (liberada a jusante)
    reservoir_level_m NUMERIC(6,2),
    spillway_open BOOLEAN,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dam_readings_dam_time ON public.dam_readings (dam_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_dam_readings_dam_date ON public.dam_readings (dam_id, recorded_at DESC);

ALTER TABLE public.dams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dam_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read dams" ON public.dams;
CREATE POLICY "Public read dams" ON public.dams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write dams" ON public.dams;
CREATE POLICY "Admin write dams" ON public.dams FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read dam readings" ON public.dam_readings;
CREATE POLICY "Public read dam readings" ON public.dam_readings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write dam readings" ON public.dam_readings;
CREATE POLICY "Admin write dam readings" ON public.dam_readings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed: complexo CERAN no Rio das Antas (a montante de Santa Tereza / Linha José Júlio). Sem
-- leituras ainda — só a referência das usinas, para o admin (ou um coletor futuro) preencher.
INSERT INTO public.dams (name, river, operator, dam_type, installed_capacity_mw, nearest_downstream_city_id, notes)
SELECT 'Castro Alves', 'Rio das Antas', 'CERAN', 'fio_dagua', 130.00, c.id,
       'Sem fonte pública de vazão em tempo real localizada (pesquisa de 22/09/2026).'
FROM public.cities c WHERE c.slug = 'linhajosejulio'
AND NOT EXISTS (SELECT 1 FROM public.dams WHERE name = 'Castro Alves');

INSERT INTO public.dams (name, river, operator, dam_type, installed_capacity_mw, nearest_downstream_city_id, notes)
SELECT 'Monte Claro', 'Rio das Antas', 'CERAN', 'fio_dagua', 130.00, c.id,
       'Sem fonte pública de vazão em tempo real localizada (pesquisa de 22/09/2026).'
FROM public.cities c WHERE c.slug = 'linhajosejulio'
AND NOT EXISTS (SELECT 1 FROM public.dams WHERE name = 'Monte Claro');

INSERT INTO public.dams (name, river, operator, dam_type, installed_capacity_mw, nearest_downstream_city_id, notes)
SELECT '14 de Julho', 'Rio das Antas', 'CERAN', 'fio_dagua', 100.00, c.id,
       'Sem fonte pública de vazão em tempo real localizada (pesquisa de 22/09/2026).'
FROM public.cities c WHERE c.slug = 'linhajosejulio'
AND NOT EXISTS (SELECT 1 FROM public.dams WHERE name = '14 de Julho');
