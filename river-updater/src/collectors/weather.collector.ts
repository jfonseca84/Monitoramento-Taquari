import { LoggerService } from '../logs/logger.service.js';
import { SupabaseService, DBCity } from '../services/supabase.service.js';
import { fetchWithRetry } from './river.collector.js';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

const HOURLY_VARS = [
  'precipitation',
  'precipitation_probability',
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'dew_point_2m',
  'pressure_msl',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'uv_index',
  'shortwave_radiation',
  'visibility',
  'soil_moisture_0_to_1cm',
  'soil_moisture_1_to_3cm',
  'soil_moisture_3_to_9cm',
  'soil_moisture_9_to_27cm',
].join(',');

interface OpenMeteoHourly {
  time: string[];
  precipitation?: number[];
  precipitation_probability?: number[];
  temperature_2m?: number[];
  relative_humidity_2m?: number[];
  apparent_temperature?: number[];
  dew_point_2m?: number[];
  pressure_msl?: number[];
  wind_speed_10m?: number[];
  wind_direction_10m?: number[];
  wind_gusts_10m?: number[];
  uv_index?: number[];
  shortwave_radiation?: number[];
  visibility?: number[];
  soil_moisture_0_to_1cm?: number[];
  soil_moisture_1_to_3cm?: number[];
  soil_moisture_3_to_9cm?: number[];
  soil_moisture_9_to_27cm?: number[];
}

interface OpenMeteoResponse {
  hourly?: OpenMeteoHourly;
}

function sumPrecipitation(hourly: OpenMeteoHourly, fromIndex: number, toIndex: number): number {
  const values = hourly.precipitation || [];
  let total = 0;
  for (let i = Math.max(0, fromIndex); i <= toIndex && i < values.length; i++) {
    const v = values[i];
    if (typeof v === 'number' && !isNaN(v)) total += v;
  }
  return Number(total.toFixed(2));
}

export class WeatherCollector {
  private static PREFIX = 'WeatherCollector';

  public static async executeCollection(cities: DBCity[]): Promise<{
    success: boolean;
    durationMs: number;
    citiesProcessed: number;
    forecastsInserted: number;
    errorsCount: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    let citiesProcessed = 0;
    let forecastsInserted = 0;
    let errorsCount = 0;
    const errors: string[] = [];

    const readingsToUpsert: any[] = [];
    const forecastsToUpsert: any[] = [];

    const fetchPromises = cities
      .filter((c) => c.id && typeof c.latitude === 'number' && typeof c.longitude === 'number')
      .map(async (city) => {
        const params = new URLSearchParams({
          latitude: String(city.latitude),
          longitude: String(city.longitude),
          hourly: HOURLY_VARS,
          past_days: '7',
          forecast_days: '3',
          timezone: 'America/Sao_Paulo',
        });
        const url = `${OPEN_METEO_BASE_URL}?${params.toString()}`;

        try {
          const response = await fetchWithRetry(url, { headers: { Accept: 'application/json' } }, 3, 1000, 20000);
          const payload = (await response.json()) as OpenMeteoResponse;
          const hourly = payload.hourly;
          if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) {
            throw new Error('Resposta do Open-Meteo sem dados horários');
          }

          const nowMs = Date.now();
          let nowIndex = -1;
          for (let i = 0; i < hourly.time.length; i++) {
            const t = new Date(hourly.time[i]).getTime();
            if (t <= nowMs) nowIndex = i;
            else break;
          }
          if (nowIndex === -1) nowIndex = 0;

          const recordedAt = new Date(hourly.time[nowIndex]).toISOString();
          const rain1h = sumPrecipitation(hourly, nowIndex, nowIndex);
          const rain6h = sumPrecipitation(hourly, nowIndex - 5, nowIndex);
          const rain24h = sumPrecipitation(hourly, nowIndex - 23, nowIndex);
          const rain72h = sumPrecipitation(hourly, nowIndex - 71, nowIndex);
          const rain7d = sumPrecipitation(hourly, nowIndex - 167, nowIndex);

          readingsToUpsert.push({
            city_id: city.id,
            recorded_at: recordedAt,
            precipitation_mm: hourly.precipitation?.[nowIndex] ?? null,
            rain_1h_mm: rain1h,
            rain_6h_mm: rain6h,
            rain_24h_mm: rain24h,
            rain_72h_mm: rain72h,
            rain_7d_mm: rain7d,
            soil_moisture_0_1cm: hourly.soil_moisture_0_to_1cm?.[nowIndex] ?? null,
            soil_moisture_1_3cm: hourly.soil_moisture_1_to_3cm?.[nowIndex] ?? null,
            soil_moisture_3_9cm: hourly.soil_moisture_3_to_9cm?.[nowIndex] ?? null,
            soil_moisture_9_27cm: hourly.soil_moisture_9_to_27cm?.[nowIndex] ?? null,
            temperature: hourly.temperature_2m?.[nowIndex] ?? null,
            humidity: hourly.relative_humidity_2m?.[nowIndex] ?? null,
            apparent_temperature: hourly.apparent_temperature?.[nowIndex] ?? null,
            dew_point: hourly.dew_point_2m?.[nowIndex] ?? null,
            pressure_msl: hourly.pressure_msl?.[nowIndex] ?? null,
            wind_speed: hourly.wind_speed_10m?.[nowIndex] ?? null,
            wind_direction: hourly.wind_direction_10m?.[nowIndex] ?? null,
            wind_gusts: hourly.wind_gusts_10m?.[nowIndex] ?? null,
            uv_index: hourly.uv_index?.[nowIndex] ?? null,
            solar_radiation: hourly.shortwave_radiation?.[nowIndex] ?? null,
            visibility_m: hourly.visibility?.[nowIndex] ?? null,
            source: 'open-meteo',
          });

          // Próximas 48h de previsão de chuva
          const forecastEndIndex = Math.min(hourly.time.length - 1, nowIndex + 48);
          for (let i = nowIndex + 1; i <= forecastEndIndex; i++) {
            forecastsToUpsert.push({
              city_id: city.id,
              forecast_for: new Date(hourly.time[i]).toISOString(),
              issued_at: new Date().toISOString(),
              precipitation_mm: hourly.precipitation?.[i] ?? null,
              precipitation_probability: hourly.precipitation_probability?.[i] ?? null,
              source: 'open-meteo',
            });
          }

          citiesProcessed++;
        } catch (err: any) {
          errorsCount++;
          const msg = `Falha ao buscar clima para ${city.name}: ${err.message}`;
          errors.push(msg);
          LoggerService.warn(this.PREFIX, msg);
        }
      });

    await Promise.all(fetchPromises);

    if (readingsToUpsert.length > 0) {
      const ok = await SupabaseService.batchUpsertWeatherReadings(readingsToUpsert);
      if (!ok) {
        errorsCount++;
        errors.push('Erro ao gravar weather_readings em lote.');
      }
    }

    if (forecastsToUpsert.length > 0) {
      const ok = await SupabaseService.batchUpsertWeatherForecasts(forecastsToUpsert);
      if (ok) {
        forecastsInserted = forecastsToUpsert.length;
      } else {
        errorsCount++;
        errors.push('Erro ao gravar weather_forecasts em lote.');
      }
    }

    const durationMs = Date.now() - startTime;
    return {
      success: errorsCount === 0 || citiesProcessed > 0,
      durationMs,
      citiesProcessed,
      forecastsInserted,
      errorsCount,
      errors,
    };
  }
}
