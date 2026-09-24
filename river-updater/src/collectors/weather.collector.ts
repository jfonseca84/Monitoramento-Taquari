import { LoggerService } from '../logs/logger.service.js';
import { SupabaseService, DBCity } from '../services/supabase.service.js';
import { fetchAnaRain, AnaRain } from './river.collector.js';

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

// ---------------------------------------------------------------------------
// Controle de requisições ao Open-Meteo
// ---------------------------------------------------------------------------
const LOG = 'CLIMA';
// Cidades consultadas ao mesmo tempo (evita rajada de 25 requisições simultâneas)
const OPEN_METEO_CONCURRENCY = 4;
const OPEN_METEO_MAX_ATTEMPTS = 3;
const OPEN_METEO_TIMEOUT_MS = 20000;
// Espera progressiva entre tentativas; o header Retry-After, quando existir, tem prioridade
const OPEN_METEO_BACKOFF_MS = [3000, 8000];
const OPEN_METEO_MAX_WAIT_MS = 60000;
// A coleta roda a cada 30 min e a leitura horária pode ter até ~30 min a mais de idade. Acima de 90 min
// (2 ciclos seguidos sem atualizar) a leitura é tratada como DESATUALIZADA (o site usa o mesmo corte).
const STALE_AFTER_MIN = 90;

interface OpenMeteoOutcome {
  ok: boolean;
  payload?: OpenMeteoResponse;
  attempts: number;
  reason?: string;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Só erros temporários justificam nova tentativa: 429 (limite) e 5xx. Demais 4xx são permanentes.
const isRetryableStatus = (status: number) => status === 429 || status >= 500;

function parseRetryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (!isNaN(seconds) && seconds >= 0) return seconds * 1000;
  const date = new Date(header).getTime();
  return isNaN(date) ? null : Math.max(0, date - Date.now());
}

function describeError(err: any): string {
  const cause = err?.cause?.code || err?.cause?.message;
  return `${err?.message || err}${cause ? ` (${cause})` : ''}`;
}

const fmtSeconds = (ms: number) => `${Math.round(ms / 1000)}s`;

// Pausa compartilhada: se o Open-Meteo pediu para esperar (429), nenhuma cidade dispara nova requisição
// até lá. Assim as tarefas simultâneas não repetem juntas e não geram tempestade de retries.
const cooldown = { until: 0 };
async function waitForCooldown(): Promise<void> {
  const remaining = cooldown.until - Date.now();
  if (remaining > 0) await sleep(remaining);
}

/**
 * Consulta o Open-Meteo para uma cidade. Cada tentativa é registrada com cidade, tentativa, status HTTP e
 * tempo de resposta. Repete só em erro temporário (429, 5xx, timeout, rede), com espera progressiva e
 * respeitando o Retry-After. Erro 4xx permanente não é repetido.
 */
