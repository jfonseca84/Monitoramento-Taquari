-- Migration 008: Alert Subscribers Cota and Schema Standardization

ALTER TABLE public.alert_subscribers
  ADD COLUMN IF NOT EXISTS nome_completo TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS cota_residencia NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS receber_alertas BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.sync_alert_subscriber_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome_completo IS NULL AND NEW.name IS NOT NULL THEN
    NEW.nome_completo := NEW.name;
  ELSIF NEW.name IS NULL AND NEW.nome_completo IS NOT NULL THEN
    NEW.name := NEW.nome_completo;
  END IF;

  IF NEW.cidade IS NULL AND NEW.city_slug IS NOT NULL THEN
    NEW.cidade := NEW.city_slug;
  ELSIF NEW.city_slug IS NULL AND NEW.cidade IS NOT NULL THEN
    NEW.city_slug := NEW.cidade;
  END IF;

  IF NEW.bairro IS NULL AND NEW.neighborhood IS NOT NULL THEN
    NEW.bairro := NEW.neighborhood;
  ELSIF NEW.neighborhood IS NULL AND NEW.bairro IS NOT NULL THEN
    NEW.neighborhood := NEW.bairro;
  END IF;

  IF NEW.receber_alertas IS NULL THEN
    NEW.receber_alertas := COALESCE(NEW.active, true);
  END IF;

  NEW.atualizado_em := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_alert_subscriber_fields ON public.alert_subscribers;
CREATE TRIGGER trigger_sync_alert_subscriber_fields
  BEFORE INSERT OR UPDATE ON public.alert_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.sync_alert_subscriber_fields();

ALTER TABLE public.alert_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert alert_subscribers" ON public.alert_subscribers;
CREATE POLICY "Public insert alert_subscribers" ON public.alert_subscribers 
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin write/read alert_subscribers" ON public.alert_subscribers;
CREATE POLICY "Admin write/read alert_subscribers" ON public.alert_subscribers 
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
