-- Migration 009: Alert History for Hydrological Emergency Central

CREATE TABLE IF NOT EXISTS public.alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cidade TEXT NOT NULL,
    nivel_rio NUMERIC(6,2) NOT NULL,
    cota_disparada NUMERIC(6,2) NOT NULL,
    quantidade_usuarios_atingidos INTEGER DEFAULT 0,
    mensagem TEXT NOT NULL,
    tipo_alerta TEXT NOT NULL, -- 'atenção', 'alerta', 'inundação'
    enviado BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read alert_history" ON public.alert_history;
CREATE POLICY "Public read alert_history" ON public.alert_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write alert_history" ON public.alert_history;
CREATE POLICY "Admin write alert_history" ON public.alert_history 
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
