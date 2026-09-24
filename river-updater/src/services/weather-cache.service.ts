import { SupabaseService, DBCity } from './supabase.service.js';
import { LoggerService } from '../logs/logger.service.js';

/**
 * Cache em memória da previsão do tempo, no mesmo modelo do cache dos níveis (CacheService).
 * O site chama /api/weather no worker em vez de consultar o Supabase direto: quantos acessos houver,
 * as consultas ao banco são só as da renovação (uma por cidade a cada ciclo de clima).
 */
const PREFIX = 'CLIMA-CACHE';
// Mesma janela que o site usava nas consultas diretas: de 6 h atrás em diante, no máximo 160 linhas
const FORECAST_BACK_MS = 6 * 60 * 60 * 1000;
const FORECAST_LIMIT = 160;
const REFRESH_CONCURRENCY = 5;
// A coleta é a cada 30 min; passando disso o cache é renovado em segundo plano na próxima requisição
const STALE_AFTER_MS = 45 * 60 * 1000;
const MAX_HEADWATERS = 12;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

interface Entry {
  reading: any | null;
  forecast: any[];
}

export interface WeatherBundleResult {
  status: number;
  body: any;
}

const avg = (vals: (number | null | undefined)[]): number | null => {
  const v = vals.filter((x): x is number => typeof x === 'number' && !isNaN(x));
  return v.length ? Number((v.reduce((a, b) => a + b, 0) / v.length).toFixed(4)) : null;
};

// Soma a chuva prevista (mm) nas próximas `hours` horas a partir de agora
function sumWindow(rows: any[], hours: number): number | null {
  const now = Date.now();
  let total = 0;
  let hasAny = false;
  for (const r of rows) {
    const t = new Date(r.forecast_for).getTime();
    if (isNaN(t) || t < now || t > now + hours * 3600000) continue;
    if (typeof r.precipitation_mm === 'number' && !isNaN(r.precipitation_mm)) {
      total += r.precipitation_mm;
      hasAny = true;
    }
  }
  return hasAny ? total : null;
}

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

export class WeatherCacheService {
  private static entries = new Map<string, Entry>();
  private static cachedAt = 0;
  private static inflight: Promise<void> | null = null;

  /** Renova o cache lendo do Supabase. Chamadas simultâneas compartilham a mesma renovação. */
  public static refresh(cities?: DBCity[]): Promise<void> {
    if (!this.inflight) {
      this.inflight = this.doRefresh(cities).finally(() => {
        this.inflight = null;
      });
    }
    return this.inflight;
  }

  private static async doRefresh(cities?: DBCity[]): Promise<void> {
    const started = Date.now();
    const client = SupabaseService.getClient();
    const list = cities ?? (await SupabaseService.fetchExistingCities());
    const since = new Date(Date.now() - FORECAST_BACK_MS).toISOString();
    let renewed = 0;
    let kept = 0;

    await runWithConcurrency(list, REFRESH_CONCURRENCY, async (city) => {
      try {
        const [reading, forecast] = await Promise.all([
          client.from('weather_readings').select('*').eq('city_id', city.id).order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
          client
            .from('weather_forecasts')
            .select('city_id, forecast_for, issued_at, precipitation_mm, precipitation_probability, temperature_2m')
            .eq('city_id', city.id)
            .gte('forecast_for', since)
            .order('forecast_for', { ascending: true })
            .limit(FORECAST_LIMIT),
        ]);
        if (reading.error || forecast.error) throw new Error(reading.error?.message || forecast.error?.message);
        this.entries.set(city.id, { reading: reading.data ?? null, forecast: forecast.data ?? [] });
        renewed++;
      } catch (err: any) {
        // Falha temporária: a entrada anterior (última leitura válida) continua sendo servida
        kept++;
        LoggerService.warn(PREFIX, `${city.name} | não renovada, mantendo a anterior | ${err?.message || err}`);
      }
    });

    if (renewed > 0) this.cachedAt = Date.now();
    LoggerService.info(PREFIX, `Cache do clima renovado: ${renewed} cidades atualizadas, ${kept} mantidas (${Date.now() - started}ms)`);
  }

  /**
   * Resposta de /api/weather?city=<id>&hw=<id,id,...>: leitura e previsão da cidade, mais o resumo das
   * estações de cabeceira pedidas (mesma regra que o site aplicava: prefere chuva medida pela ANA).
   */
  public static async getBundle(cityId: string, headwaterIds: string[]): Promise<WeatherBundleResult> {
    if (!ID_PATTERN.test(cityId)) return { status: 400, body: { error: 'city inválida' } };
    const hw = headwaterIds.filter((id) => ID_PATTERN.test(id)).slice(0, MAX_HEADWATERS);

    if (this.entries.size === 0) {
      try {
        await this.refresh();
      } catch (err: any) {
        return { status: 503, body: { error: 'Cache do clima indisponível', details: err?.message || String(err) } };
      }
    } else if (Date.now() - this.cachedAt > STALE_AFTER_MS) {
      this.refresh().catch(() => undefined);
    }

    const entry = this.entries.get(cityId);
    if (!entry) return { status: 404, body: { error: 'Cidade sem dados de clima em cache' } };

    const stations = hw.map((id) => this.entries.get(id)).filter((e): e is Entry => !!e);
    let headwaters: any = null;
    if (stations.length > 0) {
      const measured = stations.filter((s) => /ana/.test(s.reading?.source ?? ''));
      const use = measured.length ? measured : stations;
      headwaters = {
        stations: stations.length,
        measured: measured.length,
        r24: avg(use.map((s) => s.reading?.rain_24h_mm)),
        r72: avg(use.map((s) => s.reading?.rain_72h_mm)),
        f72: avg(stations.map((s) => sumWindow(s.forecast, 72))),
      };
    }

    return {
      status: 200,
      body: { cityId, cachedAt: new Date(this.cachedAt).toISOString(), reading: entry.reading, forecast: entry.forecast, headwaters },
    };
  }
}
