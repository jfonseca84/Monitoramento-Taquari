-- Migration 024: Sincroniza as cotas hidrológicas com os valores oficiais (SGB/ANA)
-- Target: Supabase / PostgreSQL
--
-- Por que existe:
--   * A migration 005 atualizava as cotas usando slugs com hífen ('roca-sales', 'santa-tereza'),
--     mas o worker cria as cidades com slugs sem hífen ('rocasales', 'santatereza'). Nenhuma
--     linha era atingida e as cidades ficaram com o DEFAULT das colunas (3.00 / 3.00 / 6.00 / 8.50).
--   * Várias cotas antigas não correspondiam às oficiais do SGB (Sistema de Alerta Hidrológico
--     das bacias do Taquari-Antas e do Caí) nem às da ANA.
--
-- Fontes: boletins SGB SAH Taquari (24/07/2026) e SAH Caí (22/07/2026); estações ANA/SGB para
-- Roca Sales, São Leopoldo, Dona Francisca e Rio Pardo; Defesa Civil de Porto Alegre e de
-- São Leopoldo para a cota de atenção dessas duas cidades.
--
-- Observações:
--   * "normal_level" não é definido por SGB/ANA: é referência de exibição e não afeta status.
--   * Onde o SGB não define atenção/alerta (Passo Carreiro, Linha Colombo, Rio Pardo), o alerta foi
--     ajustado apenas para manter a ordem normal < atenção < alerta < inundação. Não é valor oficial.
--   * Cachoeira do Sul e Cruzeiro do Sul não foram alteradas (cota de inundação ainda sem confirmação).
--   * Rodar manualmente no SQL Editor do Supabase. É idempotente.

WITH cotas (slug, normal_level, attention_level, alert_level, flood_level) AS (
  VALUES
    ('santatereza',       4.00, 6.00,  9.00, 15.00),
    ('linhajosejulio',    4.00, 6.50, 10.00, 24.50),
    ('passocarreiro',     3.00, 4.50,  5.50,  6.50),
    ('linhacolombo',      3.00, 4.50,  5.50,  6.50),
    ('passotainhas',      2.50, 4.00,  5.50, 10.50),
    ('barradofao',        3.50, 5.00,  7.00, 10.00),
    ('mucum',             4.00, 5.00,  9.00, 18.00),
    ('encantado',         4.00, 5.00,  9.00, 12.00),
    ('rocasales',        12.00, 14.00, 16.00, 18.00),
    ('bomretirodosul',    8.00, 9.00, 12.00, 16.50),
    ('portomariante',     6.00, 7.00, 11.00, 14.00),
    ('taquari',           3.00, 4.00,  6.50,  8.50),
    ('portoalegre',       1.50, 2.00,  2.50,  3.00),
    ('saoleopoldo',       2.50, 3.50,  3.80,  4.50),
    ('montenegro',        2.00, 3.00,  4.00,  6.00),
    ('saosebastiaodocai', 4.00, 5.00,  7.00, 10.50),
    ('donafrancisca',     4.00, 5.50,  6.50,  7.50),
    ('riopardo',          7.00, 10.00, 11.50, 12.50)
)
UPDATE public.cities c
SET normal_level    = k.normal_level,
    attention_level = k.attention_level,
    alert_level     = k.alert_level,
    flood_level     = k.flood_level
FROM cotas k
WHERE c.slug = k.slug;

-- Estações vinculadas às cidades acima acompanham as mesmas cotas
UPDATE public.stations s
SET normal_level    = c.normal_level,
    attention_level = c.attention_level,
    alert_level     = c.alert_level,
    flood_level     = c.flood_level
FROM public.cities c
WHERE s.city_id = c.id
  AND c.slug IN (
    'santatereza','linhajosejulio','passocarreiro','linhacolombo','passotainhas','barradofao',
    'mucum','encantado','rocasales','bomretirodosul','portomariante','taquari','portoalegre',
    'saoleopoldo','montenegro','saosebastiaodocai','donafrancisca','riopardo'
  );
