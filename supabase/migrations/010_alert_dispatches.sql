-- Migration 010: Multi-channel Alert Dispatches Queue
CREATE TABLE IF NOT EXISTS public.alert_dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_history_id UUID REFERENCES public.alert_history(id) ON DELETE CASCADE,
    subscriber_id TEXT NOT NULL,
    canal TEXT NOT NULL, -- 'whatsapp', 'email', 'sms', 'push'
    destino TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    status TEXT DEFAULT 'pendente', -- 'pendente', 'enviado', 'erro'
    tentativa INTEGER DEFAULT 1,
    enviado_em TIMESTAMPTZ,
    erro_detalhe TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_alert_sub_channel UNIQUE (alert_history_id, subscriber_id, canal)
);

-- RLS Policies
ALTER TABLE public.alert_dispatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read alert_dispatches" ON public.alert_dispatches;
CREATE POLICY "Public read alert_dispatches" ON public.alert_dispatches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write alert_dispatches" ON public.alert_dispatches;
CREATE POLICY "Admin write alert_dispatches" ON public.alert_dispatches 
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
