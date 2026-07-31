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

export class RiverCollectorService {
  private sources = OFFICIAL_SOURCES;

  async fetchFromNivelGuaiba(baseUrl: string): Promise<any[]> {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const results: any[] = [];

    for (const item of CATALOG_SLUGS) {
      const fetchSlug = item.slug === 'estrela' ? 'lajeado' : item.slug;
      const jsonUrl = `${cleanBaseUrl}/${fetchSlug}.json`;
      try {
        const res = await fetch(jsonUrl, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) continue;
        const data = await res.json();
        const keys = Object.keys(data);
        if (keys.length === 0) continue;

        const lastKey = keys[keys.length - 1];
        const latestLevel = Number(data[lastKey]);
        if (isNaN(latestLevel)) continue;

        let prevLevel = latestLevel;
        if (keys.length > 1) {
          const lookbackIdx = Math.max(0, keys.length - 5);
          const val = Number(data[keys[lookbackIdx]]);
          if (!isNaN(val)) prevLevel = val;
        }

        const rate = Number((latestLevel - prevLevel).toFixed(2));
        let trend = 'estavel';
        if (rate > 0.01) trend = 'subindo';
        else if (rate < -0.01) trend = 'descendo';

        let tsIso = new Date().toISOString();
        if (lastKey) {
          const parsed = new Date(lastKey.replace(' ', 'T'));
          if (!isNaN(parsed.getTime())) tsIso = parsed.toISOString();
        }

        results.push({
          city: item.name,
          slug: item.slug,
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
