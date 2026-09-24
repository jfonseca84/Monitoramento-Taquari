import { SupabaseService } from './supabase.service.js';
import { LoggerService } from '../logs/logger.service.js';

export interface TelemetryPayload {
  cities: any[];
  news: any[];
  alerts: any[];
  sponsors: any[];
  cachedAt: string;
  expiresAt: string;
}

export class CacheService {
  private static PREFIX = 'CacheService';
  private static telemetryCache: TelemetryPayload | null = null;
  private static telemetryCacheTime = 0;
  private static TTL_MS = 5 * 60 * 1000; // 5 minutos de validade do cache no backend

  private static historyCache = new Map<string, { data: any[]; cachedAt: number }>();
  private static HISTORY_TTL_MS = 10 * 60 * 1000; // 10 minutos de cache para gráficos históricos

  /**
   * Retorna os dados consolidados do cache em memória ou realiza a busca se o cache estiver expirado.
   */
  public static async getTelemetryData(): Promise<TelemetryPayload> {
    const now = Date.now();
    if (this.telemetryCache && (now - this.telemetryCacheTime < this.TTL_MS)) {
      return this.telemetryCache;
    }

    return await this.refreshTelemetryCache();
  }

  /**
   * Força a renovação do cache buscando dados no Supabase e combinando os registros mais recentes.
   * Chamado automaticamente após cada ciclo do worker.
   */
  public static async refreshTelemetryCache(): Promise<TelemetryPayload> {
    LoggerService.info(this.PREFIX, 'Atualizando cache em memória de dados hidrológicos...');
    try {
      const client = SupabaseService.getClient();

      // Executa consultas otimizadas ao Supabase em paralelo
      const [citiesRes, levelsRes, newsRes, alertsRes, sponsorsRes] = await Promise.all([
        client.from('cities').select('*').order('ordem', { ascending: true }),
        client.from('river_levels').select('*').order('recorded_at', { ascending: false }).limit(300),
        client.from('news').select('*').order('created_at', { ascending: false }),
        client.from('alerts').select('*').eq('active', true).order('created_at', { ascending: false }),
        client.from('sponsors').select('*').order('display_order', { ascending: true })
      ]);

      const dbCities = citiesRes.data || [];
      const levels = levelsRes.data || [];
      const news = newsRes.data || [];
      const alerts = alertsRes.data || [];
      const sponsors = sponsorsRes.data || [];

      // Mapeia medições mais recentes por cidade
      const latestMap = new Map<string, any>();
      for (const row of levels) {
        if (row.city_id && !latestMap.has(String(row.city_id))) {
          latestMap.set(String(row.city_id), row);
        }
      }

      // Mescla cidades com as últimas leituras de nível
      const citiesMerged = dbCities.map((city: any) => {
        const latest = latestMap.get(String(city.id));
        return {
          ...city,
          current_level: latest?.level ?? city.current_level ?? 0,
          rate_of_change: latest?.rate_of_change ?? city.rate_of_change ?? 0,
          trend: latest?.trend ?? city.trend ?? 'estavel',
          last_updated: latest?.recorded_at || city.updated_at || city.last_updated
        };
      });

      const now = Date.now();
      const cachedAt = new Date(now).toISOString();
      const expiresAt = new Date(now + this.TTL_MS).toISOString();

      this.telemetryCache = {
        cities: citiesMerged,
        news,
        alerts,
        sponsors,
        cachedAt,
        expiresAt
      };
      this.telemetryCacheTime = now;

      // Invalida cache de gráficos históricos quando chegam novas medições
      this.historyCache.clear();

      LoggerService.info(this.PREFIX, `Cache de telemetria renovado com sucesso (${citiesMerged.length} cidades, ${news.length} notícias, ${alerts.length} alertas).`);
      return this.telemetryCache;
    } catch (err: any) {
      LoggerService.error(this.PREFIX, `Erro ao renovar cache: ${err?.message || err}`);
      if (this.telemetryCache) return this.telemetryCache; // Fallback para o cache anterior
      throw err;
    }
  }

