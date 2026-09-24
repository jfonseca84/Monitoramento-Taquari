-- Cachoeira do Sul passa a usar a régua Passo São Lourenço (fonte: nivelguaiba.com.br/cachoeiradosul).
-- Nessa régua a cota de inundação é 9,00 m e o recorde é 15,45 m (maio/2024). A régua da cidade
-- (ANA 85643990, escala ~18-22 m, cota 21,50 m) adotada na migration 026 deixa de ser usada.
--
-- ATENÇÃO: só a cota de inundação (9,00 m) é informada pela fonte. Normal/atenção/alerta abaixo são
-- PROVISÓRIOS e devem ser corrigidos no painel administrativo com as cotas oficiais.

UPDATE public.cities
SET normal_level = 6.00, attention_level = 7.50, alert_level = 8.00, flood_level = 9.00
WHERE slug = 'cachoeiradosul';

UPDATE public.stations s
SET normal_level = 6.00, attention_level = 7.50, alert_level = 8.00, flood_level = 9.00
FROM public.cities c
WHERE s.city_id = c.id AND c.slug = 'cachoeiradosul';