async function fetchOpenMeteo(cityName: string, url: string, counters: { requests: number }): Promise<OpenMeteoOutcome> {
  const N = OPEN_METEO_MAX_ATTEMPTS;
  let reason = 'sem resposta';

  for (let attempt = 1; attempt <= N; attempt++) {
    await waitForCooldown();
    const tag = `${cityName} | tentativa ${attempt}/${N}`;
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OPEN_METEO_TIMEOUT_MS);
    let retryAfterMs: number | null = null;

    try {
      counters.requests++;
      const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });

      if (response.ok) {
        const payload = (await response.json()) as OpenMeteoResponse;
        const elapsed = Date.now() - started;
        if (!payload.hourly || !Array.isArray(payload.hourly.time) || payload.hourly.time.length === 0) {
          LoggerService.warn(LOG, `${tag} | HTTP ${response.status} | ${elapsed}ms | resposta sem dados horários | sem retry`);
          return { ok: false, attempts: attempt, reason: `HTTP ${response.status} sem dados horários` };
        }
        LoggerService.info(LOG, `${tag} | HTTP ${response.status} | ${elapsed}ms`);
        LoggerService.info(LOG, `${cityName} | sucesso`);
        return { ok: true, payload, attempts: attempt };
      }

      const elapsed = Date.now() - started;
      const detail = (await response.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160);
      reason = `HTTP ${response.status}${detail ? ` - ${detail}` : ''}`;

      if (!isRetryableStatus(response.status)) {
        LoggerService.warn(LOG, `${tag} | HTTP ${response.status} | erro permanente | sem retry${detail ? ` | ${detail}` : ''}`);
        LoggerService.error(LOG, `${cityName} | falha final | ${reason}`);
        return { ok: false, attempts: attempt, reason };
      }
      LoggerService.warn(LOG, `${tag} | HTTP ${response.status} | ${elapsed}ms${detail ? ` | ${detail}` : ''}`);
      retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'));
      if (retryAfterMs !== null) LoggerService.info(LOG, `${cityName} | Retry-After: ${fmtSeconds(retryAfterMs)}`);
    } catch (err: any) {
      const elapsed = Date.now() - started;
      if (err?.name === 'AbortError') {
        reason = `TIMEOUT ${OPEN_METEO_TIMEOUT_MS}ms`;
        LoggerService.warn(LOG, `${tag} | TIMEOUT | ${elapsed}ms`);
      } else {
        reason = `erro de rede: ${describeError(err)}`;
        LoggerService.warn(LOG, `${tag} | ERRO DE REDE | ${elapsed}ms | ${describeError(err)}`);
      }
    } finally {
      clearTimeout(timer);
    }

    if (attempt < N) {
      const wait = Math.min(retryAfterMs ?? OPEN_METEO_BACKOFF_MS[attempt - 1], OPEN_METEO_MAX_WAIT_MS);
      LoggerService.info(LOG, `${cityName} | aguardando ${fmtSeconds(wait)} para nova tentativa (${retryAfterMs !== null ? 'Retry-After' : 'backoff'})`);
      // Em 429/5xx a pausa vale para todas as cidades, não só para esta
      if (retryAfterMs !== null || /HTTP (429|5\d\d)/.test(reason)) cooldown.until = Math.max(cooldown.until, Date.now() + wait);
      await sleep(wait);
    }
  }

  LoggerService.error(LOG, `${cityName} | falha final | ${reason} | ${N} tentativas`);
  return { ok: false, attempts: N, reason };
}

// Executa `worker` para todos os itens, no máximo `limit` de cada vez. O worker não deve lançar erro.
async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

