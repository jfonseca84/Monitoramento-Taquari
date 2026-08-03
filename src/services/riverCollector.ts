import { localStore, supabase, isSupabaseConfigured } from '../lib/supabase';

export const OFFICIAL_SOURCES = [
  { name: 'niveldosrios.guerreirosdohumaita.com.br', url: 'https://niveldosrios.guerreirosdohumaita.com.br/' },
  { name: 'nivelguaiba.com.br', url: 'https://nivelguaiba.com.br/' }
];

const CATALOG_SLUGS = [
  { name: 'Santa Tereza', slug: 'santatereza' },
  { name: 'Muçum', slug: 'mucum' },
  { name: 'Encantado', slug: 'encantado' },
  { name: 'Roca Sales', slug: 'rocasales' },
  { name: 'Lajeado', slug: 'lajeado' },
  { name: 'Estrela', slug: 'estrela' },
  { name: 'Bom Retiro do Sul', slug: 'bomretirodosul' },
  { name: 'Porto Alegre', slug: 'portoalegre' },
  { name: 'São Leopoldo', slug: 'saoleopoldo' },
  { name: 'Gravataí', slug: 'gravatai' },
  { name: 'Montenegro', slug: 'montenegro' },
  { name: 'São Sebastião do Caí', slug: 'saosebastiaodocai' },
  { name: 'Taquari', slug: 'taquari' },
  { name: 'Taquara', slug: 'taquara' },
  { name: 'Cachoeira do Sul', slug: 'cachoeiradosul' },
  { name: 'Dona Francisca', slug: 'donafrancisca' },
  { name: 'Feliz', slug: 'feliz' }
];

export interface SyncResult {
  success: boolean;
  timestamp: string;
  sources: string[];
  processedCount: number;
  updatedCount: number;
  message: string;
  errors?: string[];
  readings?: any[];
}

function parseKeyToTimeMs(key: string): number {
  if (!key) return 0;
  if (key.includes('/')) {
    const parts = key.trim().split(' ');
    const dateParts = parts[0].split('/');
    if (dateParts.length === 3) {
      const day = dateParts[0].padStart(2, '0');
      const month = dateParts[1].padStart(2, '0');
      const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
      const timePart = parts[1] || '00:00:00';
      const isoStr = `${year}-${month}-${day}T${timePart}`;
      const t = new Date(isoStr).getTime();
      if (!isNaN(t)) return t;
    }
  }
  const t = new Date(key.replace(' ', 'T')).getTime();
  return isNaN(t) ? 0 : t;
}

export class RiverCollectorService {
  private sources = OFFICIAL_SOURCES;

  async fetchFromNivelGuaiba(baseUrl: string): Promise<any[]> {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const results: any[] = [];

    for (const item of CATALOG_SLUGS) {
      const fetchSlug = item.slug === 'estrela' ? 'lajeado' : item.slug;
      const jsonUrl = `${cleanBaseUrl}/${fetchSlug}.json`;
      const publicPageUrl = `${cleanBaseUrl}/${item.slug === 'portoalegre' ? '' : item.slug}`;
      try {
        const res = await fetch(jsonUrl, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) continue;
        const data = await res.json();
        // 1. Ordene as chaves de data do JSON cronologicamente por timestamp
        const keys = Object.keys(data).sort((a, b) => parseKeyToTimeMs(a) - parseKeyToTimeMs(b));
        if (keys.length === 0) continue;

        const lastKey = keys[keys.length - 1];
        const latestLevel = Number(data[lastKey]);
        if (isNaN(latestLevel)) continue;

        let tsIso = new Date().toISOString();
        let lastTimeMs = Date.now();
        if (lastKey) {
          const parsedMs = parseKeyToTimeMs(lastKey);
          if (parsedMs > 0) {
            tsIso = new Date(parsedMs).toISOString();
            lastTimeMs = parsedMs;
          }
        }

        // Cálculo exato de ~60 minutos atrás
        let prevLevel = latestLevel;
        let prevTimeMs = lastTimeMs;

        if (keys.length > 1 && lastTimeMs > 0) {
          const target1hMs = lastTimeMs - 60 * 60 * 1000;
          let minDiff = Infinity;
          for (const k of keys) {
            const kTime = parseKeyToTimeMs(k);
            if (kTime === 0) continue;
            const diffFromTarget = Math.abs(kTime - target1hMs);
            if (diffFromTarget < minDiff) {
              minDiff = diffFromTarget;
              prevLevel = Number(data[k]);
              prevTimeMs = kTime;
            }
          }
        }

        const timeDiffHours = (lastTimeMs - prevTimeMs) / (1000 * 60 * 60);
        const levelDiffMeters = latestLevel - prevLevel;
        const rate = (timeDiffHours > 0 && !isNaN(levelDiffMeters))
          ? Number((levelDiffMeters / timeDiffHours).toFixed(4))
          : 0.00;

        let trend = 'estavel';
        if (rate > 0.005) trend = 'subindo';
        else if (rate < -0.005) trend = 'descendo';

        results.push({
          city: item.name,
          slug: item.slug,
          source_slug: fetchSlug,
          source_url: publicPageUrl,
          api_endpoint: jsonUrl,
          level: latestLevel,
          rate,
          trend,
          ts: tsIso,
          source_origin: 'nivelguaiba.com.br'
        });
      } catch (err) {
        console.warn(`[riverCollector] Error loading ${jsonUrl}:`, err);
      }
    }
    return results;
  }

  /**
   * Consulta simultaneamente todas as fontes oficiais configuradas.
   */
  async fetchFromAllSources(): Promise<any[]> {
    const fetchPromises = this.sources.map(async (src) => {
      try {
        if (src.name.includes('nivelguaiba') || src.url.includes('nivelguaiba')) {
          return await this.fetchFromNivelGuaiba(src.url);
        }

        const endpoint = `${src.url.replace(/\/$/, '')}/api/stations`;
        const res = await fetch(endpoint, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) return [];
        const payload = await res.json();
        const items = Array.isArray(payload?.stations)
          ? payload.stations
          : Array.isArray(payload)
          ? payload
          : [];

        return items.map((st: any) => ({
          ...st,
          source_origin: src.name
        }));
      } catch (err) {
        console.warn(`[riverCollector] Falha ao consultar fonte ${src.name}:`, err);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    return results.flat();
  }

  /**
   * Retorna as cidades com os dados mais recentes do Supabase ou do armazenamento local.
   */
  async fetchLiveStations(): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('cities').select('*').order('ordem', { ascending: true });
      if (data && data.length > 0) return data;
    }
    return localStore.getCities();
  }
}

export const riverCollector = new RiverCollectorService();
