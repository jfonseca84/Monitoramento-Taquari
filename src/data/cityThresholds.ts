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
  "Santa Tereza": { normal: 4.0, attention: 6.0, alert: 8.0, flood: 10.0, normal_level: 4.0, attention_level: 6.0, alert_level: 8.0, flood_level: 10.0 },
  "Muçum": { normal: 12.0, attention: 14.0, alert: 16.0, flood: 18.0, normal_level: 12.0, attention_level: 14.0, alert_level: 16.0, flood_level: 18.0 },
  "Encantado": { normal: 6.0, attention: 8.0, alert: 10.0, flood: 12.0, normal_level: 6.0, attention_level: 8.0, alert_level: 10.0, flood_level: 12.0 },
  "Roca Sales": { normal: 12.0, attention: 14.0, alert: 16.0, flood: 18.0, normal_level: 12.0, attention_level: 14.0, alert_level: 16.0, flood_level: 18.0 },
  "Lajeado": { normal: 13.0, attention: 15.0, alert: 17.0, flood: 19.0, normal_level: 13.0, attention_level: 15.0, alert_level: 17.0, flood_level: 19.0 },
  "Estrela": { normal: 13.0, attention: 15.0, alert: 17.0, flood: 19.0, normal_level: 13.0, attention_level: 15.0, alert_level: 17.0, flood_level: 19.0 },
  "Bom Retiro do Sul": { normal: 13.0, attention: 15.0, alert: 17.0, flood: 19.0, normal_level: 13.0, attention_level: 15.0, alert_level: 17.0, flood_level: 19.0 },
  "Porto Alegre": { normal: 1.5, attention: 2.1, alert: 2.5, flood: 3.0, normal_level: 1.5, attention_level: 2.1, alert_level: 2.5, flood_level: 3.0 },
  "São Leopoldo": { normal: 2.5, attention: 3.2, alert: 3.8, flood: 4.5, normal_level: 2.5, attention_level: 3.2, alert_level: 3.8, flood_level: 4.5 },
  "Gravataí": { normal: 2.5, attention: 3.25, alert: 4.0, flood: 4.75, normal_level: 2.5, attention_level: 3.25, alert_level: 4.0, flood_level: 4.75 },
  "Montenegro": { normal: 4.5, attention: 6.0, alert: 7.0, flood: 8.0, normal_level: 4.5, attention_level: 6.0, alert_level: 7.0, flood_level: 8.0 },
  "São Sebastião do Caí": { normal: 5.5, attention: 7.0, alert: 8.5, flood: 10.0, normal_level: 5.5, attention_level: 7.0, alert_level: 8.5, flood_level: 10.0 },
  "Taquari": { normal: 5.0, attention: 7.0, alert: 9.0, flood: 11.0, normal_level: 5.0, attention_level: 7.0, alert_level: 9.0, flood_level: 11.0 },
  "Taquara": { normal: 3.0, attention: 4.0, alert: 5.0, flood: 6.0, normal_level: 3.0, attention_level: 4.0, alert_level: 5.0, flood_level: 6.0 },
  "Cachoeira do Sul": { normal: 12.0, attention: 14.0, alert: 16.0, flood: 18.0, normal_level: 12.0, attention_level: 14.0, alert_level: 16.0, flood_level: 18.0 },
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

    if (hasCustomDbThresholds) {
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