  /**
   * Busca histórico de nível de rio para uma cidade com cache em memória por cityId + timeframe.
   */
  public static async getCityHistory(cityId: string, timeframe: string): Promise<any[]> {
    const key = `${cityId}_${timeframe}`;
    const now = Date.now();
    const cached = this.historyCache.get(key);
    if (cached && (now - cached.cachedAt < this.HISTORY_TTL_MS)) {
      return cached.data;
    }

    const client = SupabaseService.getClient();
    let limit = 100;
    if (timeframe === '24h') limit = 48;
    else if (timeframe === '7d') limit = 200;
    else if (timeframe === '30d') limit = 500;
    else limit = 1000;

    // Leituras mais RECENTES da janela pedida (ordem decrescente + limit), devolvidas em ordem cronológica
    const windowMs: Record<string, number> = { '6h': 6, '12h': 12, '24h': 24, '7d': 168, '30d': 720 };
    let query = client.from('river_levels').select('*').eq('city_id', cityId);
    if (windowMs[timeframe]) {
      query = query.gte('recorded_at', new Date(now - windowMs[timeframe] * 60 * 60 * 1000).toISOString());
    }
    const { data } = await query.order('recorded_at', { ascending: false }).limit(limit);

    const result = (data || []).slice().reverse();
    this.historyCache.set(key, { data: result, cachedAt: now });
    return result;
  }

  private static readingsCache = new Map<string, { data: any; cachedAt: number }>();
  private static READINGS_TTL_MS = 5 * 60 * 1000; // 5 minutos para a aba Histórico
  private static READINGS_MAX_ROWS = 10000;
  private static READINGS_MAX_DAYS = 90;

  /**
   * Leituras brutas de uma cidade entre duas datas (dia inteiro no horário de Brasília), da mais recente
   * para a mais antiga, para a aba Histórico. Lê em páginas de 1000 linhas (sem o limite do /api/history).
   * from/to: "AAAA-MM-DD".
   */
  public static async getCityReadings(cityId: string, from: string, to: string): Promise<any> {
    const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (!isDay(from) || !isDay(to)) throw new Error('from e to devem estar no formato AAAA-MM-DD');
    const fromMs = new Date(`${from}T00:00:00-03:00`).getTime();
    const toMs = new Date(`${to}T23:59:59.999-03:00`).getTime();
    if (isNaN(fromMs) || isNaN(toMs)) throw new Error('Data inválida');
    if (fromMs > toMs) throw new Error('A data inicial é maior que a final');
    if (toMs - fromMs > this.READINGS_MAX_DAYS * 24 * 60 * 60 * 1000) {
      throw new Error(`O período máximo é de ${this.READINGS_MAX_DAYS} dias`);
    }

    const key = `${cityId}_${from}_${to}`;
    const now = Date.now();
    const cached = this.readingsCache.get(key);
    if (cached && now - cached.cachedAt < this.READINGS_TTL_MS) return cached.data;

    const client = SupabaseService.getClient();
    const PAGE = 1000;
    const rows: any[] = [];
    let truncated = false;
    for (let offset = 0; ; offset += PAGE) {
      if (rows.length >= this.READINGS_MAX_ROWS) { truncated = true; break; }
      const { data, error } = await client
        .from('river_levels')
        .select('recorded_at, level, trend, rate_of_change, station:stations(name)')
        .eq('city_id', cityId)
        .gte('recorded_at', new Date(fromMs).toISOString())
        .lte('recorded_at', new Date(toMs).toISOString())
        .order('recorded_at', { ascending: false })
        .range(offset, offset + PAGE - 1);
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) break;
      rows.push(...data);
      if (data.length < PAGE) break;
    }

    const result = {
      from,
      to,
      truncated,
      rows: rows.map((r: any) => ({
        recorded_at: r.recorded_at,
        level: Number(r.level),
        trend: r.trend,
        rate_of_change: r.rate_of_change,
        station: r.station?.name ?? null
      }))
    };
    this.readingsCache.set(key, { data: result, cachedAt: now });
    return result;
  }

  /**
   * Invalida todo o cache em memória
   */
  public static invalidate(): void {
    this.telemetryCache = null;
    this.telemetryCacheTime = 0;
    this.historyCache.clear();
    this.readingsCache.clear();
  }
}
