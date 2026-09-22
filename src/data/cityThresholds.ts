export interface HydrologicalThresholds {
  normal: number;
  attention: number;
  alert: number;
  flood: number;
  normal_level?: number;
  attention_level?: number;
  alert_level?: number;
  flood_level?: number;
}

export const CITY_THRESHOLDS: Record<string, HydrologicalThresholds> = {
  "Santa Tereza": { normal: 4.0, attention: 6.0, alert: 9.0, flood: 15.0, normal_level: 4.0, attention_level: 6.0, alert_level: 9.0, flood_level: 15.0 },
  "Muçum": { normal: 4.0, attention: 5.0, alert: 9.0, flood: 18.0, normal_level: 4.0, attention_level: 5.0, alert_level: 9.0, flood_level: 18.0 },
  "Encantado": { normal: 4.0, attention: 5.0, alert: 9.0, flood: 12.0, normal_level: 4.0, attention_level: 5.0, alert_level: 9.0, flood_level: 12.0 },
  "Roca Sales": { normal: 12.0, attention: 14.0, alert: 16.0, flood: 18.0, normal_level: 12.0, attention_level: 14.0, alert_level: 16.0, flood_level: 18.0 },
  "Lajeado": { normal: 13.0, attention: 15.0, alert: 17.0, flood: 19.0, normal_level: 13.0, attention_level: 15.0, alert_level: 17.0, flood_level: 19.0 },
  "Estrela": { normal: 13.0, attention: 15.0, alert: 17.0, flood: 19.0, normal_level: 13.0, attention_level: 15.0, alert_level: 17.0, flood_level: 19.0 },
  "Bom Retiro do Sul": { normal: 13.0, attention: 15.0, alert: 17.0, flood: 19.0, normal_level: 13.0, attention_level: 15.0, alert_level: 17.0, flood_level: 19.0 },
  "Porto Alegre": { normal: 1.5, attention: 2.0, alert: 2.5, flood: 3.0, normal_level: 1.5, attention_level: 2.0, alert_level: 2.5, flood_level: 3.0 },
  "São Leopoldo": { normal: 2.5, attention: 3.5, alert: 3.8, flood: 4.5, normal_level: 2.5, attention_level: 3.5, alert_level: 3.8, flood_level: 4.5 },
  "Gravataí": { normal: 2.5, attention: 3.25, alert: 4.0, flood: 4.75, normal_level: 2.5, attention_level: 3.25, alert_level: 4.0, flood_level: 4.75 },
  "Montenegro": { normal: 2.0, attention: 3.0, alert: 4.0, flood: 6.0, normal_level: 2.0, attention_level: 3.0, alert_level: 4.0, flood_level: 6.0 },
  "São Sebastião do Caí": { normal: 4.0, attention: 5.0, alert: 7.0, flood: 10.5, normal_level: 4.0, attention_level: 5.0, alert_level: 7.0, flood_level: 10.5 },
  "Cruzeiro do Sul": { normal: 13.0, attention: 15.0, alert: 17.0, flood: 19.0, normal_level: 13.0, attention_level: 15.0, alert_level: 17.0, flood_level: 19.0 },
  "Porto Mariante": { normal: 6.0, attention: 7.0, alert: 11.0, flood: 14.0, normal_level: 6.0, attention_level: 7.0, alert_level: 11.0, flood_level: 14.0 },
  "Barra do Fão": { normal: 3.5, attention: 5.0, alert: 7.0, flood: 10.0, normal_level: 3.5, attention_level: 5.0, alert_level: 7.0, flood_level: 10.0 },
  "Linha José Júlio": { normal: 4.0, attention: 6.5, alert: 10.0, flood: 24.5, normal_level: 4.0, attention_level: 6.5, alert_level: 10.0, flood_level: 24.5 },
  "Passo Carreiro": { normal: 3.0, attention: 4.5, alert: 5.5, flood: 6.5, normal_level: 3.0, attention_level: 4.5, alert_level: 5.5, flood_level: 6.5 },
  "Linha Colombo": { normal: 3.0, attention: 4.5, alert: 5.5, flood: 6.5, normal_level: 3.0, attention_level: 4.5, alert_level: 5.5, flood_level: 6.5 },
  "Passo Tainhas": { normal: 2.5, attention: 4.0, alert: 5.5, flood: 10.5, normal_level: 2.5, attention_level: 4.0, alert_level: 5.5, flood_level: 10.5 },
  "Taquari": { normal: 3.0, attention: 4.0, alert: 6.5, flood: 8.5, normal_level: 3.0, attention_level: 4.0, alert_level: 6.5, flood_level: 8.5 },
  "Taquara": { normal: 3.0, attention: 4.0, alert: 5.0, flood: 6.0, normal_level: 3.0, attention_level: 4.0, alert_level: 5.0, flood_level: 6.0 },
  "Cachoeira do Sul": { normal: 12.0, attention: 14.0, alert: 16.0, flood: 21.5, normal_level: 12.0, attention_level: 14.0, alert_level: 16.0, flood_level: 21.5 },
  "Dona Francisca": { normal: 4.0, attention: 5.5, alert: 6.5, flood: 7.5, normal_level: 4.0, attention_level: 5.5, alert_level: 6.5, flood_level: 7.5 },
  "Feliz": { normal: 4.5, attention: 6.0, alert: 7.5, flood: 9.0, normal_level: 4.5, attention_level: 6.0, alert_level: 7.5, flood_level: 9.0 }
};

