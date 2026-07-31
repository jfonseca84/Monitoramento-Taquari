import { localStore, supabase, isSupabaseConfigured } from '../lib/supabase';

export const OFFICIAL_SOURCES = [
  { name: 'niveldosrios.guerreirosdohumaita.com.br', url: 'https://niveldosrios.guerreirosdohumaita.com.br/' },
  { name: 'nivelguaiba.com.br', url: 'https://nivelguaiba.com.br/' }
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

  /**
   * Consulta simultaneamente todas as fontes oficiais configuradas.
   */
  async fetchFromAllSources(): Promise<any[]> {
    const fetchPromises = this.sources.map(async (src) => {
      try {
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
