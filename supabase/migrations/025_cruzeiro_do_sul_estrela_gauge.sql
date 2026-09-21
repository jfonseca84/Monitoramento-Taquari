-- Migration 025: Cruzeiro do Sul passa a usar as cotas da régua da estação Estrela (ANA 86879300)
-- Target: Supabase / PostgreSQL
--
-- Por que existe:
--   * Cruzeiro do Sul não tem estação própria. O SGB (SAH Taquari) orienta que o município use as
--     réguas da estação Estrela, instalada em Lajeado, para acompanhar o rio Taquari.
--   * O site mostrava um valor fixo (12,17 m) porque a cidade não era coletada. Agora o coletor lê a
--     mesma régua de Estrela/Lajeado, então as cotas precisam ser as dessa estação
--     (SGB: atenção 15,00 / alerta 17,00 / inundação 19,00).
--   * "normal_level" não é definido por SGB/ANA: é referência de exibição (mesmo valor de Estrela).
--   * É idempotente. Rodar manualmente no SQL Editor do Supabase.

UPDATE public.cities
SET normal_level    = 13.00,
    attention_level = 15.00,
    alert_level     = 17.00,
    flood_level     = 19.00
WHERE slug = 'cruzeirodosul';

UPDATE public.stations s
SET normal_level    = 13.00,
    attention_level = 15.00,
    alert_level     = 17.00,
    flood_level     = 19.00
FROM public.cities c
WHERE s.city_id = c.id
  AND c.slug = 'cruzeirodosul';