export function normalizeKey(str: string): string {
  return String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const NORMALIZED_LOOKUP: Record<string, HydrologicalThresholds> = {};
for (const [cityName, thresholds] of Object.entries(CITY_THRESHOLDS)) {
  NORMALIZED_LOOKUP[normalizeKey(cityName)] = thresholds;
}

export function getCityThresholds(slugOrIdOrCity: any): HydrologicalThresholds {
  if (!slugOrIdOrCity) {
    return CITY_THRESHOLDS["Santa Tereza"];
  }

  // Se for objeto da cidade no Supabase ou no estado local
  if (typeof slugOrIdOrCity === 'object' && slugOrIdOrCity !== null) {
    const city = slugOrIdOrCity;
    const hasCustomDbThresholds =
      typeof city.normal_level === 'number' && city.normal_level > 0 &&
      typeof city.attention_level === 'number' && city.attention_level > 0 &&
      typeof city.alert_level === 'number' && city.alert_level > 0 &&
      typeof city.flood_level === 'number' && city.flood_level > 0;

    // Valores DEFAULT das colunas da tabela cities (migrations 001/003). Cidades criadas pelo
    // worker sem cotas chegam com esse conjunto exato; não são cotas reais, então usa o catálogo.
    const isDbColumnDefault =
      Number(city.normal_level) === 3 &&
      Number(city.attention_level) === 3 &&
      Number(city.alert_level) === 6 &&
      Number(city.flood_level) === 8.5;

    // Conjunto que a migration 024 gravou para Bom Retiro do Sul: era a cota da estação Eclusa (SGB),
    // mas o site lê a estação Montante (ANA 86881000), cuja inundação é 19,00 m. Não é cota válida aqui.
    const isRetiredBomRetiroSet =
      Number(city.normal_level) === 8 &&
      Number(city.attention_level) === 9 &&
      Number(city.alert_level) === 12 &&
      Number(city.flood_level) === 16.5;

    if (hasCustomDbThresholds && !isDbColumnDefault && !isRetiredBomRetiroSet) {
      const n = Number(city.normal_level);
      const at = Number(city.attention_level);
      const al = Number(city.alert_level);
      const f = Number(city.flood_level);
      return {
        normal: n,
        attention: at,
        alert: al,
        flood: f,
        normal_level: n,
        attention_level: at,
        alert_level: al,
        flood_level: f
      };
    }
    slugOrIdOrCity = city.name || city.slug || city.id || '';
  }

  const strKey = String(slugOrIdOrCity).trim();
  if (CITY_THRESHOLDS[strKey]) {
    return CITY_THRESHOLDS[strKey];
  }

  const normKey = normalizeKey(strKey);
  if (NORMALIZED_LOOKUP[normKey]) {
    return NORMALIZED_LOOKUP[normKey];
  }

  return CITY_THRESHOLDS["Santa Tereza"];
}

export interface CityCotaOption {
  value: number;
  label: string;
}

export function getCityAvailableCotas(slugOrIdOrCity: any): CityCotaOption[] {
  const t = getCityThresholds(slugOrIdOrCity);
  const cotasSet = new Set<number>();

  if (t.attention) cotasSet.add(Number(t.attention.toFixed(2)));
  if (t.alert) cotasSet.add(Number(t.alert.toFixed(2)));
  if (t.flood) cotasSet.add(Number(t.flood.toFixed(2)));

  const floodLevel = t.flood || 10;
  const step = floodLevel < 5 ? 0.5 : floodLevel < 10 ? 1.0 : 2.0;

  for (let i = 1; i <= 6; i++) {
    const nextVal = floodLevel + (i * step);
    cotasSet.add(Number(nextVal.toFixed(2)));
  }

  const sortedCotas = Array.from(cotasSet).sort((a, b) => a - b);

  return sortedCotas.map(val => {
    let tag = '';
    if (Math.abs(val - t.attention) < 0.05) tag = ' (Atenção)';
    else if (Math.abs(val - t.alert) < 0.05) tag = ' (Alerta)';
    else if (Math.abs(val - t.flood) < 0.05) tag = ' (Inundação)';

    return {
      value: val,
      label: `${val.toFixed(2).replace('.', ',')} metros${tag}`
    };
  });
}

