-- Migration 026 (OPCIONAL): corrige no banco duas cotas que a auditoria de 21/09/2026 revisou
-- Target: Supabase / PostgreSQL
--
-- O código já ignora esses valores antigos, então o site funciona sem rodar este arquivo.
-- Rodar apenas para deixar o banco igual ao catálogo do código. É idempotente.
--
--   * Bom Retiro do Sul: a migration 024 gravou 8 / 9 / 12 / 16,5, que são as cotas da estação Eclusa
--     (SGB 86882000). O site lê a estação Montante (ANA 86881000), cuja cota de inundação é 19,00 m
--     (nivelguaiba e niveldosrios). Volta para 13 / 15 / 17 / 19.
--   * Cachoeira do Sul: o site lê a régua da cidade (ANA 85643990, escala ~18-22 m). A cota de inundação
--     nessa régua é 21,50 m (Defesa Civil / imprensa local: 22,44 m foi "quase 1 m acima da cota").
--     Atenção e alerta (14 / 16) seguem sem confirmação oficial.

UPDATE public.cities
SET normal_level = 13.00, attention_level = 15.00, alert_level = 17.00, flood_level = 19.00
WHERE slug = 'bomretirodosul';

UPDATE public.stations s
SET normal_level = 13.00, attention_level = 15.00, alert_level = 17.00, flood_level = 19.00
FROM public.cities c
WHERE s.city_id = c.id AND c.slug = 'bomretirodosul';

UPDATE public.cities
SET normal_level = 12.00, attention_level = 14.00, alert_level = 16.00, flood_level = 21.50
WHERE slug = 'cachoeiradosul';

UPDATE public.stations s
SET normal_level = 12.00, attention_level = 14.00, alert_level = 16.00, flood_level = 21.50
FROM public.cities c
WHERE s.city_id = c.id AND c.slug = 'cachoeiradosul';