const fmtBrasilia = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function fmtAge(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return min < 60 ? `há ${min} min` : `há ${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;
}

export class WeatherCollector {
  private static PREFIX = LOG;

  /**
   * Lê a lista de cidades no início do ciclo. Falhas transitórias do Supabase (ex.: "JWT issued at future")
   * abortavam o ciclo inteiro; agora há mais 2 tentativas antes de desistir.
   */
  public static async loadCities(): Promise<DBCity[]> {
    const waits = [2000, 5000];
    const total = waits.length + 1;
    for (let attempt = 1; ; attempt++) {
      try {
        return await SupabaseService.fetchExistingCities();
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (attempt >= total) {
          LoggerService.error(LOG, `Lista de cidades | falha final após ${attempt} tentativas | ${msg}`);
          throw err;
        }
        LoggerService.warn(LOG, `Lista de cidades | tentativa ${attempt}/${total} | erro: ${msg} | nova tentativa em ${fmtSeconds(waits[attempt - 1])}`);
        await sleep(waits[attempt - 1]);
      }
    }
  }

  /**
   * Cidade cujo Open-Meteo falhou: NÃO grava dados de clima novos (a última leitura válida fica como está).
   * A chuva medida pela ANA é independente do Open-Meteo e continua sendo gravada.
   * Retorna a data da última leitura válida existente, ou null se a cidade nunca teve leitura.
   */
  private static async handleOpenMeteoFailure(city: DBCity, ana: AnaRain | undefined): Promise<{ hasReading: boolean; lastSuccessAt: string | null; anaStored: boolean }> {
    const client = SupabaseService.getClient();
    let lastSuccessAt: string | null = null;
    let lastId: string | null = null;

    try {
      const { data } = await client
        .from('weather_readings')
        .select('id, recorded_at')
        .eq('city_id', city.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        lastSuccessAt = data.recorded_at as string;
        lastId = data.id as string;
      }
      // recorded_at é a hora cheia do dado; o issued_at da previsão é renovado a cada coleta bem-sucedida
      // e mostra melhor quando o Open-Meteo respondeu pela última vez
      const { data: fc } = await client
        .from('weather_forecasts')
        .select('issued_at')
        .eq('city_id', city.id)
        .order('issued_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (fc?.issued_at && (!lastSuccessAt || new Date(fc.issued_at as string).getTime() > new Date(lastSuccessAt).getTime())) {
        lastSuccessAt = fc.issued_at as string;
      }
    } catch (err: any) {
      LoggerService.warn(LOG, `${city.name} - não foi possível consultar a última leitura: ${err?.message || err}`);
    }

    let anaStored = false;
    if (ana) {
      const rain = {
        rain_1h_mm: ana.rain1h,
        rain_6h_mm: ana.rain6h,
        rain_24h_mm: ana.rain24h,
        rain_72h_mm: ana.rain72h,
        ...(ana.rain7d !== null ? { rain_7d_mm: ana.rain7d } : {}),
      };
      try {
        if (lastId) {
          // Atualiza só os campos de chuva da última leitura; temperatura, solo etc. seguem como estavam
          const { error } = await client.from('weather_readings').update({ ...rain, source: 'open-meteo+ana' }).eq('id', lastId);
          anaStored = !error;
          if (error) LoggerService.warn(LOG, `${city.name} - falha ao gravar chuva da ANA: ${error.message}`);
        } else {
          // Cidade sem nenhuma leitura: grava só a chuva medida, sem inventar os demais campos
          const hour = new Date(Math.floor(Date.now() / 3600000) * 3600000).toISOString();
          const { error } = await client.from('weather_readings').insert({ city_id: city.id, recorded_at: hour, ...rain, source: 'ana' });
          anaStored = !error;
          if (error) LoggerService.warn(LOG, `${city.name} - falha ao gravar chuva da ANA: ${error.message}`);
        }
      } catch (err: any) {
        LoggerService.warn(LOG, `${city.name} - falha ao gravar chuva da ANA: ${err?.message || err}`);
      }
    }

    return { hasReading: lastId !== null, lastSuccessAt, anaStored };
  }

  public static async executeCollection(cities: DBCity[]): Promise<{
    success: boolean;
    durationMs: number;
    citiesProcessed: number;
    forecastsInserted: number;
    errorsCount: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    let forecastsInserted = 0;
    let errorsCount = 0;
    const errors: string[] = [];

    const eligible = cities.filter((c) => c.id && typeof c.latitude === 'number' && typeof c.longitude === 'number');
    LoggerService.info(LOG, `Ciclo iniciado: ${eligible.length} cidades (até ${OPEN_METEO_CONCURRENCY} por vez)`);

    // 1) Chuva medida pela ANA: independente do Open-Meteo (se falhar, só as estações ficam sem o dado medido)
    let anaRain = new Map<string, AnaRain>();
    const anaFailures = new Map<string, string>();
    try {
      anaRain = await fetchAnaRain(cities, anaFailures);
    } catch (err: any) {
      LoggerService.warn(LOG, `ANA | falha ao buscar chuva medida: ${err?.message || err}`);
    }
    for (const [slug, reason] of anaFailures) {
      const name = cities.find((c) => c.slug === slug)?.name ?? slug;
      LoggerService.warn(LOG, `ANA | ${name} | sem chuva medida neste ciclo | ${reason}`);
    }
    LoggerService.info(LOG, `ANA | chuva medida obtida em ${anaRain.size} estação(ões)${anaFailures.size ? `, ${anaFailures.size} sem dado` : ''}`);

    // 2) Open-Meteo, com concorrência controlada
    const counters = { requests: 0 };
    const readingsToUpsert: any[] = [];
    const forecastsToUpsert: any[] = [];
    const failed: { city: DBCity; message: string }[] = [];
    let updated = 0;

    await runWithConcurrency(eligible, OPEN_METEO_CONCURRENCY, async (city) => {
      try {
        const params = new URLSearchParams({
          latitude: String(city.latitude),
          longitude: String(city.longitude),
          hourly: HOURLY_VARS,
          past_days: '7',
          forecast_days: '6',
          timezone: 'America/Sao_Paulo',
        });
        const outcome = await fetchOpenMeteo(city.name, `${OPEN_METEO_BASE_URL}?${params.toString()}`, counters);
        if (!outcome.ok || !outcome.payload?.hourly) {
          failed.push({ city, message: outcome.reason ?? 'falha sem detalhe' });
          return;
        }
        const hourly = outcome.payload.hourly;

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

        const ana = anaRain.get(city.slug);
        readingsToUpsert.push({
          city_id: city.id,
          recorded_at: recordedAt,
          precipitation_mm: hourly.precipitation?.[nowIndex] ?? null,
          rain_1h_mm: ana ? ana.rain1h : rain1h,
          rain_6h_mm: ana ? ana.rain6h : rain6h,
          rain_24h_mm: ana ? ana.rain24h : rain24h,
          rain_72h_mm: ana ? ana.rain72h : rain72h,
          rain_7d_mm: ana?.rain7d ?? rain7d,
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
          source: ana ? 'open-meteo+ana' : 'open-meteo',
        });

        // Próximas horas de previsão de chuva
        const forecastEndIndex = Math.min(hourly.time.length - 1, nowIndex + 120);
        for (let i = nowIndex + 1; i <= forecastEndIndex; i++) {
          forecastsToUpsert.push({
            city_id: city.id,
            forecast_for: new Date(hourly.time[i]).toISOString(),
            issued_at: new Date().toISOString(),
            precipitation_mm: hourly.precipitation?.[i] ?? null,
            precipitation_probability: hourly.precipitation_probability?.[i] ?? null,
            temperature_2m: hourly.temperature_2m?.[i] ?? null,
            source: 'open-meteo',
          });
        }

        updated++;
      } catch (err: any) {
        failed.push({ city, message: `erro ao processar resposta - ${err?.message || err}` });
        LoggerService.warn(LOG, `${city.name} - erro ao processar resposta: ${err?.message || err}`);
      }
    });

    // 3) Gravação das cidades atualizadas
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

    // 4) Cidades com falha no Open-Meteo: mantém a última leitura válida e grava a chuva da ANA
    let keptLast = 0;
    let stale = 0;
    let definitive = 0;
    let anaOnly = 0;
    await runWithConcurrency(failed, 5, async ({ city, message }) => {
      try {
        const { hasReading, lastSuccessAt, anaStored } = await WeatherCollector.handleOpenMeteoFailure(city, anaRain.get(city.slug));
        if (anaStored) anaOnly++;
        if (hasReading && lastSuccessAt) {
          keptLast++;
          const ageMin = Math.round((Date.now() - new Date(lastSuccessAt).getTime()) / 60000);
          const isStale = ageMin > STALE_AFTER_MIN;
          if (isStale) stale++;
          LoggerService.warn(
            LOG,
            `${city.name} | Open-Meteo indisponível (${message}) | mantendo última leitura válida | última atualização bem-sucedida ${fmtBrasilia(lastSuccessAt)} (${fmtAge(lastSuccessAt)})${isStale ? ` | DESATUALIZADA (> ${STALE_AFTER_MIN} min)` : ''} | nova tentativa no próximo ciclo`
          );
        } else {
          definitive++;
          LoggerService.error(LOG, `${city.name} | falha definitiva neste ciclo (${message}) e sem leitura anterior | nova tentativa no próximo ciclo`);
        }
        if (anaStored) LoggerService.info(LOG, `${city.name} | chuva medida da ANA gravada mesmo sem o Open-Meteo`);
      } catch (err: any) {
        definitive++;
        LoggerService.error(LOG, `${city.name} | falha ao tratar erro do Open-Meteo: ${err?.message || err}`);
      }
      errorsCount++;
      errors.push(`${city.name}: ${message}`);
    });

    // 5) Resumo do ciclo
    const durationMs = Date.now() - startTime;
    LoggerService.info(LOG, 'Ciclo concluído');
    LoggerService.info(LOG, `${eligible.length} cidades processadas`);
    LoggerService.info(LOG, `${updated} atualizadas`);
    LoggerService.info(LOG, `${keptLast} utilizando última leitura válida (${stale} desatualizadas, mais de ${STALE_AFTER_MIN} min)`);
    LoggerService.info(LOG, `${definitive} falhas definitivas`);
    LoggerService.info(LOG, `Chuva da ANA gravada sem o Open-Meteo em ${anaOnly} cidade(s)`);
    LoggerService.info(LOG, `Requisições ao Open-Meteo: ${counters.requests} (${counters.requests - eligible.length} a mais que o mínimo, por novas tentativas)`);
    LoggerService.info(LOG, `Tempo total: ${fmtSeconds(durationMs)}`);

    return {
      success: updated > 0 || failed.length === 0,
      durationMs,
      citiesProcessed: updated,
      forecastsInserted,
      errorsCount,
      errors,
    };
  }
}
